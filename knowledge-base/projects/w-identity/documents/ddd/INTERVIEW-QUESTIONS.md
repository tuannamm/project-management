# Câu hỏi phỏng vấn DDD

Che đáp án, nói thành tiếng 60–90 giây theo thứ tự: định nghĩa chính xác → đánh đổi → ví dụ (nhà hàng hoặc w-identity). Chỉ đánh dấu đã thuộc khi trả lời được cả câu hỏi phụ trong phần "Tự kiểm tra" của bài tương ứng.

## Phần A. Strategic Design

### Nền tảng

- [ ] 🟢 DDD là gì? Nêu ba ý cốt lõi. · 📚 #0
  *Ý chính:* Cách tiếp cận phát triển phần mềm cho nghiệp vụ phức tạp (Evans, 2003): tập trung vào core domain; khám phá model qua hợp tác giữa developer và domain expert; dùng Ubiquitous Language bên trong Bounded Context. **Bẫy:** định nghĩa bằng cấu trúc thư mục.
- [ ] 🟢 Strategic Design và Tactical Design khác nhau thế nào? Cái nào đi trước? · 📚 #0
  *Ý chính:* Strategic tìm ngôn ngữ, bounded context, subdomain, context map. Tactical thể hiện model trong một context bằng entity, value object, aggregate, event, repository. Strategic đi trước vì ranh giới sai thì tactical đẹp cũng mô hình sai bài toán.
- [ ] 🟡 Kể ba điều mà người ta hay nghĩ DDD bắt buộc nhưng thực ra không. · 📚 #0
  *Ý chính:* Không bắt buộc microservices, CQRS, Event Sourcing, cấu trúc thư mục cố định hay framework nào. Cũng không nên dùng cho mọi dự án; CRUD đơn giản hợp với Transaction Script.
- [ ] 🟢 Domain model là gì? Vì sao model không phải bản sao của thực tế? · 📚 #1
  *Ý chính:* Hệ thống trừu tượng có chọn lọc, giữ lại những khía cạnh cần cho bài toán. Model tốt là model hữu ích, không phải đầy đủ nhất. Trong DDD code phải phản ánh model (Model-Driven Design).
- [ ] 🟢 Ubiquitous Language là gì? Cho ví dụ ngôn ngữ bị gãy trong code. · 📚 #1
  *Ý chính:* Ngôn ngữ chung giữa chuyên gia và developer, dùng thống nhất trong một bounded context, kể cả tên class/method/event. Ví dụ gãy: chuyên gia nói "xác nhận đơn", code viết `status = 2`; nên là `order.confirm()`.
- [ ] 🟡 Vì sao Ubiquitous Language gắn với một bounded context chứ không phải cả công ty? · 📚 #1
  *Ý chính:* Cùng một từ mang nghĩa khác nhau ở các bộ phận ("khách hàng", "món"). Ép một nghĩa cho cả công ty tạo ra model khổng lồ và mâu thuẫn.

### Bounded Context và Subdomain

- [ ] 🟢 Định nghĩa bounded context trong một câu. Cho ví dụ. · 📚 #2
  *Ý chính:* Ranh giới mà bên trong đó một model và ngôn ngữ có nghĩa nhất quán. "Khách hàng" ở Đặt bàn (người giữ chỗ), Thanh toán (người trả tiền) và Thân thiết (thành viên có điểm) là ba model khác nhau.
- [ ] 🟡 Bounded context có phải là microservice không? · 📚 #2, #14
  *Ý chính:* Không. Context là ranh giới ngôn ngữ và model; microservice là ranh giới triển khai. Một context có thể là module trong monolith, hoặc gồm vài service. Một microservice thường bao một context, nhưng điều ngược lại không bắt buộc.
- [ ] 🟡 Dấu hiệu nào cho thấy cần tách một context làm hai? · 📚 #2
  *Ý chính:* Một từ có hai định nghĩa; model nhiều trường chỉ một nhóm dùng; đổi quy tắc của nhóm A làm vỡ nhóm B; hai nhóm có nhịp thay đổi khác nhau. Liên hệ định luật Conway.
