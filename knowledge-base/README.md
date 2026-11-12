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

Mục `#clean-architecture` gồm 17 bài học (bài 14 là phần so sánh Clean Architecture, DDD và CQRS, bài 15 là SOLID/Boundary/cấu trúc dự án, bài 16 là RBAC).
Nguồn đặt trong `apps/w-identity/documents/`: `KNOWLEDGE.md`, `INTERVIEW-QUESTIONS.md`, `SLIDES.md`.
Ví dụ dựa trên thiết kế và code w-identity đã có kiểm thử local; không đại diện cho kinh nghiệm vận hành production. Các thao tác quản lý tài khoản hiện bị `AuthorizationPolicy.management()` từ chối nên được ghi là kịch bản thiết kế.
Ví dụ quán ăn và hai sơ đồ minh họa nằm ở bài 0–1. Luyện câu hỏi ở `#clean-architecture/practice`; đánh dấu đã thuộc/cần ôn được lưu riêng trên trình duyệt (`ca-practice-marks`).

## Domain-Driven Design

Mục `#ddd` là sổ tay riêng, tách khỏi Clean Architecture, gồm 17 bài (0–16) chia 4 phần: Strategic Design (ngôn ngữ chung, bounded context, subdomain/distillation, đủ 9 pattern của context map), Tactical Design có code TypeScript minh họa (entity/value object, aggregate với 4 quy tắc của Vernon và optimistic locking, các loại service/specification, domain event và outbox, repository/factory/unit of work), Thực hành (Event Storming, Transaction Script và anemic model, ví dụ nhà hàng làm trọn vẹn), So sánh và áp dụng (bài 13 so sánh DDD với Clean Architecture, bài 14 về CQRS/Event Sourcing/Microservices, bài 15 về Hexagonal/Onion, bài 16 phân tích User/Role/UserRole ở w-identity kèm race condition của `DeleteRoleHandler`).
Code TypeScript ở bài 5–15 là minh họa, chưa chạy thử; phần "đề xuất" ở bài 16 chưa triển khai.
Nguồn đặt trong `apps/w-identity/documents/ddd/` (cùng định dạng, kèm `ddd-restaurant-contexts.svg`, `ddd-context-map.svg`, `ddd-clean-mapping.svg`); template ở `knowledge-base/projects/ddd/template.html`; đánh dấu ôn tập dùng khóa `ddd-practice-marks`, nên tiến độ cũ của các câu DDD từng nằm trong Clean Architecture không được chuyển sang.
Dự án này đăng ký trong `projects.json` với thêm trường `docs` (`documents/ddd`) để builder biết đọc thư mục nào.
Sinh lại các sổ tay của w-identity (clean-architecture, ddd, authz, oidc): `npm exec nx run w-identity:docs:knowledge` (hoặc `npm run docs:knowledge` trong `apps/w-identity`); sinh lại toàn bộ bằng lệnh build ở trên.

## Phân quyền

Mục `#authz` là sổ tay riêng về authentication/authorization: mô hình RBAC (các collection `users`, `user_roles`, `roles`, `permissions`), luồng từ đăng nhập đến từng request (có sơ đồ `authz-flow.svg`), UI render theo quyền, gateway kiểm tra bằng `x-required-permissions`, cache/single-flight/fail closed, so sánh với permission trong JWT, và trạng thái triển khai.
Nguồn đặt trong `apps/w-identity/documents/authz/`; template ở `knowledge-base/projects/authz/template.html`; đánh dấu ôn tập dùng khóa `authz-practice-marks`. Đăng ký trong `projects.json` với trường `docs` (`documents/authz`).
Nội dung này từng nằm ở bài 17 của sổ tay Clean Architecture và đã được tách ra.

## Keycloak và OIDC

Mục `#oidc` là sổ tay riêng về cách client tương tác với Keycloak: OAuth 2.0 và OIDC, endpoint, Authorization Code + PKCE từng bước, ba loại token và claim, xác minh token, session SSO khác token, làm mới và xoay vòng refresh token, đăng xuất (cái gì mất, cái gì còn), lưu token và các tấn công, chẩn đoán lỗi thật, cách nói khi phỏng vấn, và bài 11 về những điều riêng của SPA (vòng đời trang khi đăng nhập, `/callback` và history fallback, làm mới token, CORS/preflight, rủi ro XSS và BFF, chẩn đoán lỗi từ UI).
Thông số (thời hạn token, tên cookie, mã lỗi) được đo bằng script trên Keycloak 26 local với một realm tạm. Nguồn đặt trong `apps/w-identity/documents/oidc/` (kèm `login-logout-flow.svg`, `token-session-lifecycle.svg`); template ở `knowledge-base/projects/oidc/template.html`; đánh dấu ôn tập dùng khóa `oidc-practice-marks`.

## Transactional Outbox

Mục `#outbox` là sổ tay về Transactional Outbox: dual write, cấu trúc outbox và transaction trên MongoDB, relay (claim bằng lease, publisher confirm), at-least-once và inbox idempotent, thứ tự/retry/poison message, polling so với change stream, vận hành, và cách nói khi phỏng vấn (có sơ đồ `outbox-flow.svg` và mô phỏng tương tác ở trang Tổng quan).
Đây là tài liệu thiết kế: dự án chưa cài outbox và code ví dụ chưa chạy thử. Nguồn đặt trong `apps/w-identity/documents/outbox/`; template ở `knowledge-base/projects/outbox/template.html`; đánh dấu ôn tập dùng khóa `outbox-practice-marks`.

## RabbitMQ

Mục `#rabbitmq` là sổ tay học RabbitMQ từ nền tảng, gồm 15 bài (0–14): vì sao cần broker, connection và channel, exchange và binding, queue, ack và prefetch, ba chặng không mất message, at-least-once và idempotent, DLX và retry, thứ tự, patterns, vận hành, cluster và quorum queue, so sánh với Kafka, và cách nói khi phỏng vấn (có sơ đồ `rabbitmq-routing.svg`).
Đây là tài liệu lý thuyết tổng quát, không mô tả code của `@lib-infrastructure/rabbitmq`; code `amqplib` chỉ để minh họa và chưa chạy thử. Nguồn đặt trong `apps/w-identity/documents/rabbitmq/`; template ở `knowledge-base/projects/rabbitmq/template.html`; đánh dấu ôn tập dùng khóa `rabbitmq-practice-marks`.

## Thêm project mới

1. Trong `apps/<project>/`: viết `documents/KNOWLEDGE.md`, `INTERVIEW-QUESTIONS.md`, `SLIDES.md`
   (cùng định dạng với api-gateway) và copy thư mục `scripts/` từ api-gateway, sửa phần
   Tổng quan (hero, sơ đồ, simulator) trong `knowledge-base/projects/<id>/template.html`.
   Đổi key localStorage (`gw-…`) sang tiền tố riêng để tiến độ không lẫn giữa các project.
2. Thêm một dòng vào `projects.json` (`id`, `name`, `app`, `tagline`; thêm `docs` nếu tài liệu không nằm ở `documents/`).
3. Chạy `npm run docs:knowledge-base`.
