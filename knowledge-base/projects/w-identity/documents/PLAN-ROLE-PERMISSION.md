# Kế hoạch: domain `role` và `permission` (w-identity)

> Trạng thái: đánh dấu `[x]` khi xong. File này là nơi theo dõi tiến độ; giải thích "tại sao" nằm ở cuối.

## Quyết định thiết kế

| Chủ đề | Quyết định |
|---|---|
| Nơi lưu | MongoDB (`permissions`, `roles`, `user_roles`). Không dùng Keycloak realm roles. |
| Mô hình | RBAC chuẩn: `Permission` = `resource:action`; `Role` chứa `permissionKeys[]`; **mỗi user đúng 1 role**. |
| Role hệ thống | `admin`, `user` (`system = true`): không xóa, không đổi tên, không sửa danh sách permission. |
| Role mặc định | User chưa có bản ghi `user_roles` được coi là role `user` khi đọc (không cần migrate). `CreateUser` không ghi role (không cần, nhờ mặc định khi đọc). |
| Authorization | **Chưa** bật lại `AuthorizationPolicy.management` (vẫn FORBIDDEN tạm thời). Handler mới gọi `auth.management(actor)` giống handler user. |
| Phạm vi gateway | Chỉ liệt kê `operationId`; không sửa api-gateway. |

## Checklist

### 1. Domain
- [x] `domain/models/permission.ts`
- [x] `domain/models/role.ts` (kèm `UserRole`)
- [x] `domain/policies/role.policy.ts` (validate key/name, bảo vệ role system, `effectivePermissions`)
- [x] `DomainErrorCode` thêm `INVALID_ROLE`, `INVALID_PERMISSION`, `SYSTEM_ROLE_PROTECTED`
- [x] `role.policy.spec.ts`

### 2. Application
- [x] `ErrorCode` thêm `ROLE_NOT_FOUND`, `PERMISSION_NOT_FOUND`, `ROLE_CONFLICT`, `PERMISSION_CONFLICT`, `ROLE_IN_USE`, `PERMISSION_IN_USE`
- [x] Ports (repo dùng `insert` thay `create` vì base `MongoDBRepository.create` đã tồn tại; thêm `ensure`/`ensureSystemRole` cho seeder): `permission-repository.port.ts`, `role-repository.port.ts`, `user-role-repository.port.ts`
- [x] Commands + handlers: `permission.commands`/`permission-command.handlers`, `role.commands`/`role-command.handlers` (create/update/delete role, grant/revoke permission, assign role)
- [x] Queries + handlers: list/get permission, list/get role, get user role, get user permissions
- [x] `rbac.spec.ts` (unit test handlers với port giả)

### 3. Infrastructure (Mongoose)
- [x] Entities: permission, role, user-role
- [x] Repositories: permission, role, user-role (map lỗi duplicate → `*_CONFLICT`)
- [x] Repository spec

### 4. Presentation (TCP)
- [x] DTO: create-permission, permission-key-param, create-role, update-role, role-name-param, grant-permission, assign-role
- [x] `permission.controller.ts`, `role.controller.ts`
- [x] `rbac.handlers.ts` (Nest adapter bọc handler thuần)
- [x] `identity-error.filter.ts`: map mã lỗi mới
- [x] DTO spec

### 5. Bootstrap
- [x] Tokens DI mới
- [x] `rbac.seeder.ts`: seed role `admin`/`user` + permission mặc định lúc khởi động (idempotent)
- [x] Đăng ký trong `app.module.ts`

### 6. Xác minh & tài liệu
- [x] Jest (13 suite, 193 test) + oxlint + `nest build` xanh. Chạy trên Node 24 (máy đang Node 22: Jest không load được `@nestjs/common` ESM). Chưa chạy `test:mongo`/`test:e2e` (cần MongoDB/Keycloak).
- [x] Cập nhật `documents/KNOWLEDGE.md` (mục 16)
- [ ] Bạn review → bạn bảo mới commit

## Seed admin (bổ sung)

Cách làm: **script chạy tay** `npm run seed:admin` (đổi từ seed tự động lúc khởi động). Mật khẩu tạm lấy từ biến môi trường.

