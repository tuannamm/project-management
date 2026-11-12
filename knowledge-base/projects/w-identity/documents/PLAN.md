> Tài liệu lịch sử: các nội dung về phân quyền và quản lý role không còn phản ánh implementation hiện tại. Các thao tác quản lý tài khoản đang tạm bị từ chối.

# Kế hoạch triển khai w-identity

## Mục tiêu và phạm vi

Xây dựng dịch vụ NestJS quản lý người dùng và tương tác với Keycloak. Admin quản lý tài khoản; người dùng xem thông tin và cập nhật hồ sơ cá nhân. Dịch vụ giao tiếp bằng TCP qua API Gateway và đăng ký với service discovery.

```text
Client → API Gateway (xác minh JWT) → TCP w-identity → Keycloak / MongoDB
```

Phạm vi v1: một realm, quyền toàn hệ thống `admin` và `user`; Keycloak quản lý danh tính, MongoDB quản lý hồ sơ nghiệp vụ. Không bao gồm đăng nhập, đăng ký, refresh token, phân quyền theo project/workspace, upload ảnh, xóa tài khoản, đồng bộ nền từ Keycloak Admin Console hoặc phát sự kiện RabbitMQ.

## Clean Architecture

Tổ chức các lớp trong app `w-identity` hiện tại, chưa tách Nx libraries. Các bước nghiệp vụ bên dưới được triển khai theo cấu trúc và thứ tự kiến trúc trong phần này.

| Lớp | Trách nhiệm |
|---|---|
| Domain | Mô hình tài khoản, hồ sơ, role và quy tắc nghiệp vụ thuần |
| Application | Use case, kiểm tra quyền và interface kết nối với hệ thống bên ngoài |
| Infrastructure | Adapter Keycloak và repository MongoDB hiện thực các interface |
| Presentation | TCP controller, DTO, mapping và chuyển lỗi sang hợp đồng gateway |
| Bootstrap | Cấu hình NestJS, dependency injection, health và discovery |

Hướng phụ thuộc: `Application → Domain`; `Infrastructure → Application + Domain`; `Presentation → Application`; bootstrap lắp ghép các lớp. Domain và Application dùng TypeScript thuần, không import NestJS, Mongoose, Keycloak SDK hay hợp đồng gateway.

```text
src/
├── domain/
│   ├── models/                 # user-account, user
│   ├── policies/               # application-role
├── application/
│   ├── ports/                  # identity-provider, user-repository
│   ├── security/               # actor, authorization policy
│   ├── use-cases/              # users, roles, me
│   └── errors/
├── infrastructure/
│   ├── keycloak/               # HTTP client, token provider, adapter, mapper
│   └── persistence/mongoose/   # schema, repository, mapper
├── presentation/tcp/
│   ├── controllers/
│   ├── dto/
│   ├── contracts/
│   ├── mappers/
│   └── filters/
├── bootstrap/                  # DI tokens
├── app.module.ts               # composition root, config, health, discovery
└── main.ts
```

Chỉ tạo file khi cần, không tạo lớp rỗng. Unit test đặt cạnh code; test tích hợp và E2E đặt trong `test/`.

### Thứ tự xây dựng kiến trúc

1. **Domain:** tạo `UserAccount`, `User` và policy cho role `admin`, `user`. Trong mô hình dùng `userId`; adapter MongoDB ánh xạ sang `keycloakUserId`. Không đưa decorator NestJS, Mongoose document hay Keycloak response vào domain.
2. **Application ports:** khai báo `IdentityProviderPort` cho thao tác tài khoản, role, session và email; `UserRepositoryPort` cung cấp `getOrCreate(userId)` và `update(userId, patch)`, trả `User`. Ports nhận và trả mô hình nội bộ. Application không import class repository cụ thể, kể cả `import type`. Khai báo `Actor` gồm `userId`, `issuer`, `roles` và policy yêu cầu đăng nhập/admin.
3. **Use cases:** tạo riêng `CreateUser`, `ListUsers`, `GetUser`, `UpdateUser`, `SetUserStatus`, `ListRoles`, `AssignUserRole`, `RemoveUserRole`, `GetMe`, `UpdateMyProfile`, `SendPasswordResetEmail`. Mỗi use case có `execute(input, actor)`, nhận ports qua constructor, kiểm tra quyền trước khi gọi adapter và trả lỗi nghiệp vụ có mã ổn định.
4. **Infrastructure:** hiện thực `KeycloakIdentityAdapter` và `UserRepository`; tách token provider, HTTP client và mapper. Ánh xạ lỗi Keycloak thành lỗi application; schema và document chỉ tồn tại ở lớp persistence. Repository upsert an toàn và có unique index.
5. **Presentation:** TCP controller nhận request, validate DTO, ánh xạ actor/input, gọi use case rồi ánh xạ response. RPC filter chuyển lỗi application thành `GatewayRpcError`; lỗi bất ngờ trả thông báo chung, log request ID và không lộ stack trace hay thông tin kết nối.
6. **Bootstrap:** khai báo DI tokens trong `bootstrap/tokens.ts`, lắp adapters vào use cases bằng factory providers trong `AppModule`, cùng cấu hình, health và discovery. Token `USER_PROFILE_REPOSITORY` dùng `useExisting: UserRepository` để giữ instance đã được module database quản lý. `main.ts` khởi động TCP và RabbitMQ, bật shutdown hooks.

