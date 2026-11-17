# SOLID — năm nguyên tắc thiết kế hướng đối tượng

Sổ tay riêng về SOLID để ôn phỏng vấn: từng nguyên tắc (SRP, OCP, LSP, ISP, DIP) kèm ví dụ vi phạm và cách sửa, một bài refactor xuyên suốt, quan hệ với design pattern và kiến trúc, áp dụng trong TypeScript/NestJS, và khi nào **không** nên áp dụng. Code TypeScript là minh họa, **chưa chạy thử**; đây là tài liệu lý thuyết tổng quát, không mô tả code của dự án.

Học theo thứ tự 0–10. Mỗi ngày đọc hai chủ đề, tự nói câu trả lời trong 60–90 giây theo khung: định nghĩa → dấu hiệu vi phạm → cách sửa và đánh đổi. Trạng thái 📖 là tài liệu lý thuyết, không khẳng định bạn đã học thuộc.

## Bảng tiến độ

| # | Chủ đề | Nhóm | Trạng thái |
|---|---|---|---|
| 0 | SOLID trong 60 giây | Nền tảng | 📖 |
| 1 | S — Single Responsibility | Năm nguyên tắc | 📖 |
| 2 | O — Open/Closed | Năm nguyên tắc | 📖 |
| 3 | L — Liskov Substitution | Năm nguyên tắc | 📖 |
| 4 | I — Interface Segregation | Năm nguyên tắc | 📖 |
| 5 | D — Dependency Inversion, DI và IoC | Năm nguyên tắc | 📖 |
| 6 | Refactor xuyên suốt: từ một class vi phạm cả năm | Thực hành | 📖 |
| 7 | SOLID, design pattern và kiến trúc | Thực hành | 📖 |
| 8 | SOLID trong TypeScript và NestJS | Thực hành | 📖 |
| 9 | Khi nào không áp dụng: đánh đổi và over-engineering | Thực hành | 📖 |
| 10 | Cách nói khi phỏng vấn | Thực hành | 📖 |

## 0. SOLID trong 60 giây

**SOLID** là năm nguyên tắc thiết kế hướng đối tượng do Robert C. Martin (Uncle Bob) tổng hợp, chữ viết tắt do Michael Feathers đặt. Mục tiêu chung: code **dễ đổi, dễ test, dễ hiểu**, tức là một thay đổi nhỏ về yêu cầu chỉ chạm một chỗ nhỏ trong code.

| Chữ | Tên | Một câu | Dấu hiệu vi phạm |
|---|---|---|---|
| S | Single Responsibility | Một class chỉ có một lý do để thay đổi | Class dài, sửa vì nhiều yêu cầu khác nhau |
| O | Open/Closed | Mở để mở rộng, đóng để sửa đổi | Chuỗi `if/switch` theo kiểu phải sửa mỗi lần thêm trường hợp |
| L | Liskov Substitution | Lớp con thay được lớp cha mà chương trình vẫn đúng | Override ném lỗi, hoặc kiểm tra kiểu trước khi gọi |
| I | Interface Segregation | Đừng ép client phụ thuộc method nó không dùng | `throw new Error('not supported')` |
| D | Dependency Inversion | Phụ thuộc abstraction, không phụ thuộc chi tiết | `new` thẳng DB/SDK trong lớp nghiệp vụ |

### Ví dụ đời thường: bếp trưởng nhà hàng

Một người vừa nấu, vừa thu ngân, vừa nhập hàng, vừa lau bàn: ai nghỉ là cả quán đứng (vi phạm S). Mỗi lần thêm món lại phải đập bếp xây lại (vi phạm O). Đầu bếp phụ "thay" đầu bếp chính mà không biết nấu món chính (vi phạm L). Bắt thợ rửa bát đọc cả sổ thu chi (vi phạm I). Bếp chỉ chạy được với đúng một hãng gas (vi phạm D).

### Ví dụ xuyên suốt: xử lý đơn hàng

Bài toán: cửa hàng online nhận đơn, tính tiền có khuyến mãi (VIP, Black Friday), cho khách trả bằng thẻ hoặc ví điện tử, lưu đơn xuống DB và gửi email xác nhận. Dưới đây là đoạn code xuất phát, viết "một mạch" trong một class; đọc nó ở đây là đủ, từng bài sau chỉ trích lại đúng phần liên quan kèm code.

```ts
class OrderService {
  async place(order: Order, kind: string, paymentType: string) {
    // (1) Tính tiền + khuyến mãi
    let total = order.items.reduce((s, i) => s + i.price * i.qty, 0);
    if (kind === 'vip') total *= 0.9;
    else if (kind === 'blackfriday') total *= 0.7;

    // (2) Thanh toán
    if (paymentType === 'card') { await new StripeClient().charge(total); }
    else if (paymentType === 'ewallet') { await new MomoClient().pay(total); }

    // (3) Lưu DB và (4) gửi email
    await new MySqlDatabase().insert('orders', { ...order, total });
    await new SendGridMailer().send(order.email, 'Đã nhận đơn');
  }
}
```

