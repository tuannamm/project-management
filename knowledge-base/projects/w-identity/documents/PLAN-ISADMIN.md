# Kế hoạch: cờ `isAdmin` (= role admin + mọi permission)

Trạng thái: **chờ duyệt** — chưa viết code. Đánh dấu `[x]` khi xong từng bước.

## 1. Yêu cầu

Nếu user có `isAdmin = true` thì:
- role hiệu lực của user là `admin`, bất kể bản ghi `user_roles` nói gì;
- permission hiệu lực là **mọi permission đang có trong hệ thống** (kể cả permission tạo sau này), không chỉ danh sách đang gắn cho role `admin`.

## 2. Quyết định cần bạn chọn (quan trọng nhất)

Cờ này là đặc quyền cao nhất, nên **nơi lưu và ai được đặt** quyết định mức an toàn.

| Phương án | Nơi lưu cờ | Ưu | Nhược |
|---|---|---|---|
| **A (đề xuất)** | Collection `user_roles` (thêm field `isAdmin`, mặc định `false`) | Cùng chỗ với role nên tra một lần; không lẫn với hồ sơ user tự sửa được; domain thuần, không cần Keycloak | Phải có use case riêng để đặt cờ; bản ghi chưa tồn tại coi như `false` |
| B | Collection `users` (field của `User`) | Một nơi cho mọi thứ của user | `UpdateMyProfile` ghi cùng record; nếu sơ suất, user tự đặt mình thành admin. Cần chặn rất cẩn thận |
| C | Thuộc tính (attribute) trên Keycloak | Quản trị viên chỉnh được trong Keycloak console | Domain/test phụ thuộc Keycloak; adapter hiện chưa đọc attribute; mỗi lần tra phải gọi HTTP |

Đề xuất **A**. Các mục dưới viết theo A; chọn phương án khác thì tôi điều chỉnh.

Quy tắc an toàn bất kể phương án:
- Cờ **không bao giờ** đến từ input của client hoặc claim JWT; chỉ đọc từ kho dữ liệu của service.
- `UpdateMyProfile` không được chạm tới cờ (DTO `UpdateMyProfileDto` đã whitelist nên field `isAdmin` bị từ chối; sẽ thêm test chứng minh).

## 3. Thiết kế (theo phương án A)

### Domain
- `UserRole` thêm `isAdmin: boolean`.
- Hàm thuần `resolveEffectiveAccess(userRole | null, roles, allPermissionKeys)` trong `role.policy.ts`:
  - `isAdmin === true` → `{ roleName: 'admin', isAdmin: true, permissions: tất cả allPermissionKeys, đã sắp xếp }`
  - ngược lại → hành vi hiện tại (role đã gán hoặc `user`, permission của role).
- Giữ nguyên `effectivePermissions` cho trường hợp không phải admin.

### Application
- Port `UserRoleRepositoryPort`: `findByUserId` trả `UserRole` có `isAdmin`; thêm `setAdmin(userId, isAdmin): Promise<UserRole>` (upsert, idempotent).
- Port `PermissionRepositoryPort.list()` đã có → dùng để lấy mọi permission khi `isAdmin`.
- `GetUserRoleHandler` và `GetUserPermissionsHandler` dùng `resolveEffectiveAccess`; kết quả trả thêm `isAdmin`.
- Command mới `SetUserAdminCommand` + `SetUserAdminHandler` (`auth.management(actor)`; xác nhận user tồn tại qua `IdentityProviderPort.get`).
- `AssignRoleToUser` giữ nguyên: đổi role không đụng cờ. Nếu `isAdmin = true` thì role lưu chỉ là thông tin phụ, role hiệu lực luôn là `admin`.

### Infrastructure
- `UserRolePersistenceEntity`: thêm `isAdmin: boolean` (mặc định `false`); `UserRoleRepository.set` giữ nguyên cờ khi đổi role (dùng `$set: { roleName }` như hiện nay, không ghi đè); thêm `setAdmin` bằng upsert có xử lý race khóa duy nhất như `set`.

### Presentation
- DTO `SetUserAdminDto { isAdmin: boolean }` (`@IsBoolean`).
- Operation mới `identity.users.setAdmin` (params `id`, body `{ isAdmin }`).
- Controller/CQRS adapter đăng ký command mới.