Không dùng CQRS framework, command bus hoặc event bus nghiệp vụ trong v1. Adapter persistence kế thừa `MongoDBRepository` dùng chung; port Application chỉ công khai các thao tác hồ sơ cần thiết. Ưu tiên kiểu dữ liệu và hàm policy; chỉ tạo entity class khi cần đóng gói hành vi. Khi khóa tài khoản thành công nhưng kết thúc session thất bại, trả lỗi thể hiện rõ tài khoản đã bị khóa.

### Kiểm thử kiến trúc

- [x] Kiểm thử Domain và Application bằng fake ports: quyền, role, quyền sở hữu hồ sơ, trùng dữ liệu, tài khoản không tồn tại và lỗi từng phần; không cần khởi động NestJS hoặc database.
- [x] Kiểm thử adapter với Keycloak/MongoDB: token cache, ánh xạ lỗi, upsert đồng thời và unique index.
- [x] Kiểm thử presentation: DTO, actor, message pattern, response và RPC error.
- [x] Bổ sung kiểm tra dependency bằng AST: Domain chỉ phụ thuộc Domain; Application chỉ phụ thuộc Domain và Application. Áp dụng cả unit test core, type-only import, re-export, dynamic import và require; không có ngoại lệ repository cụ thể.
- [x] Kiểm thử E2E từ gateway qua TCP đến Keycloak/MongoDB, gồm luồng admin, `/me`, token sai và thiếu quyền.

## Bước 1 — Chuẩn bị môi trường và cấu hình

- [x] Cung cấp fixture realm, role `admin` và `user`, client cho ứng dụng, audience và service account riêng cho w-identity với quyền tối thiểu cần thiết. Tạo fixture dev có thể chạy lại và hướng dẫn bootstrap admin đầu tiên.
- [x] Cấu hình Keycloak URL, realm, client credentials, issuer, audience, MongoDB URI và cổng TCP bằng biến môi trường; kiểm tra cấu hình bắt buộc khi khởi động.
- [x] Bổ sung `.env.example`, hướng dẫn chạy các dịch vụ trong Docker Compose và hướng dẫn cấu hình SMTP để gửi email đặt lại mật khẩu.
- [x] Giữ health và service discovery hiện có; cấu hình graceful shutdown.

**Hoàn thành khi:** môi trường dev khởi động được, cấu hình thiếu hoặc sai được báo rõ và không ghi secret vào log.

## Bước 2 — Xác thực tại API Gateway

- [x] Bổ sung metadata security vào route từ OpenAPI. Route mặc định yêu cầu bearer token; `security: []` cho phép truy cập công khai; từ chối security scheme chưa hỗ trợ khi nạp spec.
- [x] Xác minh JWT bằng JWKS của Keycloak, kiểm tra thuật toán cho phép, chữ ký, issuer, audience và thời hạn; hỗ trợ xoay khóa.
- [x] Dựng `GatewayRequest.user` từ claim đã xác minh: `sub`, `iss` và `roles` từ `realm_access.roles`. Không nhận danh tính hoặc role do client tự khai báo trong body/header.
- [x] Trả `401` khi token thiếu hoặc không hợp lệ; trả `403` khi thiếu quyền. Chỉ cho phép truy cập cổng TCP của w-identity từ mạng nội bộ tin cậy.

**Hoàn thành khi:** request hợp lệ có danh tính được truyền xuống service; token sai và request giả danh bị từ chối.

## Bước 3 — Chuyển w-identity sang TCP và khai báo hợp đồng