- [ ] 🟢 Ba loại subdomain khác nhau thế nào? Mỗi loại nên đầu tư ra sao? · 📚 #3
  *Ý chính:* Core: tạo lợi thế cạnh tranh, tự xây, DDD đầy đủ. Supporting: cần thiết, đặc thù, làm đơn giản. Generic: lời giải chung, mua hoặc dùng sẵn. Phân loại theo giá trị chiến lược, không theo kỹ thuật.
- [ ] 🟡 Subdomain khác bounded context ở đâu? · 📚 #3
  *Ý chính:* Subdomain thuộc problem space (nghiệp vụ có phần nào), bounded context thuộc solution space (model được ranh giới ở đâu). Lý tưởng là một-một; legacy thường lệch.
- [ ] 🟡 Cho ví dụ một nghiệp vụ là core ở công ty này nhưng generic ở công ty khác. · 📚 #3
  *Ý chính:* Thanh toán: generic với nhà hàng (dùng cổng có sẵn), core với công ty ví điện tử. Đăng nhập: generic với hầu hết, core với nhà cung cấp identity.
- [ ] 🔴 Distillation là gì? Kể ba kỹ thuật. · 📚 #3
  *Ý chính:* Tách và làm nổi bật core domain. Domain Vision Statement, Highlighted Core, Generic Subdomain, Cohesive Mechanism, Segregated Core.

### Context Map

- [ ] 🟢 Context map là gì? Upstream và downstream nghĩa là gì? · 📚 #4
  *Ý chính:* Mô tả hiện trạng các context và quan hệ giữa chúng. Upstream là bên có ảnh hưởng, downstream bị ảnh hưởng bởi thay đổi. Đây là chiều ảnh hưởng, không phải chiều gọi API.
- [ ] 🟡 Kể tên 9 pattern của context map. · 📚 #4
  *Ý chính:* Partnership, Shared Kernel, Customer–Supplier, Conformist, Anticorruption Layer, Open Host Service, Published Language, Separate Ways, Big Ball of Mud.
- [ ] 🟡 Customer–Supplier khác Conformist ở đâu? · 📚 #4
  *Ý chính:* Ở quyền lực: customer có tiếng nói trong kế hoạch của upstream; conformist không có, đành chấp nhận nguyên model của upstream.
- [ ] 🟡 Khi nào dùng Anticorruption Layer? ACL thuộc về bên nào? · 📚 #4
  *Ý chính:* Khi model của upstream xấu, cũ hoặc khác hẳn và mình không muốn nó lan vào. ACL thuộc downstream, gồm facade/adapter và translator. Trong Clean Architecture nó là adapter ở vòng ngoài.
- [ ] 🔴 Shared Kernel có rủi ro gì? Khi nào nên dùng? · 📚 #4
  *Ý chính:* Phần chung phình dần thành God model, và mọi thay đổi cần hai team đồng ý. Chỉ dùng khi phần chung thật nhỏ, ổn định và hai team giao tiếp tốt.
- [ ] 🔴 Gặp một hệ thống legacy rối, bạn vẽ nó trên context map và tích hợp thế nào? · 📚 #4
  *Ý chính:* Vẽ một ranh giới quanh nó, đánh dấu Big Ball of Mud. Context mới đặt ACL khi giao tiếp với nó để bùn không lan sang. Có thể dần tách từng phần ra (strangler).
- [ ] 🔴 Trong ví dụ nhà hàng, Ordering và Kitchen quan hệ thế nào? Billing tích hợp cổng thanh toán ra sao? · 📚 #4, #12
  *Ý chính:* Ordering là upstream, công bố `OrderConfirmed` (OHS + Published Language); Kitchen là downstream, dịch thành `KitchenTicket`. Billing là downstream của cổng thanh toán bên ngoài, đặt ACL.

## Phần B. Tactical Design

### Entity và Value Object

- [ ] 🟢 Entity khác Value Object ở đâu? · 📚 #5
  *Ý chính:* Entity xác định bởi danh tính, có vòng đời, bằng nhau khi cùng ID. Value Object xác định bởi giá trị, không có danh tính, bằng nhau khi cùng giá trị, nên bất biến.
