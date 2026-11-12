# Câu hỏi phỏng vấn Clean Architecture

Che đáp án, nói thành tiếng 60–90 giây: định nghĩa → đánh đổi → ví dụ. Chỉ đánh dấu đã thuộc khi giải thích được câu hỏi phụ.

## Phần A. Kiến thức nền

- [ ] 🟢 Clean Architecture có những vòng nào? Ánh xạ vào w-identity ra sao? · 📚 #0
  *Ý chính:* Entities/Domain chứa model và quy tắc; Use Cases/Application điều phối nghiệp vụ và định nghĩa port; Interface Adapters chuyển đổi giao tiếp và hiện thực port; Frameworks & Drivers là NestJS, MongoDB, Keycloak. Dependency mã nguồn hướng vào trong; AppModule lắp ghép các thành phần.
- [ ] 🟢 Giải thích: Clean Architecture trong 60 giây? · 📚 #0
  *Ý chính:* Tách quy tắc nghiệp vụ khỏi chi tiết giao tiếp và lưu trữ để kiểm thử và thay đổi độc lập. Điều quyết định là hướng phụ thuộc trong mã nguồn, không phải số thư mục. **Bẫy cần tránh:** Chia đủ bốn folder nhưng application vẫn import Mongoose thì ranh giới chưa đúng.
- [ ] 🟢 Giải thích: Dependency Rule và luồng thực thi? · 📚 #1
  *Ý chính:* Dependency trong mã nguồn hướng về phần nghiệp vụ bên trong. Luồng chạy có thể đi từ use case ra adapter qua interface do lớp trong sở hữu. **Bẫy cần tránh:** Nhầm chiều gọi hàm với chiều import; nghĩ use case không được gọi database thông qua port.
- [ ] 🟢 Giải thích: Domain: mô hình và quy tắc? · 📚 #2
  *Ý chính:* Domain diễn tả khái niệm và bất biến nghiệp vụ. Entity không bắt buộc là class; có thể dùng kiểu dữ liệu và hàm thuần khi phù hợp. **Bẫy cần tránh:** Đưa mọi validation vào entity hoặc tạo class rỗng chỉ để gọi là DDD.
- [ ] 🟢 Giải thích: Application và use case? · 📚 #3
  *Ý chính:* Use case mô tả một mục đích của người dùng, điều phối domain và ports, kiểm tra quyền và quyết định thứ tự thao tác. **Bẫy cần tránh:** Tạo UserService khổng lồ hoặc để controller điều phối nhiều adapter.
- [ ] 🟡 Giải thích: Ports, adapters và quyền sở hữu interface? · 📚 #4
  *Ý chính:* Port là hợp đồng lớp nghiệp vụ cần; adapter chuyển hợp đồng đó thành lời gọi công nghệ cụ thể. Interface nên nói bằng ngôn ngữ của bên sử dụng. **Bẫy cần tránh:** Định nghĩa port trả Keycloak SDK object khiến abstraction vẫn rò rỉ nhà cung cấp.
- [ ] 🟡 Giải thích: DIP, DI và composition root? · 📚 #5
  *Ý chính:* DIP là nguyên tắc phụ thuộc vào abstraction; DI là cách cung cấp dependency từ ngoài. Composition root chọn implementation và lắp object graph. DI không tự bảo đảm DIP. **Bẫy cần tránh:** Inject Mongoose Model trực tiếp vào use case vẫn gắn use case với database dù đã dùng DI.
- [ ] 🟡 Giải thích: DTO, mapper và ranh giới dữ liệu? · 📚 #6
  *Ý chính:* DTO giao tiếp, mô hình nội bộ và document lưu trữ có mục đích khác nhau. Mapper chỉ cần khi có ranh giới thật hoặc hình dạng khác nhau. **Bẫy cần tránh:** Trả nguyên document hoặc token Keycloak; ngược lại tạo mapper giống hệt ở mọi hàm gây dư thừa.
- [ ] 🟡 Giải thích: Validation và authorization nằm ở đâu? · 📚 #7
  *Ý chính:* Presentation kiểm tra kiểu/định dạng dữ liệu; application kiểm tra quyền và điều phối; domain bảo vệ bất biến. Kiểm tra ở biên không thay thế kiểm tra nghiệp vụ. **Bẫy cần tránh:** Chỉ dùng guard ở controller rồi nghĩ use case an toàn khi được gọi từ transport khác.
- [ ] 🟡 Giải thích: Lỗi, timeout và kết quả chưa xác định? · 📚 #8
  *Ý chính:* Lỗi application có mã ổn định, không chứa HTTP/RPC exception. Adapter chuyển lỗi kỹ thuật; presentation ánh xạ ra giao thức. Timeout không chứng minh thao tác chưa xảy ra. **Bẫy cần tránh:** Catch mọi lỗi rồi trả 500; retry POST mù quáng có thể tạo tác dụng phụ trùng.
