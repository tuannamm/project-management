# Câu hỏi phỏng vấn Keycloak và OIDC

Che đáp án, nói thành tiếng 60–90 giây: định nghĩa → đánh đổi → ví dụ. Chỉ đánh dấu đã thuộc khi giải thích được câu hỏi phụ.

## Phần A. Nền tảng và luồng đăng nhập

### Khái niệm

- [ ] 🟢 OAuth 2.0 khác OpenID Connect thế nào? · 📚 #0
  *Ý chính:* OAuth 2.0 là giao thức ủy quyền (quyền gọi API không cần đưa mật khẩu). OIDC là lớp xác thực chạy trên OAuth 2.0, thêm ID token để client biết người dùng là ai. **Bẫy cần tránh:** gọi OAuth 2.0 là giao thức xác thực.
- [ ] 🟢 Access token, ID token và refresh token khác nhau thế nào? Mỗi loại dành cho ai? · 📚 #0
  *Ý chính:* Access token cho resource server (gọi API); ID token cho client (biết user là ai); refresh token cho Keycloak (lấy access token mới). Trong dự án: `aud` của access token là `w-identity`, của ID token là `pm-web`.
- [ ] 🟡 Public client khác confidential client thế nào? `pm-web` và `identity-service` thuộc loại nào? · 📚 #1
  *Ý chính:* Public không giữ được secret (SPA, mobile) nên dùng PKCE; confidential giữ được secret (server) nên xác thực bằng secret. `pm-web` là public, `identity-service` là confidential.
- [ ] 🟡 Realm, client, client scope và mapper là gì? · 📚 #1
  *Ý chính:* Realm là vùng tách biệt chứa user, client, cấu hình; client là ứng dụng được phép dùng Keycloak; client scope là nhóm claim gắn vào token; mapper thêm một claim cụ thể (ví dụ audience).

### Authorization Code + PKCE

- [ ] 🟢 Vì sao SPA không tự làm form đăng nhập? Luồng nào được dùng? · 📚 #2
  *Ý chính:* Mật khẩu không nên đi qua mã của SPA. SPA chuyển hướng sang Keycloak rồi nhận một mã (Authorization Code + PKCE).
- [ ] 🟡 PKCE giải quyết vấn đề gì? Hoạt động thế nào? · 📚 #2
  *Ý chính:* SPA không giữ được secret. SPA gửi `code_challenge = SHA256(code_verifier)` khi bắt đầu và gửi `code_verifier` khi đổi mã. Kẻ chặn được mã không có verifier nên không đổi được token. Đã kiểm chứng: verifier sai trả 400.
- [ ] 🟡 `state` và `nonce` khác nhau thế nào? · 📚 #2
  *Ý chính:* `state` chống CSRF ở luồng đăng nhập: Keycloak trả lại nguyên vẹn, client kiểm tra. `nonce` gắn vào ID token để chống phát lại: ID token trả về chứa đúng `nonce` đã gửi.
- [ ] 🟡 Vì sao `redirect_uri` phải khớp chính xác và không dùng ký tự đại diện? · 📚 #2
  *Ý chính:* Nếu cho phép địa chỉ tùy ý, kẻ tấn công có thể nhận mã ủy quyền. Keycloak trả 400 khi `redirect_uri` không khớp (đã kiểm chứng).
- [ ] 🔴 Vì sao không dùng luồng Implicit hay Password cho SPA? · 📚 #2
  *Ý chính:* Implicit đặt token trong URL (lộ qua lịch sử, log, referrer) và không có PKCE; Password buộc ứng dụng nhận mật khẩu. Server vẫn hỗ trợ các grant này nhưng client `pm-web` chỉ bật Standard flow.

## Phần B. Token và xác minh

### Nội dung token

- [ ] 🟡 Những claim nào bạn kiểm tra khi xác minh một access token? · 📚 #4
  *Ý chính:* Chữ ký (thuật toán `RS256`, khóa theo `kid` từ JWKS), `iss`, `aud`, `exp`, `typ = Bearer`, có `sub` và `iat`.
- [ ] 🟡 Vì sao `aud` của access token và ID token khác nhau? · 📚 #3
  *Ý chính:* Mỗi token có người nhận khác nhau: access token cho API (`w-identity`), ID token cho client (`pm-web`). Client không được đưa ID token cho API.