- [ ] 🟡 Nêu năm tính chất của Value Object. · 📚 #5
  *Ý chính:* So sánh bằng giá trị; bất biến; tự kiểm tra hợp lệ khi tạo; toàn vẹn khái niệm (gom thuộc tính đi cùng nhau); có hành vi.
- [ ] 🟡 Làm sao quyết định một khái niệm là Entity hay Value Object? · 📚 #5
  *Ý chính:* Hỏi: nếu hai đối tượng có cùng mọi thuộc tính, nghiệp vụ có coi là một không? Có thì Value Object. Cùng khái niệm có thể khác nhau tùy context (địa chỉ).
- [ ] 🟡 Primitive Obsession là gì và gây lỗi gì? · 📚 #5
  *Ý chính:* Dùng `string`/`number` cho khái niệm nghiệp vụ. Mất đơn vị (`price: number`), không biết đã hợp lệ (`email: string`), truyền nhầm ID. Giải bằng Value Object hoặc branded type.

### Aggregate

- [ ] 🟢 Aggregate là gì? Định nghĩa trong một câu có chữ "invariant". · 📚 #6
  *Ý chính:* Cụm entity và value object được xem là một đơn vị thay đổi dữ liệu, có một root làm cổng vào, tạo thành ranh giới nhất quán để bảo vệ invariant sau mỗi lần commit.
- [ ] 🟡 Aggregate có phải là nơi cung cấp interface để hai model tương tác không? Có phải là bảng không? · 📚 #6
  *Ý chính:* Không cho cả hai. Aggregate là ranh giới nhất quán. Phối hợp giữa các aggregate dùng tham chiếu ID, domain service hoặc domain event. Cách lưu trữ được chọn sau.
- [ ] 🟡 Nêu 4 quy tắc thiết kế aggregate của Vernon. · 📚 #6
  *Ý chính:* Mô hình invariant thật trong ranh giới nhất quán; thiết kế aggregate nhỏ; tham chiếu aggregate khác bằng ID; dùng eventual consistency ngoài ranh giới. Hệ quả: một transaction sửa một aggregate.
- [ ] 🟡 Vì sao aggregate lớn là vấn đề? · 📚 #6
  *Ý chính:* Tải dữ liệu thừa; xung đột ghi đồng thời tăng (hai người sửa hai phần không liên quan vẫn đụng version); khó mở rộng.
- [ ] 🔴 Đổi thuộc tính ở aggregate A kéo theo đổi aggregate B. Bạn xử lý thế nào? · 📚 #6, #16
  *Ý chính:* Theo thứ tự: (1) B có thật cần đổi không, hay chỉ cần tham chiếu ID thay vì copy; (2) có phải invariant tức thời không, nếu có thì xem lại ranh giới; (3) chấp nhận trễ thì dùng domain event; (4) nếu chỉ kiểm tra thì domain service, cẩn thận race check-then-act.
- [ ] 🔴 Optimistic concurrency hoạt động thế nào với aggregate? · 📚 #6
  *Ý chính:* Aggregate có `version`. Khi lưu, cập nhật với điều kiện version bằng lúc đọc và tăng version. Không khớp thì báo xung đột để retry hoặc báo người dùng. Aggregate nhỏ giảm xung đột.
- [ ] 🔴 Khi nào chấp nhận phá quy tắc "một transaction một aggregate"? · 📚 #6
  *Ý chính:* Theo Vernon: tiện cho UI (tạo hàng loạt cùng loại), thiếu hạ tầng bất đồng bộ, yêu cầu transaction toàn cục. Phải là quyết định có ý thức và được ghi lại.

### Service, Event, Repository

- [ ] 🟢 Domain Service khác Application Service ở đâu? · 📚 #7
  *Ý chính:* Domain service chứa quy tắc nghiệp vụ không thuộc entity nào, stateless, không I/O. Application service điều phối use case: quyền, nạp, gọi domain, lưu, transaction, phát event; không chứa quy tắc nghiệp vụ.
- [ ] 🟡 Vì sao domain service không nên gọi repository? · 📚 #7
  *Ý chính:* Để domain thuần, không I/O, dễ test. Application service nạp dữ liệu rồi truyền vào domain service.