- [x] Chuyển bootstrap sang NestJS TCP microservice, bật shutdown hooks và dùng cùng cổng với service discovery.
- [x] Giữ cấu trúc `GatewayRequest` và `GatewayRpcError` theo hợp đồng gateway. Dùng namespace `identity.*` để tránh trùng pattern `user.*` của echo-service.
- [x] Tạo OpenAPI spec riêng cho identity; mỗi `operationId` khớp chính xác với một message pattern. Gateway chuyển lỗi RPC thành `problem+json`.
- [x] Dùng DTO allowlist, từ chối trường ngoài hợp đồng; kiểm tra quyền tại từng handler. Các thao tác `/me` luôn lấy ID từ `user.sub`.

| HTTP qua gateway | Message pattern | Quyền |
|---|---|---|
| `GET /users` | `identity.users.list` | Admin |
| `POST /users` | `identity.users.create` | Admin |
| `GET /users/{id}` | `identity.users.get` | Admin |
| `PATCH /users/{id}` | `identity.users.update` | Admin |
| `PATCH /users/{id}/status` | `identity.users.setStatus` | Admin |
| `GET /roles` | `identity.roles.list` | Admin |
| `PUT /users/{id}/roles/{role}` | `identity.users.assignRole` | Admin |
| `DELETE /users/{id}/roles/{role}` | `identity.users.removeRole` | Admin |
| `POST /users/{id}/password-reset-email` | `identity.users.sendPasswordReset` | Admin |
| `GET /me` | `identity.me.get` | Đã đăng nhập |
| `PATCH /me` | `identity.me.updateProfile` | Đã đăng nhập |

**Hoàn thành khi:** gateway tìm thấy các pattern qua registry, định tuyến đúng và trả lỗi theo hợp đồng.

## Bước 4 — Tích hợp Keycloak

- [x] Tách Keycloak adapter và nghiệp vụ người dùng. Gọi Admin REST API bằng service account, không truy cập trực tiếp database Keycloak.
- [x] Lấy token bằng client credentials, cache theo hạn dùng và refresh một lần khi gặp `401`; đặt timeout cho request. Không tự động retry tạo tài khoản hoặc gửi email khi kết quả chưa xác định.
- [x] Quản lý `id`, username, email, họ tên, `enabled`, `emailVerified` và realm roles tại Keycloak. Chỉ cho phép gán/gỡ role ứng dụng `admin`, `user`.
- [x] Tạo tài khoản bằng username, email và họ tên; mặc định bật và có role `user`, không nhận mật khẩu. Nếu gán role mặc định thất bại, trả lỗi kèm ID tài khoản đã tạo để admin khắc phục, không tự xóa tài khoản.
- [x] Cho admin sửa email và họ tên; username bất biến trong v1. Khi đổi email, đặt `emailVerified=false`.
- [x] Liệt kê tài khoản từ Keycloak với `search`, `enabled`, `offset`, `limit`; mặc định `limit=20`, tối đa `100`. Không lọc theo trường MongoDB.
- [x] Khi khóa tài khoản, tắt tài khoản và yêu cầu kết thúc session. Cấu hình access token mặc định 5 phút; token đã phát hành có thể còn hiệu lực đến khi hết hạn.
- [x] Gửi email đặt lại mật khẩu qua `execute-actions-email` với `UPDATE_PASSWORD`; SMTP phải được cấu hình.

**Hoàn thành khi:** admin thực hiện được các thao tác tài khoản và role qua gateway; lỗi trùng dữ liệu, Keycloak và SMTP được trả rõ ràng.

## Bước 5 — Hồ sơ MongoDB

- [x] Dùng `@nestjs/mongoose` lưu hồ sơ gồm `keycloakUserId`, `avatarUrl`, `phoneNumber`, `timezone`, `locale`, `createdAt`, `updatedAt`; tạo unique index cho `keycloakUserId`.
- [x] Dùng ID Keycloak làm ID công khai; không xuất MongoDB `_id`, lưu mật khẩu, token hoặc bản sao role trong hồ sơ.
- [x] Upsert hồ sơ khi đọc hoặc cập nhật hồ sơ của tài khoản Keycloak hợp lệ, bao gồm tài khoản đã tồn tại trước đó. Tạo tài khoản hoàn tất ở Keycloak; hồ sơ MongoDB được tạo lười.
- [x] `GET /me` và chi tiết người dùng kết hợp dữ liệu Keycloak với hồ sơ MongoDB. `PATCH /me` chỉ cập nhật các trường hồ sơ MongoDB; thông tin tài khoản thuộc luồng admin.
- [x] Tách thao tác ghi: request hồ sơ chỉ ghi MongoDB, request tài khoản chỉ ghi Keycloak.