- [ ] 🟡 Giải thích: Transaction và tính nhất quán giữa hai hệ thống? · 📚 #9
  *Ý chính:* Clean Architecture không cung cấp distributed transaction. Cần quyết định nguồn dữ liệu chuẩn, ranh giới ghi và chiến lược lỗi từng phần. **Bẫy cần tránh:** Tưởng thêm repository là có atomicity giữa Keycloak và MongoDB. Outbox/saga chỉ thêm khi yêu cầu và hạ tầng phù hợp.
- [ ] 🟡 Giải thích: Chiến lược kiểm thử? · 📚 #10
  *Ý chính:* Kiểm thử nghiệp vụ bằng fake ports; adapter bằng integration test; TCP mapping bằng controller test; các luồng chính bằng E2E. Thêm kiểm tra import để giữ ranh giới. **Bẫy cần tránh:** Mock quá sâu từng lời gọi private; chỉ có fake test nên không phát hiện adapter sai hợp đồng.
- [ ] 🟡 Giải thích: Clean, Hexagonal, Onion và layered architecture? · 📚 #11
  *Ý chính:* Các cách tiếp cận đều nhấn mạnh tách nghiệp vụ và chi tiết nhưng mô tả ranh giới khác nhau. Layered truyền thống có thể để service phụ thuộc implementation database; Clean dùng đảo phụ thuộc ở ranh giới đó. **Bẫy cần tránh:** Đồng nhất Clean Architecture với microservices, DDD hoặc bắt buộc CQRS. Monolith cũng áp dụng được.
- [ ] 🟡 Giải thích: Đánh đổi và khi nào áp dụng? · 📚 #12
  *Ý chính:* Ranh giới thêm interface, mapping và chi phí điều hướng. Hữu ích khi nghiệp vụ phức tạp, nhiều tích hợp hoặc sống lâu; CRUD nhỏ có thể dùng cấu trúc nhẹ hơn. **Bẫy cần tránh:** Hứa đổi database không tốn công: vẫn phải xử lý query, schema, migration và đặc tính consistency.
- [ ] 🟡 Giải thích: Bài thực hành và câu trả lời phỏng vấn? · 📚 #13
  *Ý chính:* Bài tập: thiết kế UpdateMyProfile với input, Actor, hai ports, lỗi và test. Sau đó giả lập Keycloak timeout, MongoDB down và request của user khác. **Bẫy cần tránh:** Kể thiết kế dự kiến như thành tích đã làm; chỉ kể tên thư mục mà không mô tả dependency và trade-off.

- [ ] 🟢 Giải thích bốn tầng Clean Architecture bằng một quán ăn. · 📚 #0
  *Ý chính:* Domain giữ quy tắc đơn hàng; Application điều phối đặt món; adapter chuyển yêu cầu và hiện thực thanh toán/lưu trữ; drivers là POS/API/database. Khách đổi kênh đặt món thì quy tắc nghiệp vụ vẫn đúng.
- [ ] 🟡 Trong quán ăn, vì sao PlaceOrder gọi ra máy POS mà dependency vẫn hướng vào trong? · 📚 #1
  *Ý chính:* Lời gọi lúc chạy đi qua PaymentPort tới adapter. Application sở hữu port; cả use case và POSPaymentAdapter đều phụ thuộc port, use case không import adapter. Composition root chọn implementation.
- [ ] 🟡 Mọi tương tác giữa các tầng đều cần interface đúng không? · 📚 #4
  *Ý chính:* Tầng trong cần khả năng của tầng ngoài thì gọi qua port của lớp trong. Controller gọi use case và Application gọi Domain có thể trực tiếp. Port có thể là interface, abstract class hoặc kiểu hàm; không tạo interface chỉ vì hai class nằm ở hai tầng.

- [ ] 🟡 CommandBus, QueryBus và EventBus có phải use case không? · 📚 #3
  *Ý chính:* Bus định tuyến hoặc phát message; handler mới thực thi use case. Handler Application thuần chứa điều phối, decorator/bus NestJS ở adapter. EventBus không tự điều phối một quy trình dài và không mặc định là RabbitMQ.
- [ ] 🟡 Vì sao CQRS phải sửa getOrCreate trong luồng đọc profile? · 📚 #3
  *Ý chính:* getOrCreate có thể ghi dữ liệu. Query mới dùng findByUserId, trả null nếu chưa có profile; command cập nhật mới upsert. Cả hai dùng chung UserRepositoryPort, database và pool; test chứng minh đọc không tạo document.

