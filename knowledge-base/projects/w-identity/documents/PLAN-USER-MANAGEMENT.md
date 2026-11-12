# Kế hoạch: quản lý user và gán role (w-identity + UI)

Trạng thái: **đã triển khai, chờ review**. Không commit khi chưa được duyệt.

## Quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Role | Chỉ 2 role hệ thống `user` và `admin` (đã seed). UI không quản lý role/permission. |
| `management()` | Chỉ kiểm tra đã xác thực (issuer tin cậy). Permission (`users:write`, `roles:write`...) do **gateway** chặn qua `x-required-permissions`. Đánh đổi: w-identity không tự kiểm tra role nếu bị gọi vòng qua gateway, nên cổng TCP phải là mạng nội bộ. |
| Admin đầu tiên | Biến môi trường `BOOTSTRAP_ADMIN_USER_ID` (Keycloak user id); seeder gán role `admin` khi khởi động, idempotent. |
| Tạo user | Keycloak tạo user với `UPDATE_PASSWORD`; UI chọn role rồi gọi `PUT /users/{id}/role` (bỏ qua nếu là `user`, vì mặc định). |

## Checklist

- [x] `AuthorizationPolicy.management` chỉ yêu cầu xác thực
- [x] Seeder gán admin đầu tiên từ `BOOTSTRAP_ADMIN_USER_ID` (+ `.env.example`)
- [x] Sửa test "luôn FORBIDDEN" thành "UNAUTHENTICATED khi actor sai issuer" (`authorization.policy.spec`, `cqrs.spec`, `rbac.spec`, `profile.integration.spec.mjs`)
- [x] UI: `/users` (danh sách, tìm kiếm, phân trang, role từng dòng), `/users/new`, `/users/:id` (sửa hồ sơ, đổi role, khóa/mở khóa, email đặt lại mật khẩu)
- [x] UI: `api/identityApi.ts` + test; link "Người dùng" trong header theo `users:read`
- [x] Jest w-identity 205 test (Node 24), `tsc` sạch; UI 52 test, `tsc` sạch, `react-scripts build` ok
- [ ] Chưa chạy `test:mongo`/`test:profile` (cần MongoDB) và chưa thử trình duyệt thật
- [ ] Bạn review → bạn bảo mới commit

## Cách tạo admin đầu tiên

1. Đăng nhập một lần bằng user bất kỳ trong Keycloak, lấy `sub` (hoặc xem id trong Keycloak console).
2. Đặt `BOOTSTRAP_ADMIN_USER_ID=<id>` trong `.env` của w-identity, khởi động lại.
3. Đăng nhập lại: `/me/permissions` trả role `admin`, header hiện link "Người dùng". Gateway cache quyền ngắn nên có thể trễ một TTL.

## Giới hạn đã biết

- UI chặn tự đổi role/khóa chính mình, nhưng backend chưa chặn (chặn admin cuối cùng nằm trong `PLAN-ISADMIN.md`, chưa duyệt).
- Danh sách tra role từng dòng (1 request/dòng, 10 dòng/trang) vì Keycloak list không kèm role.
