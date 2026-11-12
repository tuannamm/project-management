> **Trạng thái code hiện tại:** các handler quản lý tài khoản, role và permission đã được triển khai, nhưng `AuthorizationPolicy.management()` luôn từ chối với `FORBIDDEN` nên các thao tác này hiện bị tắt. Luồng đang chạy và có test là `GetMe`, `GetUser`, `ListUsers` (đọc) và `UpdateMyProfile`. Ở các bài dưới, ví dụ lấy từ luồng quản lý tài khoản được ghi rõ là **kịch bản thiết kế (hiện bị tắt)**; ví dụ không ghi chú là hành vi đang chạy.

# Clean Architecture — học, ôn tập và phỏng vấn

Ví dụ xuyên suốt là thiết kế và code **w-identity** đã có kiểm thử; đây chưa phải bằng chứng vận hành production. Xem [PLAN.md](./PLAN.md) (tài liệu lịch sử, nhiều chỗ đã khác code hiện tại).

Học theo thứ tự 0–16. Phần DDD và phần phân quyền đã tách sang các sổ tay riêng (`#ddd`, `#authz`). Mỗi ngày đọc hai chủ đề (khoảng 8 ngày), tự nói câu trả lời trong 60–90 giây rồi luyện thẻ câu hỏi. Sau đó làm bài thực hành và một buổi phỏng vấn giả lập 20 phút. Trạng thái 📖 là tài liệu lý thuyết, không khẳng định bạn đã học thuộc.

## Bảng tiến độ

| # | Chủ đề | Bước PLAN | Trạng thái |
|---|---|---|---|
| 0 | Clean Architecture trong 60 giây | Clean Architecture | 📖 |
| 1 | Dependency Rule và luồng thực thi | Clean Architecture | 📖 |
| 2 | Domain: mô hình và quy tắc | Clean Architecture | 📖 |
| 3 | Application và use case | Clean Architecture | 📖 |
| 4 | Ports, adapters và quyền sở hữu interface | Clean Architecture | 📖 |
| 5 | DIP, DI và composition root | Clean Architecture | 📖 |
| 6 | DTO, mapper và ranh giới dữ liệu | Clean Architecture | 📖 |
| 7 | Validation và authorization nằm ở đâu | Clean Architecture | 📖 |
| 8 | Lỗi, timeout và kết quả chưa xác định | Clean Architecture | 📖 |
| 9 | Transaction và tính nhất quán giữa hai hệ thống | Clean Architecture | 📖 |
| 10 | Chiến lược kiểm thử | Clean Architecture | 📖 |
| 11 | Clean, Hexagonal, Onion và layered architecture | Clean Architecture | 📖 |
| 12 | Đánh đổi và khi nào áp dụng | Clean Architecture | 📖 |
| 13 | Bài thực hành và câu trả lời phỏng vấn | Clean Architecture | 📖 |
| 14 | So sánh Clean Architecture, DDD và CQRS | Clean Architecture | 📖 |
| 15 | SOLID, Boundary và cấu trúc dự án | Clean Architecture | 📖 |
| 16 | Role và Permission (RBAC) trong w-identity | Clean Architecture | 📖 |

## 0. Clean Architecture trong 60 giây

Tách quy tắc nghiệp vụ khỏi chi tiết giao tiếp và lưu trữ để kiểm thử và thay đổi độc lập. Điều quyết định là hướng phụ thuộc trong mã nguồn, không phải số thư mục.

### Bốn vòng thường dùng, từ trong ra ngoài

![Bốn vòng Clean Architecture và vị trí các thành phần w-identity](./clean-architecture-layers.svg)

Hình thể hiện các vòng khái niệm: càng vào trong càng gần nghiệp vụ. Tên thành phần trong hình là ví dụ tương ứng, không có nghĩa mỗi thư mục chỉ được chứa đúng một vòng.

| Vòng | Trách nhiệm | Ví dụ trong w-identity |
|---|---|---|
| **Entities / Domain** | Mô hình và quy tắc nghiệp vụ cốt lõi, độc lập với công nghệ. | `UserAccount`, `User`, `profile.policy.ts` và `DomainError` trong `domain/`. |
| **Use Cases / Application** | Điều phối hành động của ứng dụng, kiểm tra quyền và định nghĩa các port cần dùng. | `UpdateMyProfile`, `AuthorizationPolicy`, `UserRepositoryPort` trong `application/`. |
| **Interface Adapters** | Chuyển đổi dữ liệu giữa use case và thế giới bên ngoài; hiện thực các port. | TCP controller, DTO/filter trong `presentation/`; Keycloak adapter và MongoDB repository trong `infrastructure/`. |
| **Frameworks & Drivers** | Công cụ và hệ thống bên ngoài cung cấp giao tiếp, lưu trữ và vận hành. | NestJS, TCP/RabbitMQ, Mongoose/MongoDB, Keycloak. |

Đây là mô hình khái niệm: tên thư mục và số tầng triển khai có thể khác nhau. Trong dự án này, `presentation/` và `infrastructure/` đều chứa adapter; các file đó đồng thời dùng NestJS hoặc thư viện database. `AppModule` là **composition root** để lắp các thành phần, không phải một vòng nghiệp vụ riêng.

Quy tắc phụ thuộc: Domain không biết Application hay Infrastructure; Application biết Domain và port của mình; adapter bên ngoài biết Application/Domain. Ví dụ khi cập nhật hồ sơ, chiều gọi lúc chạy là controller → use case → repository → MongoDB, nhưng use case chỉ import port do Application sở hữu.

**Trả lời phỏng vấn:** “Bốn vòng là Entities, Use Cases, Interface Adapters và Frameworks & Drivers. Quy tắc chính là dependency mã nguồn hướng vào trong. Ở w-identity, UpdateMyProfile phụ thuộc UserRepositoryPort; UserRepository hiện thực port bằng MongoDB và AppModule lắp chúng lại.”

**Ví dụ w-identity:** Trong thiết kế w-identity, use case cập nhật hồ sơ dùng repository port; Mongoose nằm ở adapter bên ngoài.

**Bẫy phỏng vấn:** Chia đủ bốn folder nhưng application vẫn import Mongoose thì ranh giới chưa đúng.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

### Ví dụ ngoài đời: quán ăn nhận đơn

Khách nói: **“Cho tôi hai phần cơm gà.”** Quán có thể nhận yêu cầu tại quầy, qua điện thoại hoặc qua ứng dụng giao hàng. Dù nhận qua đâu, đơn hàng vẫn phải tuân thủ quy tắc của quán.

![Bốn tầng Clean Architecture qua ví dụ quán ăn](./restaurant-layers.svg)

| Tầng, từ ngoài vào trong | Vai trò trong quán | Ví dụ trong code |
|---|---|---|
| Frameworks & Drivers | Máy POS, ứng dụng giao hàng, sổ lưu đơn | API thanh toán, HTTP, database |
| Interface Adapters | Nhân viên chuyển lời khách thành thông tin chuẩn; bộ phận chuyển lệnh thu tiền sang POS | OrderController, POSPaymentAdapter, OrderRepository |
| Application / Use Cases | Người điều phối một lần đặt món | PlaceOrder lấy món, áp dụng quy tắc, thu tiền và lưu đơn |
| Domain | Quy tắc bán hàng của quán | Đơn có ít nhất một món; số lượng dương; tổng tiền bằng tổng giá nhân số lượng |

Đây là phép so sánh về **trách nhiệm**, không phải yêu cầu tạo một class cho mỗi nhân viên. Các quy tắc ví dụ vẫn đúng dù đổi kênh nhận đơn, máy POS hay database. Đó là phần cần được bảo vệ trong Domain. Application sắp xếp các bước để hoàn thành một yêu cầu cụ thể.

**Liên hệ w-identity:** controller nhận yêu cầu sửa profile; UpdateMyProfile điều phối; domain policy kiểm tra trạng thái tài khoản và dữ liệu profile; UserRepository thực hiện việc lưu thông qua contract UserRepositoryPort.

### Ví dụ căn nhà: bốn vòng và chiều phụ thuộc