- [ ] 🟡 Specification pattern là gì? Có những công dụng nào? · 📚 #7
  *Ý chính:* Object đóng gói điều kiện nghiệp vụ với `isSatisfiedBy`, kết hợp được bằng and/or/not. Dùng để kiểm tra, chọn (lọc) và mô tả cái cần tạo.
- [ ] 🟢 Domain event là gì? Đặt tên thế nào? · 📚 #8
  *Ý chính:* Bản ghi một điều có ý nghĩa nghiệp vụ đã xảy ra, bất biến, do aggregate tạo ra. Đặt tên ở thì quá khứ theo ngôn ngữ chung: `OrderConfirmed`.
- [ ] 🟡 Command khác event thế nào? · 📚 #8
  *Ý chính:* Command là yêu cầu, thì mệnh lệnh, có thể bị từ chối, một handler. Event là sự thật đã xảy ra, thì quá khứ, không từ chối được, không hoặc nhiều subscriber.
- [ ] 🔴 Phát domain event trước commit, sau commit hay qua outbox? Vì sao? · 📚 #8
  *Ý chính:* Trước commit: handler chạy với sự thật có thể không tồn tại. Sau commit trong bộ nhớ: process chết giữa hai bước thì mất event (dual write). Outbox: lưu event cùng transaction với aggregate, relay publish sau, đảm bảo at-least-once, bên nhận idempotent.
- [ ] 🟡 Domain event khác integration event thế nào? · 📚 #8
  *Ý chính:* Domain event trong một context, ngôn ngữ nội bộ, đổi tự do. Integration event giữa các context, là Published Language, cần version và tương thích ngược, chỉ chứa kiểu nguyên thủy, đi qua broker.
- [ ] 🟢 Vì sao chỉ có repository cho aggregate root? · 📚 #9
  *Ý chính:* Entity bên trong chỉ được sửa qua root. Repository cho entity con sẽ cho phép bỏ qua invariant của root.
- [ ] 🟡 Repository khác DAO thế nào? Collection-oriented khác persistence-oriented thế nào? · 📚 #9
  *Ý chính:* Repository thao tác trên aggregate bằng ngôn ngữ domain; DAO thao tác trên bảng. Collection-oriented: `add/remove`, thay đổi được theo dõi tự động (ORM). Persistence-oriented: gọi `save` rõ ràng (hợp với MongoDB).
- [ ] 🟡 Màn hình báo cáo cần dữ liệu từ nhiều aggregate thì lấy thế nào? · 📚 #9, #14
  *Ý chính:* Không nạp aggregate. Dùng query service hoặc read model riêng trả DTO. Đây là chỗ DDD gặp CQRS.
- [ ] 🟡 Factory dùng khi nào? · 📚 #9
  *Ý chính:* Khi tạo aggregate phức tạp cần đảm bảo hợp lệ từ đầu (static method trên root, method trên aggregate khác, hoặc class riêng). Và khi khôi phục từ database (không phát event, không kiểm tra quy tắc tạo mới).

## Phần C. Thực hành và đánh đổi

- [ ] 🟢 Event Storming là gì? Có mấy cấp độ? · 📚 #10
  *Ý chính:* Workshop của Brandolini, dán giấy note lên tường để khám phá domain cùng chuyên gia. Ba cấp: Big Picture, Process Modeling, Software Design.
- [ ] 🟡 Từ bức tường Event Storming, làm sao tìm bounded context và aggregate? · 📚 #10
  *Ý chính:* Event và command liên quan chặt gom thành aggregate. Nơi ngôn ngữ thay đổi hoặc một event được hai nhóm hiểu khác nhau thường là ranh giới context. Hotspot chỉ ra chỗ cần hỏi thêm.
- [ ] 🟡 Policy trong Event Storming là gì? · 📚 #10
  *Ý chính:* Quy tắc phản ứng "khi event X thì chạy command Y", ví dụ khi đơn xác nhận thì tạo phiếu bếp.
