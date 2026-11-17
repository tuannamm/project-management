# OOP — Lập trình hướng đối tượng

Sổ tay ôn OOP cho phỏng vấn: bốn trụ cột (đóng gói, trừu tượng, kế thừa, đa hình), composition so với inheritance, quan hệ giữa các lớp, SOLID (tóm tắt, bản đầy đủ ở sổ tay riêng), coupling/cohesion, các design pattern hay gặp, OOP trong TypeScript/JavaScript, và những anti-pattern. Code minh họa bằng TypeScript, **chưa chạy thử** trong dự án này; đây là tài liệu lý thuyết tổng quát, không mô tả code của dự án.

Học theo thứ tự 0–13. Mỗi ngày đọc hai chủ đề, tự nói câu trả lời trong 60–90 giây theo khung: định nghĩa → vì sao / đánh đổi → ví dụ. Trạng thái 📖 là tài liệu lý thuyết, không khẳng định bạn đã học thuộc.

## Bảng tiến độ

| # | Chủ đề | Nhóm | Trạng thái |
|---|---|---|---|
| 0 | OOP trong 60 giây | Nền tảng | 📖 |
| 1 | Class, object và vòng đời | Nền tảng | 📖 |
| 2 | Encapsulation (đóng gói) | Bốn trụ cột | 📖 |
| 3 | Abstraction (trừu tượng) | Bốn trụ cột | 📖 |
| 4 | Inheritance (kế thừa) | Bốn trụ cột | 📖 |
| 5 | Polymorphism (đa hình) | Bốn trụ cột | 📖 |
| 6 | Composition so với Inheritance | Thiết kế | 📖 |
| 7 | Quan hệ giữa các lớp | Thiết kế | 📖 |
| 8 | SOLID | Thiết kế | 📖 |
| 9 | Coupling, cohesion và các nguyên tắc nhỏ | Thiết kế | 📖 |
| 10 | Design pattern hay gặp | Thực hành | 📖 |
| 11 | OOP trong TypeScript và JavaScript | Thực hành | 📖 |
| 12 | Anti-pattern và OOP so với FP | Thực hành | 📖 |
| 13 | Cách nói khi phỏng vấn | Thực hành | 📖 |

## 0. OOP trong 60 giây

**OOP (Object-Oriented Programming)** là cách tổ chức chương trình thành các **object**: mỗi object gói **dữ liệu (state)** cùng **hành vi (method)** thao tác trên dữ liệu đó, và các object giao tiếp với nhau bằng cách **gửi message** (gọi method).

Bốn trụ cột hay được hỏi:

| Trụ cột | Một câu | Lợi ích chính |
|---|---|---|
| Encapsulation | Giấu state, chỉ cho đổi qua method giữ được quy tắc | Bảo vệ invariant, đổi nội bộ không vỡ code ngoài |
| Abstraction | Chỉ lộ "làm gì", giấu "làm thế nào" | Giảm độ phức tạp người dùng phải nhớ |
| Inheritance | Lớp con tái dùng và mở rộng lớp cha | Tái dùng code, mô hình quan hệ "là một" |
| Polymorphism | Cùng một lời gọi, hành vi tùy kiểu thật của object | Thêm kiểu mới không sửa code gọi |

### Ví dụ đời thường: máy ATM

Bạn bấm "rút 500k". Bạn không biết (và không cần biết) máy kiểm tra số dư thế nào, đếm tiền ra sao. Đó là **abstraction** và **encapsulation**: giao diện nhỏ, ruột bị giấu. Máy của ngân hàng A hay B khác nhau bên trong nhưng bạn thao tác giống nhau: đó là **polymorphism**.

### Ví dụ xuyên suốt: thanh toán đơn hàng

Bài toán: một cửa hàng online nhận đơn, tính tổng tiền, rồi cho khách trả bằng **thẻ**, **ví điện tử** hoặc **chuyển khoản**. Dưới đây là toàn bộ thiết kế hoàn chỉnh; đọc một lần ở đây là đủ, các bài sau chỉ lấy lại từng mảnh và đều có code kèm theo.

**Ai làm gì (mỗi object một trách nhiệm):**

| Object | Vai trò | Giữ state gì |
|---|---|---|
| `Money` | Số tiền kèm đơn vị, bất biến | `amount`, `currency` |
| `OrderItem` | Một dòng hàng trong đơn | `name`, `price`, `qty` |
| `Order` | Đơn hàng, tự giữ quy tắc trạng thái NEW → PAID → SHIPPED | danh sách `items`, `status` |
| `PaymentMethod` | Hợp đồng "biết trả tiền", chỉ có `pay(amount)` | không có (interface) |
| `CardPayment`, `EWalletPayment`, `BankTransferPayment` | Ba cách trả cụ thể, cùng cài `PaymentMethod` | mỗi cái giữ thứ riêng (cổng thẻ, số tài khoản...) |
| `Checkout` | Điều phối: nhận đơn và một cách trả, thực hiện thanh toán | `PaymentMethod` được truyền vào |

**Code đầy đủ:**

```ts
// 1. Value object: bất biến, so sánh theo giá trị
class Money {
  constructor(readonly amount: number, readonly currency: string) {}
  add(o: Money): Money {
    if (o.currency !== this.currency) throw new Error('Khác đơn vị tiền');
    return new Money(this.amount + o.amount, this.currency);
  }
}

// 2. Một dòng hàng
class OrderItem {
  constructor(readonly name: string, readonly price: Money, readonly qty: number) {}
  get subtotal(): Money { return new Money(this.price.amount * this.qty, this.price.currency); }
}

// 3. Order: đóng gói state và quy tắc trạng thái
type OrderStatus = 'NEW' | 'PAID' | 'SHIPPED';

class Order {
  private items: OrderItem[] = [];
  private status: OrderStatus = 'NEW';

  addItem(item: OrderItem): void {
    if (this.status !== 'NEW') throw new Error('Đơn đã khóa, không thêm hàng');
    this.items.push(item);
  }
  get total(): Money {
    return this.items.reduce((sum, i) => sum.add(i.subtotal), new Money(0, 'VND'));
  }
  markPaid(): void {
    if (this.items.length === 0) throw new Error('Đơn rỗng');
    this.status = 'PAID';
  }
  ship(): void {
    if (this.status !== 'PAID') throw new Error('Chưa thanh toán');
    this.status = 'SHIPPED';
  }
}

// 4. Abstraction: hợp đồng chung cho mọi cách trả tiền
interface PaymentResult { ok: boolean; reference?: string }
interface PaymentMethod {
  pay(amount: Money): Promise<PaymentResult>;
}

// 5. Ba cài đặt cụ thể (cách làm khác nhau, hợp đồng giống nhau)
class CardPayment implements PaymentMethod {
  constructor(private readonly gateway: { charge(m: Money): Promise<string> }) {}
  async pay(amount: Money) {
    const ref = await this.gateway.charge(amount);
    return { ok: true, reference: ref };
  }
}
class EWalletPayment implements PaymentMethod {
  constructor(private readonly wallet: { debit(m: Money): Promise<boolean> }) {}
  async pay(amount: Money) { return { ok: await this.wallet.debit(amount) }; }
}
class BankTransferPayment implements PaymentMethod {
  constructor(private readonly accountNo: string) {}
  async pay(amount: Money) {
    // chỉ sinh nội dung chuyển khoản; tiền về sau thì mới xác nhận
    return { ok: true, reference: `CK-${this.accountNo}-${amount.amount}` };
  }
}

// 6. Checkout chỉ biết hợp đồng PaymentMethod, không biết cách trả cụ thể
class Checkout {
  constructor(private readonly method: PaymentMethod) {}
  async complete(order: Order): Promise<void> {
    const result = await this.method.pay(order.total);
    if (!result.ok) throw new Error('Thanh toán thất bại');
    order.markPaid();
  }
}
```

