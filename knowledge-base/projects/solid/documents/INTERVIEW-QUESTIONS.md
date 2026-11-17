# Câu hỏi phỏng vấn SOLID

Che đáp án, nói thành tiếng 60–90 giây: phát biểu → ví dụ vi phạm → cách sửa → đánh đổi. Chỉ đánh dấu đã thuộc khi giải thích được câu hỏi phụ.

## Phần A. Tổng quan và SRP

### Tổng quan

- [ ] 🟢 SOLID là gì? Mục đích của nó? · 📚 #0
  *Ý chính:* Năm nguyên tắc thiết kế OOP (SRP, OCP, LSP, ISP, DIP) để code dễ đổi, dễ test, dễ hiểu. Là kim chỉ nam nhận ra thiết kế đau, không phải luật tuyệt đối.
- [ ] 🟡 Năm nguyên tắc này liên hệ với nhau thế nào? · 📚 #0, #4
  *Ý chính:* Hỗ trợ lẫn nhau: DIP đi cùng OCP; ISP giúp tránh vi phạm LSP; SRP giúp mọi nguyên tắc khác dễ áp dụng.

### Single Responsibility

- [ ] 🟢 SRP là gì? · 📚 #1
  *Ý chính:* Một class chỉ có một lý do để thay đổi, tức chịu trách nhiệm trước một actor.
- [ ] 🟡 SRP có phải "một class một method" không? · 📚 #1
  *Ý chính:* Không. Nhiều method vẫn đúng SRP nếu cùng một trách nhiệm. Tách quá nhỏ gây rời rạc, khó theo dõi.
- [ ] 🟡 Làm sao nhận ra một class vi phạm SRP? · 📚 #1
  *Ý chính:* Mô tả cần chữ "và"; nhiều nhóm người có lý do sửa nó; tên `Manager/Helper/Util`; import quá nhiều thứ không liên quan; test phải mock cả chục phụ thuộc.
- [ ] 🔴 SRP liên quan đến cohesion thế nào? · 📚 #1
  *Ý chính:* SRP chính là cohesion cao: thứ đổi cùng lý do ở cùng nhau, thứ đổi khác lý do tách ra.

## Phần B. Open/Closed và Liskov

### Open/Closed

- [ ] 🟢 OCP là gì? · 📚 #2
  *Ý chính:* Mở để mở rộng, đóng để sửa đổi: thêm hành vi bằng code mới, không sửa code cũ đã chạy.
- [ ] 🟡 Làm sao refactor chuỗi `switch (type)` theo OCP? · 📚 #2
  *Ý chính:* Mỗi case thành một lớp cài chung interface (Strategy), nơi dùng chỉ biết interface; thêm trường hợp = thêm class.
- [ ] 🟡 OCP có nghĩa là không bao giờ được sửa code cũ không? · 📚 #2
  *Ý chính:* Không. Sửa lỗi vẫn sửa; OCP nói về thêm tính năng không buộc sửa code cũ.
- [ ] 🔴 Làm sao biết đóng với thay đổi nào? · 📚 #2, #9
  *Ý chính:* Đoán trục thay đổi (thường là "thêm loại mới"); dùng Rule of Three, đừng trừu tượng hóa trước khi có hai–ba trường hợp thật vì dễ chọn sai trục.

### Liskov Substitution

- [ ] 🟡 LSP là gì? · 📚 #3
  *Ý chính:* Lớp con thay được lớp cha mà chương trình vẫn đúng về hành vi, không chỉ khớp chữ ký.
- [ ] 🔴 Vì sao `Square extends Rectangle` vi phạm LSP? · 📚 #3
  *Ý chính:* Rectangle cho đổi width/height độc lập; Square đổi cả hai, nên `setWidth(5); setHeight(4)` ra 16 thay vì 20. Is-a toán học không bằng is-a về hành vi.