**Class này vi phạm gì, ở đâu:**

| Chữ | Vi phạm trong đoạn code trên |
|---|---|
| S | Một class lo cả bốn việc: tính tiền (1), thanh toán (2), lưu DB (3), gửi mail (4); bốn nhóm người khác nhau yêu cầu sửa nó |
| O | Thêm khuyến mãi mới hay cổng thanh toán mới phải mở `place` ra thêm nhánh `else if` |
| L | Nếu sau này có `GiftOrderService extends OrderService` mà override `place` ném lỗi thì nơi gọi bị phá |
| I | Nếu có interface thanh toán béo (`pay`, `refund`, `capture`...), cách trả nào cũng bị ép cài hết |
| D | `new StripeClient()`, `new MySqlDatabase()`, `new SendGridMailer()` nằm ngay trong nghiệp vụ nên không test được nếu không có hạ tầng thật |

**Thiết kế đích sau khi sửa** (bài 6 làm từng bước, kèm code đầy đủ): `OrderService` chỉ nhận bốn thứ qua constructor là chính sách giảm giá, cách thanh toán, kho lưu đơn và bộ thông báo (đều là interface), rồi điều phối theo đúng thứ tự: giảm giá → thanh toán → lưu → thông báo. Thêm khuyến mãi hay cổng thanh toán mới chỉ thêm một class.

### SOLID là gì và không phải là gì

- Là **kim chỉ nam** để nhận ra thiết kế đang đau, không phải luật phải tuân thủ tuyệt đối.
- Không phải mục tiêu cuối: mục tiêu là code dễ thay đổi. Áp dụng máy móc sinh ra over-engineering (bài 9).
- Các nguyên tắc **hỗ trợ lẫn nhau**: DIP và OCP thường đi chung; ISP giúp LSP; SRP giúp mọi thứ khác.

**Bẫy phỏng vấn:** đọc thuộc năm tên mà không cho được ví dụ vi phạm. Nhà tuyển dụng gần như luôn hỏi tiếp "cho ví dụ code vi phạm và cách sửa".

**Tự trả lời:** giải thích SOLID cho người chưa biết gì trong ba câu, dùng ví dụ bếp trưởng.

## 1. S — Single Responsibility Principle

**Phát biểu:** một module/class chỉ nên có **một lý do để thay đổi**. Cách hiểu của Uncle Bob (sau này): nó chỉ chịu trách nhiệm trước **một actor** (một nhóm người dùng/bên yêu cầu).

Điểm hay bị hiểu sai: SRP **không** nghĩa là "một class một method" hay "làm một việc nhỏ xíu". Một class có nhiều method vẫn đúng SRP nếu tất cả cùng phục vụ một trách nhiệm.

### Vi phạm

```ts
class OrderService {
  calculateTotal(order: Order): number { /* quy tắc giá: do bộ phận kinh doanh yêu cầu */ }
  renderInvoicePdf(order: Order): Buffer { /* định dạng: do bộ phận kế toán yêu cầu */ }
  save(order: Order): Promise<void> { /* SQL: do đội hạ tầng quyết định */ }
  sendConfirmation(order: Order): Promise<void> { /* email: do bộ phận marketing */ }
}
```

Bốn actor khác nhau cùng sửa một file: đổi định dạng PDF có thể vô tình làm hỏng `calculateTotal`, và xung đột merge liên tục.

### Sửa

```ts
class PriceCalculator { total(order: Order): Money { /* ... */ } }
class InvoiceRenderer { render(order: Order): Buffer { /* ... */ } }
class OrderRepository { save(order: Order): Promise<void> { /* ... */ } }
class ConfirmationMailer { send(order: Order): Promise<void> { /* ... */ } }
```

### Cách kiểm tra nhanh

- Mô tả class bằng một câu **không có chữ "và"**.
- Hỏi: "những ai/yêu cầu nào khiến tôi phải sửa file này?" Nếu hơn một nhóm, tách.
- Dấu hiệu khác: tên `Manager`, `Helper`, `Util`, `Processor`; import quá nhiều thứ không liên quan; test phải mock cả chục phụ thuộc.

### Mức độ: module, class và hàm

SRP áp dụng ở mọi mức: hàm làm một việc, class một trách nhiệm, module một nhóm lý do thay đổi. Tách quá nhỏ sinh ra hàng chục class chỉ vài dòng, khó theo dõi luồng (bài 9).

### Cohesion

SRP chính là **cohesion cao**: những thứ thay đổi cùng lý do thì ở cùng nhau; những thứ thay đổi khác lý do thì tách ra.

**Bẫy phỏng vấn:** "SRP là mỗi class một method đúng không?" Không: là một **lý do để thay đổi**. Bẫy ngược: tách tới mức một class một dòng, làm code rời rạc.

**Tự trả lời:** lấy một class bạn từng viết, liệt kê các "actor" có thể yêu cầu sửa nó.

