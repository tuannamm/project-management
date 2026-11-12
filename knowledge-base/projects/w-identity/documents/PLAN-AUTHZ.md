# Kế hoạch: phân quyền theo permission (UI + gateway + w-identity)

Trạng thái: **đã triển khai G5, I1–I3; đã kiểm tra test, typecheck và HTTP e2e; chờ người dùng review diff**. Không tự commit.
Liên quan: [PLAN-ROLE-PERMISSION.md](./PLAN-ROLE-PERMISSION.md), [PLAN-ISADMIN.md](./PLAN-ISADMIN.md) (chưa duyệt), `apps/api-gateway/documents/PLAN.md`.

## 1. Quyết định đã chốt

1. **UI:** sau khi đăng nhập, UI gọi API lấy role và permission của mình để quyết định render. Chỉ để hiển thị, không phải bảo mật.
2. **Client không gửi permission.** Gateway tự xác định permission của user từ nguồn tin cậy (w-identity) và **cache ngắn**.
3. **OpenAPI khai báo permission cho từng operation**; gateway kiểm tra trước khi chuyển request. Mặc định từ chối nếu thiếu khai báo.

## 2. Luồng

```text
Client ──login──► Keycloak ──JWT──► Client
UI     ──GET /me/permissions (JWT)──► Gateway ──► w-identity: identity.me.permissions
        ◄── { userId, role, permissions[] }       (UI dùng để render menu/nút)

Client ──request + JWT──► Gateway
  1. route khớp                           (đã có)
  2. xác thực JWT → user.sub              (đã có)
  3. AUTHORIZE (mới):
       required = route.permissions       (từ x-required-permissions)
       required rỗng        → bỏ qua
       granted = cache(sub) hoặc gọi identity.authz.permissions { userId: sub }
       thiếu permission nào → 403 FORBIDDEN
       tra cứu lỗi          → 503 AUTHZ_UNAVAILABLE  (từ chối khi không chắc, fail closed)
  4. discovery → gửi RPC tới service      (đã có)
```

## 3. Hiện trạng đã đọc trong api-gateway

| Điểm | Hiện trạng | Hệ quả cho kế hoạch |
|---|---|---|
| `gateway-handler.ts` | Thứ tự: route → authenticate → payload → discovery → send | Chèn bước `authorize` giữa authenticate và payload |
| `spec-loader.ts` | Chỉ hiểu `security` (bearer, scopes rỗng) → `requiresAuth`; chưa đọc extension `x-` nào | Thêm đọc `x-required-permissions`, kiểm tra khi khởi động |
| `RouteDefinition` | Có `operationId`, `successStatus`, `requiresAuth` | Thêm `permissions: readonly string[]` |
| `jwt-authenticator.ts` | Lấy `roles` từ claim Keycloak `realm_access.roles` | **Mâu thuẫn** với thiết kế: role nằm ở MongoDB, JWT không mang role. Hai nguồn sự thật dễ gây nhầm |
| `specs/identity/openapi.yml` | Còn các route cũ `/roles`, `/users/{id}/roles/{role}` (assign/remove), field `roles` enum `admin/user`; **chưa có** route cho RBAC mới và `/me/permissions` | Phải cập nhật spec (trái với dòng "không sửa api-gateway" trong plan RBAC, nên nay vào phạm vi) |
| Lỗi gateway | `GatewayError(status, code, message)` → problem+json | Dùng `FORBIDDEN` 403 và `AUTHZ_UNAVAILABLE` 503 theo cùng cách |

## 4. Thiết kế

### 4.1 Hợp đồng OpenAPI

Mỗi operation có `x-required-permissions` (mảng key `resource:action`, ngữ nghĩa **AND**: phải có đủ tất cả).

Luật kiểm tra khi khởi động (`spec-loader`, fail-fast, gộp vào `SpecValidationError`):

| Trường hợp | Kết quả |
|---|---|
| Route cần đăng nhập, **thiếu** `x-required-permissions` | Lỗi (từ chối mặc định) |
| `x-required-permissions: []` | Hợp lệ: chỉ cần đăng nhập (ví dụ `/me`) |
| Route công khai (`security: []`) có khai báo permission | Lỗi (vô nghĩa, dễ nhầm) |
| Key sai định dạng `^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$`, trùng lặp, hoặc không phải mảng chuỗi | Lỗi |