**Chạy thử một luồng hoàn chỉnh:**

```ts
const order = new Order();
order.addItem(new OrderItem('Áo thun', new Money(150_000, 'VND'), 2)); // 300.000
order.addItem(new OrderItem('Nón', new Money(80_000, 'VND'), 1));      // 80.000
// order.total = 380.000 VND

await new Checkout(new CardPayment(cardGateway)).complete(order);   // khách chọn thẻ
// hoặc: new Checkout(new EWalletPayment(momoWallet))
// hoặc: new Checkout(new BankTransferPayment('0123456789'))

order.ship();   // hợp lệ vì đã PAID; gọi trước khi trả tiền sẽ ném lỗi
```

**Ví dụ này minh họa bốn trụ cột như thế nào:**

| Trụ cột | Thấy ở đâu trong ví dụ |
|---|---|
| Encapsulation | `Order` giấu `items` và `status`; chỉ đổi qua `addItem`, `markPaid`, `ship`. Không ai gán `order.status = 'SHIPPED'` được |
| Abstraction | `Checkout` chỉ biết `PaymentMethod.pay()`, không biết gọi cổng thẻ hay ví |
| Inheritance / realization | Ba lớp thanh toán cùng `implements PaymentMethod` |
| Polymorphism | `this.method.pay(...)` chạy cách trả tiền khác nhau tùy object được truyền vào; thêm `CryptoPayment` chỉ cần thêm một class, `Checkout` không đổi |

**Bẫy phỏng vấn:** trả lời "OOP là có class". Class chỉ là công cụ; ý chính là **object tự quản lý state của mình và giao tiếp qua message**. Một đống class chỉ chứa getter/setter (anemic) vẫn là code thủ tục trá hình.

**Tự trả lời:** giải thích bốn trụ cột cho người chưa học lập trình, mỗi trụ một câu, dùng ví dụ máy ATM.

## 1. Class, object và vòng đời

**Class** là bản thiết kế (kiểu): khai báo các field và method. **Object (instance)** là một thực thể cụ thể tạo ra từ class, có state riêng.

```ts
class Money {
  constructor(
    public readonly amount: number,   // đơn vị nhỏ nhất, ví dụ đồng
    public readonly currency: string,
  ) {}

  add(other: Money): Money {
    if (other.currency !== this.currency) throw new Error('Khác đơn vị tiền');
    return new Money(this.amount + other.amount, this.currency);
  }
}

const a = new Money(100_000, 'VND'); // object 1
const b = new Money(50_000, 'VND');  // object 2, state độc lập với a
```

### Các thành phần của class

| Thành phần | Ý nghĩa |
|---|---|
| Field (thuộc tính) | Dữ liệu của từng object (instance field) |
| Method | Hành vi, đọc/ghi state của object |
| Constructor | Khởi tạo object ở trạng thái hợp lệ ngay từ đầu |
| `static` member | Thuộc về class, không thuộc object nào (dùng dè dặt: khó test, dễ thành global state) |
| Access modifier | `public`, `protected`, `private` kiểm soát ai được truy cập |

### Identity, state, behavior

- **Identity:** object này khác object kia dù state giống nhau (`===` so sánh tham chiếu).
- **State:** giá trị các field tại một thời điểm.
- **Behavior:** những gì object làm được.

### Value object và entity

- **Value object:** định nghĩa bằng giá trị, thường **bất biến** (`Money`, `Email`, `DateRange`). Hai `Money(100, 'VND')` coi là bằng nhau.
- **Entity:** định nghĩa bằng danh tính (`User` có id). Đổi tên vẫn là cùng một user.

### Constructor phải tạo object hợp lệ

Object không nên tồn tại ở trạng thái "nửa vời". Kiểm tra invariant trong constructor hoặc factory method, đừng để người dùng gọi `new Order()` rồi mới set từng field.

**Bẫy phỏng vấn:** nhầm class với object, hoặc nói "object là instance của class" rồi không giải thích được vì sao hai object cùng class lại có state khác nhau. Ngoài ra: nhầm `static` là "toàn cục tiện lợi". `static` mutable state là biến toàn cục trá hình.

**Tự trả lời:** khác nhau giữa value object và entity là gì? Cho một ví dụ mỗi loại.

## 2. Encapsulation (đóng gói)

**Encapsulation** gồm hai ý thường bị lẫn: (1) **gom** dữ liệu và hành vi vào một đơn vị, (2) **giấu** state nội bộ, chỉ cho thay đổi qua method bảo vệ được quy tắc (**invariant**).

### Không đóng gói: ai cũng sửa được

```ts
class Order {
  items: OrderItem[] = [];
  status = 'NEW';
  total = 0;
}

const order = new Order();
order.status = 'SHIPPED';   // nhảy cóc, chưa thanh toán
order.total = -5;           // giá trị vô lý
```

### Đóng gói: object tự giữ quy tắc

```ts
type OrderStatus = 'NEW' | 'PAID' | 'SHIPPED';

class Order {
  private items: OrderItem[] = [];
  private status: OrderStatus = 'NEW';

  addItem(item: OrderItem): void {
    if (this.status !== 'NEW') throw new Error('Đơn đã khóa, không thêm hàng');
    this.items.push(item);
  }

  pay(): void {
    if (this.items.length === 0) throw new Error('Đơn rỗng');
    this.status = 'PAID';
  }

  ship(): void {
    if (this.status !== 'PAID') throw new Error('Chưa thanh toán');
    this.status = 'SHIPPED';
  }

  get total(): Money {
    return this.items.reduce((sum, i) => sum.add(i.subtotal), new Money(0, 'VND'));
  }
}
```

