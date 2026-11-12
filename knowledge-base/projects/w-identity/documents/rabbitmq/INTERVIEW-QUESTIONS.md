# Câu hỏi phỏng vấn RabbitMQ

Che đáp án, nói thành tiếng 60–90 giây: định nghĩa → đánh đổi → ví dụ. Chỉ đánh dấu đã thuộc khi giải thích được câu hỏi phụ.

## Phần A. Nền tảng và định tuyến

### Vì sao cần broker

- [ ] 🟢 Vì sao dùng message queue thay vì gọi HTTP trực tiếp? · 📚 #1
  *Ý chính:* Temporal decoupling (bên nhận không cần đang chạy), decoupling về địa chỉ (bên gửi không cần biết ai nhận), load leveling (hấp thụ đột biến). **Bẫy cần tránh:** nói dùng queue để "nhanh hơn".
- [ ] 🟡 Nhược điểm của việc đưa message broker vào hệ thống là gì? · 📚 #1
  *Ý chính:* Thêm hệ thống phải vận hành, eventual consistency, message có thể trùng hoặc sai thứ tự, khó debug và cần tracing.
- [ ] 🟡 Khi nào không nên dùng queue? · 📚 #1
  *Ý chính:* Khi caller cần kết quả ngay để đi tiếp, như kiểm tra số dư. Gọi đồng bộ đơn giản và đúng hơn.

### Kiến trúc

- [ ] 🟢 Connection và channel khác nhau thế nào? · 📚 #2
  *Ý chính:* Connection là TCP dài hạn, tốn kém. Channel là kênh logic nhẹ bên trong. Mỗi process giữ ít connection, dùng nhiều channel.
- [ ] 🟡 Vì sao nên tách connection cho publish và consume? · 📚 #2
  *Ý chính:* Khi có alarm, connection publish bị chặn; consumer dùng chung sẽ bị ảnh hưởng đúng lúc cần xả queue.
- [ ] 🟢 Vhost là gì? · 📚 #2
  *Ý chính:* Không gian cô lập trong một broker, có exchange, queue và quyền riêng.

### Exchange và queue

- [ ] 🟢 Message đi qua RabbitMQ như thế nào? · 📚 #0
  *Ý chính:* Producer publish vào exchange với routing key, exchange so binding để đưa vào queue, broker giao cho consumer, consumer ack thì message bị xóa.
- [ ] 🟢 Có những loại exchange nào, khác nhau ra sao? · 📚 #3
  *Ý chính:* Direct khớp chính xác, fanout gửi tất cả, topic khớp wildcard, headers khớp theo header.
- [ ] 🟢 Trong topic exchange, `*` và `#` khác nhau thế nào? · 📚 #3
  *Ý chính:* `*` đúng một từ, `#` không hoặc nhiều từ, từ cách nhau bởi dấu chấm.
- [ ] 🟡 Default exchange là gì? · 📚 #3
  *Ý chính:* Direct exchange không tên, mọi queue tự bind theo tên của nó. `sendToQueue` thực chất dùng exchange này.
- [ ] 🟡 Message không khớp binding nào thì sao? · 📚 #3
  *Ý chính:* Bị bỏ im lặng. Dùng `mandatory` để trả về producer, hoặc alternate exchange để hứng.
- [ ] 🟡 Durable, exclusive, auto-delete khác nhau thế nào? · 📚 #4
  *Ý chính:* Durable còn sau restart; exclusive gắn với một connection; auto-delete xóa khi consumer cuối rời đi.
- [ ] 🟡 Khai báo lại queue với tham số khác thì sao? · 📚 #4
  *Ý chính:* Lỗi `PRECONDITION_FAILED`, channel bị đóng. Phải tạo queue mới; policy cho phép đổi một số cấu hình khi đang chạy.

## Phần B. Tiêu thụ và độ tin cậy

### Consumer

- [ ] 🟢 Auto ack và manual ack khác nhau thế nào? · 📚 #5
  *Ý chính:* Auto ack coi là xong ngay khi gửi, consumer chết là mất. Manual ack xác nhận sau khi xử lý, an toàn hơn.
- [ ] 🟡 Consumer chết khi đang xử lý thì message ra sao? · 📚 #5
  *Ý chính:* Message unacked trở về ready, giao lại kèm `redelivered = true`.
- [ ] 🟡 Prefetch là gì? Chọn giá trị thế nào? · 📚 #5
  *Ý chính:* Số message unacked tối đa của consumer. Thấp thì phân phối đều cho việc nặng, cao thì throughput tốt cho việc nhanh. Phải đo.
- [ ] 🟡 Làm sao để nhiều service cùng nhận một event? · 📚 #5
  *Ý chính:* Mỗi service một queue bind vào exchange. Cùng consume một queue thì chúng chia nhau message.