### 4.2 Bảng permission cho identity

6 permission seed hiện có đủ dùng.

| operationId | `x-required-permissions` |
|---|---|
| `identity.me.get`, `identity.me.updateProfile`, `identity.me.permissions` | `[]` |
| `identity.users.list`, `identity.users.get`, `identity.users.getRole`, `identity.users.getPermissions` | `["users:read"]` |
| `identity.users.create`, `identity.users.update`, `identity.users.setStatus`, `identity.users.sendPasswordReset` | `["users:write"]` |
| `identity.users.assignRole` | `["roles:write"]` |
| `identity.roles.list`, `identity.roles.get` | `["roles:read"]` |
| `identity.roles.create`, `update`, `delete`, `grantPermission`, `revokePermission` | `["roles:write"]` |
| `identity.permissions.list`, `identity.permissions.get` | `["permissions:read"]` |
| `identity.permissions.create`, `identity.permissions.delete` | `["permissions:write"]` |

Pattern **nội bộ**, không có route HTTP: `identity.authz.permissions` (gateway dùng để tra).

### 4.3 Gateway

- `auth/permission-resolver.ts`: interface `PermissionResolver { permissionsOf(userId): Promise<ReadonlySet<string>> }`.
- `RpcPermissionResolver`: gọi `identity.authz.permissions` qua discovery + transport hiện có, với timeout của gateway.
- `CachingPermissionResolver` (bọc ngoài):
  - TTL mặc định 30 giây, cấu hình bằng `AUTHZ_CACHE_TTL_MS`;
  - giới hạn số entry (ví dụ 10 000), loại entry cũ nhất khi đầy;
  - **single-flight**: nhiều request cùng `sub` đang chờ chỉ tạo một lần tra;
  - chỉ cache kết quả thành công, không cache lỗi.
- `GatewayHandler.authorize(route, user)`: bỏ qua nếu `route.permissions` rỗng; thiếu quyền → `403 FORBIDDEN`; tra lỗi → `503 AUTHZ_UNAVAILABLE`.
- `buildGateway`: nếu có route cần permission mà không dựng được resolver → `ConfigError` (fail-fast).
- Gateway **không** chuyển permission xuống service; service tự kiểm tra khi cần.

### 4.4 w-identity

- **Domain:** `resolveEffectiveAccess(userRole | null, roles, allPermissions)` thuần (nếu duyệt `PLAN-ISADMIN`, `isAdmin = true` → role `admin` + mọi permission; chưa duyệt thì bỏ nhánh đó).
- **Application:**
  - `AccessResolver`: gom logic "user → role → permission hiệu lực" đang nằm riêng trong `resolveUserRole` (dùng chung cho 3 nơi dưới).
  - Query `GetMyAccess` (`identity.me.permissions`): actor chính mình; yêu cầu tài khoản đang hoạt động; trả `{ userId, role, permissions }`.
  - Query `ResolveUserAccess` (`identity.authz.permissions`): **không có Actor**, nhận `{ userId }` từ gateway. Tài khoản bị khóa trong Keycloak → trả `permissions: []`, nên khóa tài khoản có hiệu lực tối đa sau 1 TTL cache dù JWT còn hạn.
  - `GetUserPermissions` dùng lại `AccessResolver`.
- **Presentation:** hai message pattern mới + DTO `UserIdParamDto` có sẵn; controller riêng `authz.controller.ts` cho pattern nội bộ.
- **Giữ nguyên ở lượt này:** `AuthorizationPolicy.management()` vẫn từ chối (xem 6).

### 4.5 Cập nhật spec gateway

Sửa `apps/api-gateway/specs/identity/openapi.yml`: bỏ route/schema cũ không còn khớp, thêm route cho role/permission mới và `GET /me/permissions`, gắn `x-required-permissions` theo bảng 4.2.

## 5. Các bước thực hiện

**Gateway** (`apps/api-gateway`)
- [x] G1. `RouteDefinition.permissions`; `spec-loader` đọc và kiểm tra `x-required-permissions` (4.1) + test các ca lỗi
- [x] G2. `PermissionResolver`, `RpcPermissionResolver`, `CachingPermissionResolver` + test (cache trúng, hết TTL, single-flight, lỗi không cache, giới hạn entry)
- [x] G3. `GatewayHandler.authorize` + `buildGateway` + config `AUTHZ_CACHE_TTL_MS` + test (403, 503, `[]` bỏ qua tra, route công khai)
- [x] G4. Bỏ đọc `roles` từ JWT trong `jwt-authenticator` (nếu duyệt câu 1) + cập nhật test
- [x] G5. Cập nhật `specs/identity/openapi.yml` (4.5)