`total` được **tính** từ `items`, không lưu rời để tránh hai nguồn sự thật lệch nhau.

### Access modifier

| Modifier | Ai truy cập được | Ghi chú |
|---|---|---|
| `public` | Mọi nơi | Đây là hợp đồng với bên ngoài, đổi sẽ vỡ người dùng |
| `protected` | Chính lớp và lớp con | Lớp con bị gắn với ruột lớp cha, dùng dè dặt |
| `private` | Chỉ chính lớp | Mặc định nên chọn |

### Getter/setter không tự động là đóng gói

Một class có `private` field cộng với getter và setter cho **mọi** field vẫn lộ hết state, chỉ thêm một lớp vỏ. Đóng gói thật là **method theo nghiệp vụ** (`pay()`, `ship()`) thay vì `setStatus()`.

### Tell, Don't Ask

Đừng hỏi object lấy dữ liệu ra rồi quyết định hộ nó. Hãy bảo nó làm.

```ts
// Ask: logic nằm ở ngoài, lặp lại khắp nơi
if (order.getStatus() === 'PAID' && order.getItems().length > 0) order.setStatus('SHIPPED');

// Tell: object tự quyết định
order.ship();
```

### Lợi ích

- Giữ **invariant** ở một chỗ duy nhất.
- Đổi cấu trúc nội bộ (mảng thành Map) không vỡ code ngoài.
- Dễ test: hành vi qua method công khai.

**Bẫy phỏng vấn:** nói "encapsulation là dùng private". Private là **cơ chế**, mục đích là **bảo vệ invariant và ẩn quyết định thiết kế**. Bẫy thứ hai: getter trả về mảng nội bộ cho phép người ngoài `push` thẳng vào; phải trả bản sao hoặc `readonly`.

**Tự trả lời:** vì sao `setStatus('SHIPPED')` tệ hơn `ship()`? Nêu hai lý do.

## 3. Abstraction (trừu tượng)

**Abstraction** là chọn ra những gì quan trọng với người dùng và **giấu phần còn lại**. Người dùng làm việc với **hợp đồng** (what), không biết **cách làm** (how).

### Encapsulation và abstraction khác nhau thế nào?

| Tiêu chí | Abstraction | Encapsulation |
|---|---|---|
| Trả lời câu hỏi | Lộ ra cái gì? | Giấu và bảo vệ cái gì? |
| Mức | Thiết kế (khái niệm, giao diện) | Cài đặt (field, modifier) |
| Công cụ | interface, abstract class, đặt tên | private, method nghiệp vụ |

Hai thứ đi cùng nhau: abstraction chọn giao diện, encapsulation giữ ruột phía sau giao diện đó.

### Interface

Interface là hợp đồng thuần: chỉ khai báo chữ ký, không có state.

```ts
interface PaymentMethod {
  pay(amount: Money): Promise<PaymentResult>;
}

class CardPayment implements PaymentMethod {
  constructor(private readonly gateway: CardGateway) {}
  async pay(amount: Money) { return this.gateway.charge(amount); }
}

class EWalletPayment implements PaymentMethod {
  async pay(amount: Money) { /* gọi API ví */ return { ok: true }; }
}
```

### Abstract class

Abstract class không tạo trực tiếp được, có thể chứa **cả** phần đã cài sẵn **và** phần để lớp con điền (template method).

```ts
abstract class Report {
  // template method: khung cố định
  generate(): string {
    return [this.header(), this.body(), this.footer()].join('\n');
  }
  protected header(): string { return '=== BÁO CÁO ==='; }
  protected abstract body(): string;     // lớp con bắt buộc cài
  protected footer(): string { return '=== HẾT ==='; }
}
```

### Interface so với abstract class

| Tiêu chí | Interface | Abstract class |
|---|---|---|
| State (field) | Không | Có |
| Code cài sẵn | Không (TypeScript) | Có |
| Một lớp dùng được | Nhiều interface | Chỉ kế thừa một lớp |
| Dùng khi | Định nghĩa **khả năng / hợp đồng**, nhiều cài đặt không liên quan nhau | Các lớp con **chia sẻ code và state**, có khung thuật toán chung |
| Quan hệ | "có thể làm" (can-do) | "là một" (is-a) |

Quy tắc chọn nhanh: mặc định dùng **interface**; chỉ dùng abstract class khi thật sự cần chia sẻ state hoặc code.

### Leaky abstraction

Abstraction "rò" khi người dùng buộc phải biết chi tiết bên dưới để dùng đúng. Ví dụ `Repository` che SQL nhưng hiệu năng phụ thuộc N+1 query; `ORM` che DB nhưng bạn vẫn phải hiểu transaction. Không có abstraction nào kín hoàn toàn: mục tiêu là rò **ít và có chủ đích**.

**Bẫy phỏng vấn:** trả lời "abstraction là dùng abstract class/interface". Đó là công cụ; bản chất là **che độ phức tạp bằng giao diện đơn giản**. Hỏi tiếp thường là "interface khác abstract class chỗ nào" (bảng trên).

**Tự trả lời:** cho ví dụ một abstraction tốt và một abstraction rò rỉ bạn từng gặp.

## 4. Inheritance (kế thừa)

**Inheritance** cho phép lớp con (subclass) nhận field và method của lớp cha (superclass), thêm hoặc **ghi đè (override)** hành vi. Mô hình quan hệ **is-a**.

```ts
class Account {
  constructor(protected balance: Money) {}
  deposit(m: Money) { this.balance = this.balance.add(m); }
}

class SavingsAccount extends Account {
  addInterest(rate: number) {
    this.deposit(new Money(Math.round(this.balance.amount * rate), 'VND'));
  }
}
```

### Các kiểu kế thừa

| Kiểu | Ý nghĩa | Hỗ trợ |
|---|---|---|
| Đơn (single) | Một lớp cha | Java, C#, TS/JS |
| Đa (multiple) | Nhiều lớp cha | C++, Python. Java/TS/JS không cho kế thừa nhiều **class** |
| Nhiều tầng (multilevel) | A → B → C | Phổ biến, nhưng cây sâu là mùi xấu |

### Vấn đề kim cương (diamond problem)

