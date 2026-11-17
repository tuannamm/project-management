# Câu hỏi phỏng vấn OOP

Che đáp án, nói thành tiếng 60–90 giây: định nghĩa → đánh đổi → ví dụ. Chỉ đánh dấu đã thuộc khi giải thích được câu hỏi phụ.

## Phần A. Nền tảng và bốn trụ cột

### Class và object

- [ ] 🟢 OOP là gì? Khác lập trình thủ tục thế nào? · 📚 #0
  *Ý chính:* Tổ chức chương trình thành object gói state và hành vi, giao tiếp bằng message. Thủ tục tách dữ liệu và hàm. **Bẫy cần tránh:** nói "OOP là có class"; class anemic chỉ có getter/setter vẫn là code thủ tục.
- [ ] 🟢 Class và object khác nhau thế nào? · 📚 #1
  *Ý chính:* Class là bản thiết kế, object là thực thể cụ thể có state riêng và identity riêng.
- [ ] 🟡 Value object và entity khác nhau thế nào? · 📚 #1
  *Ý chính:* Value object định nghĩa bằng giá trị, thường bất biến (`Money`, `Email`). Entity định nghĩa bằng danh tính (`User` có id), đổi state vẫn là cùng một đối tượng.
- [ ] 🟡 Vì sao constructor phải tạo object ở trạng thái hợp lệ? · 📚 #1
  *Ý chính:* Object nửa vời (chưa set field) làm mọi method phải tự phòng thủ. Kiểm tra invariant trong constructor hoặc factory để object không bao giờ vào trạng thái sai.

### Bốn trụ cột

- [ ] 🟢 Nêu bốn tính chất của OOP. · 📚 #0
  *Ý chính:* Encapsulation, abstraction, inheritance, polymorphism; mỗi cái một câu và một ví dụ riêng (`Order.ship()`, `PaymentMethod`).
- [ ] 🟢 Encapsulation là gì? · 📚 #2
  *Ý chính:* Gom dữ liệu và hành vi, giấu state, chỉ cho đổi qua method bảo vệ invariant. Lợi ích: một chỗ giữ quy tắc, đổi ruột không vỡ code ngoài.
- [ ] 🟡 Abstraction khác encapsulation thế nào? · 📚 #2, #3
  *Ý chính:* Abstraction trả lời "lộ ra cái gì" (thiết kế giao diện); encapsulation trả lời "giấu và bảo vệ cái gì" (cài đặt). Đi cùng nhau.
- [ ] 🟡 Vì sao private field + getter/setter cho mọi field không phải đóng gói tốt? · 📚 #2
  *Ý chính:* Vẫn lộ toàn bộ state và quy tắc nằm ở người gọi. Đóng gói thật là method theo nghiệp vụ (`pay()`, `ship()`), kèm Tell, Don't Ask.
- [ ] 🟡 Polymorphism là gì và có ích gì? · 📚 #5
  *Ý chính:* Cùng lời gọi, hành vi tùy kiểu thật. Loại bỏ chuỗi `if/switch` theo kiểu, thêm kiểu mới không sửa code gọi (Open/Closed).

## Phần B. Interface, kế thừa và đa hình

### Interface và abstract class

- [ ] 🟢 Interface khác abstract class thế nào? · 📚 #3
  *Ý chính:* Interface chỉ là hợp đồng, không state, cài được nhiều. Abstract class có thể có state và code chung, chỉ kế thừa một. Mặc định chọn interface; abstract class khi cần chia sẻ code/state hoặc template method.
- [ ] 🟡 Template method là gì? Khi nào dùng? · 📚 #3
  *Ý chính:* Lớp cha định nghĩa khung thuật toán cố định, lớp con điền các bước thay đổi. Dùng khi khung ổn định, bước biến thiên.
- [ ] 🔴 Leaky abstraction là gì? Cho ví dụ. · 📚 #3
  *Ý chính:* Người dùng buộc phải biết chi tiết bên dưới để dùng đúng, ví dụ ORM che SQL nhưng vẫn gặp N+1 và transaction. Mục tiêu là rò ít và có chủ đích.

### Kế thừa

- [ ] 🟢 Inheritance là gì? Khi nào nên dùng? · 📚 #4
  *Ý chính:* Lớp con thừa hưởng và mở rộng lớp cha, quan hệ is-a. Chỉ dùng khi lớp con thay thế được cha ở mọi nơi (Liskov); không dùng chỉ để tái dùng code.
- [ ] 🟡 Vấn đề kim cương (diamond problem) là gì? Ngôn ngữ xử lý ra sao? · 📚 #4
  *Ý chính:* D kế thừa B và C cùng kế thừa A, cùng override một method thì mơ hồ. Python dùng MRO; Java/C#/TS cấm đa kế thừa class và cho cài nhiều interface.
- [ ] 🟡 Fragile base class là gì? · 📚 #4, #6
  *Ý chính:* Sửa lớp cha làm vỡ lớp con vì con phụ thuộc chi tiết cài đặt của cha. Giảm bằng ít `protected`, cây nông, hoặc composition.
