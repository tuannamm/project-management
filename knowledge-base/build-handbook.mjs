// Sinh knowledge-base/projects/<id>/knowledge.html từ một thư mục markdown
// (KNOWLEDGE.md + INTERVIEW-QUESTIONS.md + SLIDES.md, ảnh ./*.svg được nhúng base64).
// Chạy: node knowledge-base/build-handbook.mjs <id> <thư mục docs, tính từ gốc repo>
//   ví dụ: node knowledge-base/build-handbook.mjs saga knowledge-base/projects/w-identity/documents/saga
// Cùng định dạng markdown và cùng hình dạng DATA với builder của service-discovery.
// Markdown là nguồn chuẩn; KHÔNG sửa tay file HTML sinh ra.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const kbDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(kbDir, '..');
const [id, docsArg] = process.argv.slice(2);
if (!id || !docsArg) {
  console.error('Cách dùng: node knowledge-base/build-handbook.mjs <id> <docs-dir>');
  process.exit(1);
}
const docsDir = path.resolve(rootDir, docsArg);
const read = (file) => readFileSync(path.join(docsDir, file), 'utf8');

marked.setOptions({ gfm: true });

// Ảnh tương đối (./x.svg) → data URI, để knowledge.html tự chứa được trong iframe srcdoc.
marked.use({
  walkTokens(token) {
    if (token.type !== 'image' || /^(https?:|data:)/.test(token.href)) return;
    const file = path.resolve(docsDir, token.href);
    if (!existsSync(file)) throw new Error(`[${id}] thiếu ảnh ${token.href}`);
    const mime = file.endsWith('.svg') ? 'image/svg+xml' : `image/${path.extname(file).slice(1)}`;
    token.href = `data:${mime};base64,${readFileSync(file).toString('base64')}`;
  },
});

const STATUS = { '✅': 'done', '📖': 'theory', '⬜': 'todo' };

function splitSections(md) {
  const sections = [];
  let current = null;
  for (const line of md.split('\n')) {
    const heading = /^## (.+)$/.exec(line);
    if (heading) {
      current = { heading: heading[1].trim(), lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return sections.map((s) => ({ heading: s.heading, body: s.lines.join('\n').replace(/\n---\s*$/s, '').trim() }));
}

function tableRows(body) {
  return body
    .split('\n')
    .filter((l) => /^\|.*\|\s*$/.test(l) && !/^\|\s*-/.test(l))
    .map((l) => l.trim().slice(1, -1).split('|').map((c) => c.trim()))
    .slice(1);
}

function parseKnowledge(md) {
  const sections = splitSections(md);
  const progress = new Map();
  const progressSection = sections.find((s) => s.heading === 'Bảng tiến độ');
  for (const [n, title, step, statusCell] of tableRows(progressSection?.body ?? '')) {
    const emoji = Object.keys(STATUS)
      .filter((e) => statusCell.includes(e))
      .sort((a, b) => statusCell.indexOf(a) - statusCell.indexOf(b))[0];
    progress.set(Number(n), {
      status: STATUS[emoji] ?? 'todo',
      statusNote: statusCell.replace(emoji ?? '', '').replace(/^[\s(]+|[\s)]+$/g, ''),
      step,
    });
  }

  const topics = sections
    .map((s) => ({ match: /^(\d+)\.\s+(.+)$/.exec(s.heading), body: s.body }))
    .filter((s) => s.match)
    .map(({ match, body }) => {
      const n = Number(match[1]);
      const p = progress.get(n) ?? { status: 'todo', statusNote: '', step: '-' };
      return { n, title: match[2], status: p.status, statusNote: p.statusNote, step: p.step, html: marked.parse(body) };
    });

  const glossarySection = sections.find((s) => s.heading === 'Từ điển nhanh');
  const glossary = tableRows(glossarySection?.body ?? '').map(([term, def]) => ({
    term: marked.parseInline(term),
    def: marked.parseInline(def),
  }));

  const intro = marked.parse(md.split('\n## ')[0].replace(/^# .+\n/, ''));
  return { topics, glossary, intro };
}

function parseQuestions(md) {
  const questions = [];
  let part = null;
  let group = null;
  let current = null;

  // "📚 #2, #14" → [2, 14]
  const refsOf = (text) => [...text.matchAll(/📚([^·]*)/gu)].flatMap((m) => [...m[1].matchAll(/#(\d+)/g)].map((r) => Number(r[1])));
  const stripRefs = (text) => text.replace(/\s*·?\s*📚[^·]*$/u, '').replace(/\s*·\s*$/, '').trim();

  for (const line of md.split('\n')) {
    const partMatch = /^## (Phần ([A-E]))\. (.+)$/.exec(line);
    if (partMatch) {
      part = { id: partMatch[2], title: partMatch[3] };
      group = null;
      current = null;
      continue;
    }
    if (/^## /.test(line)) {
      part = null;
      continue;
    }
    if (!part) continue;

    const groupMatch = /^### (.+)$/.exec(line);
    if (groupMatch) {
      group = groupMatch[1];
      continue;
    }

    const q = /^- \[[ xX]\] (.+)$/.exec(line);
    if (q) {
      let text = q[1];
      const level = { '🟢': 'basic', '🟡': 'mid', '🔴': 'hard' }[[...text][0]] ?? null;
      if (level) text = text.slice([...text][0].length).trim();
      current = { part: part.id, partTitle: part.title, group, level, textMd: stripRefs(text), refs: refsOf(text), hintLabel: null, hintMd: null };
      questions.push(current);
      continue;
    }

    const hint = /^\s{2,}\*(Ý chính|Gợi ý(?: \([^)]*\))?):\*\s*(.+)$/.exec(line);
    if (hint && current) {
      current.hintLabel = hint[1];
      current.hintMd = stripRefs(hint[2]);
      current.refs.push(...refsOf(hint[2]));
    }
  }

  return questions.map((q) => ({
    id: createHash('sha1').update(q.part + q.textMd).digest('hex').slice(0, 10),
    part: q.part,
    partTitle: q.partTitle,
    group: q.group,
    level: q.level,
    text: marked.parseInline(q.textMd),
    hintLabel: q.hintLabel,
    hint: q.hintMd ? marked.parseInline(q.hintMd) : null,
    refs: [...new Set(q.refs)],
  }));
}

function parseSlides(md) {
  return md
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/^---\s*$/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [body, notes = ''] = chunk.split(/^Note:\s*/m);
      return { cover: /^# /.test(body), html: marked.parse(body.trim()), notes: notes.trim() ? marked.parse(notes.trim()) : '' };
    });
}

const knowledge = parseKnowledge(read('KNOWLEDGE.md'));
const questions = parseQuestions(read('INTERVIEW-QUESTIONS.md'));
const slides = parseSlides(read('SLIDES.md'));

const data = { generatedAt: new Date().toISOString(), ...knowledge, questions, slides };
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const outDir = path.join(kbDir, 'projects', id);
const html = readFileSync(path.join(outDir, 'template.html'), 'utf8').replace('__KNOWLEDGE_DATA__', () => json);
writeFileSync(path.join(outDir, 'knowledge.html'), html);

console.log(
  `[${id}] knowledge.html: ${knowledge.topics.length} topics, ${questions.length} questions, ` +
    `${knowledge.glossary.length} glossary terms, ${slides.length} slides`,
);
