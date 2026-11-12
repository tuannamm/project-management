# Câu hỏi phỏng vấn phân quyền

Che đáp án, nói thành tiếng 60–90 giây: định nghĩa → đánh đổi → ví dụ. Chỉ đánh dấu đã thuộc khi giải thích được câu hỏi phụ.

## Phần A. Nền tảng và luồng

### Khái niệm

- [ ] 🟢 Authentication khác authorization thế nào? Trong hệ thống này ai làm việc nào? · 📚 #0
  *Ý chính:* Authentication xác định bạn là ai: Keycloak cấp JWT, gateway xác minh và lấy `sub`. Authorization xác định bạn được làm gì: w-identity quyết định bằng role và permission lưu ở MongoDB.
- [ ] 🟢 RBAC là gì? Permission có dạng nào? · 📚 #1
  *Ý chính:* User có role, role chứa permission, quyền của user là quyền của role. Permission dạng `resource:action` như `users:read`.
- [ ] 🟡 RBAC khác ABAC thế nào? Khi nào cần thêm kiểm tra theo dữ liệu? · 📚 #1
  *Ý chính:* RBAC quyết định theo role, ABAC theo thuộc tính (chủ sở hữu, thời gian...). RBAC làm lớp thô; các quy tắc như "chỉ sửa hồ sơ của mình" cần kiểm tra theo dữ liệu ở service.
- [ ] 🟡 Vì sao mỗi user đúng một role và `users` tách khỏi `user_roles`? · 📚 #1
  *Ý chính:* Mô hình đơn giản, gán role là một upsert idempotent trên khóa duy nhất. Hồ sơ user tự sửa được, role chỉ quản trị viên gán, nên tách nơi lưu để không thể sửa role qua đường hồ sơ. Muốn nhiều role phải đổi schema và use case.
- [ ] 🔴 Role hệ thống `admin`/`user` được bảo vệ thế nào? · 📚 #1
  *Ý chính:* Hai lớp: policy ở Domain từ chối sửa/xóa, và điều kiện `system: { $ne: true }` ngay trong câu lệnh Mongo nên race cũng không sửa được (defense in depth).

### Luồng và UI

- [ ] 🟡 Sau khi đăng nhập, UI biết cần render gì như thế nào? Ẩn nút trên UI có đủ bảo mật không? · 📚 #3
  *Ý chính:* UI gọi `identity.me.permissions` để lấy role và permission của chính mình rồi render. Ẩn nút chỉ để hiển thị, vì ai cũng gọi API trực tiếp được; chặn thật nằm ở gateway và service.
- [ ] 🔴 Có nên để client gửi danh sách permission trong mỗi request để API kiểm tra không? · 📚 #2
  *Ý chính:* Không: mọi thứ client gửi đều giả được. Server phải tự xác định permission từ nguồn tin cậy theo `sub` đã xác minh (tra cứu có cache), hoặc đọc claim trong JWT đã ký.
- [ ] 🟡 `identity.me.permissions` khác `identity.users.getPermissions` ở đâu? · 📚 #3
  *Ý chính:* `me.permissions` luôn dùng danh tính của chính người gọi và không nhận userId từ client. `getPermissions` dành cho admin xem quyền của user khác nên cần quyền quản lý.

## Phần B. Gateway và thiết kế

### Gateway

- [ ] 🟡 Gateway biết operation cần permission nào bằng cách nào? · 📚 #4
  *Ý chính:* Mỗi operation khai báo `x-required-permissions` trong OpenAPI, spec-loader đọc lúc khởi động. Từ chối mặc định: route cần đăng nhập mà thiếu khai báo thì gateway không khởi động; dùng `[]` cho route chỉ cần đăng nhập.
- [ ] 🟡 Vì sao route công khai không được khai báo `x-required-permissions`? · 📚 #4
  *Ý chính:* Khai báo đó vô nghĩa vì route không cần token, dễ khiến người đọc tưởng route đã được bảo vệ. Loader báo lỗi để tránh nhầm lẫn.
- [ ] 🟡 Vì sao thông báo 403 không liệt kê permission còn thiếu? · 📚 #4
  *Ý chính:* Liệt kê sẽ lộ cấu trúc phân quyền cho kẻ thăm dò. Thông báo chung chung là đủ cho client.

### Cache và độ tin cậy

- [ ] 🟡 Kiểm tra quyền ở mỗi request có tốn kém không? Giảm chi phí thế nào? · 📚 #5
  *Ý chính:* Bắt buộc phải kiểm tra, nhưng rẻ nếu có cache theo `userId` với TTL ngắn (30 giây), single-flight cho các request đồng thời, giới hạn số entry và không cache lỗi. Đánh đổi: đổi quyền có độ trễ tối đa một TTL.
- [ ] 🟡 Single-flight giải quyết vấn đề gì? · 📚 #5
  *Ý chính:* Khi cache trượt, nhiều request cùng user chỉ gây một lần tra thay vì mỗi request một lần, tránh dồn tải lên w-identity.
- [ ] 🔴 w-identity chết thì gateway xử lý request cần quyền thế nào? · 📚 #5
  *Ý chính:* Fail closed: trả 503 `AUTHZ_UNAVAILABLE`, không cho qua khi không chắc. Route chỉ cần đăng nhập (`[]`) và route công khai vẫn chạy; cache giúp qua gián đoạn ngắn.
