# Knowledge Base

Một file `index.html` gộp sổ tay của mọi project để ôn phỏng vấn và thuyết trình.

- **Nội dung không nằm ở đây.** Mỗi project tự giữ nguồn trong `apps/<project>/documents/*.md`
  và tự sinh `apps/<project>/knowledge.html`. Knowledge base nhúng nguyên văn file đó, chỉ thêm
  trang chủ (tiến độ, danh sách mọi chủ đề) và thanh chuyển project.
- **Không sửa tay `index.html`**: nó được sinh từ `template.html` + `projects.json`.

## Build

```bash
npm run docs:knowledge-base                  # sinh lại sổ tay từng project từ markdown, rồi gộp
node knowledge-base/build.mjs --no-rebuild   # chỉ gộp các knowledge.html đã có
```

Mở `knowledge-base/index.html` trong trình duyệt. Link trực tiếp:
`#home`, `#api-gateway`, `#api-gateway/topic-3`, `#service-discovery/practice`, `#api-gateway/slides`.

## Thêm project mới

1. Trong `apps/<project>/`: viết `documents/KNOWLEDGE.md`, `INTERVIEW-QUESTIONS.md`, `SLIDES.md`
   (cùng định dạng với api-gateway) và copy thư mục `scripts/` từ api-gateway, sửa phần
   Tổng quan (hero, sơ đồ, simulator) trong `scripts/knowledge.template.html`.
   Đổi key localStorage (`gw-…`) sang tiền tố riêng để tiến độ không lẫn giữa các project.
2. Thêm một dòng vào `projects.json` (`id`, `name`, `app`, `tagline`).
3. Chạy `npm run docs:knowledge-base`.
