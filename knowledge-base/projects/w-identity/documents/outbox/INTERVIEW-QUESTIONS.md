# Câu hỏi phỏng vấn Transactional Outbox

Che đáp án, nói thành tiếng 60–90 giây: định nghĩa → đánh đổi → ví dụ. Chỉ đánh dấu đã thuộc khi giải thích được câu hỏi phụ.

## Phần A. Vấn đề và ý tưởng

### Dual write

- [ ] 🟢 Dual write là gì? Vì sao nguy hiểm? · 📚 #1
  *Ý chính:* Ghi vào hai hệ thống độc lập (DB và broker) mà không có transaction chung nên có thể thành công một nửa. Hậu quả: mất event hoặc event ma. **Bẫy cần tránh:** nghĩ `try/catch` là đủ; process bị kill thì `catch` không chạy.
- [ ] 🟡 "Mất event" và "event ma" khác nhau thế nào? Cái nào tệ hơn với audit? · 📚 #1
  *Ý chính:* Mất: DB đã đổi mà không có event. Ma: event đã đi mà DB rollback. Cả hai làm audit sai; event ma còn nguy hiểm vì consumer đã hành động trên việc chưa xảy ra.
- [ ] 🟡 Vì sao "publish trước rồi ghi DB" không phải lời giải? · 📚 #2
  *Ý chính:* Chỉ đổi mất event thành event ma; DB lỗi thì event đã đi, không thu hồi được.
- [ ] 🟡 Vì sao không dùng 2PC/XA? · 📚 #2
  *Ý chính:* Mongo và RabbitMQ không phối hợp theo cách đó trong thực tế, và 2PC giảm khả dụng, ràng buộc chặt các hệ thống.

### Outbox

- [ ] 🟢 Transactional Outbox hoạt động thế nào? · 📚 #0
  *Ý chính:* Ghi event vào bảng outbox cùng transaction với dữ liệu; relay riêng đọc outbox, publish, rồi đánh dấu đã gửi. Nghiệp vụ và event cùng tồn tại hoặc cùng không.
- [ ] 🟡 Vì sao outbox phải nằm cùng DB với dữ liệu nghiệp vụ? · 📚 #3
  *Ý chính:* Chỉ khi cùng DB mới chung được transaction. Tách DB lại thành dual write. Vì vậy outbox là của từng service.
- [ ] 🟡 Vì sao không được gọi broker bên trong transaction? · 📚 #3
  *Ý chính:* Broker nhận rồi mà commit vẫn có thể lỗi (event ma), và giữ transaction mở trong lúc gọi mạng làm giảm hiệu năng.
- [ ] 🟡 Outbox khác "publish rồi retry trong code" thế nào? · 📚 #9
  *Ý chính:* Retry trong bộ nhớ mất khi process chết; outbox bền vì nằm trong DB cùng transaction.

## Phần B. Relay và độ tin cậy

### Relay

- [ ] 🟡 Relay claim dòng thế nào khi có nhiều replica? · 📚 #4
  *Ý chính:* `findOneAndUpdate` nguyên tử gắn lease (`lockedUntil`) cho dòng pending; chỉ một relay nhận được. Lease hết hạn thì dòng tự nhả, không kẹt vĩnh viễn.
- [ ] 🔴 Vì sao phải đợi publisher confirm rồi mới đánh dấu `published`? Đánh dấu trước có sao không? · 📚 #4
  *Ý chính:* Đánh dấu trước rồi chết thì event mất vĩnh viễn; đánh dấu sau confirm chết thì chỉ trùng, sửa được. Chọn trùng thay vì mất.
- [ ] 🔴 Relay chết ở từng điểm (sau claim, sau publish, sau mark) thì kết quả là gì? · 📚 #4
  *Ý chính:* Sau claim: lease hết, gửi lại, không sao. Sau publish trước mark: gửi lại, trùng. Sau mark: không sao.

### At-least-once

- [ ] 🟢 Outbox đảm bảo exactly-once không? · 📚 #5
  *Ý chính:* Không. Nó cho at-least-once; cộng consumer idempotent mới đạt effectively-once. **Bẫy cần tránh:** hứa exactly-once delivery.
- [ ] 🟡 Làm consumer idempotent bằng những cách nào? · 📚 #5
  *Ý chính:* Thao tác tự nhiên idempotent (upsert); inbox lưu `event.id` đã xử lý với unique index, cùng transaction với hiệu ứng; so version của aggregate.
- [ ] 🟡 Worker activity log nhận event trùng thì sao? · 📚 #5
  *Ý chính:* Dùng `event.id` làm `_id` của bản ghi log; lần ghi thứ hai bị unique index từ chối và coi là thành công.
- [ ] 🔴 Vì sao dấu "đã xử lý" và hiệu ứng phải cùng transaction? · 📚 #5
  *Ý chính:* Tách ra thì lại có khoảng hở: xử lý xong mà chưa ghi dấu thì chạy lại, ghi dấu mà chưa xử lý thì mất.

## Phần C. Thứ tự, biến thể, vận hành

- [ ] 🟡 Outbox có đảm bảo thứ tự không? · 📚 #6
  *Ý chính:* Chỉ khi một relay xử lý tuần tự và broker giữ thứ tự; nhiều relay hay retry làm xáo trộn. Thứ tự toàn cục hiếm khi cần, cần là theo aggregate. Consumer nên dùng version/occurredAt để bỏ event cũ.
- [ ] 🟡 Xử lý poison message trong outbox thế nào? · 📚 #6
  *Ý chính:* Sau `maxAttempts` chuyển `failed`, ghi lỗi, cảnh báo, xử lý thủ công; không xóa im lặng, và không để nó chặn cả hàng.
- [ ] 🔴 Lỗi ở consumer có phải việc của outbox không? · 📚 #6
  *Ý chính:* Không. Outbox chỉ bảo đảm event đến được broker. Lỗi xử lý ở consumer do ack/nack và DLQ lo.
- [ ] 🟡 Polling hay change stream? Bạn chọn gì cho dự án này? · 📚 #7
  *Ý chính:* Polling đơn giản, trễ bằng chu kỳ; CDC trễ thấp nhưng phức tạp (resume token, replica set). Bắt đầu bằng polling, nâng lên khi đo được vấn đề; có thể dùng change stream làm tín hiệu đánh thức.
- [ ] 🟡 Vận hành outbox cần lưu ý gì? · 📚 #8
  *Ý chính:* Dọn dòng `published` (TTL index), giám sát số pending/tuổi dòng cũ nhất/số failed, quyết định nhiều relay hay một relay theo yêu cầu thứ tự.
- [ ] 🟡 Mongo cần gì để chạy transaction cho outbox? · 📚 #3
  *Ý chính:* Replica set (hoặc sharded cluster); standalone sẽ lỗi `Transaction numbers are only allowed on a replica set member or mongos`. Hai collection phải cùng database.

## Phần D. Thực hành và phỏng vấn

- [ ] 🟢 Khi nào không cần outbox? · 📚 #9
  *Ý chính:* Khi mất thi thoảng một event chấp nhận được (thông báo không quan trọng). Với audit/activity log thì nên có.
- [ ] 🟡 Outbox khác event sourcing thế nào? · 📚 #9
  *Ý chính:* Outbox là kênh gửi tin đáng tin; event sourcing dùng chuỗi event làm nguồn sự thật của trạng thái.