- [ ] 🔴 Vì sao `Square extends Rectangle` là thiết kế sai? · 📚 #4, #8
  *Ý chính:* Rectangle cho đổi width/height độc lập; Square buộc đổi cả hai, phá giả định (đặt 5×4 mong diện tích 20). Is-a đời thường không bằng is-a về hành vi: vi phạm Liskov.

### Đa hình

- [ ] 🟢 Override và overload khác nhau thế nào? · 📚 #5
  *Ý chính:* Override: lớp con thay method cha cùng chữ ký, chọn lúc chạy. Overload: cùng tên khác tham số, chọn lúc biên dịch.
- [ ] 🟡 Dynamic dispatch hoạt động thế nào? · 📚 #5
  *Ý chính:* Lời gọi tra theo kiểu thực của object lúc chạy (vtable ở Java/C++, prototype chain ở JS), không theo kiểu khai báo của biến.
- [ ] 🟡 Upcast và downcast khác nhau? Vì sao downcast là mùi xấu? · 📚 #5
  *Ý chính:* Upcast an toàn, ngầm định. Downcast có thể lỗi lúc chạy và thường nghĩa là bạn đang hỏi kiểu thay vì để đa hình lo.
- [ ] 🔴 Làm sao thay chuỗi `switch (type)` bằng đa hình? Nhược điểm? · 📚 #5, #8
  *Ý chính:* Mỗi case thành một lớp cài chung interface (Strategy/State), code gọi chỉ biết interface. Nhược điểm: thêm lớp gián tiếp, khó theo dõi luồng; không đáng với 2–3 case ổn định.

## Phần C. Thiết kế: composition, quan hệ lớp, SOLID

### Composition và quan hệ

- [ ] 🟢 Composition và inheritance khác nhau thế nào? Vì sao ưu tiên composition? · 📚 #6
  *Ý chính:* Has-a và ủy quyền so với is-a. Composition gắn lỏng, đổi được lúc chạy, dễ test; kế thừa gắn chặt và chốt lúc biên dịch.
- [ ] 🟡 Khi nào kế thừa vẫn là lựa chọn đúng? · 📚 #6
  *Ý chính:* Is-a thật và đúng Liskov, framework yêu cầu, template method với khung ổn định.
- [ ] 🟡 Phân biệt association, aggregation, composition. · 📚 #7
  *Ý chính:* Association: biết nhau. Aggregation: "có", phần sống độc lập. Composition: sở hữu chặt, phần chết theo. Hỏi một câu: xóa cha thì phần còn tồn tại không?
- [ ] 🟡 `Order` và `OrderItem`, `Team` và `Player`: quan hệ gì? · 📚 #7
  *Ý chính:* `Order`–`OrderItem` là composition (item vô nghĩa khi mất đơn). `Team`–`Player` là aggregation (cầu thủ tồn tại độc lập).

### SOLID

- [ ] 🟢 Kể năm nguyên tắc SOLID và một dấu hiệu vi phạm mỗi chữ. · 📚 #8
  *Ý chính:* SRP, OCP, LSP, ISP, DIP. Phần đào sâu (ví dụ code, refactor, DIP/DI/IoC) nằm ở sổ tay SOLID riêng.
- [ ] 🟡 SOLID liên hệ với đa hình, kế thừa và composition thế nào? · 📚 #8, #5, #6
  *Ý chính:* Đa hình là cơ chế của OCP; LSP là phép thử cho kế thừa; composition + interface là nền của DIP.

## Phần D. Chất lượng và pattern

### Coupling, cohesion

- [ ] 🟢 Coupling và cohesion là gì? Muốn mức nào? · 📚 #9
  *Ý chính:* Coupling là mức module biết về nhau (muốn thấp); cohesion là mức thành phần trong module thuộc về nhau (muốn cao).
- [ ] 🟡 Law of Demeter là gì? Cho ví dụ. · 📚 #9
  *Ý chính:* Chỉ nói chuyện với bạn gần; tránh `a.getB().getC().doX()`, thay bằng method trên `a`. Giảm coupling với cấu trúc nội bộ.
- [ ] 🟡 Tell, Don't Ask là gì? · 📚 #2, #9
  *Ý chính:* Bảo object làm việc thay vì lấy dữ liệu ra tự quyết, giữ logic cạnh dữ liệu.
- [ ] 🔴 DRY có luôn đúng không? · 📚 #9
  *Ý chính:* Không. Hai đoạn code giống nhau tình cờ nhưng đổi vì lý do khác nhau thì gộp lại sẽ tạo coupling sai. DRY nói về trùng **tri thức**, không phải trùng chữ.

### Design pattern

- [ ] 🟢 Design pattern là gì? Có mấy nhóm? · 📚 #10
  *Ý chính:* Lời giải đã kiểm chứng cho bài toán thiết kế lặp lại, cho từ vựng chung. GoF: Creational, Structural, Behavioral.