- [ ] 🟡 `Penguin extends Bird` có `fly()` ném lỗi sai ở đâu? Sửa thế nào? · 📚 #3
  *Ý chính:* Phá hợp đồng của `Bird.fly()`. Tách `Bird` và `FlyingBird` (hoặc dùng composition) để chỉ loài bay được mới có `fly()`.
- [ ] 🔴 Nêu các quy tắc hợp đồng mà lớp con phải tuân theo. · 📚 #3
  *Ý chính:* Không siết tiền điều kiện, không làm yếu hậu điều kiện, giữ bất biến, không ném ngoại lệ lạ. Khớp với covariance (đầu ra) và contravariance (đầu vào).
- [ ] 🟡 Dấu hiệu vi phạm LSP trong code thật? · 📚 #3
  *Ý chính:* Override rồi `throw new Error('not supported')` hoặc để trống; nơi gọi phải `instanceof` trước khi dùng; test của lớp cha không chạy được với lớp con.

## Phần C. Interface Segregation và Dependency Inversion

### Interface Segregation

- [ ] 🟢 ISP là gì? · 📚 #4
  *Ý chính:* Client không bị ép phụ thuộc method nó không dùng; nhiều interface nhỏ theo client tốt hơn một interface béo.
- [ ] 🟡 Cho ví dụ tách một interface béo. · 📚 #4
  *Ý chính:* `UserRepository` gồm đọc và ghi, `ReportService` chỉ cần đọc: tách `UserReader`/`UserWriter`. Báo cáo không thể xóa nhầm, test chỉ mock vài method.
- [ ] 🔴 ISP liên quan LSP và SRP thế nào? · 📚 #4, #3
  *Ý chính:* Interface béo ép method rỗng/ném lỗi, đó là vi phạm LSP. ISP là SRP áp cho interface. Nhưng đừng cực đoan: gom theo vai trò client, không phải mỗi method một interface.

### Dependency Inversion

- [ ] 🟡 DIP là gì? · 📚 #5
  *Ý chính:* Module cấp cao và cấp thấp cùng phụ thuộc abstraction; chi tiết phụ thuộc abstraction. Nghiệp vụ định nghĩa interface, hạ tầng cài đặt.
- [ ] 🔴 DIP, Dependency Injection và IoC container khác nhau thế nào? · 📚 #5
  *Ý chính:* DIP là nguyên tắc; DI là kỹ thuật truyền phụ thuộc từ ngoài; IoC container là công cụ tự lắp. Inject một lớp cụ thể vẫn vi phạm DIP; có thể đạt DIP không cần container.
- [ ] 🔴 Interface của DIP nên nằm ở phía nào? · 📚 #5, #7
  *Ý chính:* Phía module cấp cao, mô tả nhu cầu của nghiệp vụ (`Notifier.orderPlaced`), không phản ánh API thư viện. Đó là nền của Hexagonal/Clean Architecture.
- [ ] 🟡 Constructor injection khác setter injection khi nào chọn? · 📚 #5
  *Ý chính:* Constructor là mặc định cho phụ thuộc bắt buộc, object luôn hợp lệ. Setter cho phụ thuộc tùy chọn; method injection cho phụ thuộc chỉ dùng trong một lời gọi.
- [ ] 🟡 Composition root là gì? · 📚 #5, #8
  *Ý chính:* Một nơi duy nhất (điểm vào/module gốc) biết lớp cụ thể và lắp chúng; phần còn lại chỉ thấy interface.

## Phần D. Thực hành và kiến trúc

### Refactor và pattern

- [ ] 🟡 Mô tả cách refactor một `OrderService` "làm tất cả". · 📚 #6
  *Ý chính:* Chẩn đoán từng nguyên tắc, tách trách nhiệm (S), Strategy cho khuyến mãi/thanh toán (O), giữ hợp đồng biến thể (L), interface nhỏ (I), inject interface (D). Nêu cái giá: nhiều file, phải nối dây.
- [ ] 🟡 Strategy và Adapter thể hiện nguyên tắc SOLID nào? · 📚 #7
  *Ý chính:* Strategy: OCP. Adapter: DIP (nghiệp vụ phụ thuộc interface của mình, adapter che API ngoài). Decorator: OCP/SRP.