- [x] `IdentityProviderPort` thêm `findByUsername` và `setTemporaryPassword` (adapter Keycloak: `GET /users?exact=true`, `PUT /users/{id}/reset-password` với `temporary: true`)
- [x] `bootstrap/admin.seeder.ts`: `readAdminSeedSettings` + `AdminSeeder`
- [x] `src/seed-admin.ts`: script dùng `SeedAdminModule` tối giản (chỉ ConfigModule, MongoDB, Keycloak; không TCP/RabbitMQ/discovery/health)
- [x] `package.json`: `"seed:admin": "nest build && node dist/seed-admin"`
- [x] `RbacSeeder` vẫn chạy lúc service khởi động (service cần role/permission); service **không** tự tạo admin nữa
- [x] `.env.example`: `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
- [x] Test: settings, seeder, adapter
- [ ] Bạn điền 3 biến vào `.env` và chạy `npm run seed:admin` với Keycloak/MongoDB thật

Cách chạy: điền `SEED_ADMIN_*` trong `apps/w-identity/.env`, rồi `cd apps/w-identity && npm run seed:admin`. Thoát mã 1 và in lý do nếu lỗi.

| Tình huống | Kết quả |
|---|---|
| Thiếu `SEED_ADMIN_USERNAME`, email hoặc password; password ngoài 3-128 ký tự | Script dừng, mã thoát 1, chưa ghi gì |
| User chưa có trong Keycloak | Seed role/permission, tạo user, đặt mật khẩu tạm (buộc đổi lần đăng nhập đầu), gán role `admin` |
| User đã có | Không đụng mật khẩu; chỉ gán `admin` nếu user chưa có role nào (hạ quyền có chủ ý không bị hoàn tác) |
| Keycloak hoặc MongoDB lỗi | Script báo lỗi (không chứa mật khẩu), mã thoát 1; chạy lại an toàn |

Giới hạn đã biết: nếu tạo user xong mà đặt mật khẩu lỗi, lần chạy sau thấy user đã tồn tại nên không đặt lại mật khẩu; khi đó dùng email đặt lại mật khẩu (`sendPasswordReset`) hoặc Keycloak Admin Console.

## Message pattern / operationId (để khai báo ở gateway)

| Pattern | Input | Ghi chú |
|---|---|---|
| `identity.permissions.create` | body `{ key, description? }` | 409 nếu trùng |
| `identity.permissions.list` | – | |
| `identity.permissions.get` | params `{ key }` | 404 |
| `identity.permissions.delete` | params `{ key }` | 409 `PERMISSION_IN_USE` nếu role đang dùng |
| `identity.roles.create` | body `{ name, description?, permissionKeys? }` | permission phải tồn tại |
| `identity.roles.list` | – | |
| `identity.roles.get` | params `{ name }` | 404 |
| `identity.roles.update` | params `{ name }`, body `{ description? }` | chặn role system |
| `identity.roles.delete` | params `{ name }` | chặn role system; 409 `ROLE_IN_USE` nếu có user |
| `identity.roles.grantPermission` | params `{ name }`, body `{ permissionKey }` | idempotent; chặn role system |
| `identity.roles.revokePermission` | params `{ name, key }` | idempotent; chặn role system |
| `identity.users.getRole` | params `{ id }` | mặc định `user` |
| `identity.users.assignRole` | params `{ id }`, body `{ roleName }` | **thay thế** role cũ, idempotent |
| `identity.users.getPermissions` | params `{ id }` | permission hiệu lực của role hiện tại |

## Vì sao thiết kế như vậy (để ôn phỏng vấn)

- **Ba port tách riêng (ISP):** handler role không cần biết đến lưu trữ user-role, và ngược lại. Test dễ mock.
- **Policy thuần trong domain:** quy tắc "role system bất biến", định dạng key/name chạy được cả khi gọi use case trực tiếp (không chỉ qua TCP), giống `profile.policy`.
- **1 user = 1 role = 1 document:** `user_roles.keycloakUserId` unique, `set` là một upsert nên idempotent và không race; đếm user theo role bằng index `roleName`.
- **Grant/revoke bằng `$addToSet`/`$pull`:** thao tác nguyên tử, chạy song song vẫn đúng, gọi lại không đổi kết quả.
- **Kiểm tra "đang được dùng" trước khi xóa:** check-then-delete có cửa sổ race nhỏ; chấp nhận ở v1 vì chỉ admin thao tác, ghi nhận là giới hạn đã biết.
- **Seed ở bootstrap:** dữ liệu khởi tạo là chuyện triển khai, không phải quy tắc miền; seed idempotent bằng upsert.

Phân quyền gateway và tra cứu quyền hiệu lực được triển khai theo `PLAN-AUTHZ.md`; `management()` vẫn từ chối cho tới kế hoạch riêng.