- [ ] 🟡 Strategy là gì? Khác State thế nào? · 📚 #10
  *Ý chính:* Strategy: client chọn thuật toán thay thế được. State: object tự đổi hành vi theo trạng thái nội bộ. Cấu trúc giống, ý định khác.
- [ ] 🟡 Decorator khác kế thừa chỗ nào? · 📚 #10, #6
  *Ý chính:* Thêm hành vi bằng cách bọc object cùng interface, ghép được lúc chạy, không bùng nổ lớp con.
- [ ] 🟡 Observer dùng khi nào? · 📚 #10
  *Ý chính:* Một nguồn phát sự kiện, nhiều bên nghe mà không biết nhau (event emitter, pub/sub). Lưu ý rò rỉ listener và thứ tự xử lý.
- [ ] 🟡 Factory và Builder khác nhau? · 📚 #10
  *Ý chính:* Factory chọn và tạo đúng kiểu cụ thể sau interface. Builder dựng một object phức tạp từng bước với nhiều tùy chọn.
- [ ] 🔴 Vì sao Singleton bị xem là anti-pattern? Thay bằng gì? · 📚 #10, #12
  *Ý chính:* Là biến toàn cục trá hình, ẩn phụ thuộc, khó test và khó thay. Thay bằng một instance do DI container quản lý vòng đời.
- [ ] 🔴 Adapter và Facade khác nhau? · 📚 #10
  *Ý chính:* Adapter chuyển một interface sang interface khác mà client cần. Facade tạo cửa vào đơn giản cho cả hệ con, không nhất thiết đổi interface.

## Phần E. TypeScript/JS, anti-pattern và phỏng vấn

### TypeScript và JavaScript

- [ ] 🟡 JavaScript hướng đối tượng theo kiểu nào? `class` có thật sự là class không? · 📚 #11
  *Ý chính:* Dựa trên prototype; `class` là cú pháp phủ lên prototype chain. Method nằm trên `prototype` và dùng chung giữa các instance.
- [ ] 🟡 Vì sao `this` bị mất khi truyền method làm callback? Cách sửa? · 📚 #11
  *Ý chính:* `this` phụ thuộc cách gọi. Sửa: `.bind`, arrow function field, hoặc bọc `() => obj.method()`.
- [ ] 🟡 `private` của TypeScript khác `#field` của JavaScript thế nào? · 📚 #11
  *Ý chính:* `private` chỉ kiểm tra lúc biên dịch, vẫn truy cập được lúc chạy; `#` riêng tư thật lúc chạy.
- [ ] 🔴 Structural typing là gì? Hệ quả với đa hình trong TS? · 📚 #11
  *Ý chính:* Khớp kiểu theo cấu trúc, không theo tên nên không cần `implements`. Linh hoạt, nhưng hai kiểu khác nghĩa cùng cấu trúc bị coi là một (dùng branded type).
- [ ] 🔴 `interface` ở TypeScript khác Java thế nào? · 📚 #11, #3
  *Ý chính:* TS interface bị xóa khi biên dịch, không tồn tại lúc chạy nên không `instanceof` được; cần kiểm tra thì dùng type guard hoặc class.

### Anti-pattern và so sánh

- [ ] 🟡 Anemic domain model là gì? Vì sao bị phê phán? · 📚 #12, #2
  *Ý chính:* Class chỉ có dữ liệu, logic nằm ở service nên ai cũng phá được quy tắc. Chỗ dùng được: DTO. Tệ khi nghiệp vụ phức tạp rải rác.
- [ ] 🟡 God class và cách sửa? · 📚 #12, #8
  *Ý chính:* Một class làm mọi thứ. Tách theo trách nhiệm (SRP), đẩy logic về đúng object.
- [ ] 🟡 Primitive obsession là gì? · 📚 #12, #1
  *Ý chính:* Dùng `string`/`number` thô cho khái niệm nghiệp vụ (email, tiền). Thay bằng value object tự kiểm tra hợp lệ.
- [ ] 🔴 OOP so với lập trình hàm: khi nào chọn cái nào? · 📚 #12
  *Ý chính:* OOP mạnh ở thực thể có vòng đời và ranh giới/plugin; FP mạnh ở biến đổi dữ liệu và đồng thời. Thực tế trộn cả hai: object cho ranh giới, hàm thuần cho tính toán.

### Cách nói

- [ ] 🟢 Tự giới thiệu: giải thích OOP trong 60 giây. · 📚 #0, #13
  *Ý chính:* Định nghĩa một câu → bốn trụ cột mỗi cái một ví dụ → một cảnh báo (kế thừa dùng dè dặt).
- [ ] 🔴 Bạn từng thiết kế sai một class ra sao và sửa thế nào? · 📚 #13, #8
  *Ý chính:* Chọn một ví dụ thật: nêu dấu hiệu (khó test, sửa nhiều chỗ), nguyên tắc bị vi phạm, cách tách. Nói rõ đánh đổi, không lý tưởng hóa.