- [ ] 🔴 Clean Architecture/Hexagonal liên quan SOLID thế nào? · 📚 #7
  *Ý chính:* Chúng là DIP ở quy mô ứng dụng: Dependency Rule cho phụ thuộc chỉ hướng vào domain; lõi định nghĩa port, hạ tầng là adapter.
- [ ] 🟡 SOLID khác DRY, KISS, YAGNI chỗ nào? · 📚 #7, #9
  *Ý chính:* DRY nói về trùng tri thức. KISS/YAGNI là đối trọng, kìm trừu tượng hóa sớm. SOLID nói về cấu trúc phụ thuộc.

### TypeScript và NestJS

- [ ] 🟡 Vì sao inject interface trong NestJS cần token? · 📚 #8
  *Ý chính:* Interface TypeScript bị xóa lúc chạy nên không dùng được làm khóa; dùng `Symbol`, string hoặc abstract class làm token, rồi `@Inject(TOKEN)`.
- [ ] 🟡 Đổi kho dữ liệu hoặc thay bằng bản giả khi test trong NestJS thế nào? · 📚 #8
  *Ý chính:* Đổi `useClass` trong `providers` của module (composition root); test dùng `useValue` với bản in-memory.
- [ ] 🔴 Nhận diện vi phạm SOLID thường gặp trong một dự án NestJS. · 📚 #8
  *Ý chính:* Controller chứa nghiệp vụ và truy vấn DB (S); service import thẳng `mongoose.Model`/SDK (D); interface repo béo (I); `UserService` hàng nghìn dòng (S).

## Phần E. Đánh đổi và phỏng vấn

### Đánh đổi

- [ ] 🟡 Khi nào không nên áp dụng SOLID? · 📚 #9
  *Ý chính:* Script ngắn, prototype, phần ổn định; interface chỉ một cài đặt không bao giờ đổi. SOLID giải quyết đau khi thay đổi, không có đau thì chỉ thêm chi phí.
- [ ] 🔴 Over-engineering do SOLID trông như thế nào? · 📚 #9
  *Ý chính:* Hàng chục class vài dòng, factory của factory, trừu tượng hóa trước trường hợp thứ hai. Hậu quả: khó theo dõi luồng, sai trục thay đổi.
- [ ] 🔴 Rule of Three là gì? Liên quan YAGNI thế nào? · 📚 #9, #2
  *Ý chính:* Lần một viết thẳng, lần hai để ý, lần ba mới rút trừu tượng. YAGNI: đừng cài thứ chưa cần.
- [ ] 🔴 Bạn phê bình SOLID ở điểm nào? · 📚 #9
  *Ý chính:* Mơ hồ ("một lý do thay đổi" tùy cách hiểu), dễ sinh gián tiếp nếu máy móc, LSP/ISP gắn với kế thừa kiểu Java, không thay được hiểu biết nghiệp vụ.

### Cách nói

- [ ] 🟢 Giải thích SOLID trong 60 giây. · 📚 #0, #10
  *Ý chính:* Mỗi chữ một câu và một dấu hiệu vi phạm, rồi nói đây là kim chỉ nam chứ không phải luật.
- [ ] 🔴 Kể một lần bạn áp dụng một nguyên tắc SOLID và kết quả. · 📚 #10, #6
  *Ý chính:* Chọn ví dụ thật: dấu hiệu đau (khó test, sửa vỡ nhiều chỗ), nguyên tắc dùng, thay đổi cụ thể, kết quả đo được và cái giá phải trả.
- [ ] 🔴 Nguyên tắc nào khó áp dụng nhất, vì sao? · 📚 #10, #3
  *Ý chính:* Thường LSP (đòi hiểu hợp đồng hành vi, khó thấy bằng mắt) hoặc OCP (phải đoán đúng trục thay đổi). Nêu cách bạn kiểm tra: test hợp đồng chung, Rule of Three.