## 2. O — Open/Closed Principle

**Phát biểu:** thực thể phần mềm nên **mở để mở rộng, đóng để sửa đổi**. Thêm hành vi mới bằng cách **thêm code mới**, không sửa code cũ đã chạy và đã test.

### Vi phạm

```ts
class DiscountService {
  apply(order: Order, kind: string): Money {
    if (kind === 'vip') return order.total.multiply(0.9);
    if (kind === 'coupon') return order.total.subtract(order.coupon!.value);
    if (kind === 'blackfriday') return order.total.multiply(0.7);
    return order.total;
  }
}
```

Mỗi chương trình khuyến mãi mới phải mở hàm này ra sửa, có thể làm hỏng các nhánh cũ, và phải test lại tất cả.

### Sửa bằng đa hình (Strategy)

```ts
interface DiscountPolicy {
  apply(order: Order): Money;
}

class VipDiscount implements DiscountPolicy {
  apply(o: Order) { return o.total.multiply(0.9); }
}
class CouponDiscount implements DiscountPolicy {
  apply(o: Order) { return o.total.subtract(o.coupon!.value); }
}

class DiscountService {
  constructor(private readonly policies: DiscountPolicy[]) {}
  apply(order: Order): Money {
    return this.policies.reduce((total, p) => p.apply({ ...order, total }), order.total);
  }
}
```

Thêm khuyến mãi mới = thêm một class và đăng ký, `DiscountService` không đổi.

### Cơ chế đạt OCP

| Cơ chế | Ví dụ |
|---|---|
| Đa hình / interface | Strategy, State |
| Composition + decorator | Bọc thêm logging, cache, retry |
| Plugin / registry | Đăng ký handler theo kiểu |
| Hàm bậc cao | Truyền hàm xử lý như tham số |

### Đóng "ở đâu"?

Không có code nào đóng hoàn toàn với mọi thay đổi. Hãy **đoán đúng trục thay đổi** (thường là "thêm loại mới") và đóng với nó. Đừng trừu tượng hóa trước khi có ít nhất hai–ba trường hợp thật (**Rule of Three**): trừu tượng sớm thường sai trục.

### Hai cách hiểu OCP

- **Bertrand Meyer (gốc):** dùng kế thừa để mở rộng class mà không sửa.
- **Uncle Bob (hiện đại):** dùng interface và đa hình; tránh kế thừa cài đặt.

**Bẫy phỏng vấn:** nói "OCP là không bao giờ sửa code cũ". Sai: sửa lỗi vẫn sửa; OCP nói về việc **thêm tính năng** không buộc sửa code cũ. Bẫy khác: trừu tượng hóa mọi `if` thành Strategy, gây over-engineering với hai nhánh ổn định.

**Tự trả lời:** tìm một chuỗi `switch (type)` trong code bạn biết và vẽ cách thay bằng đa hình.

## 3. L — Liskov Substitution Principle

**Phát biểu (Barbara Liskov, 1987):** nếu `S` là kiểu con của `T` thì đối tượng `T` có thể được thay bằng đối tượng `S` mà **chương trình vẫn đúng**. Quan trọng là đúng về **hành vi**, không chỉ khớp chữ ký.

### Quy tắc hợp đồng (design by contract)

| Thành phần | Lớp con được phép | Lớp con không được |
|---|---|---|
| Tiền điều kiện (đầu vào) | Nới lỏng (chấp nhận nhiều hơn) | Siết chặt (đòi nhiều hơn) |
| Hậu điều kiện (đầu ra) | Mạnh hơn (đảm bảo nhiều hơn) | Yếu hơn (hứa ít hơn) |
| Bất biến | Giữ nguyên | Phá bất biến của cha |
| Ngoại lệ | Ném kiểu con của ngoại lệ cha đã khai | Ném ngoại lệ hoàn toàn mới |

### Vi phạm kinh điển 1: hình vuông và hình chữ nhật

```ts
class Rectangle {
  constructor(protected w: number, protected h: number) {}
  setWidth(w: number) { this.w = w; }
  setHeight(h: number) { this.h = h; }
  area() { return this.w * this.h; }
}

class Square extends Rectangle {
  setWidth(w: number) { this.w = w; this.h = w; }   // phá giả định của cha
  setHeight(h: number) { this.w = h; this.h = h; }
}

function resize(r: Rectangle) {
  r.setWidth(5); r.setHeight(4);
  console.log(r.area());   // mong 20; với Square ra 16
}
```

Is-a trong toán học không phải is-a về hành vi. Sửa: dùng bất biến (`Shape` với `area()`), hoặc không cho đổi từng cạnh.

### Vi phạm kinh điển 2: chim cánh cụt

```ts
class Bird { fly(): void { /* bay */ } }
class Penguin extends Bird {
  fly(): void { throw new Error('Chim cánh cụt không bay'); }   // phá hợp đồng
}
```