- [ ] 🔴 Gateway trả 401 dù người dùng vừa đăng nhập. Bạn kiểm tra gì? · 📚 #9
  *Ý chính:* Giải mã payload token và kiểm tra `sub`, `aud`, `iss`, `typ`, `exp`. Lỗi thật của dự án: fixture thiếu client scope `basic` nên access token không có `sub`, mà gateway yêu cầu `sub`.
- [ ] 🟡 Xác minh JWT cục bộ khác introspection thế nào? · 📚 #4
  *Ý chính:* Cục bộ: nhanh, không gọi Keycloak, nhưng không biết phiên đã hủy. Introspection: biết ngay token còn hiệu lực theo phiên, đổi lại thêm một lần gọi mạng. Đã kiểm chứng: sau đăng xuất introspection trả `active: false`, còn xác minh cục bộ vẫn chấp nhận đến khi hết hạn.
- [ ] 🔴 Khóa ký xoay vòng thì gateway xử lý thế nào? · 📚 #4
  *Ý chính:* Chọn khóa theo `kid`; gặp `kid` lạ thì tải lại JWKS, có thời gian chờ giữa các lần để chống lạm dụng.

### Làm mới token

- [ ] 🟡 Refresh token rotation là gì? Nó bảo vệ điều gì? · 📚 #6
  *Ý chính:* Mỗi lần làm mới cấp refresh token mới và vô hiệu token cũ. Dùng lại token cũ bị từ chối (`invalid_grant: Maximum allowed refresh token reuse exceeded`), nên token bị lộ chỉ dùng được một lần và việc dùng lại là tín hiệu bị đánh cắp.
- [ ] 🟡 Client quản lý việc làm mới access token thế nào? · 📚 #6
  *Ý chính:* Làm mới trước mỗi lần gọi API nếu còn dưới 30 giây (`updateToken(30)`), xử lý `onTokenExpired`, và khi API trả 401 thì ép làm mới rồi thử lại đúng một lần.
- [ ] 🔴 Hai yêu cầu làm mới chạy song song với rotation sẽ xảy ra chuyện gì? · 📚 #6
  *Ý chính:* Cùng dùng một refresh token nên một yêu cầu thất bại (token đã bị vô hiệu). Giải pháp: gom thành một lần làm mới (single-flight) ở client.

## Phần C. Session và đăng xuất

- [ ] 🟡 Phiên SSO khác token ở điểm nào? · 📚 #5
  *Ý chính:* Phiên SSO nằm ở Keycloak (cookie `KEYCLOAK_IDENTITY`, `KEYCLOAK_SESSION`), cho phép đăng nhập lại không cần mật khẩu; token nằm ở client và dùng gọi API. Phiên idle 30 phút, tối đa 10 giờ; token sống 5 phút và 30 phút.
- [ ] 🟡 F5 trang thì chuyện gì xảy ra với token và phiên? · 📚 #5
  *Ý chính:* Token trong bộ nhớ mất. Keycloak thấy phiên SSO còn nên cấp mã mới mà không hỏi mật khẩu; phiên hết thì hiện trang đăng nhập.
- [ ] 🟡 `check-sso` khác `login-required` thế nào? `prompt=none` là gì? · 📚 #5
  *Ý chính:* `check-sso`: có phiên thì đăng nhập ngầm, không thì ở trạng thái chưa đăng nhập. `login-required`: không có phiên thì chuyển thẳng sang trang đăng nhập (dự án dùng cái này). `prompt=none` hỏi phiên có sẵn mà không hiện trang đăng nhập; không có phiên thì trả `error=login_required`.
- [ ] 🔴 Đăng xuất đúng gồm những việc gì? · 📚 #7
  *Ý chính:* Xóa token ở client và chuyển hướng tới `/logout` kèm `id_token_hint` và `post_logout_redirect_uri` đã đăng ký để hủy phiên SSO. Chỉ xóa token ở UI thì lần sau Keycloak vẫn đăng nhập ngầm.
- [ ] 🔴 Ngay sau khi đăng xuất, access token cũ còn dùng được ở đâu và không dùng được ở đâu? · 📚 #7
  *Ý chính:* Không dùng được: `/userinfo` (401), introspection (`active: false`), làm mới (400). Vẫn dùng được: gateway xác minh cục bộ đến khi `exp` (tối đa 5 phút). Vì vậy access token sống ngắn.