- [ ] 🟡 Khóa tài khoản trong Keycloak thì JWT còn hạn có dùng tiếp được không? · 📚 #5
  *Ý chính:* Pattern nội bộ trả permission rỗng cho tài khoản bị khóa nên các route cần quyền bị chặn sau tối đa một TTL cache, dù JWT còn hạn. Route chỉ cần đăng nhập vẫn phụ thuộc vào việc service tự kiểm tra tài khoản.

### So sánh và an toàn

- [ ] 🔴 So sánh để permission trong JWT với tra cứu có cache. Vì sao chọn tra cứu? · 📚 #6
  *Ý chính:* JWT: không cần tra cứu nhưng token cũ giữ quyền cũ đến khi hết hạn, token to, phải đồng bộ với Keycloak. Tra cứu: đổi quyền hiệu lực nhanh, kiểm soát độ tươi bằng TTL, đổi lại gateway phụ thuộc w-identity.
- [ ] 🔴 Vì sao gateway bỏ đọc `roles` từ claim JWT? · 📚 #6
  *Ý chính:* Role nằm ở MongoDB; nếu vừa đọc claim vừa tra DB sẽ có hai nguồn sự thật, dễ lệch nhau và gây nhầm lẫn về quyền thật.
- [ ] 🔴 Vì sao vẫn kiểm tra trong service khi gateway đã chặn? · 📚 #7
  *Ý chính:* Defense in depth: OpenAPI không diễn đạt được quy tắc theo dữ liệu (chỉ sửa hồ sơ của mình, không gỡ admin cuối cùng), và service không nên tin tuyệt đối rằng gateway đã chặn.
- [ ] 🔴 Rủi ro của pattern nội bộ `identity.authz.permissions` là gì? · 📚 #7
  *Ý chính:* Bất kỳ client nào tới được cổng TCP đều gọi được. Không có route HTTP nên không lộ ra ngoài, nhưng cần chính sách mạng hoặc khóa dùng chung ở bước sau.
- [ ] 🔴 Bạn đã làm đến đâu trong phần này? Nói thế nào cho trung thực? · 📚 #8
  *Ý chính:* Chỉ nói phần đã cài đặt và kiểm chứng (gateway: kiểm tra spec, resolver có cache, chặn 403/503). Phần chưa làm (me.permissions, bật kiểm tra trong w-identity) nói rõ là thiết kế đã chọn và lý do.

## Phần C. Đăng nhập và đăng xuất trên UI

- [ ] 🟢 Vì sao SPA không tự làm form đăng nhập? Luồng nào được dùng? · 📚 #9
  *Ý chính:* Mật khẩu không nên đi qua mã của SPA. SPA chuyển hướng sang trang đăng nhập của Keycloak rồi nhận mã (Authorization Code + PKCE); w-identity cũng không có endpoint đăng nhập.
- [ ] 🟡 PKCE giải quyết vấn đề gì? Hoạt động thế nào? · 📚 #9
  *Ý chính:* SPA là public client, không giữ được secret. SPA gửi `code_challenge = SHA256(code_verifier)` khi bắt đầu và gửi `code_verifier` khi đổi mã. Kẻ chặn được mã không có verifier nên không đổi được token.
- [ ] 🟡 Vì sao không lưu token trong `localStorage`? F5 xử lý ra sao? · 📚 #9
  *Ý chính:* Token trong bộ nhớ thì XSS không đọc được từ kho lưu trữ. F5 mất token nên UI hỏi lại Keycloak qua phiên SSO để lấy token mới mà không nhập lại mật khẩu.  Vì ứng dụng bắt buộc đăng nhập, chưa có phiên thì chuyển thẳng sang trang đăng nhập mà không cần bấm nút.
- [ ] 🟡 `redirect_uri` và `post_logout_redirect_uri` cấu hình thế nào, vì sao? · 📚 #9
  *Ý chính:* Khai báo chính xác (không ký tự đại diện) trong client `pm-web`; địa chỉ lạ bị Keycloak từ chối (400), chặn việc gửi mã hoặc chuyển hướng tới nơi lạ.
- [ ] 🔴 Đăng xuất trên UI làm những việc gì? Access token cũ còn dùng được không? · 📚 #9
  *Ý chính:* Xóa token ở UI và chuyển hướng tới Keycloak `/logout` (kèm `id_token_hint`) để hủy phiên SSO. Access token đã cấp không bị thu hồi, vẫn hợp lệ đến khi hết hạn (5 phút); refresh token bị vô hiệu cùng phiên.
- [ ] 🟡 UI xử lý 401, 403 và 503 khác nhau thế nào? · 📚 #9
  *Ý chính:* 401: làm mới token và thử lại đúng một lần, vẫn lỗi thì chuyển lại sang trang đăng nhập. 403: không đăng xuất, tải lại quyền. 503 `AUTHZ_UNAVAILABLE`: lỗi tạm thời, cho thử lại, không coi là bị từ chối.
- [ ] 🔴 Vì sao gateway phải trả lời preflight trước bước xác thực? Vì sao không dùng CORS `*`? · 📚 #9
  *Ý chính:* Preflight do trình duyệt gửi tự động và không mang token, nên xác thực trước sẽ luôn thất bại. Có header `Authorization` nên chỉ cho phép origin cấu hình chính xác; origin lạ nhận 403 và không có header CORS.
- [ ] 🔴 "Quay lại trang đang xem sau khi đăng nhập" có rủi ro bảo mật nào? · 📚 #9
  *Ý chính:* Open redirect nếu tin giá trị đã lưu. Chỉ nhận đường dẫn nội bộ (bắt đầu bằng một `/`, không `//`, không dấu `\`, không ký tự điều khiển) và kiểm tra lại cả khi đọc ra.
