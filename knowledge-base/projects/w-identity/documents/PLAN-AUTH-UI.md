# Kế hoạch: UI đăng nhập và đăng xuất

Trạng thái: **đã triển khai, chờ review** (U1–U7 xong; U8 chờ bạn). Đổi so với kế hoạch: UI chạy cổng **3001** (cổng 3000 đã là của API Gateway), nên mọi `localhost:3000` ở các mục dưới tương ứng với `localhost:3001` trong cấu hình thật. Đánh dấu `[x]` khi xong từng bước.
Liên quan: [PLAN-AUTHZ.md](./PLAN-AUTHZ.md) (phân quyền sau khi đăng nhập), sổ tay `#authz`.

## 1. Mục tiêu

Người dùng đăng nhập và đăng xuất trên UI, sau đó UI lấy permission của mình (`GET /me/permissions`) để render, và mọi lời gọi API đều kèm JWT hợp lệ.

**Nguyên tắc chốt:** SPA **không bao giờ nhận username/password**. Màn hình đăng nhập do Keycloak phục vụ (đã có theme tùy biến), SPA chỉ chuyển hướng tới đó và nhận lại mã. Cách này là **Authorization Code + PKCE**, đúng với client `pm-web` mà tài liệu w-identity đã dự kiến.

## 2. Hiện trạng đã đọc

| Thành phần | Hiện trạng | Hệ quả |
|---|---|---|
| `apps/u-project-management` | React 19 từ Create React App, còn nguyên mẫu (`App.js`, logo); chưa có router, chưa có thư viện OIDC | Phải dựng khung UI, router và tích hợp auth |
| `apps/keycloak-theme` | Theme Keycloakify cho **trang đăng nhập của Keycloak** (`src/login/Login.tsx`) | Màn hình đăng nhập đã có chỗ làm; SPA không cần tự dựng form |
| Keycloak (docker-compose) | Cổng `8081`, `start-dev`, realm dự kiến `pm` | Issuer: `http://localhost:8081/realms/pm` |
| Client `pm-web` | README w-identity nói fixture `fixtures/pm-realm.json` có client này, nhưng **thư mục `fixtures/` không tồn tại** (cũng là lý do `test:e2e` dừng) | Phải tạo lại client (xem 5) |
| Gateway | Xác minh JWT với `iss` + `aud = w-identity`; **chưa có CORS** | SPA ở origin khác sẽ bị trình duyệt chặn; cần thêm CORS (xem 6) |
| Đăng xuất | Chưa có luồng nào; `IdentityProviderPort.logout` chỉ để admin kết thúc phiên khi khóa tài khoản | Đăng xuất của người dùng đi qua Keycloak, không qua w-identity |

## 3. Luồng đăng nhập

```text
Người dùng      SPA (React)                 Keycloak (trang đăng nhập)        Gateway
    │ mở /app        │                                │                         │
    ├───────────────►│ chưa có token                  │                         │
    │                │ sinh code_verifier + state     │                         │
    │                ├──302 /auth?client_id=pm-web&response_type=code           │
    │                │   &code_challenge=S256(...)&redirect_uri=/callback ─────►│(Keycloak)
    │◄───────────────┴──────── hiện form đăng nhập (theme tùy biến) ───────────┤
    │ nhập username/password ───────────────────────────────────────────────►  │
    │                │◄──302 /callback?code=...&state=... ─────────────────────┤
    │                │ kiểm tra state                  │                         │
    │                ├──POST /token (code + code_verifier) ──────────────────►│
    │                │◄── access_token (5 phút) + refresh_token + id_token ────┤
    │                │ giữ token trong BỘ NHỚ          │                         │
    │                ├──GET /me/permissions + Bearer ───────────────────────────►│
    │                │◄── { role, permissions[] } ─────────────────────────────┤
    │◄── render menu/nút theo permissions ─────────────│                         │
```

Bước nào do ai: SPA chỉ lưu `code_verifier` tạm thời và đổi mã lấy token; mật khẩu chỉ đi giữa trình duyệt và Keycloak.

## 4. Luồng đăng xuất

```text
Người dùng     SPA                          Keycloak
    │ bấm Đăng xuất │                           │
    ├──────────────►│ xóa token trong bộ nhớ    │
    │               ├──302 /logout?id_token_hint=...&post_logout_redirect_uri=/ ─►│
    │               │                           │ hủy phiên SSO (cookie Keycloak)
    │◄──────────────┴──────── 302 về /  (trạng thái chưa đăng nhập) ─────────────┤
```