Code gọi `bird.fly()` bất ngờ nổ. Sửa: tách khả năng.

```ts
interface Bird { eat(): void }
interface FlyingBird extends Bird { fly(): void }
class Sparrow implements FlyingBird { eat() {} fly() {} }
class Penguin implements Bird { eat() {} }
```

### Dấu hiệu vi phạm trong code thật

- Override method rồi `throw new Error('not supported')` hoặc để trống.
- Code gọi phải kiểm tra `instanceof` / `if (x.type === ...)` trước khi dùng.
- Lớp con siết điều kiện: cha nhận số âm, con từ chối.
- Test của lớp cha không chạy được với lớp con.

### LSP và kế thừa

LSP là **phép thử** cho mọi quan hệ kế thừa: nếu không thay thế được, đó không phải kế thừa đúng; chuyển sang composition (bài 6 của sổ tay OOP).

### LSP và kiểu dữ liệu

Hệ thống kiểu còn **hiệp biến / phản biến** (covariance / contravariance): đầu ra của lớp con có thể cụ thể hơn, đầu vào có thể tổng quát hơn, khớp với quy tắc tiền và hậu điều kiện ở bảng trên.

**Bẫy phỏng vấn:** nói "LSP là con kế thừa cha thì được". LSP nói về **thay thế được về hành vi**, chữ ký hợp lệ chưa đủ. Ví dụ hình vuông là câu hỏi gần như bắt buộc.

**Tự trả lời:** giải thích vì sao `Penguin extends Bird` là sai bằng một đoạn code gọi `bird.fly()`.

## 4. I — Interface Segregation Principle

**Phát biểu:** client không nên bị ép phụ thuộc vào method mà nó **không dùng**. Nhiều interface nhỏ, theo nhu cầu của client, tốt hơn một interface "béo" đa dụng.

### Vi phạm

```ts
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Robot implements Worker {
  work() { /* làm việc */ }
  eat() { throw new Error('Robot không ăn'); }    // bị ép cài thứ vô nghĩa
  sleep() { throw new Error('Robot không ngủ'); }
}
```

### Sửa

```ts
interface Workable { work(): void }
interface Eatable { eat(): void }
interface Sleepable { sleep(): void }

class Human implements Workable, Eatable, Sleepable { work() {} eat() {} sleep() {} }
class Robot implements Workable { work() {} }
```

### Ví dụ thực tế: repository

```ts
// Béo: báo cáo chỉ cần đọc nhưng phụ thuộc cả ghi/xóa
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(u: User): Promise<void>;
  delete(id: string): Promise<void>;
}

// Tách theo vai trò
interface UserReader { findById(id: string): Promise<User | null>; findAll(): Promise<User[]> }
interface UserWriter { save(u: User): Promise<void>; delete(id: string): Promise<void> }

class ReportService { constructor(private readonly users: UserReader) {} }   // không thể xóa nhầm
```

Lợi ích: client chỉ biết điều nó cần, test chỉ mock vài method, thay đổi một method không buộc biên dịch lại mọi client, và **an toàn hơn** (báo cáo không có quyền ghi).

### Quan hệ với các nguyên tắc khác

- ISP bổ trợ **LSP**: interface béo ép lớp cài đặt viết method rỗng/ném lỗi, đó chính là vi phạm LSP.
- ISP là **SRP áp dụng cho interface**: một interface nên phục vụ một nhóm client.
- Trong TypeScript, kiểu con có thể dùng `Pick<T, ...>` hoặc interface nhỏ và để cấu trúc (structural typing) tự khớp.

### Đừng cực đoan

Mỗi method một interface thì quá mức. Gom theo **vai trò client** (reader, writer), không theo từng hàm.

**Bẫy phỏng vấn:** nói "ISP là chia interface cho nhỏ". Phải nói theo **client**: nhỏ **theo nhu cầu người dùng**. Dấu hiệu nhận biết là method rỗng hoặc ném `not supported`.

**Tự trả lời:** tìm một interface "béo" trong code và đề xuất cách tách theo vai trò.

## 5. D — Dependency Inversion Principle

**Phát biểu:**

1. Module cấp cao **không** phụ thuộc module cấp thấp; **cả hai phụ thuộc abstraction**.
2. Abstraction **không** phụ thuộc chi tiết; **chi tiết phụ thuộc abstraction**.

"Đảo ngược" nghĩa là: thay vì nghiệp vụ (cấp cao) gọi thẳng hạ tầng (cấp thấp), **nghiệp vụ định nghĩa interface nó cần**, hạ tầng cài đặt interface đó. Mũi tên phụ thuộc của mã nguồn đổi chiều.

### Vi phạm

```ts
class OrderService {
  private db = new MySqlDatabase();          // biết cụ thể MySQL
  private mailer = new SendGridMailer();     // biết cụ thể SendGrid

  async place(order: Order) {
    await this.db.insert('orders', order);
    await this.mailer.send(order.customerEmail, 'Đã nhận đơn');
  }
}
```