**Hoàn thành khi:** người dùng xem và sửa hồ sơ của mình; upsert đồng thời không tạo bản ghi trùng và lỗi MongoDB không làm tạo lại tài khoản Keycloak.

## Bước 6 — Kiểm thử, vận hành và bàn giao

- [x] Kiểm thử xác thực: token hợp lệ, sai chữ ký/issuer/audience, hết hạn, xoay JWKS, route công khai và request giả danh.
- [x] Kiểm thử phân quyền: user không gọi API admin, không sửa hồ sơ người khác hoặc tự cấp role; thiếu danh tính bị từ chối.
- [x] Kiểm thử nghiệp vụ: tạo và tìm tài khoản, trùng username/email, cập nhật email, bật/tắt, role ngoài allowlist, validation và email đặt lại mật khẩu.
- [x] Kiểm thử lỗi Keycloak timeout, service account thiếu quyền, SMTP lỗi, gán role mặc định thất bại, kết thúc session thất bại và MongoDB không khả dụng.
- [x] Kiểm thử E2E HTTP → gateway → discovery → TCP → Keycloak/MongoDB bằng realm và database riêng; xác minh `/me`, phân trang và cấu trúc lỗi.
- [x] Log request ID, người thực hiện, thao tác, đối tượng và kết quả; không ghi token, secret hoặc toàn bộ hồ sơ.
- [x] Chạy build, typecheck, lint và test qua Nx cho các project thay đổi; cập nhật hướng dẫn chạy và request mẫu.

**Hoàn thành khi:** các API trong bảng chạy qua gateway với Keycloak và MongoDB thật, các kiểm tra quyền đạt yêu cầu và tài liệu đủ để dựng môi trường mới.

## Giả định vận hành