Điểm cần nhớ khi nói chuyện phỏng vấn:
- Đăng xuất **không thu hồi** access token đã cấp; nó vẫn hợp lệ đến khi hết hạn (5 phút). Giảm rủi ro bằng token sống ngắn và refresh token bị vô hiệu cùng phiên.
- Phải xóa token khỏi UI **và** hủy phiên ở Keycloak. Chỉ xóa ở UI thì lần sau bấm "Đăng nhập" Keycloak vẫn đăng nhập ngầm bằng cookie SSO.
- Truyền `id_token_hint` để Keycloak đăng xuất ngay; không có thì Keycloak hiện trang hỏi xác nhận.

## 5. Luồng phụ: làm mới phiên và xử lý lỗi

| Tình huống | Hành vi của UI |
|---|---|
| Access token sắp hết hạn | Làm mới bằng refresh token **trước khi gọi API** (hoặc khi nhận sự kiện hết hạn); thành công thì tiếp tục, người dùng không thấy gì |
| Làm mới thất bại (phiên hết hạn, bị đăng xuất ở nơi khác) | Xóa token, chuyển về trạng thái chưa đăng nhập, nhớ trang đang xem để quay lại sau |
| API trả **401** | Thử làm mới **đúng một lần** rồi gọi lại; vẫn 401 thì đăng xuất cục bộ |
| API trả **403** | Không đăng xuất. Tải lại `/me/permissions` (quyền có thể đã đổi, độ trễ tối đa một TTL cache) và báo "không có quyền" |
| API trả **503 `AUTHZ_UNAVAILABLE`** | Báo lỗi tạm thời, cho thử lại; không coi là bị từ chối quyền |
| Tải lại trang (F5) | Token nằm trong bộ nhớ nên mất; UI hỏi Keycloak xem phiên SSO còn không (xem 7), còn thì cấp token mới mà không nhập lại mật khẩu |

## 6. Màn hình và trạng thái UI

```text
[Khởi động] ─ kiểm tra phiên SSO ─┬─ có phiên ─► [Đang tải quyền] ─► [Đã đăng nhập]
                                   └─ không có ─► [Chưa đăng nhập] ──(bấm Đăng nhập)──► Keycloak
[Đã đăng nhập] ──(bấm Đăng xuất)──► Keycloak /logout ──► [Chưa đăng nhập]
[Đã đăng nhập] ──(làm mới thất bại)──► [Chưa đăng nhập] (kèm thông báo "Phiên đã hết hạn")
```

| Màn hình / route | Nội dung |
|---|---|
| `/` (công khai) | Trang giới thiệu, nút **Đăng nhập** |
| `/callback` | Xử lý mã trả về, hiển thị "Đang đăng nhập…", rồi chuyển tới trang đã nhớ |
| Khu vực sau đăng nhập (ví dụ `/app`) | Header có tên người dùng (từ `/me`), menu theo permission, nút **Đăng xuất** |
| Trang "không có quyền" | Hiện khi 403 hoặc khi vào route cần permission mà không có |
| Trang đăng nhập của Keycloak | Do `apps/keycloak-theme`, không thuộc SPA |

Thành phần cần có:
- `AuthProvider` + `useAuth()`: trạng thái (`loading | anonymous | authenticated`), `login()`, `logout()`, lấy token.
- `ProtectedRoute`: chưa đăng nhập thì chuyển đi đăng nhập, nhớ trang hiện tại.
- `PermissionGate` / `useCan('users:write')`: ẩn hiện theo permission. **Chỉ để hiển thị**; bảo mật thật nằm ở gateway.
- `apiClient`: gắn `Authorization: Bearer`, xử lý 401/403/503 như bảng mục 5, gắn `x-request-id`.

## 7. Quyết định kỹ thuật cần chốt

| # | Chủ đề | Đề xuất | Lý do / đánh đổi |
|---|---|---|---|
| 1 | Thư viện OIDC | `keycloak-js` (adapter chính thức) | Ít phần phải tự viết cho Keycloak (PKCE, làm mới, đăng xuất). Thay thế: `oidc-client-ts` + `react-oidc-context` (chuẩn OIDC chung, không gắn Keycloak) |
| 2 | Nơi giữ token | **Chỉ trong bộ nhớ**, không dùng `localStorage` | XSS không đọc được từ kho lưu trữ; đổi lại F5 phải hỏi lại Keycloak để lấy token mới |
| 3 | Khôi phục phiên khi F5 | Chuyển hướng kiểm tra SSO (đơn giản) | Cách dùng iframe ẩn dễ hỏng khi trình duyệt chặn cookie bên thứ ba |
| 4 | Nền tảng UI | Giữ `u-project-management`, thêm React Router | Create React App đã cũ; có thể chuyển sang Vite sau, tách khỏi phạm vi này |
| 5 | Refresh token | Bật xoay vòng (rotation) và phiên SSO có hạn | Giảm thiệt hại khi bị lộ |