- [ ] 🟢 DDD là kiến trúc chia tầng, design pattern hay cách tiếp cận thiết kế? · 📚 #14
  *Ý chính:* DDD là cách tiếp cận phát triển và thiết kế lấy nghiệp vụ làm trung tâm, gồm khám phá mô hình/ngôn ngữ/ranh giới và thể hiện chúng trong code. Clean tổ chức dependency; CQRS tách đọc và thay đổi trạng thái.
- [ ] 🔴 Có domain folder, CQRS và repository thì đã áp dụng DDD tốt chưa? · 📚 #14
  *Ý chính:* Chưa thể kết luận chỉ từ cấu trúc code. Cần làm rõ ngôn ngữ, bounded context, quyền sở hữu dữ liệu và ranh giới nhất quán cùng người hiểu nghiệp vụ. Không thêm aggregate/value object chỉ để đủ tên pattern.

### So sánh kiến trúc và nguyên tắc

- [ ] 🟡 DDD, Clean Architecture và CQRS giải quyết ba vấn đề khác nhau thế nào? Khái niệm DDD nằm ở lớp nào của Clean? · 📚 #14
  *Ý chính:* DDD: mô hình nghiệp vụ và ranh giới; Clean: hướng dependency bảo vệ mô hình; CQRS: tách đường đọc và ghi. Entity, value object, aggregate, domain service nằm ở vòng Domain; application service ở Application; giao diện repository là port, cài đặt repository ở adapter. Bounded context là ranh giới ngang chứa trọn các lớp, không phải một lớp.
- [ ] 🔴 w-identity có áp dụng DDD không? Bạn nói thế nào trong phỏng vấn? · 📚 #14
  *Ý chính:* Chỉ ở mức nhẹ: tách Domain khỏi hạ tầng, đặt tên theo ngôn ngữ nghiệp vụ, tách UserAccount và User. Không có aggregate, value object, domain event hay context map. Identity là subdomain generic nên không cần DDD đầy đủ; ví dụ nhà hàng dùng để học khái niệm, không gán cho code w-identity.
- [ ] 🟡 Clean, Hexagonal, Onion và Layered khác nhau chỗ nào, giống nhau chỗ nào? · 📚 #11
  *Ý chính:* Cùng ý cốt lõi là lõi nghiệp vụ không phụ thuộc chi tiết. Layered để phụ thuộc đi xuống nên business hay dính database; Hexagonal nhấn mạnh port/adapter với bên ngoài; Onion đặt Domain Model ở tâm; Clean thêm Dependency Rule và use case làm đơn vị chính.
- [ ] 🟡 Nêu từng chữ trong SOLID và một ví dụ trong w-identity. · 📚 #15
  *Ý chính:* SRP: mỗi handler một use case. OCP: thêm adapter mới cho port có sẵn. LSP: fake và repository thật cùng tuân hợp đồng port. ISP: UserRepositoryPort chỉ có hai method. DIP: use case phụ thuộc port của Application.
- [ ] 🟡 Input/Output Boundary và Presenter là gì? w-identity có dùng không? · 📚 #15
  *Ý chính:* Use case nhận lệnh qua input boundary, trả kết quả qua output boundary, presenter định dạng cho view. w-identity dùng biến thể đơn giản: handler trả giá trị, controller và filter định dạng; vẫn đúng Dependency Rule vì handler không import Presentation.
- [ ] 🟡 Package by layer và package by feature khác nhau thế nào? Bạn chọn gì? · 📚 #15
  *Ý chính:* By layer dễ thấy ranh giới kỹ thuật nhưng một tính năng rải nhiều thư mục; by feature gom theo tính năng. w-identity dùng by layer vì service nhỏ; service nhiều tính năng độc lập nên cân nhắc by feature, có thể kết hợp.
- [ ] 🔴 Làm sao ép ranh giới kiến trúc bằng công cụ trong workspace Nx? · 📚 #15
  *Ý chính:* Test import bằng AST (đã có), hoặc tách lib và dùng tag cùng `@nx/enforce-module-boundaries`. Rule này thuộc ESLint plugin của Nx; workspace hiện dùng oxlint nên chưa cấu hình.
- [ ] 🟡 Fake khác mock thế nào? Vì sao dự án ưu tiên fake? · 📚 #10
  *Ý chính:* Fake là implementation đơn giản chạy được, test kiểm tra kết quả; mock xác nhận cách gọi nên dễ gãy khi refactor. Fake đi cùng integration test để bắt adapter sai hợp đồng.

## Phần B. Tình huống w-identity