Muốn đổi sang PostgreSQL phải sửa nghiệp vụ; muốn test phải có MySQL thật và gửi mail thật.

### Sửa

```ts
// Nghiệp vụ sở hữu các interface (cổng, port)
interface OrderRepository { save(o: Order): Promise<void> }
interface Notifier { orderPlaced(o: Order): Promise<void> }

class OrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly notifier: Notifier,
  ) {}
  async place(order: Order) {
    await this.orders.save(order);
    await this.notifier.orderPlaced(order);
  }
}

// Hạ tầng cài đặt (adapter)
class MySqlOrderRepository implements OrderRepository { /* ... */ }
class SendGridNotifier implements Notifier { /* ... */ }

// Test: thay bằng bản giả trong bộ nhớ
class InMemoryOrderRepository implements OrderRepository {
  items: Order[] = [];
  async save(o: Order) { this.items.push(o); }
}
```

### Ba khái niệm hay bị lẫn

| Khái niệm | Bản chất | Ví dụ |
|---|---|---|
| **DIP** | Nguyên tắc thiết kế: phụ thuộc abstraction | `OrderService` phụ thuộc `OrderRepository` |
| **Dependency Injection (DI)** | Kỹ thuật: truyền phụ thuộc từ ngoài vào (constructor, setter) | `new OrderService(repo, notifier)` |
| **IoC container** | Công cụ: tự tạo và lắp các object | NestJS, Spring, InversifyJS |

DI **không bằng** DIP: bạn có thể inject một lớp cụ thể (vẫn vi phạm DIP) hoặc đạt DIP mà tự lắp bằng tay không cần container.

### Interface thuộc về ai?

Điểm tinh tế nhất của DIP: interface nên nằm ở **phía module cấp cao** (nghiệp vụ), phản ánh nhu cầu của nó (`Notifier.orderPlaced`), chứ không phải phản ánh API của thư viện (`SendGridClient.send`). Đây là nền của Hexagonal / Clean Architecture.

### Ba cách inject

| Cách | Khi dùng |
|---|---|
| Constructor injection | Mặc định: phụ thuộc bắt buộc, object luôn hợp lệ |
| Setter / property injection | Phụ thuộc tùy chọn (hiếm) |
| Method (parameter) injection | Phụ thuộc chỉ dùng trong một lời gọi |

### Composition root

Chỉ **một nơi** (điểm vào ứng dụng, module gốc) biết lớp cụ thể nào được dùng và lắp chúng lại. Phần còn lại của code chỉ thấy interface.

**Bẫy phỏng vấn:** lẫn DIP, DI và IoC; hoặc nói "DIP là dùng interface". Phải nêu thêm **chiều phụ thuộc bị đảo** và **ai sở hữu interface**. Bẫy khác: tạo interface cho mọi class chỉ có một cài đặt không bao giờ đổi.

**Tự trả lời:** vẽ mũi tên phụ thuộc trước và sau khi áp dụng DIP cho `OrderService` và MySQL.

## 6. Refactor xuyên suốt: từ một class vi phạm cả năm

Bắt đầu từ một class "làm tất cả" rồi áp dụng từng nguyên tắc.

### Bước 0: code xuất phát

```ts
class OrderService {
  async place(order: Order, kind: string, paymentType: string) {
    // tính tiền + khuyến mãi (nhiều nhánh)
    let total = order.items.reduce((s, i) => s + i.price * i.qty, 0);
    if (kind === 'vip') total *= 0.9;
    else if (kind === 'blackfriday') total *= 0.7;

    // thanh toán (nhiều nhánh)
    if (paymentType === 'card') { await new StripeClient().charge(total); }
    else if (paymentType === 'ewallet') { await new MomoClient().pay(total); }

    // lưu + gửi mail, gắn chặt hạ tầng
    await new MySqlDatabase().insert('orders', { ...order, total });
    await new SendGridMailer().send(order.email, 'Đã nhận đơn');
  }
}
```

### Chẩn đoán

| Nguyên tắc | Vi phạm ở đâu |
|---|---|
| S | Một class tính tiền, thanh toán, lưu, gửi mail |
| O | Thêm khuyến mãi hoặc cách trả tiền mới phải sửa `place` |
| L | (chưa có kế thừa, nhưng nếu thêm `GiftOrderService extends OrderService` ném lỗi thì sẽ vi phạm) |
| I | Nếu có `interface Payment` béo gồm cả `refund`, `capture`, `void`, mọi cách trả phải cài hết |
| D | `new StripeClient()`, `new MySqlDatabase()` ngay trong nghiệp vụ |

### Bước 1: tách trách nhiệm (S)

Tách `PriceCalculator`, `PaymentProcessor`, `OrderRepository`, `Notifier`; `OrderService` chỉ điều phối.

### Bước 2: đóng với "thêm loại mới" (O)

```ts
interface DiscountPolicy { apply(total: Money, order: Order): Money }
interface PaymentMethod { pay(amount: Money): Promise<void> }
```