## 8. Cấu hình Keycloak cho client `pm-web`

| Mục | Giá trị |
|---|---|
| Loại client | Public (không có secret) |
| Luồng | Chỉ **Standard flow (Authorization Code)**; tắt Direct access grants và Implicit |
| PKCE | Bắt buộc `S256` |
| Valid redirect URIs | `http://localhost:3000/callback` (dev), thêm URL thật khi triển khai |
| Valid post logout redirect URIs | `http://localhost:3000/` |
| Web origins | `http://localhost:3000` (để gọi token endpoint từ trình duyệt) |
| Audience | Thêm **Audience mapper** để access token có `aud = w-identity`, vì gateway từ chối token sai audience |
| Hạn access token | 5 phút (khớp tài liệu hiện có) |

Cần tạo lại `apps/w-identity/fixtures/pm-realm.json` (hiện không tồn tại) gồm realm `pm`, client `pm-web`, audience mapper và service account `identity-service`.

## 9. Thay đổi cần ở gateway

Trình duyệt chặn lời gọi từ `http://localhost:3000` tới gateway nếu thiếu CORS. Thêm cấu hình:
- `Access-Control-Allow-Origin`: chỉ các origin được cấu hình (không dùng `*` khi có `Authorization`);
- cho phép header `Authorization`, `Content-Type`, `X-Request-Id`, `Idempotency-Key`; cho phép các method trong spec;
- đáp ứng preflight `OPTIONS` **trước** bước xác thực (preflight không mang token);
- phơi bày header `X-Request-Id` để UI hiển thị khi báo lỗi;
- origin cấu hình bằng biến môi trường (ví dụ `GATEWAY_CORS_ORIGINS`), mặc định tắt.

## 10. Các bước thực hiện

- [ ] **U0.** Bạn chốt các quyết định ở mục 7 và 11.
- [x] **U1. Keycloak:** tạo lại fixture realm `pm` + client `pm-web` + audience mapper; hướng dẫn import; kiểm tra token có `aud = w-identity`.
- [x] **U2. Gateway:** thêm CORS có cấu hình + test (origin hợp lệ/không hợp lệ, preflight không cần token, header được phép).
- [x] **U3. UI nền:** thêm React Router, cấu trúc thư mục `auth/`, `api/`, cấu hình qua biến môi trường (`REACT_APP_KEYCLOAK_URL`, `REALM`, `CLIENT_ID`, `API_URL`).
- [x] **U4. Đăng nhập/đăng xuất:** `AuthProvider`, `/callback`, `ProtectedRoute`, nút Đăng nhập/Đăng xuất, nhớ trang trước khi chuyển hướng (chỉ chấp nhận đường dẫn nội bộ để tránh open redirect).
- [x] **U5. Gọi API:** `apiClient` (gắn Bearer, làm mới một lần khi 401, xử lý 403/503), `useCan`/`PermissionGate`, tải `/me/permissions` sau khi đăng nhập.
- [x] **U6. Kiểm thử:** unit test `AuthProvider`/`apiClient`/`ProtectedRoute` với auth giả; thử tay luồng thật (đăng nhập, F5, hết hạn token, đăng xuất, 403).
- [x] **U7. Tài liệu:** thêm bài "Đăng nhập và đăng xuất trên UI" vào sổ tay `#authz` (kèm sơ đồ), cập nhật README.
- [ ] **U8.** Bạn review diff; tôi không tự commit.

## 11. Cần bạn quyết định

| # | Câu hỏi | Mặc định |
|---|---|---|
| 1 | Dùng `keycloak-js` hay `oidc-client-ts`? | `keycloak-js` |
| 2 | Giữ token chỉ trong bộ nhớ (F5 lấy lại qua SSO)? | Có |
| 3 | Trang đăng nhập dùng theme Keycloak có sẵn (`apps/keycloak-theme`) hay chỉ dùng giao diện mặc định lúc đầu? | Giao diện mặc định trước, gắn theme sau |
| 4 | Có làm đăng ký tài khoản và quên mật khẩu trên UI không? | Không; dùng chức năng sẵn có của Keycloak nếu cần |
| 5 | Thêm CORS vào gateway trong lượt này? | Có (bắt buộc để UI gọi được API) |
| 6 | Tạo lại fixture realm trong lượt này? | Có (đang thiếu, chặn cả `test:e2e`) |