- Admin quản lý role toàn hệ thống; v1 chưa bảo vệ admin cuối cùng. Giữ tài khoản quản trị khẩn cấp riêng trong Keycloak.
- Không đồng bộ nền các thay đổi thực hiện trực tiếp trên Keycloak Admin Console; dữ liệu tài khoản được đọc từ Keycloak, hồ sơ MongoDB được quản lý qua w-identity.
- Tham khảo [Keycloak Admin REST API](https://www.keycloak.org/docs-api/latest/rest-api/index.html) cho các thao tác quản trị và gửi email.

## Nhật ký triển khai

- Chuẩn hóa ranh giới persistence: Application sở hữu `UserRepositoryPort`; `UserRepository` implements port, wiring dùng `USER_PROFILE_REPOSITORY` với `useExisting`. Unit test core dùng fake object; architecture test dùng AST và không cho phép ngoại lệ import Infrastructure. Đã kiểm chứng trên Node 24.22.2: build, typecheck, lint, 41 unit/boundary/architecture tests, MongoDB integration và E2E gateway → registry → TCP → Keycloak/MongoDB đều đạt. Tài liệu Markdown và `knowledge.html` đã cập nhật theo code hiện tại.

- Bước 1: đã thêm cấu hình fail-fast, `.env.example` và realm fixture dev. SMTP và admin ban đầu cấu hình theo README. Kiểm thử hạ tầng thực tế được ghi riêng ở bước nghiệm thu.

- Bước 2: gateway xác minh JWT/JWKS, secure-by-default và ánh xạ danh tính đã xác minh. Gateway build đạt; 136 tests đạt trên Node 24 với VM modules.
- Clean Architecture bước 1–3: Domain, ports, Actor/policy và 11 use cases đã có; 7 test nghiệp vụ đạt với fake ports.

- Bước 4: adapter Keycloak, token cache/refresh, mapping dữ liệu và lỗi đã hoàn thành; kiểm thử không retry tác dụng phụ, lỗi 403/404/409/500 và dùng chung token đồng thời đạt. Kiểm thử Keycloak thật nằm ở bước nghiệm thu.

- Bước 5: MongoDB repository đã qua kiểm thử database thật: unique index, 20 upsert đồng thời không trùng, lưu/đọc hồ sơ, không lộ `_id` và lỗi storage được chuẩn hóa.

- Bước 3 / Clean Architecture bước 4–6: TCP controller, DTO/filter, composition root và readiness MongoDB đã tích hợp; toàn luồng JWT thật → gateway → registry thật → TCP → Keycloak/MongoDB đạt.

- Bước 6: 22 unit/boundary/architecture tests của w-identity đạt; gateway có 136 unit/integration tests và 17 E2E tests đạt. Test E2E riêng của identity đã xác minh Keycloak/MongoDB thật, service discovery thật, email reset gửi vào SMTP test cục bộ, session bị kết thúc khi khóa và readiness trả 503 khi storage đóng.
- Môi trường kiểm chứng: Node 24.22.2, Keycloak image 26.0 (runtime 26.0.8), MongoDB 7. Secret và realm dev của người dùng không bị thay đổi; test dùng realm/database tạm và tự dọn.
- Cài đặt ngoài test vẫn cần import fixture dev, tạo admin đầu tiên và nhập cấu hình SMTP thực tế theo README. Các checkbox đánh dấu phần triển khai/hướng dẫn đã bàn giao, không khẳng định đã cấu hình môi trường production.

### Các commit theo hạng mục

| Repository | Commit | Hạng mục |
|---|---|---|
| w-identity | `93e393d` | Cấu hình fail-fast và realm fixture |
| api-gateway | `946c9be` | JWT/JWKS và security trong OpenAPI |
| w-identity | `371bf92` | Domain, ports, Actor/policy và use cases |
| w-identity | `ea7cfe4` | Keycloak adapter và token lifecycle |
| w-identity | `242c608` | Hồ sơ MongoDB và kiểm thử upsert đồng thời |
| api-gateway | `a7b80c9` | Routing identity và chuẩn hóa lỗi URL |
| w-identity | `f99ee42` | Tài liệu học Clean Architecture |
| w-identity | `b698ac2` | TCP, composition root, validation/filter và E2E |
| workspace | `d567d9e`, `5495e4a` | Dependency lock và giữ project trong Nx graph |

Các commit nghiệm thu cuối chứa schema API đầy đủ, hướng dẫn vận hành và kết quả kiểm tra; xem `git log` của từng repository.


## Cập nhật domain profile

- Domain bổ sung `assertActiveAccount`, `validateProfilePatch` và `DomainError`, độc lập NestJS/Mongoose/transport.
- `GetMe` và `UpdateMyProfile` gọi policy trạng thái; cập nhật profile luôn gọi validation domain trước khi ghi repository.
- Presentation giữ kiểm tra cấu trúc/kiểu request và dùng lại validation; domain error được ánh xạ về 400/403 với code API hiện có.
- Giữ `UserRepositoryPort`; repository cụ thể vẫn nằm trong worker. Mô hình lưu trữ đổi tên thành `UserPersistenceEntity`, giữ collection/index hiện có.
- Unit test domain, use case và transport cùng architecture checks đã đạt. Mongo integration và target `test:profile` (TCP + MongoDB thật, account lookup giả) đã đạt.
- E2E toàn hệ thống đang dừng tại POST /users do policy quản trị hiện tại trả 403 `Account management is temporarily unavailable`; suite cũ mong 201. Phần quản trị cần được cập nhật riêng theo chính sách mới.


## CQRS — cấu trúc hiện tại

- Đã thêm @nestjs/cqrs 12.1.2, CommandBus/QueryBus và 5 command + 3 query.
- Message và handler Application thuần nằm trong application/commands và application/queries. Nest adapter đăng ký/inject bằng decorator trong presentation/cqrs, controller dispatch qua bus.
- Theo yêu cầu, chỉ có UserRepositoryPort chung với findByUserId và update; không tách port đọc/ghi. Query không gọi getOrCreate và không ghi database.
- Profile chưa có trả null; lần cập nhật đầu tiên upsert. OpenAPI gateway đã bổ sung nullable profile. Không đổi pool/database, không thêm event sourcing hoặc broker flow mới.
- Giữ nguyên domain validation và hạn chế quản trị tài khoản hiện tại. Unit/architecture test cùng integration bus/TCP/MongoDB xác nhận dispatch và read-only behavior.
- Full E2E đang thiếu fixtures/pm-realm.json trong worker, độc lập với CQRS; không tự khôi phục fixture quản trị đã bị loại bỏ.

Kiểm chứng CQRS cuối: build/typecheck/lint, 84 unit/boundary/architecture tests của worker, 137 gateway tests (bao gồm OpenAPI profile nullable), Mongo integration và CQRS bus/TCP/MongoDB integration đều đạt. Full E2E chưa chạy qua setup vì thiếu fixture pm-realm.json.