Mỗi khuyến mãi và mỗi cách trả tiền là một class riêng.

### Bước 3: giữ hợp đồng khi có biến thể (L)

Mọi `PaymentMethod` phải thực sự thanh toán hoặc báo lỗi theo cùng quy ước (cùng kiểu kết quả); không có cài đặt nào ném lỗi "không hỗ trợ" với thao tác mà `OrderService` gọi.

### Bước 4: interface nhỏ theo client (I)

`OrderService` chỉ cần `pay`; việc hoàn tiền thuộc `RefundService` nên dùng interface `Refundable` riêng, không ép mọi cách trả cài `refund`.

### Bước 5: đảo phụ thuộc (D)

```ts
class OrderService {
  constructor(
    private readonly discount: DiscountPolicy,
    private readonly payment: PaymentMethod,
    private readonly orders: OrderRepository,
    private readonly notifier: Notifier,
  ) {}

  async place(order: Order): Promise<void> {
    const total = this.discount.apply(order.total(), order);
    await this.payment.pay(total);
    await this.orders.save(order.withTotal(total));
    await this.notifier.orderPlaced(order);
  }
}
```

### Kết quả

- Thêm khuyến mãi mới hoặc cổng thanh toán mới: thêm class, không sửa `OrderService`.
- Test `OrderService` bằng bản giả trong bộ nhớ, không cần Stripe hay MySQL.
- Đổi nhà cung cấp mail: sửa một adapter.

### Cái giá phải trả

Số file tăng lên nhiều, phải nối dây ở composition root, người mới phải đọc nhiều chỗ để hiểu luồng. Hợp lý khi hệ thống đủ lớn và hay đổi; thừa khi đó chỉ là script nhỏ (bài 9).

**Tự trả lời:** chọn một service bạn viết và đi qua năm bước chẩn đoán trên.

## 7. SOLID, design pattern và kiến trúc

### Pattern chính là SOLID đóng gói sẵn

| Pattern | Nguyên tắc nó thể hiện |
|---|---|
| Strategy, State | OCP: thêm biến thể không sửa nơi dùng |
| Decorator | OCP, SRP: thêm hành vi bằng cách bọc |
| Adapter | DIP: nghiệp vụ phụ thuộc interface của mình, adapter che API ngoài |
| Factory | DIP: nơi dùng không `new` thẳng lớp cụ thể |
| Template Method | OCP: khung cố định, bước biến thiên |
| Repository | DIP + SRP: che truy cập dữ liệu sau interface |
| Observer | OCP: thêm người nghe không sửa nguồn phát |

### SOLID ở mức kiến trúc

| Nguyên tắc | Bản mở rộng ở mức module/kiến trúc |
|---|---|
| SRP | Common Closure Principle: gom thứ đổi cùng lý do vào một package |
| OCP | Plugin architecture, hook, middleware |
| LSP | Mọi cài đặt của cùng một API/contract phải hành xử nhất quán (microservice cùng schema) |
| ISP | Common Reuse Principle: đừng ép phụ thuộc cả package để dùng một phần |
| DIP | **Dependency Rule** của Clean Architecture: phụ thuộc chỉ hướng vào trong, về phía domain |

Hexagonal (Ports and Adapters) và Clean Architecture về cơ bản là **DIP áp dụng cho cả ứng dụng**: lõi nghiệp vụ định nghĩa port, hạ tầng là adapter.

### SOLID so với các nguyên tắc khác

| Nguyên tắc | Khác SOLID chỗ nào |
|---|---|
| DRY | Nói về trùng tri thức; SOLID nói về cấu trúc phụ thuộc |
| KISS, YAGNI | Là **đối trọng**: kìm lại việc trừu tượng hóa quá sớm |
| Law of Demeter | Giảm coupling, bổ trợ DIP |
| Composition over inheritance | Giúp đạt OCP, LSP mà ít rủi ro |

**Bẫy phỏng vấn:** coi SOLID chỉ là chuyện của class. Ứng viên giỏi liên hệ được tới pattern (Strategy là OCP) và kiến trúc (Clean Architecture là DIP ở quy mô lớn).

**Tự trả lời:** Strategy và Adapter lần lượt thể hiện nguyên tắc nào? Giải thích bằng một câu mỗi pattern.

## 8. SOLID trong TypeScript và NestJS

### Điểm riêng của TypeScript

- **Interface bị xóa lúc chạy.** Với DI container cần "token" lúc chạy, dùng `abstract class` hoặc `Symbol`/string làm token.
- **Structural typing** giúp ISP và test: object literal có đủ method là dùng được, không cần `implements`.
- `readonly`, `private`, union type giúp giữ bất biến (hỗ trợ LSP).
- Hàm là công dân hạng nhất: nhiều khi truyền một hàm (`type DiscountPolicy = (o: Order) => Money`) gọn hơn cả một class, vẫn đạt OCP.