- [ ] 🔴 Import type của UserRepository trong use case có giữ đúng Dependency Rule không? · 📚 #1
  *Ý chính:* Không. Xóa dependency runtime không xóa dependency mã nguồn. Application sở hữu UserRepositoryPort; UserRepository ở Infrastructure implements port, use case chỉ import port.
- [ ] 🟡 Vì sao UserRepositoryPort chỉ có findByUserId và update, dù repository có nhiều CRUD methods? · 📚 #4
  *Ý chính:* Port mô tả nhu cầu của use case, giới hạn API và tránh rò query/database types. Fake chỉ cần hai phương thức; adapter có thể có thêm chi tiết nội bộ.
- [ ] 🔴 Vì sao AppModule dùng useExisting thay vì useClass cho USER_PROFILE_REPOSITORY? · 📚 #5
  *Ý chính:* Tái sử dụng instance UserRepository đã được DatabaseModule quản lý. Interface bị xóa khi chạy nên symbol là token NestJS; use case thuần không cần biết token hay decorator.
- [ ] 🔴 Chứng minh Application không phụ thuộc Mongoose bằng cách nào? · 📚 #10
  *Ý chính:* Kiểm tra import bằng AST, gồm import type, re-export và dynamic import; áp dụng cả unit test core. Test nghiệp vụ dùng fake ports và không khởi tạo repository thật. Vẫn cần integration/E2E để kiểm tra adapter và wiring.
- [ ] 🔴 Use case gọi repository lúc chạy có vi phạm Dependency Rule không? · 📚 #1
  *Ý chính:* Không nếu nó phụ thuộc port của lớp trong; adapter bên ngoài implements port. Phân biệt runtime call và source dependency.
- [ ] 🔴 Dùng @Injectable có tự làm code đạt Clean Architecture không? · 📚 #5
  *Ý chính:* Không. DI là cơ chế; cần xem abstraction thuộc lớp nào và framework có rò vào nghiệp vụ không.
- [ ] 🔴 Nếu chuyển TCP sang HTTP thì thay gì? · 📚 #7
  *Ý chính:* Thêm presentation adapter, giữ input/output và policy application; composition root đổi wiring. Kiểm thử lại contract giao tiếp.
- [ ] 🔴 Keycloak tạo user xong nhưng client nhận timeout thì retry thế nào? · 📚 #8
  *Ý chính:* (Tình huống thiết kế; luồng tạo user hiện bị tắt.) Kết quả chưa xác định. Cần đối soát hoặc idempotency bền vững trước khi lặp tác dụng phụ; không giả định timeout là chưa tạo.
- [ ] 🔴 MongoDB transaction có rollback Keycloak không? · 📚 #9
  *Ý chính:* Không. Khác tài nguyên giao dịch; phải thiết kế lỗi từng phần, compensation hoặc eventual consistency khi cần.
- [ ] 🔴 Fake test đều pass nhưng production lỗi thì thiếu gì? · 📚 #10
  *Ý chính:* Integration/contract test kiểm tra adapter, schema/index, lỗi thực tế và E2E các biên.
- [ ] 🔴 Có nên tạo interface cho mọi class không? · 📚 #12
  *Ý chính:* Không. Tạo ở ranh giới cần đảo phụ thuộc hoặc thay thế, tránh abstraction không có mục đích.
- [ ] 🔴 Hãy mô tả một use case khóa user và điểm lỗi từng phần. · 📚 #3
  *Ý chính:* (Kịch bản thiết kế, hiện bị tắt: `management()` luôn trả FORBIDDEN.) Kiểm tra admin, tắt account, kết thúc session; bước cuối lỗi phải báo account đã khóa. JWT có thể còn sống đến hết hạn.
- [ ] 🔴 Mongoose document có nên là entity domain không? · 📚 #6
  *Ý chính:* Không trong lựa chọn kiến trúc này; mapper chuyển sang mô hình độc lập để tránh rò persistence.
- [ ] 🔴 Thiết kế UpdateMyProfile trong 5 phút. · 📚 #13
  *Ý chính:* Actor xác định userId; validate input, xác nhận tài khoản qua port, cập nhật profile repository; test quyền và lỗi dependency.
- [ ] 🔴 Clean Architecture có bắt buộc microservices và CQRS không? · 📚 #11
  *Ý chính:* Không; hướng dependency áp dụng cả monolith, CQRS là quyết định riêng.
- [ ] 🔴 Khi nào không nên áp dụng đầy đủ các lớp? · 📚 #12
  *Ý chính:* CRUD đơn giản, vòng đời ngắn hoặc mapping/interface không mang lại lợi ích đủ bù chi phí; vẫn giữ ranh giới cần thiết.