- [ ] 🟡 Front-channel và back-channel logout khác nhau thế nào? · 📚 #7
  *Ý chính:* Front-channel: trình duyệt nạp trang đăng xuất của từng client. Back-channel: Keycloak gọi server của client. Giúp các client khác biết phiên đã kết thúc. Dự án chỉ có một client nên chưa dùng back-channel.

## Phần D. Bảo mật, chẩn đoán và dự án

- [ ] 🟡 Vì sao không lưu token trong `localStorage`? Lưu ở đâu thì hợp lý hơn? · 📚 #8
  *Ý chính:* Mọi script cùng origin (kể cả mã bị chèn do XSS) đọc được `localStorage`. Giữ trong bộ nhớ (dự án dùng) hoặc cookie `HttpOnly` kèm biện pháp chống CSRF. Đổi lại ở bộ nhớ: F5 mất token nên phải hỏi lại phiên SSO.
- [ ] 🟡 CORS có bảo vệ API không? · 📚 #8
  *Ý chính:* Không: CORS chỉ ràng buộc trình duyệt. API vẫn phải xác minh token. Gateway cũng chỉ cho phép origin cấu hình chính xác, không dùng `*` khi có `Authorization`.
- [ ] 🔴 Kể các tấn công vào luồng đăng nhập và biện pháp tương ứng. · 📚 #8
  *Ý chính:* Chặn mã → PKCE, mã dùng một lần; CSRF → `state`; phát lại ID token → `nonce`; chuyển hướng lạ → `redirect_uri` khớp chính xác; mix-up → kiểm tra `iss`; lộ token → sống ngắn, rotation, thu hồi; XSS → không để token ở `localStorage`, CSP.
- [ ] 🟡 Bạn thấy trang Keycloak "Page not found" khi bấm đăng nhập. Nguyên nhân thường gặp? · 📚 #9
  *Ý chính:* Realm chưa tồn tại: `/realms/<realm>` trả `Realm does not exist`. Cách xử lý: import fixture realm. Nếu realm có nhưng báo `redirect_uri` không hợp lệ thì so URL của UI với `redirectUris` của client.
- [ ] 🔴 Bạn đã làm đến đâu trong phần Keycloak? Nói thế nào cho trung thực? · 📚 #10
  *Ý chính:* Fixture realm, luồng PKCE, rotation, đăng xuất và kiểm tra `redirect_uri` đã kiểm chứng bằng script trên Keycloak thật; UI có test với Keycloak giả, chưa thử đầu-cuối trên trình duyệt thật. Back-channel logout, đăng ký, theme chưa làm.

## Phần E. SPA và trình duyệt

- [ ] 🟢 Vì sao SPA là public client? Bundle JavaScript có chứa secret không? · 📚 #11
  *Ý chính:* Mã chạy ở trình duyệt nên ai cũng đọc được; mọi biến `REACT_APP_*` được nhúng lúc build là công khai. Vì vậy dùng Authorization Code + PKCE thay cho secret. **Bẫy cần tránh:** đặt client secret trong biến môi trường của SPA.
- [ ] 🟡 Kể một lượt đăng nhập của SPA theo vòng đời trang, từ mở `/app/users` đến khi quay lại đúng trang. · 📚 #11
  *Ý chính:* Ghi trang hiện tại vào `sessionStorage`; `init` với `login-required` và PKCE; chuyển hướng cả trang sang Keycloak (state JS mất); quay về `/callback#state&code`; đọc mã, xóa khỏi URL, đối chiếu `state`, đổi mã lấy token trong bộ nhớ; `CallbackPage` đọc rồi xóa trang quay lại và điều hướng.
- [ ] 🟡 F5 trang khi đang đăng nhập thì mất gì, còn gì? Có bị hỏi lại mật khẩu không? · 📚 #11
  *Ý chính:* Mất token trong bộ nhớ; còn cookie phiên SSO của Keycloak, nên `init` chuyển hướng đi–về mà không hỏi mật khẩu. Hỏi lại khi phiên SSO hết hạn, bị chặn cookie hoặc đã đăng xuất.