- [ ] 🟡 Quên ack thì chuyện gì xảy ra? · 📚 #5
  *Ý chính:* Message nằm unacked, chạm prefetch thì consumer ngừng nhận, connection đóng thì message được giao lại.

### Không mất message

- [ ] 🟢 Làm sao đảm bảo không mất message? · 📚 #6
  *Ý chính:* Ba chặng: publisher confirm; durable queue cộng persistent message, thêm quorum queue; manual ack. **Bẫy cần tránh:** chỉ nói durable.
- [ ] 🟡 Durable queue và persistent message khác nhau thế nào? · 📚 #6
  *Ý chính:* Durable giữ định nghĩa queue, persistent ghi message xuống đĩa. Cần cả hai.
- [ ] 🟡 Publisher confirm là gì? Vì sao không dùng transaction? · 📚 #6
  *Ý chính:* Broker xác nhận đã nhận trách nhiệm với message. Transaction đồng bộ và chậm hơn nhiều.
- [ ] 🔴 Publisher nhận được ack thì message chắc chắn đã vào queue chưa? · 📚 #6
  *Ý chính:* Chưa chắc. Message không route được vẫn được confirm; cần `mandatory` hoặc alternate exchange.
- [ ] 🔴 Mất kết nối khi đang chờ confirm thì làm gì? · 📚 #6
  *Ý chính:* Không biết broker nhận chưa, nên gửi lại và chấp nhận trùng. Đây là nguồn gốc của at-least-once.

### Delivery semantics

- [ ] 🟢 At-most-once, at-least-once, exactly-once khác nhau thế nào? · 📚 #7
  *Ý chính:* Có thể mất; có thể trùng; đúng một lần không đạt được ở mức delivery, chỉ đạt effectively-once bằng at-least-once cộng idempotent.
- [ ] 🟡 Làm consumer idempotent bằng cách nào? · 📚 #7
  *Ý chính:* Thao tác tự nhiên idempotent, bảng dedupe theo `message_id` với unique index, so version, hoặc idempotency key với bên thứ ba.
- [ ] 🔴 Vì sao dấu "đã xử lý" phải cùng transaction với hiệu ứng nghiệp vụ? · 📚 #7
  *Ý chính:* Tách ra thì có khoảng hở: xử lý xong chưa ghi dấu thì chạy lại, ghi dấu chưa xử lý thì mất.
- [ ] 🟡 Dual-write là gì, xử lý thế nào? · 📚 #7
  *Ý chính:* Ghi DB và publish không có transaction chung. Transactional Outbox ghi event cùng transaction rồi relay publish.

## Phần C. Xử lý lỗi và patterns

### Lỗi và retry

- [ ] 🟢 DLX và DLQ là gì? · 📚 #8
  *Ý chính:* Exchange và queue nhận message đã chết, để điều tra hoặc replay.
- [ ] 🟡 Khi nào message trở thành dead letter? · 📚 #8
  *Ý chính:* Nack không requeue, hết TTL, queue vượt giới hạn, vượt delivery-limit của quorum queue.
- [ ] 🟡 Poison message là gì, xử lý ra sao? · 📚 #8
  *Ý chính:* Message luôn gây lỗi. Không requeue vô điều kiện; giới hạn số lần rồi chuyển DLQ.
- [ ] 🟡 Thiết kế retry có backoff trong RabbitMQ thế nào? · 📚 #8
  *Ý chính:* Retry queue có TTL, không consumer, hết TTL dead-letter về queue chính; đếm qua `x-death`; vượt ngưỡng thì chuyển parking lot.
- [ ] 🔴 Vì sao không dùng per-message TTL khác nhau trong cùng một retry queue? · 📚 #8
  *Ý chính:* Message hết hạn chỉ được xử lý khi lên đầu queue, nên TTL ngắn nằm sau TTL dài sẽ bị kẹt.

### Thứ tự

- [ ] 🟡 RabbitMQ đảm bảo thứ tự như thế nào? · 📚 #9
  *Ý chính:* Giữ thứ tự trên một channel publish, một queue, một channel consume. Nhiều consumer, prefetch cao hoặc requeue đều phá vỡ.
- [ ] 🔴 Cần thứ tự theo từng đơn hàng mà vẫn scale thì làm sao? · 📚 #9
  *Ý chính:* Consistent hash exchange theo `orderId`, mỗi queue một consumer; hoặc consumer so version và bỏ event cũ.
- [ ] 🟡 Single active consumer là gì? · 📚 #9
  *Ý chính:* Chỉ một consumer nhận, các consumer khác dự phòng. Giữ thứ tự, có failover, nhưng không tăng throughput.

### Patterns

- [ ] 🟡 Triển khai RPC qua RabbitMQ thế nào? · 📚 #10
  *Ý chính:* Request kèm `reply_to` và `correlation_id`, server trả về queue đó, client ghép theo `correlation_id` và luôn có timeout.