- [ ] 🟡 Domain Storytelling khác Event Storming thế nào? · 📚 #10
  *Ý chính:* Domain Storytelling cho chuyên gia kể một quy trình cụ thể, vẽ bằng actor, work object, activity đánh số; hợp nhóm nhỏ. Event Storming hợp bức tranh lớn và tìm ranh giới.
- [ ] 🟢 Transaction Script, Table Module, Domain Model khác nhau thế nào? · 📚 #11
  *Ý chính:* Fowler (PoEAA): Transaction Script là thủ tục cho mỗi use case; Table Module là class cho mỗi bảng; Domain Model là object có cả dữ liệu và hành vi. Transaction Script rẻ lúc đầu, đắt dần khi logic phức tạp.
- [ ] 🟡 Anemic Domain Model sai ở đâu? Model dùng hàm thuần có phải anemic không? · 📚 #11
  *Ý chính:* Sai vì model không tự bảo vệ invariant; ai cũng đặt được trạng thái sai. Model hàm thuần không anemic nếu quy tắc nằm trong domain và kiểu dữ liệu ngăn trạng thái sai.
- [ ] 🟡 Khi nào không nên dùng DDD tactical đầy đủ? · 📚 #11, #3
  *Ý chính:* CRUD, ít quy tắc, subdomain generic hoặc supporting, đội nhỏ. Vẫn nên làm rõ ngôn ngữ dù chỉ là CRUD.
- [ ] 🔴 Trong ví dụ nhà hàng, vì sao `OrderLine` copy giá còn `Order` chỉ giữ `tableId`? · 📚 #12
  *Ý chính:* Copy giá là snapshot có chủ đích nghiệp vụ: đổi giá thực đơn không đổi đơn đã đặt. `Table` thay đổi độc lập và không có invariant chung tức thời với `Order`, nên tham chiếu ID.
- [ ] 🔴 Quy tắc "một bàn chỉ có một đơn đang mở" thuộc aggregate nào? Chặn race condition ra sao? · 📚 #12
  *Ý chính:* Quy tắc liên quan nhiều `Order`. Có thể để `Table` làm chủ (`table.openOrder()`), hoặc kiểm tra ở application service kèm unique index trên `(tableId, draft)` để database chặn race.

## Phần D. So sánh với Clean Architecture và áp dụng

### DDD và Clean Architecture

- [ ] 🟢 DDD và Clean Architecture mỗi bên trả lời câu hỏi gì? · 📚 #13
  *Ý chính:* DDD: model nghiệp vụ là gì, ngôn ngữ nào, ranh giới ở đâu. Clean: dependency hướng thế nào để model không phụ thuộc chi tiết kỹ thuật. Bổ sung cho nhau, không thay thế nhau.
- [ ] 🟡 Đặt các building block của DDD vào các vòng của Clean Architecture. · 📚 #13
  *Ý chính:* Entity, VO, Aggregate, Domain Service, Domain Event ở Entities. Application Service ở Use Cases. Repository interface là port của vòng trong; implementation ở Frameworks & Drivers. ACL là adapter. OHS là controller/API.
- [ ] 🟡 "Entities" của Clean Architecture có giống Entity của DDD không? · 📚 #13
  *Ý chính:* Không. Entities của Clean là tên vòng trong cùng chứa enterprise business rules, gồm cả VO, aggregate, domain service. Entity của DDD là một building block có danh tính.
- [ ] 🔴 Layered Architecture của Evans khác Clean Architecture ở chiều phụ thuộc nào? · 📚 #13, #15
  *Ý chính:* Evans (2003) xếp chồng UI → Application → Domain → Infrastructure, nên Domain có thể phụ thuộc Infrastructure. Clean/Hexagonal/Onion đảo chiều bằng Dependency Inversion: Infrastructure phụ thuộc vào trong. DDD ngày nay hầu như dùng kiểu đảo chiều.
- [ ] 🔴 Application Service của DDD và Use Case của Clean khác nhau ở sắc thái nào? · 📚 #13
  *Ý chính:* DDD nói application service không chứa quy tắc nghiệp vụ. Clean nói use case chứa application-specific business rules. Thực tế gặp nhau: phần "application-specific" là điều phối; quy tắc bất biến cả hai đặt ở vòng trong.
