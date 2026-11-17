# SOLID

Năm nguyên tắc để code dễ đổi.

Tài liệu lý thuyết tổng quát; code TypeScript là minh họa.

Note: Mở đầu: SOLID là kim chỉ nam nhận ra thiết kế đau, không phải luật tuyệt đối.

---

## Vì sao cần SOLID

Yêu cầu thay đổi nhỏ, code phải sửa một chỗ nhỏ.

Dấu hiệu đau: khó test, sửa một chỗ vỡ nhiều chỗ.

Note: Ví dụ bếp trưởng vừa nấu, vừa thu ngân, vừa nhập hàng.

---

## Năm nguyên tắc

| Chữ | Ý |
|---|---|
| S | Một lý do thay đổi |
| O | Mở mở rộng, đóng sửa |
| L | Con thay được cha |
| I | Interface nhỏ theo client |
| D | Phụ thuộc abstraction |

Note: Mỗi chữ cần một ví dụ vi phạm và cách sửa.

---

## S — Single Responsibility

Một class, một **actor** yêu cầu thay đổi.

Không phải "một class một method".

Note: Mô tả class không có chữ "và". Tách PriceCalculator, InvoiceRenderer, OrderRepository.

---

## O — Open/Closed

Thêm tính năng bằng code **mới**, không sửa code cũ.

Thay `switch (type)` bằng Strategy.

Note: Đoán đúng trục thay đổi; Rule of Three trước khi trừu tượng hóa.

---

## L — Liskov Substitution

Con thay được cha mà chương trình vẫn đúng.

Phản ví dụ: `Square extends Rectangle`, `Penguin.fly()`.

Note: Không siết tiền điều kiện, không làm yếu hậu điều kiện, giữ bất biến.

---

## I — Interface Segregation

Đừng ép client cài method nó không dùng.

`UserReader` và `UserWriter` thay cho `UserRepository` béo.

Note: Dấu hiệu: throw not supported. Gom theo vai trò client, không phải từng method.

---

## D — Dependency Inversion

Nghiệp vụ **định nghĩa** interface, hạ tầng **cài đặt**.

DIP là nguyên tắc, DI là kỹ thuật, IoC là công cụ.

Note: Interface nằm ở phía cấp cao. Composition root lắp mọi thứ.

---

## Refactor OrderService

Tách trách nhiệm → Strategy → giữ hợp đồng → interface nhỏ → inject.

Kết quả: thêm cổng thanh toán không sửa nghiệp vụ.

Note: Nhắc cái giá: nhiều file, phải nối dây ở composition root.

---

## SOLID và kiến trúc

Strategy là OCP. Adapter là DIP.

Clean Architecture là DIP ở quy mô ứng dụng.

Note: Dependency Rule: phụ thuộc chỉ hướng vào domain.

---

## NestJS

Interface bị xóa lúc chạy, dùng **token**.

`useClass` đổi cài đặt, `useValue` cho test.

Note: Module là composition root của phần đó.

---

## Khi không dùng

Script ngắn, phần ổn định, interface một cài đặt.

Rule of Three. YAGNI.

Note: Hỏi: điều gì sẽ thay đổi, và bao lâu một lần?

---

## Khi phỏng vấn

Phát biểu → vi phạm → sửa → đánh đổi.

Luôn có một ví dụ code và nói được lúc không áp dụng.

Note: Nhắc lại danh sách rà nhanh ở bài 10.