| Vòng, từ trong ra ngoài | Trong căn nhà | Ví dụ trong w-identity |
|---|---|---|
| Entities / Domain | Móng và khung chịu lực: mọi thứ dựa vào móng, móng không biết ai đang dựa vào nó | `Role`, luật trong `role.policy.ts` |
| Use Cases / Application | Công năng của nhà: nấu ăn, tắm, tiếp khách. Bản thiết kế bếp chỉ ghi "cần một vòi nước chuẩn"; vòi chuẩn đó là **port** | `DeleteRoleHandler`, `RoleRepositoryPort` |
| Interface Adapters | Cửa chính đón khách (chiều vào); đường ống và đầu nối đưa nguồn nước vào đúng chuẩn của vòi (chiều ra) | Controller, DTO; `RoleRepository`, `KeycloakIdentityAdapter` |
| Frameworks & Drivers | Nhà máy nước, công ty điện, nhà mạng: dùng nhưng không tự xây và có thể đổi | MongoDB, Keycloak, NestJS, TCP |

Khi mở vòi, yêu cầu đi từ bếp ra nhà máy nước (**chiều gọi**). Nhưng bản thiết kế bếp không nhắc đến nhà máy, chỉ đường ống phải làm theo chuẩn của vòi (**chiều phụ thuộc**, hướng vào trong). `AppModule` là thợ lắp đặt: biết cả vòi lẫn nguồn nước và nối chúng lại.

Đổi MongoDB sang PostgreSQL giống đổi nước máy sang nước giếng khoan: bếp vẫn nấu như cũ, nhưng phải làm lại đường ống (repository), chuyển nước đang trữ sang bể mới (migrate dữ liệu) và bảo đảm áp lực vẫn đủ (giữ đúng ngữ nghĩa mà port đã hứa).

Chỗ khập khiễng: móng nhà thật phải xây trước và rất khó sửa, còn Entities vẫn sửa được khi nghiệp vụ đổi. "Móng" ở đây chỉ có nghĩa là **không phụ thuộc vào thứ gì bên ngoài**.

### Ba ví dụ khác, mỗi ví dụ làm rõ một ý

**Bệnh viện, rõ nhất về bốn vòng:** quy tắc y khoa như không kê thuốc bệnh nhân dị ứng là Entities; quy trình tiếp nhận, xét nghiệm, chẩn đoán, kê đơn là Use Cases; lễ tân và kỹ thuật viên chuyển thông tin về dạng chuẩn là Interface Adapters; máy xét nghiệm của từng hãng là Frameworks & Drivers. Mẫu phiếu kết quả chính là **port**: đổi máy từ hãng A sang hãng B thì bác sĩ vẫn đọc đúng mẫu phiếu cũ.

**Ngân hàng, rõ nhất về đổi kênh vào:** luật số dư là Entities; chuyển tiền là Use Case; quầy giao dịch, ATM và app đều đổi thao tác của khách thành cùng một lệnh chuyển tiền. Ở w-identity, thêm REST bên cạnh TCP chỉ cần thêm controller, handler giữ nguyên.

**Laptop và USB-C, gọn nhất về port và adapter:** laptop quy định cổng USB-C (**port**), cáp chuyển HDMI là **adapter**, màn hình của hãng nào cũng được (**driver** bên ngoài). Phụ kiện bên ngoài phải làm theo chuẩn của laptop, nên phụ thuộc hướng vào trong.

## 1. Dependency Rule và luồng thực thi

Dependency trong mã nguồn hướng về phần nghiệp vụ bên trong. Luồng chạy có thể đi từ use case ra adapter qua interface do lớp trong sở hữu.

![Luồng cập nhật hồ sơ và chiều phụ thuộc trong w-identity](./identity-profile-flow.svg)

Mũi tên hàng trên mô tả **lời gọi lúc chạy**. Mũi tên hàng dưới mô tả **dependency mã nguồn**: use case và repository cùng phụ thuộc port của Application. `AppModule` lắp repository vào use case khi khởi động.

**Ví dụ w-identity:** Application định nghĩa `IdentityProviderPort` và `UserRepositoryPort`; `KeycloakIdentityAdapter` và `UserRepository` implements các port tương ứng. Khi chạy, use case gọi adapter được truyền vào constructor. Trong mã nguồn, cả use case và adapter đều import port thuộc Application; Application không import repository cụ thể, kể cả bằng `import type`.

**Bẫy phỏng vấn:** Nhầm chiều gọi hàm với chiều import; nghĩ use case không được gọi database thông qua port.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

### Theo dấu đơn cơm: gọi ra ngoài qua port

![Luồng chạy và chiều phụ thuộc mã nguồn của đơn hàng](./restaurant-flow.svg)

1. **OrderController nhận đơn:** chuyển “hai phần cơm gà” thành mã món và số lượng.
2. **PlaceOrder điều phối:** lấy thông tin món, gọi Domain kiểm tra đơn và tính tổng tiền.
3. **Use case yêu cầu thu tiền:** gọi PaymentPort với số tiền và mã đơn. Port này do Application định nghĩa.
4. **Adapter thực hiện:** POSPaymentAdapter implements PaymentPort, chuyển yêu cầu sang API của máy POS và trả kết quả.
5. **Use case yêu cầu lưu:** gọi OrderRepositoryPort; adapter lưu đơn bằng database.

Giả sử máy POS được đổi sang ví điện tử: thêm adapter thực hiện cùng PaymentPort và đổi wiring ở composition root. Quy tắc tính tiền và use case vẫn dùng contract cũ khi yêu cầu nghiệp vụ không đổi.

**Hai chiều phải phân biệt:**

- Lúc chạy: PlaceOrder gọi chức năng thanh toán do adapter bên ngoài thực hiện, thông qua PaymentPort.
- Trong mã nguồn: PlaceOrder import PaymentPort; POSPaymentAdapter cũng import và implements PaymentPort. Use case không import adapter cụ thể.

**Câu chốt để ôn:** Khi tầng trong cần chức năng do tầng ngoài cung cấp, nó gọi qua port do tầng trong định nghĩa. Tầng ngoài hiện thực port đó. Tầng ngoài gọi tầng trong, hoặc Application gọi Domain, có thể gọi trực tiếp; không cần tạo interface cho mọi lời gọi. Port có thể là interface, abstract class hoặc kiểu hàm.

**Tự kiểm tra:** Ai sở hữu PaymentPort? Đổi máy POS ảnh hưởng phần nào? Vì sao use case gọi adapter lúc chạy mà dependency mã nguồn vẫn hướng vào trong?

## 2. Domain: mô hình và quy tắc

Domain diễn tả khái niệm và bất biến nghiệp vụ. Entity không bắt buộc là class; có thể dùng kiểu dữ liệu và hàm thuần khi phù hợp.

**Ví dụ w-identity:** `User` mô tả hồ sơ; `assertActiveAccount` chặn tài khoản bị vô hiệu hóa đọc/sửa profile; `validateProfilePatch` kiểm tra locale, timezone, avatar URL và giới hạn field. Các policy là hàm thuần ở `domain/policies/profile.policy.ts`, chỉ dùng mô hình domain và `DomainError`.

`UpdateMyProfile` kiểm tra actor, lấy account qua port, gọi domain policy rồi mới ghi qua repository port. Vì use case tự gọi validation nên HTTP, TCP, RabbitMQ hoặc lời gọi trực tiếp đều chịu cùng quy tắc. DTO kiểm tra cấu trúc request bằng class-validator và dùng chung các hàm kiểm tra định dạng với Domain; filter ánh xạ domain error thành response 400/403.

`UserPersistenceEntity` có decorator Mongoose nằm ở Infrastructure, ánh xạ collection `users`; nó khác với domain model `User`. Các model có thể giữ dạng interface khi chưa cần đóng gói hành vi trong class.

**Bẫy phỏng vấn:** Đưa mọi validation vào entity hoặc tạo class rỗng chỉ để gọi là DDD.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

### Business logic thực sự nằm ở đâu

Hình dạng dữ liệu một mình chưa phải business logic. Business logic là **luật và quyết định**. Câu "Domain chứa business logic" mô tả nơi luật nên nằm, không tự đúng với mọi code: nếu Domain chỉ có kiểu dữ liệu thì luật đã bị đẩy sang chỗ khác, thường là handler. Tình trạng này gọi là **Anemic Domain Model**.

