# Câu hỏi phỏng vấn Saga Pattern

Che đáp án, nói thành tiếng 60–90 giây: định nghĩa → đánh đổi → ví dụ. Chỉ đánh dấu đã thuộc khi giải thích được câu hỏi phụ.

## Phần A. Vấn đề và ý tưởng

### Giao dịch phân tán

- [ ] 🟢 Saga là gì? · 📚 #0
  *Ý chính:* Chuỗi local transaction, mỗi service commit trong DB của mình; bước nào lỗi thì chạy compensating transaction theo thứ tự ngược. Kết quả là eventual consistency. **Bẫy cần tránh:** nói saga "rollback"; dữ liệu đã commit, chỉ bù trừ được.
- [ ] 🟢 Vì sao microservices cần saga? · 📚 #1
  *Ý chính:* Database-per-service nên một nghiệp vụ chạm nhiều DB không có transaction chung. Cần cơ chế đưa hệ thống về trạng thái hợp lệ khi một bước lỗi.
- [ ] 🟡 Saga khác 2PC thế nào? Vì sao ít khi chọn 2PC? · 📚 #1
  *Ý chính:* 2PC cho ACID nhưng giữ lock suốt hai pha, coordinator chết thì participant treo, một bên down là cả giao dịch dừng, và nhiều broker/NoSQL không tham gia XA. Saga đổi isolation lấy availability.
- [ ] 🟡 Vì sao nói saga là "ACD"? · 📚 #1, #5
  *Ý chính:* Mất Isolation: mỗi bước commit ngay nên saga khác thấy trạng thái trung gian. Hệ quả là lost update, dirty read, fuzzy read.

### Hai kiểu saga

- [ ] 🟢 Choreography và orchestration khác nhau thế nào? · 📚 #2
  *Ý chính:* Choreography: service nghe event của nhau, không ai điều phối. Orchestration: orchestrator gửi command, nhận reply, giữ state machine.
- [ ] 🟡 Khi nào chọn choreography, khi nào chọn orchestration? · 📚 #2
  *Ý chính:* Luồng ngắn 2–4 bước, ít rẽ nhánh thì choreography. Nhiều bước, compensation phức tạp, cần biết saga đang ở đâu thì orchestration. Có thể lai: orchestration trong context, choreography giữa context.
- [ ] 🔴 Nhược điểm của orchestration là gì và giảm thế nào? · 📚 #2
  *Ý chính:* Orchestrator dễ thành god service hút business logic; là điểm lỗi đơn. Giữ orchestrator chỉ điều phối (logic nằm ở service), lưu state bền, chạy nhiều instance với optimistic lock.

## Phần B. Thiết kế bước và bù trừ

### Loại bước

- [ ] 🟡 Pivot transaction là gì? · 📚 #3
  *Ý chính:* Bước không quay đầu: thành công thì saga chắc chắn chạy tới cuối, thất bại thì bù trừ ngược. Trước pivot là compensatable, sau pivot là retriable.
- [ ] 🟡 Bạn sắp xếp thứ tự các bước thế nào? · 📚 #3
  *Ý chính:* Bước rủi ro và khó hoàn tác nhất làm pivot; việc không thu hồi được (email, SMS) đặt sau pivot; việc "giảm" làm sớm, việc "tăng" làm muộn.

### Compensating transaction

- [ ] 🟢 Compensating transaction khác rollback thế nào? · 📚 #4
  *Ý chính:* Rollback hủy thay đổi chưa commit. Compensation là nghiệp vụ mới chạy sau khi đã commit (hoàn tiền thay vì xóa bản ghi trừ tiền), người khác có thể đã thấy trạng thái trung gian.
- [ ] 🟡 Compensation cần những tính chất gì? · 📚 #4
  *Ý chính:* Semantic undo không xóa; idempotent; chịu được đến sai thứ tự (tombstone); retry tới khi thành công; chạy ngược thứ tự; dùng thao tác cộng/trừ thay vì ghi đè.
- [ ] 🔴 Compensation thất bại thì sao? · 📚 #4, #7
  *Ý chính:* Retry với backoff vì compensation chỉ nên lỗi do hạ tầng. Hết retry thì saga sang `NEEDS_MANUAL`, đẩy vào DLQ, alert, có công cụ cho vận hành xử lý tay.
- [ ] 🔴 Bước không thể hoàn tác (email đã gửi) thì làm sao? · 📚 #3, #4
  *Ý chính:* Dời ra sau pivot. Nếu buộc phải làm trước, compensation là một hành động bù về nghiệp vụ (email "đơn đã bị hủy").

### Isolation