## 12. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| XSS đánh cắp token | Token chỉ trong bộ nhớ; không đưa token vào URL hay log; chuẩn bị CSP khi triển khai |
| Open redirect sau đăng nhập | Chỉ chấp nhận đường dẫn nội bộ cho trang quay lại |
| Gửi sai `redirect_uri` | Khai báo chính xác trong Keycloak, không dùng ký tự đại diện |
| Cho rằng đăng xuất đã thu hồi token | Ghi rõ trong tài liệu; token sống ngắn |
| `aud` sai gây 401 liên tục | Audience mapper và kiểm tra bằng token thật ở U1 |
| Lệch quyền sau khi đổi role | UI tải lại `/me/permissions` khi gặp 403 |

## 13. Ngoài phạm vi

- Không làm form username/password trong SPA; không dùng luồng Direct Access (Resource Owner Password).
- Không đổi hợp đồng `GatewayRequest`/`GatewayRpcError`; không thêm endpoint đăng nhập vào w-identity.
- Không bật lại `AuthorizationPolicy` trong w-identity (đã tách riêng ở `PLAN-AUTHZ.md`).
- Không commit khi chưa được bạn review.

## 14. Kết quả triển khai

- **U1:** `apps/w-identity/fixtures/pm-realm.json` (realm `pm`, client `pm-web` public + PKCE S256, audience mapper `w-identity`, service account `identity-service` với `manage-users`, `view-users`, `view-realm`). Đã import thử vào một realm tạm trên Keycloak local rồi xóa.
- **Kiểm chứng luồng thật với Keycloak (realm tạm):** đăng nhập mã + PKCE; đổi mã bằng verifier sai trả 400; `redirect_uri` lạ trả 400; token có `aud = w-identity`, `typ = Bearer`, hạn 300 giây; làm mới thành công và token cũ không dùng lại được (rotation); đăng xuất với `id_token_hint` chuyển về `/`; làm mới sau đăng xuất trả 400; `post_logout_redirect_uri` lạ trả 400.
- **U2:** CORS trong lõi gateway (`GATEWAY_CORS_ORIGINS`), preflight trước xác thực, origin lạ nhận 403; 12 test mới. Gateway: 130 test pass (ba suite ESM `spec-loader`, `jwt-authenticator`, `tcp-transport` vẫn không chạy được trong Jest ở Node 22 như trước).
- **U3–U5:** `apps/u-project-management` (submodule git riêng): `AuthProvider` (keycloak-js), `ProtectedRoute`, `/callback`, `apiClient` (401 thử lại một lần, 403 tải lại quyền, 503 có thể thử lại), `PermissionsProvider`/`Can`, trang minh họa quyền. React Router v6 (v7 không chạy trong Jest của Create React App).
- **TypeScript:** UI viết bằng TypeScript (`strict`); `tsc --noEmit` sạch; ghim TypeScript 4.9.5 vì react-scripts 5 chỉ hỗ trợ đến 4.x.
- **U6:** 43 test (returnTo, apiClient, AuthProvider/ProtectedRoute/Callback với Keycloak giả) và `react-scripts build` pass.
- **Chưa làm / ghi nhận:** chưa thử trình duyệt thật đầu-cuối (SPA → Keycloak → gateway thật); chưa gắn theme `apps/keycloak-theme` (quyết định mặc định); `management()` trong w-identity vẫn từ chối nên `GET /users` trên trang minh họa trả 403 dù gateway cho qua.

### Thay đổi sau lần chạy thử đầu tiên

- **Mặc định vào thẳng trang đăng nhập:** chưa đăng nhập thì UI chuyển ngay sang Keycloak (`onLoad: 'login-required'`), bỏ trang chủ công khai và nút "Đăng nhập". Đăng xuất xong quay về `/` rồi lại sang trang đăng nhập. Phiên không làm mới được hoặc vẫn 401 sau khi thử lại thì chuyển lại sang đăng nhập. Cờ gợi ý `pm.session-hint` không còn cần nên đã bỏ.
- **Lỗi "Page not found" ở Keycloak:** do realm `pm` chưa tồn tại (`/realms/pm` trả `Realm does not exist`). Đã import `fixtures/pm-realm.json` vào Keycloak local theo README (bước 2); cần tạo một tài khoản trong realm `pm` để đăng nhập.
- **Thiếu claim `sub` trong access token:** fixture liệt kê `defaultClientScopes` của `pm-web` nhưng thiếu `basic` (chứa mapper `sub`), nên gateway (bắt buộc `sub`) sẽ trả 401 dù token hợp lệ. Phát hiện khi giải mã token thật lúc viết sổ tay `#oidc`. Đã thêm `basic` vào fixture và sửa trực tiếp client `pm-web` trong realm `pm` đang chạy; token cấp trước khi sửa vẫn thiếu `sub`, cần đăng xuất rồi đăng nhập lại.