- [ ] 🟡 Command và event khác nhau thế nào? · 📚 #10
  *Ý chính:* Command là yêu cầu làm, thường một người nhận. Event là việc đã xảy ra, không hoặc nhiều người nhận, người nhận tự quyết định.
- [ ] 🔴 Saga choreography và orchestration khác nhau thế nào? · 📚 #10
  *Ý chính:* Choreography phản ứng theo event, không có điều phối viên, khó theo dõi khi luồng dài. Orchestration có điều phối tập trung, dễ quan sát nhưng thêm thành phần.

## Phần D. Vận hành và high availability

### Vận hành

- [ ] 🟡 Memory alarm xảy ra thì hệ thống bị gì? · 📚 #11
  *Ý chính:* Broker chặn mọi connection đang publish, producer có thể treo. Cần timeout và tách connection.
- [ ] 🟡 Những chỉ số nào cần giám sát? · 📚 #11
  *Ý chính:* Queue depth, unacked, consumer count, publish so với deliver rate, consumer utilisation, độ dài DLQ, số connection.
- [ ] 🔴 Queue bị dồn ứ, bạn xử lý thế nào? · 📚 #11
  *Ý chính:* So rate vào và ra, xem consumer và unacked, tìm nút thắt. Downstream chậm thì sửa downstream, thêm consumer chỉ tệ hơn. **Bẫy cần tránh:** trả lời ngay "thêm consumer".
- [ ] 🟡 Graceful shutdown của consumer gồm những bước nào? · 📚 #11
  *Ý chính:* Cancel consumer để ngừng nhận, đợi việc đang chạy xong và ack, rồi đóng channel và connection.

### High availability

- [ ] 🟢 Quorum queue là gì? · 📚 #12
  *Ý chính:* Queue nhân bản bằng Raft, confirm khi đa số node đã ghi. Lựa chọn mặc định cho dữ liệu quan trọng.
- [ ] 🟡 Cụm RabbitMQ chia sẻ những gì? · 📚 #12
  *Ý chính:* Metadata được chia sẻ. Nội dung queue chỉ nhân bản khi dùng quorum hoặc stream.
- [ ] 🟡 Cụm 3 node chịu được mấy node chết? Vì sao không dùng 4 node? · 📚 #12
  *Ý chính:* Chịu 1 node theo `2f+1`. Bốn node vẫn chỉ chịu 1 vì đa số là 3.
- [ ] 🟡 Vì sao không nên học mirrored queue làm đáp án HA? · 📚 #12
  *Ý chính:* Classic mirrored queue đã bị loại bỏ từ RabbitMQ 4.0, thay bằng quorum queue và stream.
- [ ] 🔴 Quorum queue đánh đổi những gì? · 📚 #12
  *Ý chính:* Tốn đĩa và bộ nhớ hơn, độ trễ cao hơn classic, không dùng cho message tạm thời hoặc queue exclusive.

## Phần E. So sánh và tình huống

### So sánh

- [ ] 🟢 RabbitMQ khác Kafka thế nào? · 📚 #13
  *Ý chính:* RabbitMQ là hàng đợi, xóa sau ack, định tuyến linh hoạt. Kafka là log, giữ theo retention, consumer tự quản offset và đọc lại được.
- [ ] 🟡 Khi nào chọn RabbitMQ, khi nào chọn Kafka? · 📚 #13
  *Ý chính:* RabbitMQ cho task queue, định tuyến, retry từng message. Kafka cho lưu sự kiện, replay, stream processing, throughput rất lớn.
- [ ] 🟡 RabbitMQ Stream khác quorum queue thế nào? · 📚 #12
  *Ý chính:* Stream không xóa khi đọc, đọc lại theo offset, hợp fan-out lớn. Quorum queue xóa khi ack và theo dõi từng message.

### Tình huống

- [ ] 🔴 Thiết kế hệ thống gửi email với RabbitMQ sao cho không mất, không gửi trùng? · 📚 #14
  *Ý chính:* Outbox phía producer, confirm, quorum queue, manual ack, dedupe theo `message_id`, retry có backoff, DLQ có cảnh báo. Thừa nhận gửi mail ra ngoài khó đạt tuyệt đối exactly-once.
- [ ] 🔴 Sau một lần deploy, DLQ tăng vọt. Bạn làm gì? · 📚 #8
  *Ý chính:* Xem `x-death` và log, rollback nếu do bug, sửa xong replay từ DLQ, và nhờ idempotent nên chạy lại an toàn.
- [ ] 🟡 Mỗi request bạn mở một connection mới để publish. Có vấn đề gì? · 📚 #2
  *Ý chính:* Tốn tài nguyên ở cả client và broker, chậm, dễ rò rỉ. Dùng connection dài hạn và tái sử dụng channel.
