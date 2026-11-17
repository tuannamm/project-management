# OOP

Bốn trụ cột, SOLID và cách thiết kế khi phỏng vấn.

Tài liệu lý thuyết tổng quát; code TypeScript là minh họa.

Note: Mở đầu: OOP là cách tổ chức object tự quản lý state và giao tiếp qua message, không chỉ là có class.

---

## OOP là gì

Object gói **state** và **hành vi**, giao tiếp bằng message.

Class chỉ là công cụ.

Note: Cảnh báo anemic model: class chỉ có getter/setter vẫn là code thủ tục.

---

## Bốn trụ cột

| Trụ cột | Ý chính |
|---|---|
| Encapsulation | Giấu state, giữ invariant |
| Abstraction | Lộ hợp đồng, giấu cách làm |
| Inheritance | Lớp con là một lớp cha |
| Polymorphism | Cùng lời gọi, hành vi theo kiểu thật |

Note: Ví dụ xuyên suốt là máy ATM và Order/PaymentMethod.

---

## Đóng gói thật

`order.ship()` thay vì `order.status = 'SHIPPED'`.

Method theo nghiệp vụ, không phải setter.

Note: Tell, Don't Ask. Getter trả mảng nội bộ cho phép người ngoài push thẳng vào.

---

## Interface và abstract class

| | Interface | Abstract class |
|---|---|---|
| State | Không | Có |
| Cài nhiều | Có | Không |
| Dùng khi | Hợp đồng | Chia sẻ code, template |

Note: Mặc định chọn interface.

---

## Kế thừa: cẩn thận

Chỉ khi lớp con **thay được** lớp cha ở mọi nơi.

`Square extends Rectangle` là phản ví dụ.

Note: Is-a đời thường không bằng is-a về hành vi. Fragile base class.

---

## Đa hình

Thêm kiểu mới, **không sửa** code gọi.

Thay chuỗi `switch (type)` bằng interface.

Note: Dynamic dispatch tra theo kiểu thật lúc chạy. Override khác overload.

---

## Composition hơn inheritance

Has-a và ủy quyền. Đổi hành vi được lúc chạy.

Strategy, Decorator, Dependency Injection.

Note: Vẫn kế thừa khi is-a thật và đúng Liskov.

---

## Quan hệ giữa các lớp

Dependency, association, aggregation, composition.

Hỏi: xóa cha thì phần còn tồn tại không?

Note: Order–OrderItem là composition; Team–Player là aggregation.

---

## SOLID

| Chữ | Ý |
|---|---|
| S | Một lý do thay đổi |
| O | Mở mở rộng, đóng sửa |
| L | Con thay được cha |
| I | Interface nhỏ |
| D | Phụ thuộc abstraction |

Note: DIP là nguyên tắc, DI là kỹ thuật, IoC container là công cụ.

---

## Coupling và cohesion

**Thấp** coupling, **cao** cohesion.

Law of Demeter, Tell Don't Ask, DRY có điều kiện.

Note: DRY là trùng tri thức, không phải trùng chữ.

---

## Design pattern

Strategy · Decorator · Adapter · Observer · Factory · Builder.

Mỗi pattern: vấn đề, giải pháp, đánh đổi.

Note: Singleton thủ công là anti-pattern; dùng DI container.

---

## TypeScript và JavaScript

Prototype chain. `this` phụ thuộc cách gọi.

`private` lúc biên dịch, `#` lúc chạy. Structural typing.

Note: Interface TS bị xóa lúc chạy.

---

## Anti-pattern

God class · Anemic model · Primitive obsession · Fragile base class.

OOP và FP bổ sung nhau.

Note: Chọn theo bài toán, không bênh vực một chiều.

---

## Khi phỏng vấn

Định nghĩa → đánh đổi → ví dụ → cảnh báo.

Luôn có một ví dụ vi phạm và cách sửa.

Note: Nhắc lại danh sách rà nhanh ở bài 13.