```ts
type DiscountPolicy = (total: Money, order: Order) => Money;
const vip: DiscountPolicy = (t) => t.multiply(0.9);
const policies: DiscountPolicy[] = [vip];
```

### NestJS: DI sẵn có

```ts
// Token lúc chạy vì interface bị xóa
export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderRepository { save(o: Order): Promise<void> }

@Injectable()
export class PlaceOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}
  execute(o: Order) { return this.orders.save(o); }
}

@Module({
  providers: [
    PlaceOrderUseCase,
    { provide: ORDER_REPOSITORY, useClass: MongoOrderRepository },
  ],
})
export class OrdersModule {}
```

Đổi sang kho khác chỉ sửa dòng `useClass`; module `OrdersModule` là **composition root** của phần này. Khi test, thay bằng `useValue: new InMemoryOrderRepository()`.

### Nhận diện vi phạm trong NestJS thường gặp

| Dấu hiệu | Nguyên tắc | Hướng sửa |
|---|---|---|
| Controller chứa nghiệp vụ và truy vấn DB | S | Tách use case/service, repository |
| Service import trực tiếp `mongoose.Model` hay SDK | D | Port + adapter |
| Một `UserService` hàng nghìn dòng | S | Tách theo use case |
| Guard/Pipe cài đặt cứng theo từng kiểu | O | Đăng ký policy qua provider |
| Interface repo gồm mọi thao tác, service chỉ đọc | I | Tách reader/writer |

**Bẫy phỏng vấn:** quên rằng interface TS không tồn tại lúc chạy nên không thể inject bằng interface trực tiếp; phải dùng token. Đây là câu hỏi thực tế khi dùng NestJS.

**Tự trả lời:** vì sao `@Inject(ORDER_REPOSITORY)` cần `Symbol` mà không dùng thẳng `OrderRepository`?

## 9. Khi nào không áp dụng: đánh đổi và over-engineering

SOLID giải quyết **sự đau khi thay đổi**. Nếu không có thay đổi hay đau, áp dụng chỉ thêm chi phí.

### Dấu hiệu áp dụng quá tay

| Dấu hiệu | Hậu quả |
|---|---|
| Interface chỉ có một cài đặt, không bao giờ đổi, không cần mock | Thêm lớp gián tiếp vô ích |
| Một class một dòng, hàng chục file nhỏ | Khó lần theo luồng, "ravioli code" |
| Factory của factory của strategy | Người đọc không hiểu luồng chạy |
| Trừu tượng hóa trước khi có trường hợp thứ hai | Sai trục thay đổi, sửa còn khó hơn |

### Chi phí của gián tiếp

Mỗi lớp trừu tượng thêm: một file, một chỗ phải nối dây, một bước nhảy khi đọc code, và một chỗ có thể sai. Chỉ đáng khi lợi ích (dễ đổi, dễ test) vượt chi phí.

### Quy tắc thực dụng

- **Rule of Three:** lần một viết thẳng, lần hai chép và để ý, lần ba mới rút trừu tượng.
- **YAGNI:** đừng cài thứ chưa cần.
- Áp dụng mạnh ở **ranh giới dễ đổi** (hạ tầng, dịch vụ ngoài, quy tắc nghiệp vụ hay thay đổi); giữ đơn giản ở phần ổn định.
- Script ngắn, prototype, code dùng một lần: ưu tiên đơn giản.
- Dùng nỗi đau làm tín hiệu: khó test, sửa một chỗ vỡ nhiều chỗ, merge xung đột liên tục.

### Phê bình SOLID thường gặp

- Mơ hồ: "một lý do thay đổi" tùy cách hiểu.
- Sinh ra nhiều lớp gián tiếp nếu áp dụng máy móc.
- Một số nguyên tắc (LSP, ISP) gắn với kế thừa kiểu Java, ít tác dụng trong phong cách hàm (FP).
- Không thay thế được hiểu biết về nghiệp vụ: tách sai ranh giới còn tệ hơn không tách.

### Cân bằng SOLID và đơn giản

Hỏi trước khi trừu tượng hóa: **"Điều gì sẽ thay đổi, và bao lâu một lần?"** Nếu không trả lời được, hãy giữ nguyên.

**Bẫy phỏng vấn:** bênh SOLID một chiều là dấu hiệu thiếu kinh nghiệm. Câu trả lời trưởng thành nêu được lợi ích **và** lúc nên dừng (Rule of Three, YAGNI).

**Tự trả lời:** kể một lần bạn thấy trừu tượng hóa quá sớm gây hại, và bạn sẽ làm khác đi thế nào.

## 10. Cách nói khi phỏng vấn

### Khung trả lời 90 giây cho mỗi nguyên tắc

1. **Phát biểu** một câu.
2. **Vi phạm:** ví dụ code ngắn hoặc dấu hiệu.
3. **Sửa:** cách tách/đa hình/đảo phụ thuộc.
4. **Đánh đổi:** cái giá hoặc lúc không nên áp dụng.

### Mẫu trả lời

