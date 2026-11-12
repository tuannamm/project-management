# Kế hoạch: chuyển DTO sang class + class-validator

Trạng thái: **đã triển khai, chờ review** — e2e còn bị chặn bởi fixture thiếu. Đánh dấu `[x]` khi hoàn thành từng bước.

> Tên file là `PLAN-DTO.md` để không ghi đè [PLAN.md](./PLAN.md) (tài liệu lịch sử của w-identity).

## 1. Mục tiêu

Mỗi input vào service (body, query, params) là **một class DTO**, mỗi field khai báo quy tắc bằng decorator của `class-validator`. Thay cho các hàm parser tự viết trong `presentation/tcp/dto/identity.dto.ts`.

Không đổi: hợp đồng lỗi trả về gateway (`VALIDATION_ERROR` → 400), việc Application/Domain không biết `class-validator`, và các quy tắc nghiệp vụ trong Domain.

## 2. Hiện trạng

| Thành phần | Vị trí | Vấn đề |
|---|---|---|
| Parser dạng hàm: `object`, `fields`, `string`, `accountBody`, `profileBody`, `listQuery`, `userId` | `src/presentation/tcp/dto/identity.dto.ts` | Quy tắc nằm trong code lệnh, không khai báo theo field |
| Kiểm tra `enabled` boolean | trực tiếp trong `IdentityController.status` | Validate rải ở controller |
| `class-validator`, `class-transformer` | chưa cài | Cần thêm dependency |
| Test | `identity.dto.spec.ts`, `identity-error.filter.spec.ts` | Test theo hàm cũ, phải viết lại |
| Quy tắc URL/timezone/locale | `domain/policies/profile.policy.ts` | Sẽ bị lặp nếu viết lại trong DTO |

`actorOf` (dựng `Actor` từ `GatewayRequest.user`) không phải DTO nên giữ lại.

## 3. Thiết kế

### 3.1 Danh sách DTO

Mỗi class một file trong `src/presentation/tcp/dto/`.

| DTO | Nguồn | Field và quy tắc |
|---|---|---|
| `UpdateMyProfileDto` | body | `avatarUrl`, `phoneNumber`, `timezone`, `locale`: tùy chọn, chuỗi, không rỗng, tối đa 2048 ký tự cho `avatarUrl` và 100 cho các field còn lại; phải có ít nhất một field |
| `CreateUserDto` | body | `username`, `email` bắt buộc; `firstName`, `lastName` tùy chọn; tối đa 255 ký tự |
| `UpdateUserDto` | body | `email`, `firstName`, `lastName` tùy chọn; ít nhất một field |
| `SetUserStatusDto` | body | `enabled`: `@IsBoolean` |
| `ListUsersQueryDto` | query | `offset` (mặc định 0, `@IsInt`, `@Min(0)`), `limit` (mặc định 20, `@IsInt`, `@Min(1)`, `@Max(100)`), `search` tùy chọn, `enabled` tùy chọn (`'true'`/`'false'` đổi thành boolean) |
| `UserIdParamDto` | params | `id`: chuỗi không rỗng, tối đa 128 ký tự |

### 3.2 Một nguồn quy tắc duy nhất

Tách khỏi `domain/policies/profile.policy.ts` thành hàm export:

- `isSafeAvatarUrl(value)`: giao thức http/https, không chứa user:pass
- `isValidTimezone(value)`: dùng `Intl.DateTimeFormat`
- `isValidLocaleTag(value)`: dùng `Intl.getCanonicalLocales`

Dùng ở hai nơi:

1. Decorator tùy chỉnh trong DTO: `@IsSafeAvatarUrl`, `@IsTimezone`, `@IsLocaleTag`.
2. `validateProfilePatch` trong Domain, **vẫn được use case gọi** để HTTP, TCP, RabbitMQ hay gọi trực tiếp đều chịu cùng bất biến.

DTO kiểm tra hình dạng và định dạng ở biên. Domain giữ bất biến nghiệp vụ.

### 3.3 Cơ chế validate

Helper `parseInput(DtoClass, plain)` trong Presentation:

- `plainToInstance` → `validateSync`
- tùy chọn: `whitelist: true`, `forbidNonWhitelisted: true`, `forbidUnknownValues: true` (giữ hành vi từ chối field lạ như `userId: 'victim'`)
- lỗi → ném `ApplicationError('VALIDATION_ERROR', message)`; message **không** chứa giá trị người dùng nhập

Lý do không dùng `ValidationPipe` của Nest: payload là cả envelope `GatewayRequest` (body/query/params lồng nhau), và pipe ném `HttpException`/`RpcException` thay vì lỗi mà `IdentityErrorFilter` đang ánh xạ.

### 3.4 Ranh giới lớp

```text
GatewayRequest ─► parseInput(Dto) ─► input thuần ─► Command/Query ─► Application ─► Domain
   (Presentation, dùng class-validator)      (Application/Domain không import class-validator)
```

- DTO class **không** đi vào Application; controller chuyển instance thành object thuần (`ProfilePatch`, `CreateAccount`...).
- `architecture.spec.ts` không cần đổi: nó chỉ canh `domain/` và `application/`.

## 4. Các bước thực hiện