Ở w-identity, `domain/models/` nói một `Role` **gồm những gì**, còn [role.policy.ts](../src/domain/policies/role.policy.ts) nói **điều gì được phép xảy ra**:

| Luật nghiệp vụ | Hàm |
|---|---|
| Role `admin` và `user` không được sửa hay xóa | `assertMutableRole` |
| Không ai được tạo role trùng tên role hệ thống | `validateRole` |
| Tên quyền phải có dạng `resource:action` | `isValidPermissionKey` |
| User chưa được gán role thì mặc định là `user` | `resolveEffectiveAccess` |
| Role được gán mà không tồn tại thì từ chối (fail closed) | `resolveEffectiveAccess` |

Hình dạng dữ liệu vẫn có giá trị: nó tạo ngôn ngữ chung của nghiệp vụ và đôi khi tự mang luật. `UserRole` chỉ có một `roleName` nghĩa là mỗi user chỉ có một role.

Luật "role còn người dùng thì không được xóa" đang nằm trong `DeleteRoleHandler` vì cần đếm qua port, dù về bản chất khá gần luật Domain. Có thể để handler đếm rồi truyền con số vào một hàm policy: handler lấy dữ liệu, Domain ra quyết định.

**Hai câu kiểm tra một đoạn code có thuộc Domain không:** người làm nghiệp vụ có hiểu và có quyền thay đổi nó không? Bỏ hết database, NestJS, Keycloak thì nó còn đúng không? "Role hệ thống không được xóa" đạt cả hai; "bắt lỗi `11000` khi trùng khóa" thì không, nên nó ở Infrastructure.

### I/O là gì và vì sao Domain bị động

**I/O (Input/Output)** là mọi giao tiếp ra ngoài chương trình đang chạy: truy vấn MongoDB, gọi HTTP đến Keycloak, nhận request TCP, gửi message RabbitMQ, đọc file. Tính toán trên biến trong bộ nhớ như `if (role.system)` không phải I/O. I/O thường chậm, có thể lỗi vì lý do bên ngoài, và kết quả có thể khác nhau giữa các lần gọi.

Domain **không tĩnh** vì có logic, nhưng **bị động**: nó được gọi đến và không tự gọi ra. Mọi thứ nó cần đều đến qua tham số; kết quả là giá trị trả về hoặc lỗi được ném ra. Handler mới là bên điều phối:

```ts
const role = await requireRole(this.roles, input.name);   // I/O qua port: lấy dữ liệu
assertMutableRole(role);                                  // Domain: chỉ ra quyết định
if ((await this.userRoles.countByRole(role.name)) > 0)    // I/O qua port: đếm
  throw new ApplicationError('ROLE_IN_USE', 'Role is assigned to users');
await this.roles.delete(role.name);                       // I/O qua port: ghi
```

Nếu Domain tự gọi `roleModel.findOne(...)`, luật bị dính vào Mongoose, muốn test phải có database và đổi database thì phải sửa cả Domain. Khi không có I/O, cùng đầu vào luôn cho cùng kết quả nên test rất ngắn:

```ts
expect(() => assertMutableRole({ system: true })).toThrow(DomainError);
```

**Câu chốt:** use case lo lấy và lưu dữ liệu, Domain chỉ nhận dữ liệu và ra quyết định.

### Domain có cần interface để use case gọi vào không?

Thường là không. Use case gọi vào Domain thì chiều gọi và chiều phụ thuộc đã cùng hướng vào trong, nên không có gì phải đảo ngược; luật nghiệp vụ cũng chỉ có một bản, không cần thay thế như MongoDB hay Keycloak. Handler import thẳng `assertMutableRole` từ Domain.

`User` và `Role` được khai báo bằng `interface` của TypeScript, nhưng đó chỉ là **hình dạng dữ liệu**, khác với port là hợp đồng hành vi. Domain có interface thật khi DDD cổ điển đặt repository interface trong Domain; đó vẫn là DIP cho chiều đi ra. w-identity đặt port ở `application/ports/`, cũng hợp lệ, và `architecture.spec.ts` cấm Domain import Application nên luật Domain không dùng được các port này.

Với hàm thuần, handler phải tự nhớ gọi luật; `assertMutableRole` đang được gọi lặp lại ở các handler sửa, xóa, cấp và thu hồi quyền. Với Rich Domain Model, luật nằm trong đối tượng nên không thể quên:

```ts
class Role {
  grant(key: PermissionKey) {
    if (this.system) throw new DomainError('SYSTEM_ROLE_PROTECTED', '...');
    this.permissionKeys.add(key);
  }
}
```

Khi luật còn ít, hàm thuần đơn giản và hợp lý hơn. Khi luật nhiều và phụ thuộc lẫn nhau, đóng gói vào đối tượng sẽ an toàn hơn.

**Câu chốt:** interface cần ở chỗ phải gọi ra thứ có thể thay đổi. Gọi vào Domain thì không cần, vì Domain chính là thứ các lớp khác phụ thuộc vào.

## 3. Application và use case

Use case mô tả một mục đích của người dùng, điều phối domain và ports, kiểm tra quyền và quyết định thứ tự thao tác.

Một use case thường có dạng: nhận input và `Actor` → kiểm tra quyền → lấy dữ liệu qua port → gọi quy tắc Domain → ghi qua port → trả kết quả. Mỗi use case là một class/hàm riêng (một mục đích), không gom thành `UserService` chứa mọi thao tác. Use case không biết HTTP, TCP hay NestJS.

**Ví dụ w-identity (đang chạy):** `UpdateMyProfileHandler` làm đúng chuỗi đó: `auth.authenticated(actor)` → `identity.get(actor.userId)` → `assertActiveAccount` → `validateProfilePatch` → `profiles.update(...)`. Thứ tự này là quyết định của Application; Domain chỉ cung cấp các quy tắc, không biết thứ tự gọi.

**Kịch bản thiết kế (hiện bị tắt):** `SetUserStatusHandler` gọi `auth.management(actor)`, đổi trạng thái, rồi nếu khóa thì kết thúc session và báo `ACCOUNT_DISABLED_SESSION_FAILED` khi bước cuối lỗi. Hiện `management()` luôn ném `FORBIDDEN` nên luồng này không chạy tới `setEnabled`; dùng nó để học cách thiết kế lỗi từng phần, không phải hành vi hiện có.

**Phân biệt:** quy tắc *Domain* đúng với mọi ứng dụng dùng mô hình đó (tài khoản bị khóa không được sửa profile); quy tắc *Application* thuộc riêng một use case hoặc ứng dụng (ai được gọi, bước nào trước bước nào, gọi port nào).

**Bẫy phỏng vấn:** Tạo UserService khổng lồ hoặc để controller điều phối nhiều adapter.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

### CQRS trong w-identity

Controller gửi message qua `CommandBus` hoặc `QueryBus`. Bus chỉ tìm handler; handler mới thực hiện use case. NestJS bus/decorator nằm ở `presentation/cqrs/`, còn command/query và logic handler thuần nằm ở `application/commands` và `application/queries`. Domain/Application không import `@nestjs/cqrs`.

Bốn command quản lý tài khoản (`CreateUser`, `UpdateUser`, `SetUserStatus`, `SendPasswordResetEmail`) hiện bị `management()` từ chối; `UpdateMyProfileCommand` và các query đang chạy.

| Command — thay đổi trạng thái hoặc tạo tác động bên ngoài | Query — đọc dữ liệu |
|---|---|
| CreateUserCommand, UpdateUserCommand | GetUserQuery |
| SetUserStatusCommand, SendPasswordResetEmailCommand | ListUsersQuery |
| UpdateMyProfileCommand | GetMeQuery |

Adapter có decorator NestJS kế thừa handler Application để cung cấp DI/đăng ký bus; không chứa business logic. Cùng một `UserRepositoryPort` phục vụ cả hai phía, với `findByUserId` và `update`; trách nhiệm đọc/ghi được giữ trong handler và kiểm thử.

`GetMeQuery` và `GetUserQuery` chỉ đọc. Nếu chưa có profile, trả `profile: null` và không tạo document. `UpdateMyProfileCommand` kiểm tra actor, domain policy rồi upsert profile ở lần cập nhật đầu tiên. OpenAPI đã mô tả profile nullable.