**w-identity**
- [x] I1. `resolveEffectiveAccess` (domain) + `AccessResolver` (application) + test fake port
- [x] I2. `GetMyAccess`, `ResolveUserAccess` + adapter CQRS + controller + test (tài khoản khóa → rỗng, user chưa có role → role `user`)
- [x] I3. Đăng ký trong `app.module.ts`, token DI nếu cần

**Chung**
- [x] C1. Typecheck và test cả hai app; e2e HTTP → gateway → RPC TCP giả với `identity.authz.permissions`
- [x] C2. Tài liệu: bài 16 `KNOWLEDGE.md`, câu hỏi phỏng vấn (JWT roles hay tra cứu, cache TTL, fail closed), `PLAN-ROLE-PERMISSION.md`, bản sao hợp đồng
- [ ] C3. Bạn review diff; tôi không tự commit

## 6. Ngoài phạm vi / để bước sau (cần duyệt riêng)

- **Bật lại thực thi trong w-identity:** thay `management(actor)` bằng `require(actor, 'users:write')` bất đồng bộ để service tự bảo vệ (defense in depth, và để kiểm tra quy tắc theo dữ liệu như "không gỡ admin cuối cùng"). Đây là thay đổi hành vi lớn (các thao tác quản lý đang bị tắt sẽ chạy được), nên tách riêng.
- **Admin đầu tiên:** khi bật quản lý cần cách tạo admin ban đầu (biến môi trường chứa Keycloak user ID, hoặc script). Chưa quyết.
- **Thu hồi cache chủ động** (sự kiện khi đổi role). Hiện chấp nhận độ trễ tối đa một TTL.
- Không đưa permission vào JWT; không đồng bộ sang Keycloak.

## 7. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Gateway phụ thuộc w-identity: identity chết thì mọi route cần quyền trả 503 | Cố ý (fail closed); route `[]` và route công khai vẫn chạy nếu JWT hợp lệ; cache giúp qua gián đoạn ngắn |
| Quyền đổi nhưng cache cũ | Độ trễ tối đa một TTL (30 giây mặc định); tài liệu hóa |
| Pattern nội bộ `identity.authz.permissions` gọi được bởi bất kỳ client nào tới được cổng TCP của identity | Mô hình tin cậy hiện tại của TCP đã như vậy với mọi pattern; không đưa vào OpenAPI nên không có đường HTTP. Cần chính sách mạng hoặc khóa dùng chung ở bước sau |
| Lệch danh mục: key trong OpenAPI không tồn tại trong `permissions` | Thêm kiểm tra (test hoặc khi khởi động gateway/identity) so key trong spec với danh sách seed |
| Cache tăng bộ nhớ | Giới hạn số entry + loại entry cũ |
| Quên khai báo permission cho route mới | Lỗi khởi động (từ chối mặc định) |

## 8. Cần bạn quyết định

Mặc định đề xuất ở cột giữa; không phản hồi thì tôi làm theo mặc định.

| # | Câu hỏi | Mặc định | Lý do |
|---|---|---|---|
| 1 | Bỏ đọc `roles` từ claim JWT trong gateway? | Bỏ | Tránh hai nguồn sự thật; role chỉ nằm ở MongoDB |
| 2 | TTL cache | 30 giây | Cân bằng độ tươi và tải |
| 3 | Nhiều permission trong một operation | AND (phải có đủ) | Đơn giản, an toàn |
| 4 | Gộp cả bật thực thi trong w-identity (mục 6) vào lượt này? | Không, làm riêng | Thay đổi hành vi lớn |
| 5 | Có làm `isAdmin` cùng lúc (đã có `PLAN-ISADMIN.md`)? | Chưa; chỉ chừa chỗ trong `resolveEffectiveAccess` | Chưa được duyệt |
| 6 | Field `role` cho user: dùng cách "tính ra khi trả về" (cách 2) và trả qua `me.permissions`? | Có | Giữ `users` và `user_roles` tách biệt |
| 7 | Admin đầu tiên tạo thế nào? | Để bước sau | Chỉ cần khi bật thực thi |