- [ ] 🟡 `/callback` là gì? Vì sao production cần history fallback? · 📚 #11
  *Ý chính:* Là route của SPA, không phải endpoint server, nên máy chủ tĩnh phải trả `index.html` cho đường dẫn không phải file, nếu không Keycloak chuyển về sẽ gặp 404. `redirectUri` trong code, `redirectUris` của client và CORS của gateway phải khớp cùng một origin.
- [ ] 🟡 Vì sao phải kiểm tra lại đường dẫn quay lại dù chính SPA đã ghi nó vào `sessionStorage`? · 📚 #11
  *Ý chính:* Storage là đầu vào không tin cậy (XSS hoặc đồng nghiệp chèn giá trị khác); không kiểm tra sẽ thành open redirect. `safeReturnTo` chỉ nhận đường dẫn nội bộ, chặn `//host`, `\`, ký tự điều khiển, chuỗi quá dài và `/callback`.
- [ ] 🟡 Khi API trả 401 và khi trả 403, SPA xử lý khác nhau thế nào? Vì sao? · 📚 #11
  *Ý chính:* 401: làm mới token và thử lại đúng một lần; vẫn 401 thì phiên hết hạn, đăng nhập lại. 403: không đăng xuất vì đã xác thực nhưng thiếu quyền, chỉ tải lại quyền và báo lỗi. 502/503/504 hoặc mất mạng là lỗi tạm thời, không phải bị từ chối.
- [ ] 🔴 Hai lời gọi làm mới token chạy song song với refresh token xoay vòng thì chuyện gì xảy ra ở `keycloak-js`? · 📚 #11
  *Ý chính:* `keycloak-js` 26.2.5 xếp hàng các lời gọi `updateToken`: chỉ lời đầu gửi yêu cầu, các lời sau chờ cùng kết quả. Nếu không gom lại, lời thứ hai dùng refresh token đã bị xoay vòng và nhận `invalid_grant` (bài 6).
- [ ] 🟡 Vì sao gọi API khác origin kèm `Authorization` lại có yêu cầu `OPTIONS`? Gateway xử lý nó thế nào? · 📚 #11
  *Ý chính:* Header `Authorization` làm yêu cầu không còn "đơn giản", trình duyệt gửi preflight trước. Gateway trả lời preflight trước bước xác thực vì preflight không mang token, chỉ cho origin cấu hình chính xác (không `*`), origin lạ nhận 403.
- [ ] 🔴 Token ở bộ nhớ có đủ an toàn trước XSS không? Khi nào chọn BFF? · 📚 #11
  *Ý chính:* Không đủ: script bị chèn cùng origin vẫn đọc `keycloak.token` hoặc gọi API thay người dùng; bộ nhớ chỉ làm khó hơn. Biện pháp chính là CSP và kiểm soát phụ thuộc. BFF giữ token ngoài JavaScript nên hợp khi yêu cầu bảo mật cao, đổi lại thêm một thành phần phải vận hành và phải chống CSRF vì dùng cookie.
- [ ] 🟡 UI ẩn nút theo quyền thì đã là phân quyền chưa? · 📚 #11
  *Ý chính:* Chưa: đó chỉ là trải nghiệm vì người dùng sửa được JavaScript hoặc gọi API trực tiếp. Quyết định thật nằm ở gateway và service (`#authz`).
- [ ] 🔴 UI báo "Không tải được quyền" dù đăng nhập thành công. Bạn kiểm tra theo thứ tự nào? · 📚 #11
  *Ý chính:* Đọc status và `code` của yêu cầu `/me/permissions` ở tab Network, rồi đi từng tầng: CORS (console), gateway có nạp đúng project không (`ROUTE_NOT_FOUND` nghĩa là không), service có chạy và đăng ký chưa, cuối cùng mới tới dữ liệu quyền. Đã gặp thật ngày 2026-11-09 do `GATEWAY_PROJECT=example`.
- [ ] 🟡 Vì sao cấu hình SPA phải build lại khi đổi môi trường? Test `AuthProvider` làm thế nào khi Jest không nạp được `keycloak-js`? · 📚 #11
  *Ý chính:* Biến `REACT_APP_*` được nhúng lúc build. `createKeycloak.ts` được tách riêng và `AuthProvider` nhận một `KeycloakClient` (`Pick<Keycloak, …>`) để test truyền đối tượng giả; đánh đổi là không bắt được lỗi cấu hình thật nên vẫn cần thử đầu-cuối.