Lớp D kế thừa B và C, cả hai kế thừa A. Nếu B và C cùng override `foo()`, D gọi `foo()` của ai? Ngôn ngữ giải quyết bằng quy tắc thứ tự (MRO của Python) hoặc **cấm** kế thừa nhiều class và cho cài **nhiều interface** (Java, C#, TS).

### `super`, ghi đè, ẩn

- `super(...)` trong constructor gọi constructor lớp cha, phải gọi trước khi dùng `this`.
- **Override** thay đổi hành vi method cha cùng chữ ký.
- Gọi method có thể bị override ngay trong constructor là bẫy: lớp con chưa khởi tạo xong mà đã bị gọi.

### Khi nào kế thừa đúng?

Chỉ khi lớp con **thật sự thay thế được** lớp cha ở mọi nơi dùng lớp cha (Liskov, bài 8). Nếu chỉ muốn **tái dùng code**, hãy dùng composition (bài 6).

### Ví dụ kinh điển: Hình chữ nhật và hình vuông

Về toán, hình vuông "là" hình chữ nhật. Nhưng nếu `Rectangle` có `setWidth` và `setHeight` độc lập, `Square extends Rectangle` buộc đổi cả hai cùng lúc, làm hỏng giả định của code dùng `Rectangle` (đặt width 5, height 4, mong diện tích 20). Đây là vi phạm Liskov: **is-a về ngôn ngữ đời thường chưa chắc là is-a về hành vi**.

### Fragile base class

Sửa lớp cha có thể vô tình làm hỏng lớp con vì lớp con phụ thuộc vào chi tiết cài đặt của cha. Càng nhiều `protected` và cây càng sâu, càng mong manh.

**Bẫy phỏng vấn:** nói "kế thừa để tái dùng code". Đó là lý do **tệ** nhất để kế thừa. Bẫy khác: nói Java "không có đa kế thừa" mà không nhắc **interface** (và `default` method) vẫn cho đa kế thừa kiểu/hợp đồng.

**Tự trả lời:** `Square extends Rectangle` sai ở đâu? Giải thích bằng một đoạn code ngắn.

## 5. Polymorphism (đa hình)

**Polymorphism** là cùng một lời gọi nhưng hành vi phụ thuộc kiểu thật của object. Nhờ đó code gọi **không cần biết** có bao nhiêu kiểu cụ thể và **không phải sửa** khi thêm kiểu mới.

### Hai loại chính

| Loại | Còn gọi | Quyết định lúc | Cơ chế |
|---|---|---|---|
| Subtype polymorphism | Runtime, dynamic dispatch | Chạy | Override, interface |
| Overloading | Compile-time, static | Biên dịch | Cùng tên khác tham số (Java/C#; TS chỉ có overload chữ ký) |
| Parametric | Generics | Biên dịch | `Array<T>`, `identity<T>` |

Khi phỏng vấn, "đa hình" thường nghĩa là **subtype polymorphism**.

### Ví dụ: bỏ `if/switch` theo kiểu

```ts
// Không đa hình: thêm phương thức thanh toán phải sửa hàm này
function pay(method: string, amount: Money) {
  if (method === 'card') { /* ... */ }
  else if (method === 'ewallet') { /* ... */ }
  else if (method === 'bank') { /* ... */ }
}

// Đa hình: thêm kiểu mới chỉ thêm class, code gọi không đổi
class Checkout {
  constructor(private readonly method: PaymentMethod) {}
  complete(amount: Money) { return this.method.pay(amount); }
}
```

Đây chính là **Open/Closed** (bài 8): mở để mở rộng, đóng để sửa.

### Dynamic dispatch hoạt động thế nào

Biến có **kiểu khai báo** (`PaymentMethod`) và đối tượng thật có **kiểu thực** (`CardPayment`). Lúc chạy, lời gọi `method.pay()` được tra theo kiểu thực (qua bảng hàm ảo vtable ở C++/Java, qua prototype chain ở JS).

### Override so với overload

| | Override | Overload |
|---|---|---|
| Ở đâu | Lớp con thay method của lớp cha | Cùng lớp, nhiều method cùng tên |
| Chữ ký | Giống hệt | Khác tham số |
| Quyết định | Lúc chạy | Lúc biên dịch |

### Upcasting và downcasting

- **Upcast:** coi object con là kiểu cha. An toàn, ngầm định.
- **Downcast:** ép từ kiểu cha về kiểu con. Có thể lỗi lúc chạy, và thường là dấu hiệu thiết kế kém (phải hỏi "mày là kiểu gì" thay vì để đa hình lo).

**Bẫy phỏng vấn:** nhầm override với overload; hoặc không giải thích được **vì sao** đa hình có ích. Câu trả lời tốt: nó loại bỏ chuỗi `if/switch` theo kiểu và cho phép thêm hành vi mới mà không sửa code cũ.

**Tự trả lời:** viết một ví dụ đa hình thay cho `switch (shape.type)` tính diện tích hình.

## 6. Composition so với Inheritance

**Composition (hợp thành):** một object **chứa** object khác và **ủy quyền** công việc cho nó (quan hệ **has-a**). Nguyên tắc nổi tiếng của GoF: **"ưu tiên composition hơn inheritance"**.

### Vì sao kế thừa dễ đau

- **Gắn chặt (tight coupling):** lớp con phụ thuộc chi tiết lớp cha.
- **Cây nổ tung:** `Bird`, `FlyingBird`, `SwimmingBird`, `FlyingSwimmingBird`... mỗi tổ hợp một lớp.
- **Khó đổi lúc chạy:** kế thừa chốt hành vi lúc biên dịch; composition thay được lúc chạy.
- Lộ nhiều hơn mức cần: lớp con thừa hưởng **tất cả** method public của cha.

### Cùng bài toán, hai cách

```ts
// Kế thừa: bùng nổ tổ hợp
class Duck { fly() {} swim() {} }
class RubberDuck extends Duck { /* không bay được, phải override ném lỗi? */ }

// Composition: ghép hành vi
interface FlyBehavior { fly(): void }
class CanFly implements FlyBehavior { fly() { /* bay */ } }
class CannotFly implements FlyBehavior { fly() { /* đứng yên */ } }

class Duck {
  constructor(private readonly flyBehavior: FlyBehavior) {}
  performFly() { this.flyBehavior.fly(); }
}

const mallard = new Duck(new CanFly());
const rubber = new Duck(new CannotFly());
```

Muốn `Duck` đổi hành vi giữa chừng (bị thương thì không bay được): thay `flyBehavior`, không cần lớp mới. Đây là **Strategy pattern** (bài 10).

### So sánh

| Tiêu chí | Inheritance | Composition |
|---|---|---|
| Quan hệ | is-a | has-a |
| Gắn kết | Chặt (compile-time) | Lỏng (đổi lúc chạy được) |
| Tái dùng | Thừa hưởng cả khối | Chọn đúng phần cần |
| Test | Phải dựng cả cây | Thay phần phụ thuộc bằng mock |
| Phù hợp | Phân cấp ổn định, đúng Liskov | Hầu hết trường hợp khác |

### Khi nào vẫn nên kế thừa?

- Quan hệ is-a **thật**, lớp con thay thế được cha ở mọi nơi.
- Framework yêu cầu (kế thừa `Error`, component base class).
- Template method với khung thuật toán ổn định.

### Dependency Injection là composition

Truyền phụ thuộc qua constructor (như `Checkout` nhận `PaymentMethod`) là composition + **hướng tới interface**. Đây là nền của Dependency Inversion (bài 8).

**Bẫy phỏng vấn:** nói "composition luôn tốt hơn". Chính xác hơn: **ưu tiên** composition, nhưng kế thừa vẫn đúng khi is-a thật sự. Bẫy khác: nhầm composition (object chứa) với **composition trong UML** (quan hệ sở hữu chặt, xem bài 7).

**Tự trả lời:** thiết kế lại hệ `Bird → FlyingBird → SwimmingBird` bằng composition.

## 7. Quan hệ giữa các lớp

Bốn quan hệ hay gặp, từ lỏng đến chặt: **dependency → association → aggregation → composition**; cộng thêm **inheritance** và **realization**.

| Quan hệ | Ý nghĩa | Vòng đời | Ví dụ | Ký hiệu UML |
|---|---|---|---|---|
| Dependency | Dùng tạm (tham số, biến cục bộ) | Không ràng buộc | `Checkout` dùng `Logger` | Mũi tên nét đứt |
| Association | Biết và giữ tham chiếu | Độc lập | `Order` có `Customer` | Đường thẳng |
| Aggregation | "Có" kiểu tập hợp, phần tồn tại độc lập | Phần sống tiếp khi cha mất | `Team` có `Player` | Thoi rỗng |
| Composition | "Sở hữu" chặt, phần chết theo | Phần chết khi cha mất | `Order` có `OrderItem` | Thoi đặc |
| Inheritance | is-a | Gắn kiểu | `SavingsAccount` là `Account` | Mũi tên rỗng nét liền |
| Realization | Cài đặt interface | Gắn hợp đồng | `CardPayment` cài `PaymentMethod` | Mũi tên rỗng nét đứt |

### Phân biệt aggregation và composition

Câu hỏi quyết định: **phần có tồn tại một mình khi cha bị xóa không?**

- Xóa `Team`, các `Player` vẫn còn trong hệ thống → aggregation.
- Xóa `Order`, các `OrderItem` vô nghĩa → composition.

```ts
class Order {                       // composition: Order tạo và sở hữu items
  private items: OrderItem[] = [];
  addItem(productId: string, qty: number) {
    this.items.push(new OrderItem(productId, qty));
  }
}

class Team {                        // aggregation: players được truyền từ ngoài
  constructor(private players: Player[]) {}
}
```

Trong thực tế phỏng vấn, đừng sa đà vào phân biệt thoi rỗng/đặc; nêu được **câu hỏi về vòng đời** là đủ.

### Multiplicity

`1..1`, `0..*`, `1..*`: một `Customer` có `0..*` `Order`, một `Order` thuộc `1..1` `Customer`. Quan hệ nhiều-nhiều thường tách bằng lớp trung gian (`Enrollment` giữa `Student` và `Course`).

### Dependency hướng nào?

Giảm số mũi tên và **chỉ hướng phụ thuộc về phía ổn định** (interface, domain), không về phía hay đổi (chi tiết hạ tầng). Xem Dependency Inversion ở bài 8.

**Bẫy phỏng vấn:** nhầm aggregation với composition, hoặc dùng association cho mọi thứ. Mẹo trả lời: nêu **vòng đời** của phần được chứa.

**Tự trả lời:** `Library` và `Book`, `Car` và `Engine`, `Order` và `OrderItem`: mỗi cặp là quan hệ gì và vì sao?

## 8. SOLID

SOLID đã được tách thành **sổ tay riêng** (`#solid`) với ví dụ vi phạm và cách sửa cho từng nguyên tắc, bài refactor xuyên suốt, liên hệ với pattern và kiến trúc, NestJS và lúc không nên áp dụng. Ở đây chỉ giữ bản tóm tắt để đặt SOLID vào bức tranh OOP.

| Chữ | Nguyên tắc | Một câu | Dấu hiệu vi phạm |
|---|---|---|---|
| S | Single Responsibility | Một class chỉ có một lý do để thay đổi | Class dài, sửa vì nhiều yêu cầu khác nhau |
| O | Open/Closed | Mở để mở rộng, đóng để sửa đổi | Chuỗi `if/switch` theo kiểu |
| L | Liskov Substitution | Lớp con thay được lớp cha mà chương trình vẫn đúng | Override ném lỗi, kiểm tra kiểu trước khi gọi |
| I | Interface Segregation | Đừng ép client phụ thuộc method nó không dùng | `throw new Error('not supported')` |
| D | Dependency Inversion | Phụ thuộc abstraction, không phụ thuộc chi tiết | `new` thẳng DB/SDK trong lớp nghiệp vụ |

SOLID liên hệ trực tiếp với các bài khác: đa hình (bài 5) là cơ chế của OCP, kế thừa (bài 4) bị LSP kiểm tra, composition (bài 6) là nền của DIP.

**Bẫy phỏng vấn:** liệt kê đủ năm chữ nhưng không cho được ví dụ vi phạm. Phần đào sâu nằm ở sổ tay SOLID.

**Tự trả lời:** nêu mỗi chữ của SOLID một dấu hiệu vi phạm, rồi mở sổ tay SOLID đối chiếu.

## 9. Coupling, cohesion và các nguyên tắc nhỏ

### Coupling (độ gắn kết giữa các module)

Mức module này **biết** về module kia. Muốn **thấp**.

| Mức (tệ → tốt) | Mô tả |
|---|---|
| Content coupling | Sửa trực tiếp ruột module khác |
| Common coupling | Cùng dùng biến toàn cục |
| Control coupling | Truyền cờ điều khiển hành vi của module kia |
| Data coupling | Chỉ truyền dữ liệu cần thiết qua tham số |
| Message coupling | Chỉ giao tiếp qua interface/event |

### Cohesion (độ kết dính trong một module)

Mức các thành phần trong module **thuộc về nhau**. Muốn **cao**: mọi method cùng làm việc với cùng một tập dữ liệu và phục vụ một mục đích. Dấu hiệu thấp: class tên `Utils`, `Manager`, `Helper` chứa đủ thứ.

Câu thần chú: **low coupling, high cohesion**.

### Các nguyên tắc nhỏ hay hỏi

| Nguyên tắc | Nội dung |
|---|---|
| DRY | Mỗi tri thức có một nơi duy nhất. Đừng trộn lẫn "trùng code" với "trùng ý nghĩa": hai đoạn code giống nhau tình cờ nhưng thay đổi vì lý do khác nhau thì **không** gộp |
| KISS | Giữ đơn giản |
| YAGNI | Đừng cài thứ chưa cần |
| Law of Demeter | Chỉ nói chuyện với "bạn bè gần": đừng viết `a.getB().getC().doX()` |
| Tell, Don't Ask | Bảo object làm, đừng lấy dữ liệu ra tự quyết (bài 2) |
| Favor immutability | Object bất biến an toàn khi chia sẻ, dễ suy luận, thread-safe |
| Program to an interface | Phụ thuộc interface, không phụ thuộc lớp cụ thể |

### Law of Demeter minh họa

```ts
// Vi phạm: biết cấu trúc nội bộ của hai object
const city = order.getCustomer().getAddress().getCity();

// Tốt hơn: hỏi thẳng đối tượng gần nhất
const city = order.shippingCity();
```

### Bất biến (immutability)

```ts
class DateRange {
  constructor(readonly from: Date, readonly to: Date) {
    if (to < from) throw new Error('to phải sau from');
    Object.freeze(this);
  }
  withTo(to: Date) { return new DateRange(this.from, to); } // trả object mới
}
```

**Bẫy phỏng vấn:** nhầm chiều: "coupling cao là tốt vì code liên kết chặt". Ngược lại: coupling **thấp**, cohesion **cao**. Và khi nói DRY, nêu được phản ví dụ gộp nhầm.

**Tự trả lời:** `UserManager` có `login`, `sendEmail`, `exportCsv`, `calculateTax`: đánh giá cohesion và đề xuất cách tách.

## 10. Design pattern hay gặp

**Design pattern** là lời giải đã được kiểm chứng cho một bài toán thiết kế lặp lại (bộ **GoF** 23 pattern chia ba nhóm: Creational, Structural, Behavioral). Học để có **từ vựng chung** và gợi ý giải pháp, không phải để áp dụng mọi nơi.

### Creational: tạo object

**Singleton** — chỉ một instance toàn ứng dụng.

```ts
class Config {
  private static instance?: Config;
  private constructor(readonly values: Record<string, string>) {}
  static get(): Config { return (Config.instance ??= new Config(loadEnv())); }
}
```

Hay bị xem là **anti-pattern**: là biến toàn cục trá hình, khó test, ẩn phụ thuộc. Thay bằng một instance do DI container quản lý.

**Factory Method / Abstract Factory** — giao việc tạo object cho một hàm/lớp để code gọi không `new` thẳng lớp cụ thể.

```ts
class PaymentFactory {
  create(kind: 'card' | 'ewallet'): PaymentMethod {
    return kind === 'card' ? new CardPayment(gateway) : new EWalletPayment();
  }
}
```

**Builder** — dựng object phức tạp từng bước (nhiều tham số tùy chọn).

### Structural: ghép object

**Adapter** — bọc một interface không khớp thành interface bạn cần (bọc SDK bên thứ ba).

```ts
class StripeAdapter implements PaymentMethod {
  constructor(private readonly stripe: StripeClient) {}
  async pay(m: Money) {
    const r = await this.stripe.charges.create({ amount: m.amount, currency: m.currency });
    return { ok: r.status === 'succeeded' };
  }
}
```

**Decorator** — thêm hành vi bằng cách bọc object cùng interface, thay cho kế thừa.

```ts
class LoggingPayment implements PaymentMethod {
  constructor(private readonly inner: PaymentMethod) {}
  async pay(m: Money) {
    console.log('pay', m.amount);
    return this.inner.pay(m);
  }
}
const method = new LoggingPayment(new CardPayment(gateway));
```

**Facade** — một cửa vào đơn giản che cả hệ thống con phức tạp.

**Proxy** — người đại diện kiểm soát truy cập (lazy loading, cache, kiểm quyền).

### Behavioral: hành vi và giao tiếp

**Strategy** — đóng gói các thuật toán có thể hoán đổi sau cùng một interface (xem `FlyBehavior`, `PaymentMethod`). Thay `switch` theo kiểu.

**Observer** — một object phát sự kiện, nhiều object đăng ký nhận (event emitter, pub/sub).

```ts
class EventBus {
  private handlers = new Map<string, Array<(e: unknown) => void>>();
  on(type: string, h: (e: unknown) => void) {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), h]);
  }
  emit(type: string, e: unknown) { this.handlers.get(type)?.forEach((h) => h(e)); }
}
```

**Template Method** — khung thuật toán ở lớp cha, bước thay đổi ở lớp con (`Report` ở bài 3).

**Command** — đóng gói một yêu cầu thành object (hàng đợi, undo/redo).

**State** — hành vi đổi theo trạng thái, mỗi trạng thái là một lớp (thay chuỗi `if (status === ...)`).

**Repository** (không thuộc GoF, rất phổ biến) — giao diện giống "bộ sưu tập" che việc truy cập dữ liệu.

### Chọn pattern bằng bài toán

| Bài toán | Pattern gợi ý |
|---|---|
| Nhiều thuật toán thay thế nhau | Strategy |
| Thêm hành vi mà không sửa/kế thừa | Decorator |
| Tích hợp API không khớp | Adapter |
| Tạo object phức tạp, nhiều tùy chọn | Builder |
| Nhiều bên cần biết khi có thay đổi | Observer |
| Hành vi đổi theo trạng thái | State |
| Cần đúng một instance | DI container (hạn chế Singleton thủ công) |
| Giấu độ phức tạp của hệ con | Facade |

**Bẫy phỏng vấn:** liệt kê tên pattern mà không nói **vấn đề nó giải** và **đánh đổi**. Mỗi pattern thêm lớp gián tiếp; dùng khi có bài toán thật. Pattern bị lạm dụng (Singleton, quá nhiều Factory) là một dạng over-engineering.

**Tự trả lời:** chọn ba pattern và giải thích bằng một câu "vấn đề → giải pháp → đánh đổi".

## 11. OOP trong TypeScript và JavaScript

JavaScript là OOP **dựa trên prototype**; từ khóa `class` (ES2015) là cú pháp tiện lợi phủ lên cơ chế prototype.

### Prototype chain

Mỗi object có liên kết nội bộ `[[Prototype]]` trỏ tới object khác. Truy cập thuộc tính không có sẽ tra ngược theo chuỗi này cho đến `Object.prototype`.

```js
class Animal { speak() { return 'noise'; } }
class Dog extends Animal { speak() { return 'woof'; } }
const d = new Dog();
Object.getPrototypeOf(d) === Dog.prototype;           // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true
```

`extends` thiết lập chuỗi prototype; method nằm trên `prototype`, **dùng chung** cho mọi instance (tiết kiệm bộ nhớ), khác với arrow function gán vào field (mỗi instance một bản).

### `this` và các bẫy

`this` phụ thuộc **cách gọi**, không phụ thuộc nơi định nghĩa (trừ arrow function lấy `this` từ phạm vi bao quanh).

```ts
class Counter {
  count = 0;
  inc() { this.count++; }
  incArrow = () => { this.count++; };   // this gắn cố định
}
const c = new Counter();
const f = c.inc;
f();                 // lỗi/undefined: mất this
const g = c.incArrow;
g();                 // chạy đúng
```

Cách khắc phục khác: `.bind(c)` hoặc truyền `() => c.inc()`.

### Truy cập: `private` của TypeScript và `#` của JavaScript

| | `private` (TS) | `#field` (ES2022) |
|---|---|---|
| Bảo vệ | Chỉ lúc **biên dịch** | Thật sự riêng tư lúc **chạy** |
| Truy cập bằng `obj['x']` | Vẫn được | Không được |
| Xuất hiện trong JS sinh ra | Có, như field thường | Là cú pháp riêng của JS |

### TypeScript: structural typing

TS so khớp kiểu theo **cấu trúc**, không theo tên. Object có đủ method của interface thì được coi là cài interface đó, dù không khai báo `implements`.

```ts
interface Logger { log(msg: string): void }
const consoleLogger = { log: (m: string) => console.log(m) };
function run(l: Logger) { l.log('hi'); }
run(consoleLogger);  // hợp lệ, không cần `implements`
```

Hệ quả: đa hình của TS linh hoạt, nhưng hai kiểu khác nghĩa mà cùng cấu trúc bị coi là một (dùng "branded type" khi cần).

### Một số tính năng thường hỏi

| Tính năng | Ghi chú |
|---|---|
| `abstract class` | Chỉ có ở TS, bị xóa khi biên dịch, không tồn tại lúc chạy |
| `interface` | Chỉ có lúc biên dịch, **không** tồn tại lúc chạy (khác Java). Cần kiểm tra lúc chạy thì dùng type guard hoặc class |
| `readonly` | Chỉ lúc biên dịch |
| `static` | Thuộc class (constructor function) |
| Getter/setter | `get x()`/`set x(v)` |
| Mixin | Ghép nhiều khả năng khi JS không có đa kế thừa: `const Serializable = (Base) => class extends Base { ... }` |
| Parameter property | `constructor(private readonly x: T)` khai báo và gán field gọn |

### Java so với TS/JS (hay bị hỏi lẫn)

| Tiêu chí | Java | TypeScript/JavaScript |
|---|---|---|
| Mô hình | Class-based | Prototype-based (class là đường tắt) |
| Kiểu | Nominal, kiểm tra lúc chạy | Structural, bị xóa lúc chạy |
| Interface lúc chạy | Có | Không |
| Overload thật | Có | Không (chỉ khai báo chữ ký) |
| Đa kế thừa class | Không | Không (dùng mixin) |

**Bẫy phỏng vấn:** nói "JS không có OOP" hoặc "class trong JS giống Java". Chính xác: class là **cú pháp** trên prototype. Bẫy `this` bị mất khi truyền method làm callback là câu hỏi rất hay gặp.

**Tự trả lời:** vì sao `setTimeout(obj.method, 100)` có thể lỗi `this` là `undefined`? Nêu hai cách sửa.

## 12. Anti-pattern và OOP so với FP

### Anti-pattern hay gặp

| Anti-pattern | Dấu hiệu | Hướng sửa |
|---|---|---|
| God class | Một class làm mọi thứ, hàng nghìn dòng | Tách theo trách nhiệm (SRP) |
| Anemic domain model | Class chỉ có field + getter/setter, logic nằm hết ở `Service` | Đưa hành vi vào object mang dữ liệu (bài 2) |
| Primitive obsession | Dùng `string`, `number` cho khái niệm nghiệp vụ (email, tiền) | Tạo value object |
| Feature envy | Method dùng dữ liệu của class khác nhiều hơn của chính nó | Chuyển method sang class đó |
| Shotgun surgery | Một thay đổi nhỏ phải sửa nhiều class | Gom logic liên quan lại |
| Fragile base class | Sửa cha làm vỡ con | Composition, giảm `protected` |
| Deep inheritance | Cây kế thừa năm tầng | Làm phẳng, composition |
| Singleton lạm dụng | Trạng thái toàn cục | DI |
| Yo-yo problem | Phải nhảy lên xuống cây kế thừa mới hiểu một lời gọi | Giảm tầng |
| Circular dependency | A cần B, B cần A | Đảo phụ thuộc qua interface, tách module thứ ba |

### Anemic model chi tiết

```ts
// Anemic: Order chỉ chứa dữ liệu, mọi quy tắc nằm ở service
class Order { id = ''; status = 'NEW'; items: OrderItem[] = []; }
class OrderService {
  ship(o: Order) { if (o.status !== 'PAID') throw new Error('...'); o.status = 'SHIPPED'; }
}
```

Quy tắc "đã trả tiền mới giao" có thể bị bỏ qua bởi bất kỳ ai sửa `status` trực tiếp. Bản đóng gói ở bài 2 giữ quy tắc trong `Order.ship()`.

### OOP và lập trình hàm (FP)

| Tiêu chí | OOP | FP |
|---|---|---|
| Đơn vị chính | Object (state + hành vi) | Hàm thuần túy, dữ liệu bất biến |
| State | Thay đổi trong object | Tránh thay đổi, tạo giá trị mới |
| Tái dùng | Kế thừa, composition | Hợp hàm, hàm bậc cao |
| Đa hình | Interface, override | Hàm bậc cao, kiểu tổng (union) |
| Mạnh ở | Mô hình hóa thực thể có vòng đời, framework plugin | Biến đổi dữ liệu, đồng thời, dễ test |

Hai trường phái không loại trừ nhau: hầu hết code thực tế trộn cả hai (object cho thực thể và ranh giới, hàm thuần cho tính toán, dữ liệu bất biến cho value object).

### Khi OOP không phải lựa chọn tốt nhất

- Pipeline biến đổi dữ liệu (ETL), tính toán thuần túy.
- Script ngắn, glue code.
- Mô hình dữ liệu chỉ là bản ghi không có hành vi (dùng type/record).

**Bẫy phỏng vấn:** bênh vực OOP một chiều, hoặc chê OOP là "lỗi thời". Câu trả lời trưởng thành: mỗi mô hình có chỗ mạnh; chọn theo bài toán, và kết hợp.

**Tự trả lời:** nhận diện hai anti-pattern trong code bạn từng đọc và nêu cách sửa.

## 13. Cách nói khi phỏng vấn

### Khung trả lời 90 giây

1. **Định nghĩa** một câu.
2. **Vì sao / đánh đổi**: nó giải quyết gì, giá phải trả là gì.
3. **Ví dụ** ngắn, cụ thể (dùng `Order` / `PaymentMethod` của sổ tay này).
4. **Cảnh báo** một bẫy hoặc khi nào không nên dùng.

### Mẫu trả lời

**Mẫu trả lời: "Giải thích bốn tính chất của OOP."**

> Encapsulation là gói state với hành vi và giấu state, chỉ cho đổi qua method giữ được quy tắc; ví dụ `Order.ship()` kiểm tra đã thanh toán thay vì để ai cũng sửa `status`. Abstraction là chỉ lộ hợp đồng, giấu cách làm; `PaymentMethod` chỉ nói "pay". Inheritance cho lớp con tái dùng lớp cha theo quan hệ is-a, nhưng tôi dùng dè dặt vì gắn chặt. Polymorphism cho cùng lời gọi nhưng hành vi tùy kiểu thật, nên thêm phương thức thanh toán mới không phải sửa `Checkout`.

**Mẫu trả lời: "Khi nào chọn composition thay vì inheritance?"**

> Mặc định tôi chọn composition vì kế thừa gắn chặt lớp con vào ruột lớp cha và chốt hành vi lúc biên dịch. Tôi chỉ kế thừa khi is-a đúng về hành vi, tức lớp con thay được cha ở mọi nơi theo Liskov. Ví dụ `Penguin extends Bird` có `fly()` là sai; tôi tách khả năng bay thành một interface và ghép vào.

**Mẫu trả lời: "SOLID là gì?"**

> Năm nguyên tắc để code dễ đổi: mỗi class một lý do thay đổi, mở để mở rộng đóng để sửa, lớp con thay được lớp cha, interface nhỏ theo client, và phụ thuộc vào abstraction thay vì chi tiết. Tôi dùng chúng như câu hỏi kiểm tra: có chuỗi `if/switch` theo kiểu không, có `new` thẳng hạ tầng trong nghiệp vụ không.

### Câu hỏi quay ngược nên chuẩn bị

- "Cho ví dụ bạn **vi phạm** nguyên tắc đó và hậu quả?"
- "Interface và abstract class khác nhau và bạn chọn cái nào?"
- "Vì sao getter/setter không phải đóng gói?"
- "Đa hình có chi phí gì?" (gián tiếp, khó theo dõi luồng, đoán kiểu thật)
- "Anemic model có thật sự tệ không?" (có chỗ dùng: DTO, dữ liệu chuyển tầng; tệ khi nghiệp vụ phức tạp bị rải rác)

### Danh sách rà nhanh trước phỏng vấn

- [ ] Nêu được bốn trụ cột bằng ví dụ riêng, không đọc thuộc lòng.
- [ ] Phân biệt abstraction với encapsulation.
- [ ] Phân biệt interface với abstract class, override với overload.
- [ ] Giải thích được vì sao `Square extends Rectangle` sai.
- [ ] Phân biệt aggregation với composition bằng vòng đời.
- [ ] Cho ví dụ vi phạm và cách sửa cho từng chữ của SOLID.
- [ ] Giải thích DIP, DI và IoC khác nhau.
- [ ] Kể ba design pattern kèm "vấn đề → giải pháp → đánh đổi".
- [ ] Giải thích prototype chain và bẫy `this` trong JS.
- [ ] Nêu được hai anti-pattern và cách sửa.

**Tự trả lời:** hãy tự trả lời trước gương câu "OOP là gì và vì sao nó hữu ích?" trong 60 giây, không dùng từ "class".

## Từ điển nhanh

| Thuật ngữ | Giải thích |
|---|---|
| Class | Bản thiết kế khai báo field và method |
| Object / Instance | Thực thể cụ thể tạo từ class, có state riêng |
| Encapsulation | Gói dữ liệu với hành vi và giấu state để bảo vệ invariant |
| Abstraction | Lộ hợp đồng, giấu cách làm |
| Inheritance | Lớp con thừa hưởng lớp cha (is-a) |
| Polymorphism | Cùng lời gọi, hành vi tùy kiểu thật |
| Invariant | Điều kiện luôn phải đúng với một object hợp lệ |
| Interface | Hợp đồng chỉ gồm chữ ký, không có state |
| Abstract class | Lớp không tạo trực tiếp được, có thể có code và state dùng chung |
| Override | Lớp con thay hành vi method của lớp cha (cùng chữ ký) |
| Overload | Nhiều method cùng tên khác tham số, chọn lúc biên dịch |
| Dynamic dispatch | Chọn method theo kiểu thật của object lúc chạy |
| Composition | Object chứa và ủy quyền cho object khác (has-a) |
| Aggregation | "Có" kiểu tập hợp, phần tồn tại độc lập với cha |
| Dependency | Dùng tạm một class khác (tham số, biến cục bộ) |
| Value object | Object bất biến, so sánh bằng giá trị |
| Entity | Object có danh tính, đổi state vẫn là cùng một object |
| SRP | Một class có một lý do để thay đổi |
| OCP | Mở để mở rộng, đóng để sửa |
| LSP | Lớp con thay được lớp cha mà chương trình vẫn đúng |
| ISP | Đừng ép client phụ thuộc method nó không dùng |
| DIP | Phụ thuộc abstraction, không phụ thuộc chi tiết |
| Dependency Injection | Truyền phụ thuộc từ ngoài vào (thường qua constructor) |
| IoC container | Công cụ tự tạo và lắp các object (NestJS, Spring) |
| Coupling | Mức module biết về module khác (muốn thấp) |
| Cohesion | Mức thành phần trong module thuộc về nhau (muốn cao) |
| Law of Demeter | Chỉ nói chuyện với bạn gần, tránh chuỗi `a.b().c().d()` |
| Tell, Don't Ask | Bảo object làm, đừng lấy dữ liệu ra tự quyết |
| Anemic domain model | Class chỉ có dữ liệu, logic rải ở service |
| God class | Class làm quá nhiều việc |
| Diamond problem | Mơ hồ khi kế thừa nhiều lớp có chung tổ tiên |
| Prototype chain | Chuỗi object JS tra thuộc tính ngược lên |
| Structural typing | So khớp kiểu theo cấu trúc, không theo tên |
| Strategy | Pattern đóng gói thuật toán có thể hoán đổi |
| Decorator | Pattern thêm hành vi bằng cách bọc cùng interface |
| Observer | Pattern phát sự kiện cho nhiều người nghe |
