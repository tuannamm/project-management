// Gộp sổ tay của từng project thành MỘT knowledge base: knowledge-base/index.html.
// Chạy: npm run docs:knowledge-base           (sinh lại sổ tay từng project từ markdown rồi gộp)
//       node knowledge-base/build.mjs --no-rebuild   (chỉ gộp các knowledge.html đã có)
//
// Nguyên tắc: KHÔNG sửa nội dung sổ tay. Mỗi apps/<project>/knowledge.html được nhúng nguyên văn
// (iframe srcdoc); file này chỉ thêm trang chủ + thanh chuyển project.
// Thêm project mới: tạo documents/*.md + scripts/build-knowledge-html.mjs trong app đó
// (copy từ api-gateway), rồi thêm một dòng vào knowledge-base/projects.json.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const kbDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(kbDir, '..');
const rebuild = !process.argv.includes('--no-rebuild');

const projects = JSON.parse(readFileSync(path.join(kbDir, 'projects.json'), 'utf8'));

const entries = projects.map((p) => {
  const appDir = path.join(rootDir, p.app);
  const builder = path.join(appDir, 'scripts/build-knowledge-html.mjs');
  if (rebuild && existsSync(builder)) {
    process.stdout.write(`[${p.id}] `);
    execFileSync(process.execPath, [builder], { cwd: appDir, stdio: 'inherit' });
  }
  const file = path.join(appDir, 'knowledge.html');
  if (!existsSync(file)) throw new Error(`[${p.id}] thiếu ${path.relative(rootDir, file)}`);
  const html = readFileSync(file, 'utf8');

  // Đọc số liệu cho trang chủ từ chính DATA đã nhúng trong sổ tay (không parse lại markdown).
  const m = /<script id="data" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error(`[${p.id}] knowledge.html không có <script id="data">`);
  const data = JSON.parse(m[1]);
  const marksKey = /store\.get\('([\w-]+-practice-marks)'/.exec(html)?.[1] ?? null;

  return {
    ...p,
    html,
    stats: {
      generatedAt: data.generatedAt,
      topics: data.topics.map((t) => ({ n: t.n, title: t.title, status: t.status })),
      questionIds: data.questions.map((q) => q.id),
      glossary: data.glossary.length,
      slides: data.slides.length,
      marksKey,
    },
  };
});

const payload = JSON.stringify({ builtAt: new Date().toISOString(), projects: entries }).replace(/</g, '\\u003c');
const out = readFileSync(path.join(kbDir, 'template.html'), 'utf8').replace('__KB_DATA__', () => payload);
writeFileSync(path.join(kbDir, 'index.html'), out);

console.log(
  `knowledge-base/index.html: ${entries.length} projects — ` +
    entries.map((e) => `${e.id} (${e.stats.topics.length} topics, ${e.stats.questionIds.length} questions)`).join(', '),
);