### Bootstrap
- Không seed user admin nào (cờ chỉ đặt qua use case). Cách tạo admin đầu tiên khi `management()` còn bị tắt: xem câu hỏi 3.

## 4. Các bước thực hiện

- [ ] **B1. Domain:** `UserRole.isAdmin`, `resolveEffectiveAccess` + `role.policy.spec.ts` (admin → mọi permission kể cả permission ngoài role admin; không admin → như cũ; cờ true thắng role đã gán).
- [ ] **B2. Port + repository:** `setAdmin`, entity, giữ cờ khi `set`; test repository (cờ không bị mất khi đổi role).
- [ ] **B3. Handler:** `SetUserAdminHandler`; sửa hai query handler; cập nhật `rbac.spec.ts`.
- [ ] **B4. DTO + controller + adapter:** `SetUserAdminDto`, message pattern mới; test DTO (`isAdmin: 'true'` bị từ chối, field lạ bị từ chối).
- [ ] **B5. Test an toàn:** `UpdateMyProfileDto` từ chối `isAdmin`; handler không đọc cờ từ input.
- [ ] **B6. Kiểm tra:** `tsc --noEmit`, `npm test`, `test:mongo` (cần Node và MongoDB đúng yêu cầu dự án).
- [ ] **B7. Tài liệu:** cập nhật `PLAN-ROLE-PERMISSION.md`, bài 16 trong `KNOWLEDGE.md`, danh sách operationId.
- [ ] **B8. Review:** bạn đọc diff, tôi không tự commit.

## 5. Rủi ro và lưu ý

- **Leo thang đặc quyền** là rủi ro lớn nhất: bất kỳ đường nào cho client ghi `isAdmin` đều là lỗ hổng. Vì vậy có test riêng (B5) và cờ nằm ngoài `User`/`ProfilePatch`.
- **Admin cuối cùng:** gỡ cờ của admin duy nhất sẽ mất quyền quản trị. Nên chặn khi chỉ còn một user `isAdmin`, hoặc ghi nhận là giới hạn đã biết.
- **Tự gỡ cờ của chính mình:** nên chặn hoặc yêu cầu rõ ràng.
- **Quyền thật sự được thực thi chưa:** `AuthorizationPolicy.management()` vẫn luôn từ chối, nên cờ này hiện chỉ ảnh hưởng đến kết quả truy vấn quyền, chưa mở khóa thao tác nào. Bật lại thực thi quyền là một bước riêng (cần policy bất đồng bộ tra role/cờ của actor).
- **Mất đồng bộ nhỏ:** `isAdmin = true` làm role hiệu lực khác role lưu trong `user_roles`; cần thống nhất mọi nơi đọc dùng `resolveEffectiveAccess`, không tự đọc `roleName`.

## 6. Cần bạn trả lời trước khi làm

| # | Câu hỏi | Đề xuất |
|---|---|---|
| 1 | Lưu cờ ở đâu (A/B/C ở mục 2)? | A: `user_roles` |
| 2 | Có cần use case để đặt/gỡ cờ (`identity.users.setAdmin`), hay chỉ đọc cờ (đặt thủ công trong DB)? | Có use case, nằm sau `management()` như các thao tác khác |
| 3 | Admin đầu tiên được tạo thế nào, vì `management()` đang bị tắt? | Chưa giải quyết ở lượt này; đặt thủ công trong MongoDB cho tới khi bật lại phân quyền |
| 4 | Chặn gỡ cờ admin cuối cùng và tự gỡ cờ của mình? | Có, bằng lỗi `LAST_ADMIN_PROTECTED` |
| 5 | "Mọi permission" gồm cả permission tạo sau này? | Có: lấy từ `PermissionRepositoryPort.list()` lúc truy vấn |

## 7. Ngoài phạm vi

- Không bật lại `AuthorizationPolicy.management()`.
- Không đưa `isAdmin` vào JWT hay đồng bộ sang Keycloak.
- Không đổi hợp đồng `GatewayRequest` / `GatewayRpcError`; không sửa api-gateway.
- Không commit khi chưa được bạn review.
