# Knowledge Base

Một file `index.html` gộp sổ tay của mọi project để ôn phỏng vấn và thuyết trình.

- **Nội dung không nằm ở đây.** Mỗi project tự giữ nguồn trong `apps/<project>/documents/*.md`
  và sinh `knowledge-base/projects/<id>/knowledge.html`. Knowledge base nhúng nguyên văn file đó, chỉ thêm
  trang chủ (tiến độ, danh sách mọi chủ đề) và thanh chuyển project.
- **Không sửa tay `index.html`**: nó được sinh từ `template.html` + `projects.json`.

## Build

```bash
npm run docs:knowledge-base                  # sinh lại sổ tay từng project từ markdown, rồi gộp
node knowledge-base/build.mjs --no-rebuild   # chỉ gộp các knowledge.html đã có
```

Mở `knowledge-base/index.html` trong trình duyệt. Link trực tiếp:
`#home`, `#api-gateway`, `#api-gateway/topic-3`, `#service-discovery/practice`, `#api-gateway/slides`.

## Clean Architecture

Mục `#clean-architecture` gồm 14 bài học, 36 câu hỏi có ý chính, 12 thuật ngữ và 10 slide.
Nguồn đặt trong `apps/w-identity/documents/`: `KNOWLEDGE.md`, `INTERVIEW-QUESTIONS.md`, `SLIDES.md`.
Ví dụ dựa trên thiết kế và code w-identity đã có kiểm thử local; không đại diện cho kinh nghiệm vận hành production.
Ví dụ quán ăn và hai sơ đồ minh họa nằm ở bài 0–1: nhận diện các tầng, luồng gọi lúc chạy và chiều phụ thuộc mã nguồn. Có thêm ba thẻ câu hỏi và hai slide để tự ôn.
Luyện câu hỏi ở `#clean-architecture/practice`; đánh dấu đã thuộc/cần ôn được lưu riêng trên trình duyệt.
Sinh lại riêng sổ tay: `npm exec nx run w-identity:docs:knowledge`; sinh lại toàn bộ bằng lệnh build ở trên.

## Thêm project mới

1. Trong `apps/<project>/`: viết `documents/KNOWLEDGE.md`, `INTERVIEW-QUESTIONS.md`, `SLIDES.md`
   (cùng định dạng với api-gateway) và copy thư mục `scripts/` từ api-gateway, sửa phần
   Tổng quan (hero, sơ đồ, simulator) trong `knowledge-base/projects/<id>/template.html`.
   Đổi key localStorage (`gw-…`) sang tiền tố riêng để tiến độ không lẫn giữa các project.
2. Thêm một dòng vào `projects.json` (`id`, `name`, `app`, `tagline`).
3. Chạy `npm run docs:knowledge-base`.