**Mẫu trả lời: "SOLID là gì?"**

> Là năm nguyên tắc để code dễ đổi. S: mỗi class một lý do thay đổi. O: thêm tính năng bằng code mới, không sửa code cũ, thường nhờ đa hình. L: lớp con phải thay được lớp cha mà chương trình vẫn đúng. I: interface nhỏ theo nhu cầu client. D: nghiệp vụ phụ thuộc interface, hạ tầng cài đặt interface đó. Tôi dùng chúng như câu hỏi kiểm tra thiết kế, không phải luật cứng.

**Mẫu trả lời: "Cho ví dụ bạn áp dụng DIP."**

> Service đặt hàng ban đầu `new` thẳng MySQL và SendGrid nên test phải có hạ tầng thật. Tôi cho nghiệp vụ định nghĩa `OrderRepository` và `Notifier`, hạ tầng cài đặt chúng, và nối dây ở module gốc. Kết quả: test bằng bản giả trong bộ nhớ, đổi nhà cung cấp chỉ sửa một adapter. Cái giá là thêm vài interface và file nối dây.

**Mẫu trả lời: "SOLID có luôn đúng không?"**

> Không. Nó giải quyết đau khi thay đổi; nếu phần đó ổn định thì trừu tượng hóa chỉ thêm gián tiếp. Tôi áp dụng ở ranh giới dễ đổi như hạ tầng và quy tắc nghiệp vụ hay thay, và theo Rule of Three: chỉ rút trừu tượng khi có trường hợp thứ ba.

### Câu hỏi quay ngược nên chuẩn bị

- "Cho ví dụ code vi phạm từng nguyên tắc và cách sửa?"
- "SRP khác 'một class một method' chỗ nào?"
- "`Square extends Rectangle` sai ở đâu?"
- "DIP khác DI và IoC thế nào?"
- "Nguyên tắc nào bạn thấy khó áp dụng nhất, vì sao?"
- "Khi nào bạn **không** áp dụng SOLID?"

### Danh sách rà nhanh

- [ ] Nêu năm nguyên tắc kèm một dấu hiệu vi phạm mỗi cái.
- [ ] Giải thích SRP theo "lý do thay đổi/actor".
- [ ] Refactor `switch` thành Strategy và nói được OCP đạt bằng cách nào.
- [ ] Kể ví dụ hình vuông và chim cánh cụt, nêu quy tắc tiền/hậu điều kiện.
- [ ] Tách một interface béo theo vai trò client.
- [ ] Phân biệt DIP, DI, IoC; nói interface thuộc về phía cấp cao.
- [ ] Liên hệ SOLID với Strategy, Adapter, Clean Architecture.
- [ ] Nêu lúc không nên áp dụng và Rule of Three.

**Tự trả lời:** tự nói trước gương "SOLID là gì và khi nào tôi không dùng nó" trong 60 giây.

## Từ điển nhanh

| Thuật ngữ | Giải thích |
|---|---|
| SOLID | Năm nguyên tắc: SRP, OCP, LSP, ISP, DIP |
| SRP | Một class có một lý do để thay đổi |
| Actor | Nhóm người dùng/bên yêu cầu chịu trách nhiệm thay đổi một phần code |
| OCP | Mở để mở rộng, đóng để sửa đổi |
| LSP | Lớp con thay được lớp cha mà chương trình vẫn đúng |
| ISP | Đừng ép client phụ thuộc method nó không dùng |
| DIP | Phụ thuộc abstraction, không phụ thuộc chi tiết |
| Dependency Injection | Truyền phụ thuộc từ ngoài vào, thường qua constructor |
| IoC container | Công cụ tự tạo và lắp object (NestJS, Spring) |
| Composition root | Nơi duy nhất lắp các lớp cụ thể lại với nhau |
| Port | Interface do nghiệp vụ định nghĩa cho thứ nó cần |
| Adapter | Cài đặt port bằng công nghệ cụ thể (DB, SDK) |
| Tiền điều kiện | Điều phải đúng trước khi gọi method |
| Hậu điều kiện | Điều method đảm bảo sau khi chạy |
| Bất biến (invariant) | Điều luôn đúng với một object hợp lệ |
| Design by contract | Mô tả hành vi bằng tiền điều kiện, hậu điều kiện, bất biến |
| Covariance | Kiểu trả về của lớp con có thể cụ thể hơn |
| Contravariance | Kiểu tham số của lớp con có thể tổng quát hơn |
| Strategy | Pattern đóng gói thuật toán hoán đổi được, hiện thực OCP |
| Decorator | Pattern thêm hành vi bằng cách bọc cùng interface |
| Rule of Three | Rút trừu tượng khi có trường hợp thứ ba |
| YAGNI | Đừng cài thứ chưa cần |
| Over-engineering | Thiết kế phức tạp hơn nhu cầu thật |
| Dependency Rule | Phụ thuộc mã nguồn chỉ hướng vào trong, về phía domain |