- [ ] 🔴 Saga không có isolation, bạn xử lý thế nào? · 📚 #5
  *Ý chính:* Kể ba anomaly (lost update, dirty read, fuzzy read) rồi countermeasure: semantic lock `*_PENDING`, commutative update, pessimistic view, reread value/optimistic lock, version file, by value. Cho ví dụ `APPROVAL_PENDING`.
- [ ] 🔴 Semantic lock là gì? Cho ví dụ. · 📚 #5
  *Ý chính:* Bước compensatable gắn cờ trạng thái (`APPROVAL_PENDING`). Saga khác thấy cờ thì từ chối, chờ hoặc retry. Bước cuối chỉ cập nhật khi cờ còn đúng của saga mình, chống lost update.

## Phần C. Độ tin cậy và vận hành

### Message và idempotency

- [ ] 🟡 Làm sao đảm bảo "lưu DB + gửi message" không mất message? · 📚 #6
  *Ý chính:* Transactional outbox: ghi event vào bảng outbox cùng local transaction, relay publish sau. Kết quả at-least-once.
- [ ] 🟡 Message bị xử lý hai lần thì sao? · 📚 #6
  *Ý chính:* Consumer idempotent: lưu `messageId` hoặc `sagaId + step` cùng transaction với thay đổi nghiệp vụ, unique key; trùng thì bỏ qua. API bên ngoài dùng `Idempotency-Key`.
- [ ] 🟡 Lỗi nào nên retry, lỗi nào nên bù trừ? · 📚 #6
  *Ý chính:* Lỗi tạm thời (timeout, 503) thì retry với backoff và jitter. Lỗi nghiệp vụ (hết hàng, thẻ từ chối) thì không retry, chuyển sang bù trừ.

### Timeout và crash

- [ ] 🔴 Service đích timeout, bạn có bù trừ ngay không? · 📚 #6, #4
  *Ý chính:* Timeout không có nghĩa bên kia chưa làm. Hỏi lại trạng thái theo `sagaId`, hoặc bù trừ nhưng compensation phải xử lý được action đến muộn (tombstone).
- [ ] 🔴 Orchestrator crash giữa chừng thì sao? · 📚 #7
  *Ý chính:* State lưu bền sau mỗi bước; khởi động lại hoặc sweeper quét saga dở dang và chạy tiếp. Bước có thể chạy lại nên participant phải idempotent. Nhiều instance thì optimistic lock trên `version`.
- [ ] 🟡 Bạn theo dõi saga trong production thế nào? · 📚 #6, #7
  *Ý chính:* `sagaId`/`correlationId` trong mọi message và log, tracing, dashboard số saga theo trạng thái, saga kẹt quá ngưỡng, tỉ lệ bù trừ, alert `NEEDS_MANUAL`.

## Phần D. Thực hành và phỏng vấn

### Công cụ

- [ ] 🟡 Bạn dùng công cụ gì để làm saga? · 📚 #10
  *Ý chính:* Temporal, Camunda/Zeebe, AWS Step Functions, Axon, MassTransit, Eventuate Tram. Chọn workflow engine khi cần state bền, timer dài, giao diện theo dõi; tự viết khi luồng đơn giản.
- [ ] 🟡 `@Saga()` của `@nestjs/cqrs` có phải distributed saga không? · 📚 #10
  *Ý chính:* Không. Nó là RxJS stream map event thành command trong một process, không có state bền.
- [ ] 🟡 Saga liên quan gì đến Event Sourcing và CQRS? · 📚 #10
  *Ý chính:* Độc lập nhưng hay đi cùng. Event Sourcing giải dual write vì event là nguồn sự thật; saga còn gọi là process manager trong DDD.

### Kể kinh nghiệm

- [ ] 🔴 Kể một saga bạn đã thiết kế. · 📚 #9, #11
  *Ý chính:* Dùng STAR với saga tạo project kèm Keycloak: vì sao cần (Keycloak không tham gia transaction), vì sao orchestration, pivot là bước nào, idempotency bằng tên group xác định, semantic lock `PROVISIONING`, xử lý timeout. Nói rõ đây là thiết kế.
- [ ] 🟢 Trả lời "Saga là gì?" trong 90 giây. · 📚 #11
  *Ý chính:* Vấn đề → định nghĩa → hai kiểu → phần khó (outbox, idempotent, semantic lock, timeout) → ví dụ.

## Cách luyện

Mỗi ngày chọn một phần, nói to từng câu, rồi tự hỏi câu phụ "nếu bước đó lỗi thì sao?". Câu 🔴 chỉ đánh dấu thuộc khi bạn kể được kèm ví dụ cụ thể.