```text
TCP / RabbitMQ → Controller → CommandBus → Nest adapter → Application command handler
                           → QueryBus   → Nest adapter → Application query handler
                                                      ↓
                                                 Domain + ports
```

CQRS ở đây chạy đồng bộ trong worker, dùng chung database và connection pool hiện có. Event Sourcing, database đọc riêng và saga chưa được thêm. EventBus (nếu dùng sau này) phát sự kiện tới các handler; nó không tự trở thành use case hoặc hàng đợi RabbitMQ bền vững.

Tham khảo: [NestJS CQRS](https://docs.nestjs.com/recipes/cqrs).

### Command có phải interface, handler có phải bản implement không?

Không. Cả hai đều nằm ở Application, nhưng command là **thông điệp chứa dữ liệu**, còn handler là **use case xử lý thông điệp đó**. `DeleteRoleCommand` chỉ mang `input` và `actor`, không khai báo hành vi nào; `DeleteRoleHandler` không `implements DeleteRoleCommand` mà nhận command làm tham số của `execute`. Giống bệnh viện: command là tờ phiếu yêu cầu xét nghiệm, handler là người nhận phiếu và thực hiện quy trình.

Trực giác "giống interface" có cơ sở vì cả hai đều giúp bên gọi không biết bên xử lý là ai: controller chỉ gọi `commands.execute(new DeleteRoleCommand(...))`. Điểm khác là cơ chế nối:

| | Port và repository | Command và handler |
|---|---|---|
| Hai bên thống nhất qua | Danh sách method | Kiểu dữ liệu của command |
| Nối bằng | DI token | Bus tra handler theo loại command |
| Trình biên dịch kiểm tra | Có, qua `implements` | Một phần, thiếu handler thì tới lúc chạy mới báo lỗi |
| Hướng thường gặp | Từ use case ra ngoài | Từ ngoài vào use case |

Nếu muốn gọi tên "interface" trong CQRS thì đó là `ICommandHandler<T>` của NestJS: handler implement interface này, command chỉ là tham số kiểu `T`.

Handler cũng không chỉ làm việc với Domain mà **điều phối** cả hai phía: gọi Domain để áp luật và gọi port để lấy, lưu dữ liệu. `DeleteRoleHandler` dùng CQRS ở đầu vào và DIP ở đầu ra.

**Câu chốt:** command nói muốn làm gì, handler quyết định làm như thế nào, port là thứ handler cần từ bên ngoài để làm xong việc.

## 4. Ports, adapters và quyền sở hữu interface

Port là hợp đồng lớp nghiệp vụ cần; adapter chuyển hợp đồng đó thành lời gọi công nghệ cụ thể. Interface nên nói bằng ngôn ngữ của bên sử dụng.

**Ví dụ w-identity:** `IdentityProviderPort` có bảy thao tác (`create`, `get`, `list`, `update`, `setEnabled`, `logout`, `sendPasswordReset`) và chỉ dùng mô hình nội bộ như `UserAccount`, `AccountPatch`; `KeycloakIdentityAdapter` chuyển dữ liệu Keycloak sang các mô hình đó. Luồng profile hiện chỉ dùng `get`. `UserRepositoryPort` cung cấp `findByUserId(userId)` trả `User | null` và `update(userId, patch)` trả `User`; query và command dùng chung port này. Những khả năng CRUD kế thừa từ `MongoDBRepository` không nằm trong hợp đồng mà use case sử dụng.

**Bẫy phỏng vấn:** Định nghĩa port trả Keycloak SDK object khiến abstraction vẫn rò rỉ nhà cung cấp.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

## 5. DIP, DI và composition root

DIP là nguyên tắc phụ thuộc vào abstraction; DI là cách cung cấp dependency từ ngoài. Composition root chọn implementation và lắp object graph. DI không tự bảo đảm DIP.

Chính xác hơn, DIP có hai ý: module cấp cao không phụ thuộc module cấp thấp (cả hai cùng phụ thuộc abstraction), và abstraction không phụ thuộc chi tiết mà chi tiết phụ thuộc abstraction. Điều kiện để DIP thật sự đảo hướng là abstraction **thuộc về phía cấp cao** (Application), không nằm cạnh implementation. Có DI mà interface đặt trong Infrastructure thì use case vẫn import ngược ra ngoài.

Các cách DI: constructor injection (dùng trong w-identity, dependency bắt buộc và rõ ràng), setter/property injection (dễ tạo object ở trạng thái thiếu dependency), và service locator (ẩn dependency, khó test, thường là anti-pattern).

**Ví dụ w-identity:** Use case nhận port qua constructor thuần; factory trong `AppModule` truyền adapter vào. Interface TypeScript bị xóa khi chạy; Nest dùng symbol `USER_PROFILE_REPOSITORY` làm runtime token và `useExisting: UserRepository` để tái sử dụng instance đã được `DatabaseModule` khởi tạo. Constructor use case không cần decorator hoặc token NestJS.

**Bẫy phỏng vấn:** Inject Mongoose Model trực tiếp vào use case vẫn gắn use case với database dù đã dùng DI.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

### High level, low level và "both depend on abstraction" trong code

Quy tắc trung tâm của Clean Architecture là **Dependency Rule**; DIP là kỹ thuật giữ được quy tắc đó khi use case phải gọi ra ngoài. Mức cao hay thấp đo bằng khoảng cách tới I/O, không phải bằng tên thư mục:

- **High level (chính sách, "cần làm gì"):** `Role`, `role.policy.ts`, `DeleteRoleHandler`.
- **Low level (chi tiết, "làm bằng cách nào"):** `RoleRepository`, Mongoose, MongoDB.

```text
Không có DIP:  DeleteRoleHandler ──> RoleRepository ──> MongoDB
Có DIP:        DeleteRoleHandler ──> RoleRepositoryPort <── RoleRepository ──> MongoDB
```

1. **Abstraction:** [role-repository.port.ts](../src/application/ports/role-repository.port.ts) khai báo `RoleRepositoryPort` và chỉ import model từ Domain.
2. **High level phụ thuộc abstraction:** [role-command.handlers.ts](../src/application/commands/role-command.handlers.ts) có `private readonly roles: RoleRepositoryPort` trong constructor.
3. **Low level phụ thuộc abstraction:** [role.repository.ts](../src/infrastructure/persistence/mongoose/role/role.repository.ts) có `extends MongoDBRepository<RoleRecord> implements RoleRepositoryPort`.
4. **Nối lúc chạy:** interface TypeScript bị xóa khi biên dịch nên cần token. `AppModule` đăng ký `{ provide: ROLE_REPOSITORY, useExisting: RoleRepository }`; [rbac.handlers.ts](../src/presentation/cqrs/rbac.handlers.ts) dùng `@Inject(ROLE_REPOSITORY)` rồi truyền vào handler thuần qua `super(...)`.

Chữ "inversion" nằm ở chỗ interface thuộc về **Application**: lúc chạy Application gọi ra Infrastructure, nhưng trong source code Infrastructure import vào Application. Controller không cần port để gọi use case, vì chiều gọi và chiều phụ thuộc đã cùng hướng vào trong; DIP chỉ cần ở chỗ use case gọi ra ngoài.

## 6. DTO, mapper và ranh giới dữ liệu

DTO giao tiếp, mô hình nội bộ và document lưu trữ có mục đích khác nhau. Mapper chỉ cần khi có ranh giới thật hoặc hình dạng khác nhau.

Trong w-identity có bốn dạng dữ liệu, mỗi dạng sống ở một lớp:

| Dạng | Lớp | Ví dụ |
|---|---|---|
| DTO / contract giao tiếp | Presentation | các class trong `presentation/tcp/dto/`, `GatewayRequest` trong `gateway.contracts.ts` |
| Input của use case | Application | `UpdateMyProfileCommand`, `Actor` |
| Mô hình nội bộ | Domain | `User`, `UserAccount`, `ProfilePatch` |
| Document lưu trữ | Infrastructure | `UserPersistenceEntity` (decorator Mongoose, collection `users`) |

Controller chuyển DTO instance thành object thuần trước khi dựng Command/Query; DTO class chỉ thuộc Presentation. `actor.mapper.ts` giữ `actorOf`.

Mapper nằm ở ranh giới giữa hai dạng: controller đổi `GatewayRequest.user` thành `Actor`; repository đổi record MongoDB thành `User`. Nếu hai hình dạng giống hệt và cùng thuộc một lớp thì không cần mapper.

**Ví dụ w-identity:** GatewayRequest.user được chuyển thành Actor; MongoDB _id không xuất hiện trong response API.

**Bẫy phỏng vấn:** Trả nguyên document hoặc token Keycloak; ngược lại tạo mapper giống hệt ở mọi hàm gây dư thừa.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

## 7. Validation và authorization nằm ở đâu

Presentation kiểm tra kiểu/định dạng dữ liệu; application kiểm tra quyền và điều phối; domain bảo vệ bất biến. Kiểm tra ở biên không thay thế kiểm tra nghiệp vụ.

Ba loại kiểm tra khác nhau, đặt ở ba nơi:

| Loại | Câu hỏi | Nơi đặt | Ví dụ |
|---|---|---|---|
| Xác thực (authentication) | Bạn là ai, token có hợp lệ không? | Gateway/Presentation | Gateway xác minh JWT, dựng `GatewayRequest.user` |
| Phân quyền (authorization) | Bạn có được làm việc này không? | Application | `AuthorizationPolicy.authenticated(actor)` kiểm tra actor có `userId` và đúng `issuer` |
| Bất biến nghiệp vụ | Dữ liệu/trạng thái có hợp lệ không? | Domain | `assertActiveAccount`, `validateProfilePatch` |

Presentation dùng `plainToInstance` và `validateSync` trong `parseInput` để kiểm tra class DTO, từ chối field lạ và ném `ApplicationError(VALIDATION_ERROR)` với message không chứa giá trị nhập. Các decorator `IsSafeAvatarUrl`, `IsTimezone`, `IsLocaleTag` dùng chung hàm thuần trong `profile.policy.ts`; use case vẫn gọi `validateProfilePatch` để giữ bất biến khi được gọi trực tiếp. Application/Domain không import class-validator.

**Ví dụ w-identity:** Gateway xác minh JWT; GetMe lấy ID từ actor, không nhận ID người khác trong body, nên không thể đọc hay sửa hồ sơ của người khác bằng cách đổi body. `AuthorizationPolicy.management()` hiện từ chối mọi actor; nó nằm ở Application nên dù gọi từ TCP, RabbitMQ hay trực tiếp, lệnh quản lý đều bị chặn như nhau.

**Bẫy phỏng vấn:** Chỉ dùng guard ở controller rồi nghĩ use case an toàn khi được gọi từ transport khác.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

## 8. Lỗi, timeout và kết quả chưa xác định

Lỗi application có mã ổn định, không chứa HTTP/RPC exception. Adapter chuyển lỗi kỹ thuật; presentation ánh xạ ra giao thức. Timeout không chứng minh thao tác chưa xảy ra.

Ba tầng xử lý lỗi, mỗi tầng một việc:

- **Domain:** `DomainError` diễn đạt vi phạm quy tắc (profile sai locale, tài khoản bị khóa).
- **Application:** `ApplicationError` có `code` ổn định (`UNAUTHENTICATED`, `FORBIDDEN`, `ACCOUNT_DISABLED_SESSION_FAILED`), không chứa mã HTTP hay RPC.
- **Presentation:** filter (`identity-error.filter.ts`) ánh xạ lỗi ra giao thức: domain error thành 400/403, `DatabaseError` thành 503 `DEPENDENCY_UNAVAILABLE`.

Với thao tác có tác dụng phụ, timeout nghĩa là *chưa biết kết quả*. Muốn retry an toàn cần idempotency key hoặc bước đối soát (đọc lại trạng thái) trước khi lặp.

**Ví dụ w-identity:** `UpdateMyProfile` gọi Keycloak rồi MongoDB: nếu Keycloak lỗi thì chưa ghi gì; nếu MongoDB down thì repository trả `DatabaseError` và filter ra 503. Update profile là upsert theo `userId` nên lặp lại cùng patch cho cùng kết quả cuối.

**Kịch bản thiết kế (hiện bị tắt):** tạo user ở Keycloak thành công nhưng bước sau (gán role mặc định) lỗi thì trả lỗi kèm ID tài khoản đã tạo, không tự xóa. Code hiện tại không còn bước gán role, nhưng nguyên tắc "báo rõ phần đã xảy ra, không tự rollback thứ không rollback được" vẫn là bài học.

**Bẫy phỏng vấn:** Catch mọi lỗi rồi trả 500; retry POST mù quáng có thể tạo tác dụng phụ trùng.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

## 9. Transaction và tính nhất quán giữa hai hệ thống

Clean Architecture không cung cấp distributed transaction. Cần quyết định nguồn dữ liệu chuẩn, ranh giới ghi và chiến lược lỗi từng phần.

Các lựa chọn thường gặp khi hai hệ thống phải nhất quán: một nguồn dữ liệu chuẩn (source of truth) cho mỗi thông tin; ghi theo thứ tự có thể phục hồi; saga với bước bù trừ (compensation); outbox (ghi sự kiện cùng transaction với dữ liệu rồi phát sau) khi cần phát event tin cậy; hoặc chấp nhận eventual consistency kèm đối soát. Mỗi lựa chọn thêm hạ tầng và độ phức tạp, nên chỉ dùng khi yêu cầu đòi hỏi.

**Ví dụ w-identity:** Keycloak giữ tài khoản; MongoDB giữ hồ sơ, được tạo khi cần (lazy creation: lần cập nhật đầu tiên mới upsert, đọc thì không tạo). Nhờ vậy không có bước "đồng bộ hai bên lúc tạo tài khoản" để lỗi. Không cố dùng MongoDB transaction để rollback lời gọi Keycloak.

**Bẫy phỏng vấn:** Tưởng thêm repository là có atomicity giữa Keycloak và MongoDB. Outbox/saga chỉ thêm khi yêu cầu và hạ tầng phù hợp.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

## 10. Chiến lược kiểm thử

Kiểm thử nghiệp vụ bằng fake ports; adapter bằng integration test; TCP mapping bằng controller test; các luồng chính bằng E2E. Thêm kiểm tra import để giữ ranh giới.

| Mức | Kiểm tra gì | Dùng gì | Số lượng |
|---|---|---|---|
| Unit (Domain, Application) | Quy tắc, thứ tự điều phối, lỗi | Fake ports, không NestJS/DB | Nhiều, rất nhanh |
| Integration (adapter) | Adapter đúng hợp đồng với hệ thống thật: index, upsert, ánh xạ lỗi | MongoDB/Keycloak thật hoặc container | Vừa |
| Contract/controller | Message pattern, DTO, ánh xạ lỗi sang RPC | Controller test | Vừa |
| E2E | Luồng chính từ gateway tới lưu trữ | Toàn hệ thống | Ít, chậm |

Fake khác mock: fake là implementation đơn giản chạy được (ví dụ repository lưu trong bộ nhớ) và test kiểm tra kết quả; mock xác nhận *cách* gọi nên dễ gãy khi refactor.

**Ví dụ w-identity:** `GetMeHandler` dùng fake object cho cả hai port, không khởi tạo repository thật hoặc Nest container. Test kiểm tra tài khoản bị khóa không chạm storage, lấy hồ sơ đúng ID và trả dữ liệu của port. Architecture test đọc AST TypeScript để chặn import/export sai lớp, gồm `import type`, re-export, dynamic import và `require`; kiểm tra cả unit test của core. Integration test riêng kiểm tra unique index và upsert đồng thời.

**Bẫy phỏng vấn:** Mock quá sâu từng lời gọi private; chỉ có fake test nên không phát hiện adapter sai hợp đồng.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

## 11. Clean, Hexagonal, Onion và layered architecture

Các cách tiếp cận đều nhấn mạnh tách nghiệp vụ và chi tiết nhưng mô tả ranh giới khác nhau. Layered truyền thống có thể để service phụ thuộc implementation database; Clean dùng đảo phụ thuộc ở ranh giới đó.

| Kiến trúc | Ý tưởng chính | Cách nhìn ranh giới | Khác biệt đáng nhớ |
|---|---|---|---|
| Layered (N-tier) | Presentation → Business → Data, mỗi tầng chỉ gọi tầng dưới | Theo chiều dọc, phụ thuộc đi xuống | Business thường phụ thuộc trực tiếp tầng Data nên khó tách database |
| Hexagonal (Ports & Adapters, Alistair Cockburn) | Ứng dụng ở trung tâm, giao tiếp ra ngoài qua port; adapter cắm vào port | Trong/ngoài, phân biệt port "driving" (vào) và "driven" (ra) | Tập trung vào ranh giới với bên ngoài; không quy định cấu trúc bên trong lõi |
| Onion (Jeffrey Palermo) | Các vòng đồng tâm, Domain Model ở tâm, phụ thuộc hướng vào tâm | Vòng đồng tâm | Gần Clean; nhấn mạnh Domain Model và Domain Services ở tâm |
| Clean (Robert C. Martin) | Tổng hợp các ý trên, thêm Dependency Rule và tên vòng Entities/Use Cases/Adapters/Frameworks | Vòng đồng tâm + cách vượt ranh giới (input/output boundary) | Quy định rõ use case là đơn vị chính của tầng ứng dụng |

Ba kiến trúc sau cùng một ý cốt lõi: lõi nghiệp vụ không phụ thuộc chi tiết. Khác biệt chủ yếu ở tên gọi và mức quy định, nên khi phỏng vấn hãy nói điểm chung (đảo phụ thuộc) trước rồi mới nêu khác biệt.

**Ví dụ w-identity:** Cùng dịch vụ có thể giải thích theo ports/adapters hoặc các vòng domain/application. REST hay TCP không quyết định kiến trúc.

**Bẫy phỏng vấn:** Đồng nhất Clean Architecture với microservices, DDD hoặc bắt buộc CQRS. Monolith cũng áp dụng được.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

## 12. Đánh đổi và khi nào áp dụng

Ranh giới thêm interface, mapping và chi phí điều hướng. Hữu ích khi nghiệp vụ phức tạp, nhiều tích hợp hoặc sống lâu; CRUD nhỏ có thể dùng cấu trúc nhẹ hơn.

Chi phí cụ thể: nhiều file hơn cho cùng một tính năng, mapping giữa các mô hình, phải đọc qua port để tới implementation, và dễ over-engineering khi nghiệp vụ gần như CRUD. Lợi ích: test nghiệp vụ nhanh bằng fake, thay adapter có phạm vi ảnh hưởng nhỏ, và nhiều người làm song song ít xung đột.

**Ví dụ w-identity:** w-identity có Keycloak và MongoDB nên tách adapter có giá trị; giữ mọi lớp trong app thay vì tạo nhiều Nx libraries ngay. Đánh đổi của lựa chọn này: ranh giới chỉ được giữ bằng kỷ luật và `architecture.spec.ts`, không phải bằng công cụ của workspace. Nếu tách thành lib riêng, Nx có thể ép ranh giới bằng tag và rule `@nx/enforce-module-boundaries`; workspace hiện dùng oxlint nên rule này chưa được cấu hình (xem bài 15).

**Bẫy phỏng vấn:** Hứa đổi database không tốn công: vẫn phải xử lý query, schema, migration và đặc tính consistency.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

### Đổi database thì w-identity tốn gì?

Clean Architecture không hứa đổi database miễn phí; nó hứa **thay đổi bị giới hạn ở vòng ngoài**. Với w-identity, Domain và Application gần như không phải sửa, vì không có import Mongoose hay query MongoDB, `userId` là string của Keycloak chứ không phải `ObjectId`, và `architecture.spec.ts` chặn các lớp này import thư viện ngoài. Đây là kết luận từ đọc code, chưa được kiểm chứng bằng một lần đổi database thật.

Giả sử đổi sang PostgreSQL, phần phải làm là:

- **Repository và entity:** viết lại 4 repository, 4 persistence entity và `persistence-guard.ts`.
- **Query:** `$addToSet` thành `INSERT ... ON CONFLICT DO NOTHING`; upsert thành `ON CONFLICT ... DO UPDATE`; lỗi trùng khóa `11000` thành `23505`.
- **Nơi lắp ráp:** `app.module.ts` (gồm health indicator) và `seed-admin.ts`.
- **Thư viện dùng chung:** `lib-infrastructure/database` hiện chỉ có `MongoDBRepository`.
- **Ngoài code:** migrate dữ liệu, thêm công cụ schema migration (hiện dùng `autoIndex`), viết lại test của adapter.

Những chỗ không tự động an toàn:

1. **Ngữ nghĩa ẩn trong port:** port ghi `addPermission` là "Atomic and idempotent". Adapter mới phải giữ lời hứa này, compiler không kiểm tra được.
2. **Lỗi hạ tầng có thể bị nuốt:** `identity-error.filter.ts` bắt `DatabaseError` của thư viện để trả 503. Adapter mới ném loại lỗi khác thì client nhận 500.
3. **Chưa có khái niệm transaction:** mỗi write hiện chỉ đụng một document. Khi một use case cần ghi nhiều nơi cùng lúc, phải thêm port kiểu Unit of Work.
4. **Race kiểm tra rồi xóa:** `DeleteRoleHandler` đếm rồi mới xóa (xem bài 16). Với SQL, foreign key chặn được việc này và adapter đổi lỗi đó thành `ROLE_IN_USE`.

**Góc nhìn DDD:** `Role` kèm `permissionKeys` được đọc và ghi như một khối. MongoDB lưu mảng trong document, SQL có thể tách `roles` và `role_permissions`, nhưng repository vẫn trả về một `Role` hoàn chỉnh. Ranh giới nghiệp vụ không đồng nghĩa với cách lưu.

**Trả lời phỏng vấn:** “Đổi database ở w-identity chỉ cần viết adapter mới và sửa composition root, use case giữ nguyên. Chi phí thật nằm ở migrate dữ liệu, giữ đúng ngữ nghĩa atomic và ánh xạ lỗi. Clean Architecture giới hạn phạm vi thay đổi, chứ không xóa bỏ thay đổi.”

## 13. Bài thực hành và câu trả lời phỏng vấn

### Đọc code theo một luồng cụ thể

1. [IdentityController.profile](../src/presentation/tcp/identity.controller.ts) nhận message `identity.me.updateProfile`, chuyển body qua `parseInput(UpdateMyProfileDto, req.body)` và danh tính qua `actorOf`.
2. Controller dispatch `UpdateMyProfileCommand` qua CommandBus; Nest adapter nhận lệnh và thực thi [UpdateMyProfileHandler](../src/application/commands/identity-command.handlers.ts) kiểm tra actor, dùng `IdentityProviderPort.get(actor.userId)` để xác nhận tài khoản còn hoạt động, rồi gọi `profiles.update(actor.userId, input)`.
3. [UserRepositoryPort](../src/application/ports/user-repository.port.ts) định nghĩa thao tác cần thiết bằng `ProfilePatch` và `User`; không chứa `Model`, query MongoDB hoặc decorator.
4. [UserRepository](../src/infrastructure/persistence/mongoose/user/user.repository.ts) implements port, thực hiện upsert, xử lý duplicate-key race và ánh xạ record thành `User`.
5. [AppModule](../src/app.module.ts) chọn adapter và lắp chúng vào use case. Đây là nơi biết cả port lẫn implementation.
6. [Unit test](../src/application/cqrs.spec.ts) truyền fake object chỉ có hai phương thức của port; [architecture test](../test/architecture.spec.ts) ngăn core phụ thuộc ngược ra ngoài.

Chiều phụ thuộc trong mã nguồn:

```text
Presentation ──→ Application ──→ Domain
Infrastructure ──→ Application ports + Domain models
AppModule ──→ các lớp cần lắp ghép
```

Luồng gọi khi chạy:

```text
Controller → CommandBus → UpdateMyProfileHandler → IdentityProviderPort → KeycloakIdentityAdapter
                            → UserRepositoryPort → UserRepository → MongoDB
```

Hai sơ đồ mô tả hai khía cạnh khác nhau: use case gọi ra database lúc chạy thông qua hợp đồng do Application sở hữu, trong khi dependency mã nguồn vẫn hướng vào trong.

### Câu trả lời mẫu 60–90 giây

“Trong w-identity, em tách Domain và Application khỏi NestJS, Keycloak và Mongoose. Với cập nhật hồ sơ, controller chuyển request thành input và Actor. Use case kiểm tra quyền, xác nhận tài khoản hoạt động qua IdentityProviderPort, rồi ghi hồ sơ qua UserRepositoryPort. Hai interface thuộc Application; adapter bên ngoài hiện thực chúng. AppModule chọn implementation và truyền vào constructor.

Em kiểm chứng bằng unit test dùng fake ports và architecture test chặn cả import type từ core ra Infrastructure. Điểm cần phân biệt là luồng gọi khi chạy có thể đi ra database, nhưng chiều phụ thuộc mã nguồn hướng vào hợp đồng bên trong. Đánh đổi là thêm interface và mapping; lợi ích là test nghiệp vụ độc lập và giới hạn ảnh hưởng khi thay persistence. Nếu đổi database vẫn phải viết adapter, migration và kiểm thử consistency.”

### Câu hỏi phụ cần tự giải thích

- **Vì sao `import type UserRepository` vẫn chưa đúng ranh giới?** Type bị xóa khỏi JavaScript nhưng mã nguồn Application vẫn phụ thuộc class nằm trong Infrastructure. Chuyển hợp đồng về Application giải quyết quyền sở hữu abstraction.
- **Vì sao không đưa toàn bộ CRUD vào port?** Use case chỉ cần hai thao tác hồ sơ. Port nhỏ giúp fake đơn giản và không đưa query/database API vào nghiệp vụ.
- **Vì sao `useExisting`?** Nó tạo bí danh cho instance repository đã được module database quản lý; `useClass` đăng ký một provider riêng và có thể tạo instance khác.
- **Có cần interface cho AuthorizationPolicy không?** Policy là code thuộc Application, không phải chi tiết hạ tầng cần đảo phụ thuộc; giữ class thuần là đủ.
- **Test kiến trúc có chứng minh mọi thứ đúng không?** Test này kiểm tra dependency module của core. Nó không chứng minh tính đúng nghiệp vụ, hiệu năng hay hành vi database thật; cần unit, integration và E2E phù hợp.
- **Lỗi MongoDB đi qua biên ra sao?** Repository chuẩn hóa thành `DatabaseError` an toàn từ thư viện hạ tầng dùng chung; filter ở Presentation đổi thành RPC 503 với mã `DEPENDENCY_UNAVAILABLE`. Use case không import loại lỗi hạ tầng này. Keycloak adapter hiện chuyển lỗi của nó thành `ApplicationError`.

Bài tập: thiết kế UpdateMyProfile với input, Actor, hai ports, lỗi và test. Sau đó giả lập Keycloak timeout, MongoDB down và request của user khác.

**Ví dụ w-identity:** Mẫu nói: Em tách use case khỏi Keycloak/Mongoose bằng ports, lắp bằng Nest providers. Đánh đổi là thêm mapping; lợi ích là test nghiệp vụ độc lập. Chỉ mô tả phần bạn hiểu và đã tự kiểm chứng; không xem kiểm thử local là kinh nghiệm vận hành production.

**Bẫy phỏng vấn:** Kể thiết kế dự kiến như thành tích đã làm; chỉ kể tên thư mục mà không mô tả dependency và trade-off.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

## 14. So sánh Clean Architecture, DDD và CQRS

Kiến thức riêng về DDD nằm ở sổ tay **Domain-Driven Design** (`#ddd`). Phần so sánh chi tiết DDD với Clean Architecture (12 tiêu chí, ánh xạ building block vào các vòng, ba điểm hay nhầm, bốn tổ hợp) nằm ở **bài 13 của sổ tay DDD** (`#ddd/topic-13`); phân biệt DDD với CQRS, Event Sourcing và Microservices ở bài 14 của sổ tay đó. Bài này chỉ giữ bản tóm tắt.

| Khái niệm | Câu hỏi nó giúp giải quyết | Đầu ra điển hình |
|---|---|---|
| Clean Architecture | Code và dependency được tổ chức thế nào để bảo vệ phần nghiệp vụ khỏi chi tiết bên ngoài? | Các lớp, port/adapter, hướng phụ thuộc |
| CQRS | Trách nhiệm thay đổi trạng thái và đọc dữ liệu được tách thế nào? | Command/query riêng, handler riêng |

Chúng có thể kết hợp, nhưng lựa chọn một cách tiếp cận không tự động đồng nghĩa đã thực hiện hai cách còn lại.

### Chúng gặp nhau ở đâu

| Khái niệm DDD | Nằm ở đâu trong Clean Architecture |
|---|---|
| Entity, Value Object, Aggregate, Domain Service, Domain Event | Vòng Entities / Domain |
| Application Service | Vòng Use Cases / Application (handler điều phối) |
| Repository (giao diện) | Port do Application/Domain sở hữu |
| Repository (cài đặt), ORM, broker | Interface Adapters / Frameworks & Drivers |

Nói gọn: DDD cho biết **mô hình bên trong** nên là gì; Clean Architecture cho biết **mô hình đó được đặt ở đâu** và cái gì được phép phụ thuộc vào nó. CQRS quyết định đường đọc và đường ghi có dùng chung mô hình hay không; nó cũng không bắt buộc đi kèm hai cái còn lại.

### Nhầm lẫn thường gặp

- Có `domain/`, repository và CQRS nghĩa là đã làm DDD tốt. **Sai:** đó là cấu trúc code, chưa nói gì về ngôn ngữ, ranh giới và quy tắc nghiệp vụ.
- Clean Architecture bắt buộc DDD. **Sai:** có thể dùng Clean với mô hình domain đơn giản (hàm policy, kiểu dữ liệu).
- DDD bắt buộc microservices hay CQRS. **Sai:** bounded context có thể nằm trong một monolith; CQRS là quyết định riêng.
- Aggregate là một bảng database. **Sai:** nó là ranh giới nhất quán, cách lưu chọn sau.

### Ở w-identity

w-identity áp dụng **Clean Architecture** đầy đủ hơn nhiều so với DDD: có các lớp, port/adapter, composition root và một CQRS đồng bộ. Về DDD chỉ có tư tưởng nhẹ (tách Domain, đặt tên theo nghiệp vụ, `UserAccount` khác `User`, `UserRole` tham chiếu Role bằng tên); không có aggregate class, value object, domain event hay context map, vì authentication là generic và RBAC là supporting. Không nên gán nhãn DDD cho code này. Phân tích chi tiết User/Role/UserRole theo góc nhìn aggregate ở bài 16 của sổ tay DDD.

### Câu trả lời mẫu 60 giây

“DDD trả lời *mô hình nghiệp vụ là gì và ranh giới ở đâu*; Clean Architecture trả lời *dependency được sắp xếp thế nào để bảo vệ mô hình đó*; CQRS trả lời *đọc và ghi có tách nhau không*. Ba thứ độc lập nhưng kết hợp tốt: entity và aggregate của DDD nằm ở vòng trong của Clean, repository là port do lớp trong sở hữu. Ở w-identity em dùng Clean đầy đủ và CQRS đồng bộ, còn DDD chỉ ở mức nhẹ vì đây là subdomain identity.”

**Tự kiểm tra:** Một service có folder domain, repository và command/query thì thiếu gì để gọi là DDD? Bounded context nằm ở lớp nào của Clean Architecture? Vì sao một aggregate không đồng nghĩa với một collection?

## 15. SOLID, Boundary và cấu trúc dự án

Clean Architecture dựa trên SOLID ở mức module và component; phần này nối các nguyên tắc đó với cách vượt ranh giới và cấu trúc thư mục.

### SOLID trong Clean Architecture

| Nguyên tắc | Ý chính | Gặp ở w-identity |
|---|---|---|
| **S**RP | Một module chỉ có một lý do để thay đổi (một nhóm người yêu cầu thay đổi) | Mỗi handler một use case; `profile.policy.ts` chỉ chứa quy tắc profile |
| **O**CP | Mở để mở rộng, đóng với sửa đổi | Thêm adapter mới cho port có sẵn mà không sửa use case |
| **L**SP | Implementation thay được abstraction mà không đổi hành vi đúng | Fake và `UserRepository` đều tuân theo hợp đồng `UserRepositoryPort` (trả `null` khi không có, ném lỗi chuẩn hóa khi hạ tầng lỗi) |
| **I**SP | Client không bị ép phụ thuộc method nó không dùng | `UserRepositoryPort` chỉ có `findByUserId` và `update`, dù repository nền có nhiều CRUD |
| **D**IP | Phụ thuộc abstraction thuộc về phía cấp cao | Bài 5 |

### Input/Output Boundary và Presenter

Trong mô tả gốc của Uncle Bob, controller gọi **input boundary** (interface của use case), use case trả kết quả qua **output boundary** (interface), và **presenter** ở vòng ngoài định dạng kết quả cho view. Mục đích: use case không biết cách hiển thị và dependency vẫn hướng vào trong khi dữ liệu đi ra.

Trong w-identity, handler trả giá trị trực tiếp (`return this.profiles.update(...)`) và controller/filter ở Presentation định dạng response. Đây là biến thể đơn giản và phổ biến cho API request-response: vẫn đúng Dependency Rule vì handler không import Presentation. Output boundary đáng thêm khi use case cần đẩy kết quả theo nhiều bước hoặc nhiều định dạng đầu ra.

### Humble Object

Tách phần khó kiểm thử (UI, framework, I/O) thành lớp mỏng không có logic, đặt logic vào phần dễ test. Ở w-identity: NestJS adapter trong `presentation/cqrs/` chỉ kế thừa handler Application để có DI và đăng ký bus, còn logic nằm ở handler thuần đã có test bằng fake.

### Screaming Architecture và cấu trúc thư mục

Cấu trúc thư mục nên cho thấy hệ thống làm gì (use case, nghiệp vụ), không chỉ framework nào đang dùng. Hai cách tổ chức:

- **Package by layer:** `domain/`, `application/`, `presentation/`, `infrastructure/` (w-identity đang dùng). Dễ thấy ranh giới kỹ thuật, nhưng một tính năng rải ra nhiều thư mục.
- **Package by feature:** `profile/`, `account/`, mỗi thư mục có lớp riêng bên trong. Một tính năng gom lại một chỗ; phù hợp khi service có nhiều tính năng độc lập.

Có thể kết hợp: chia theo feature ở cấp ngoài, theo layer ở bên trong.

### Nguyên tắc component

Dùng khi chia code thành package/lib riêng (ví dụ Nx libraries): REP/CCP/CRP quyết định *gộp gì với gì* (cái cùng thay đổi, cùng phát hành, cùng dùng thì ở cùng package); ADP không để vòng phụ thuộc; SDP cho phép phụ thuộc về phía ổn định hơn; SAP nói component càng ổn định càng nên trừu tượng. Đây là kiến thức mở rộng, ít khi hỏi sâu ở phỏng vấn trừ vị trí kiến trúc.

### Ép ranh giới bằng công cụ

| Cách | Bắt được gì | Trạng thái ở workspace này |
|---|---|---|
| Test import bằng AST (`architecture.spec.ts`) | Core import ngược ra Infrastructure/framework | Đã có trong w-identity |
| `@nx/enforce-module-boundaries` + tag project | Import giữa các lib/app vi phạm quy tắc tag | Chưa cấu hình; workspace dùng oxlint, rule này thuộc ESLint plugin của Nx |
| Tách lib riêng (domain, application) | Không thể import chéo vì không khai báo phụ thuộc | Chưa tách; tài liệu chọn giữ trong một app |

**Bẫy phỏng vấn:** Thuộc tên SOLID nhưng không nêu ví dụ code; cho rằng Clean Architecture bắt buộc có presenter và output port ở mọi API; nghĩ rằng chia thư mục đúng là đã đúng ranh giới mà không có công cụ kiểm tra.

**Tự trả lời:** viết lại bằng lời của bạn, nêu một đánh đổi và một tình huống kiểm thử.

## 16. Role và Permission (RBAC) trong w-identity

Chi tiết kế hoạch và tiến độ: `PLAN-ROLE-PERMISSION.md`.

| Quyết định | Lý do | Đánh đổi |
|---|---|---|
| Role và Permission lưu trong MongoDB, không dùng Keycloak realm roles | Domain thuần, test không cần Keycloak, permission `resource:action` mịn hơn role Keycloak | Phải tự đồng bộ nếu sau này muốn đưa role vào JWT |
| Mỗi user đúng 1 role (`user_roles.keycloakUserId` unique) | Mô hình đơn giản; gán role là một upsert idempotent | Muốn nhiều role phải đổi schema và use case |
| Role `admin`, `user` là role hệ thống, bất biến | Không ai vô tình xóa hoặc tước quyền role nền tảng | Cần cờ `system` và repository lọc `system: { $ne: true }` để chặn cả race |
| User chưa có bản ghi → role mặc định `user` khi đọc | Không cần migrate user cũ | Role `user` phải được seed; thiếu thì trả `ROLE_NOT_FOUND` |
| Grant/revoke bằng `$addToSet`/`$pull` | Nguyên tử, idempotent, an toàn khi chạy song song | Trả về role sau cập nhật, không có lịch sử thay đổi |
| Chặn xóa Permission/Role đang được dùng | Giữ toàn vẹn tham chiếu mà MongoDB không có FK | Kiểm tra rồi xóa vẫn có cửa sổ race nhỏ; chấp nhận ở v1 vì chỉ admin thao tác |

Gateway tra permission theo `sub` đã xác minh qua `identity.authz.permissions`, cache 30 giây mặc định và từ chối khi tra cứu lỗi. UI gọi `GET /me/permissions` để lấy role cùng quyền phục vụ hiển thị. Tài khoản khóa trả danh sách quyền rỗng cho tra cứu nội bộ; thay đổi có thể trễ tối đa TTL cache.

**Bẫy phỏng vấn:** nhầm RBAC với ABAC; để quy tắc "role system bất biến" trong controller thay vì domain; quên rằng MongoDB không có khóa ngoại nên phải tự bảo vệ tham chiếu.

**Tự trả lời:** vì sao kiểm tra `system` ở cả policy lẫn câu lệnh MongoDB (defense in depth)? Bạn đổi gì nếu cần nhiều role mỗi user?

## Từ điển nhanh

| Thuật ngữ | Giải thích |
|---|---|
| Dependency Rule | Phụ thuộc mã nguồn hướng vào nghiệp vụ bên trong |
| Use case | Một mục đích nghiệp vụ mà hệ thống thực hiện |
| Port | Hợp đồng tương tác do lớp sử dụng sở hữu |
| Adapter | Hiện thực port bằng công nghệ cụ thể |
| DIP | Đảo phụ thuộc từ implementation sang abstraction |
| DI | Cung cấp dependency từ bên ngoài |
| Composition root | Nơi chọn và lắp các implementation |
| Actor | Ngữ cảnh danh tính người thực hiện đã được xác minh |
| DTO | Dữ liệu dùng ở biên giao tiếp |
| Mapper | Chuyển đổi giữa các mô hình dữ liệu |
| Fake | Implementation đơn giản dùng kiểm thử hành vi |
| Partial failure | Một phần chuỗi thao tác thành công, phần khác thất bại |
| Humble Object | Lớp mỏng, không logic, bao phần khó test để logic nằm ở phần dễ test |
| Input/Output Boundary | Interface mà use case nhận lệnh vào và trả kết quả ra, giữ dependency hướng vào trong |
| High level / Low level | Mức cao là chính sách nghiệp vụ, mức thấp là chi tiết gần I/O; đo bằng khoảng cách tới I/O |
| I/O | Mọi giao tiếp ra ngoài chương trình đang chạy: database, HTTP, TCP, message broker, file |
| Business logic | Luật và quyết định của nghiệp vụ, không phải hình dạng dữ liệu |
| Anemic Domain Model | Domain chỉ có dữ liệu, luật nghiệp vụ bị đẩy ra lớp khác |
| Command | Thông điệp chứa dữ liệu nói muốn làm gì; không phải interface của handler |

## Nguồn và cách dùng

Nguyên tắc nền tảng: [Robert C. Martin — The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html). Cách chia folder, Actor, DI tokens và ports ở đây là lựa chọn thiết kế cho w-identity, không phải quy định duy nhất của Clean Architecture.