- [ ] 🟡 Bounded context nằm ở vòng nào của Clean Architecture? · 📚 #13
  *Ý chính:* Không vòng nào. Clean mô tả bên trong một ứng dụng; bounded context là ranh giới chia hệ thống. Mỗi context có thể là một ứng dụng Clean riêng với các vòng riêng.
- [ ] 🔴 DDD cần Clean ở đâu, và Clean cần DDD ở đâu? · 📚 #13
  *Ý chính:* DDD cần Clean để rich model thuần, không dính database, dễ test. Clean cần DDD (hoặc một cách mô hình hóa) để biết quy tắc ở vòng trong trông thế nào và ranh giới ở đâu; thiếu thì vòng Entities dễ thành anemic model đúng chỗ.
- [ ] 🟡 Kể 4 tổ hợp có/không DDD và Clean, cho ví dụ mỗi ô. · 📚 #13
  *Ý chính:* Cả hai: core phức tạp. DDD không Clean: DDD trên Active Record/layered gốc. Clean không DDD: model đơn giản kiểu w-identity. Không cả hai: Transaction Script trong controller cho CRUD nhỏ.

### CQRS, Event Sourcing, Microservices, kiến trúc

- [ ] 🟡 DDD có bắt buộc CQRS hoặc Event Sourcing không? · 📚 #14
  *Ý chính:* Không. Ba khái niệm độc lập. CQRS hợp với aggregate vì đường đọc bỏ qua aggregate. Event Sourcing cần domain event tốt và gần như luôn đi kèm CQRS.
- [ ] 🔴 Vì sao aggregate không nên là ranh giới của microservice? · 📚 #14
  *Ý chính:* Quá nhỏ; một context có nhiều aggregate cùng ngôn ngữ. Tách theo aggregate (hoặc theo bảng) dễ thành distributed monolith. Ứng viên tự nhiên là bounded context, và modular monolith là bước đầu an toàn.
- [ ] 🟡 Hexagonal, Onion và Clean có chung nguyên tắc gì với DDD? · 📚 #15
  *Ý chính:* Domain ở giữa, phụ thuộc hướng vào trong, hạ tầng là chi tiết cắm vào. Đây là "Isolating the Domain" của Evans làm triệt để hơn bằng Dependency Inversion. Onion dùng thẳng thuật ngữ DDD.

### w-identity

- [ ] 🟡 w-identity có dùng DDD không? Trả lời trung thực. · 📚 #16
  *Ý chính:* Clean Architecture đầy đủ, DDD nhẹ. Authentication là generic (Keycloak), RBAC là supporting. Domain là kiểu dữ liệu và hàm policy, không có aggregate class. Có vài nguyên tắc DDD: tham chiếu bằng ID, fail closed, adapter Keycloak đóng vai ACL.
- [ ] 🔴 Ở w-identity, sửa permission của một role có cần sửa user không? Vì sao? · 📚 #16
  *Ý chính:* Không. `UserRole` chỉ giữ `roleName`, không copy permission. Quyền được tính lúc đọc bằng `resolveEffectiveAccess`. Đây là quy tắc tham chiếu bằng ID.
- [ ] 🔴 `DeleteRoleHandler` có race condition gì? Hậu quả và cách sửa? · 📚 #16
  *Ý chính:* Check-then-act: `countByRole` = 0 rồi mới `delete`; giữa hai bước một request khác gán role đó. Hậu quả giới hạn vì `resolveEffectiveAccess` fail closed. Cách sửa: chấp nhận, đếm tham chiếu atomic trên Role, hoặc soft delete kèm event dọn dẹp.
- [ ] 🔴 Repository của Role ở w-identity có đúng kiểu DDD không? Đánh đổi là gì? · 📚 #16, #9
  *Ý chính:* Không hẳn: `updateDescription`, `addPermission` sửa từng trường (kiểu DAO), invariant phải nhớ gọi `assertMutableRole`. Đổi lại thao tác atomic ở MongoDB, không cần version. Hợp lý cho supporting subdomain ít quy tắc.