- [x] **B1. Cài dependency.** Thêm `class-validator` và `class-transformer` vào `apps/w-identity/package.json`, chọn phiên bản tương thích Nest 12; chạy `tsc --noEmit`.
- [x] **B2. Tách quy tắc dùng chung** (3.2): export hàm trong `profile.policy.ts`, `validateProfilePatch` gọi lại chúng. Chạy test `profile.policy.spec.ts` để chứng minh hành vi không đổi.
- [x] **B3. Tạo decorator tùy chỉnh** `@IsSafeAvatarUrl`, `@IsTimezone`, `@IsLocaleTag` và validator "ít nhất một field".
- [x] **B4. Tạo các DTO** (3.1) và helper `parseInput` (3.3).
- [x] **B5. Sửa `IdentityController`:** thay lời gọi parser cũ bằng `parseInput`; bỏ kiểm tra `enabled` trong controller.
- [x] **B6. Xóa parser cũ** trong `identity.dto.ts`; giữ `actorOf` (có thể tách thành `actor.mapper.ts`).
- [x] **B7. Viết lại `identity.dto.spec.ts`** theo từng DTO (mục 5).
- [ ] **B8. Chạy kiểm tra:** `tsc --noEmit`, `npm test`, `npm run test:e2e`, `npm run test:mongo`.
- [x] **B9. Cập nhật tài liệu:** bài 6 và 7 trong `documents/KNOWLEDGE.md` (đang mô tả `identity.dto.ts` và việc DTO gọi lại validation domain), câu hỏi liên quan nếu cần; chạy `npm run docs:knowledge-base`.
- [ ] **B10. Review:** bạn đọc `git diff`; chỉ commit khi bạn nói.

## 5. Ca test cho DTO

| Nhóm | Ca |
|---|---|
| Hợp lệ | mỗi DTO một input đúng; query mặc định `{ offset: 0, limit: 20 }` |
| Thiếu/rỗng | thiếu `username` hoặc `email`; object rỗng với DTO "ít nhất một field"; chuỗi toàn khoảng trắng |
| Field lạ | `userId: 'victim'` trong profile; `unexpected: true`; `__proto__` |
| Định dạng | `javascript:` URL; URL có user:pass; timezone `Not/AZone`; locale sai; email sai |
| Giới hạn | vượt độ dài tối đa; `limit` = 0 hoặc 101; `offset` âm |
| Kiểu | `enabled: "yes"`; query dạng mảng; body không phải object |
| Ánh xạ lỗi | message không lộ giá trị nhập; vẫn ra `VALIDATION_ERROR` / 400 |

## 6. Rủi ro

- **Đổi hành vi ngầm:** `class-validator` có quy tắc riêng (`@IsEmail`, `@IsUrl`) khác regex/`URL` hiện tại. Vì vậy B2 giữ nguyên hàm cũ làm nguồn quy tắc.
- **Mất bảo vệ field lạ:** quên `whitelist`/`forbidNonWhitelisted` sẽ cho `userId` giả lọt qua; đã có ca test riêng.
- **Môi trường test:** Jest hiện không chạy được ở Node 22.22 (lỗi import ESM của `@nestjs/common`, có từ trước). Cần chạy test bằng phiên bản Node mà dự án yêu cầu, nếu không không thể xác nhận B7–B8.
- **Hợp đồng lỗi:** nếu chuyển sang trả lỗi theo từng field thì cần đổi cả phía `api-gateway` (xem câu hỏi 4).

## 7. Cần bạn quyết định trước khi làm

Mặc định đề xuất ở cột giữa; nếu không phản hồi tôi sẽ làm theo mặc định.

| # | Câu hỏi | Mặc định đề xuất | Lý do |
|---|---|---|---|
| 1 | Email dùng `@IsEmail()` hay giữ regex hiện tại? | Giữ hành vi hiện tại qua decorator tùy chỉnh | Không đổi hành vi trong lượt refactor |
| 2 | `phoneNumber` có thêm kiểm tra định dạng? | Không, giữ "chuỗi không rỗng ≤ 100" | Cần chọn quy ước quốc gia trước |
| 3 | Chuyển cả DTO quản lý tài khoản (đang bị `management()` từ chối)? | Có, để nhất quán | Tránh còn hai kiểu validate |
| 4 | Lỗi trả về: một message chung hay danh sách theo field? | Một message chung `Invalid <field>` | Không đổi hợp đồng với gateway |

## 8. Ngoài phạm vi

- Không đổi logic nghiệp vụ trong Domain/Application.
- Không đổi hợp đồng `GatewayRequest` / `GatewayRpcError`.
- Không thêm quyền, role hay mở lại các thao tác quản lý tài khoản.
- Không commit khi chưa được bạn review.

## 9. Kết quả triển khai

- Dependency: class-validator 0.15.1, class-transformer 0.5.1; giữ regex email cũ.
- Node 24.22.2: `tsc --noEmit`, Nx typecheck/build và 112 unit test (8 suites) pass, bao gồm profile policy và architecture.
- `test:mongo` pass khi chạy ngoài sandbox để kết nối dịch vụ local.
- `test:e2e` đã chạy ngoài sandbox, dừng vì thiếu `apps/w-identity/fixtures/pm-realm.json`; B8 chưa hoàn tất.
- `npm run docs:knowledge-base` ở root pass. Script cũ `w-identity:docs:knowledge` tham chiếu `scripts/build-knowledge-html.mjs` không tồn tại; không thay đổi script ngoài phạm vi.
- Đã kiểm tra code và `git diff --check`. Thư mục w-identity hiện untracked từ trước nên `git diff` chưa hiển thị nội dung của nó; B10 chờ bạn review. Chưa commit.
