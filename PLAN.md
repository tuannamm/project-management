# Database module dùng chung cho worker

Trạng thái: đã chuyển persistence profile về worker; build, typecheck, lint, 7 unit test lib, 25 unit test worker, 6 integration test lib, Mongo integration và E2E identity đều đạt.

## Trách nhiệm và API

- `@lib-infrastructure/database` chỉ cung cấp kết nối/pool MongoDB, decorator `@Entity`/`@Field`, `MongoDBRepository<T>`, lỗi storage và readiness indicator dùng chung.
- Worker sở hữu tên collection, entity/schema, repository cụ thể, contract/domain model và injection token của nghiệp vụ.
- Import `DatabaseModule` để đọc `MONGODB_URI` khi khởi tạo. `forRoot`/`forRootAsync` dành cho cấu hình ghi đè hoặc connection có tên.
- Worker đăng ký collection bằng `DatabaseModule.forFeature([Repository], options?)`. Các repository cùng connection dùng chung MongoClient/pool; cùng entity/collection dùng cached model. Chặn schema xung đột và model từ connection khác.
- Base repository cung cấp create, find/findOne/findById, updateById, deleteById, count, phân trang và sort. CRUD có validation và lỗi storage an toàn.

## Cấu hình và vòng đời

- Mặc định: timeout chọn server/connect/socket 3000 ms; pool min 0, max 10; autoIndex false.
- Startup thử tối đa 3 lần tổng cộng, nghỉ 1000 ms giữa hai lần; hết lượt thì thất bại.
- Driver tự reconnect; readiness theo trạng thái connection. Không tự retry thao tác ghi.
- Nest/Mongoose đóng pool khi shutdown. Repository và collection không mở pool riêng.

## Tích hợp w-identity

- `UserEntity` và `UserRepository` nằm trong infrastructure/persistence của worker; entity khai báo collection `user_profiles`.
- `AppModule` trực tiếp import `DatabaseModule` và `DatabaseModule.forFeature([UserRepository])`; inject trực tiếp class repository.
- `UserProfile` và `ProfilePatch` thuộc worker. Application dùng trực tiếp kiểu `UserRepository`; không có port hoặc token alias riêng cho repository.
- Giữ unique index trên `keycloakUserId`, autoIndex true cho profile, chờ model.init và upsert an toàn khi đồng thời tạo profile.
- Lib không export profile entity/repository/module hoặc contract profile. Kiểm thử profile nằm trong worker.

## Kiểm chứng

- Build, typecheck, lint, unit test qua Nx cho database và w-identity.
- Integration của lib kiểm tra CRUD, validation, model cache, dùng chung pool, named connection, startup retry và reconnect.
- Mongo integration của worker kiểm tra đăng ký collection bằng forFeature, index, 20 concurrent upserts và lỗi storage an toàn.
- E2E identity kiểm chứng contract profile hiện tại. Architecture test giữ domain độc lập và chỉ cho phép application tham chiếu type của UserRepository, không import infrastructure lúc chạy.

---

# Kế hoạch RabbitMQ trước đó — đã hoàn tất

Trạng thái: đã triển khai và tích hợp vào `w-identity`; đã kiểm chứng bằng unit test, integration test RabbitMQ và E2E identity.

## 1. Mục tiêu và phạm vi

Tạo package `@lib-infrastructure/rabbitmq` tại `apps/lib-infrastructure/libs/rabbitmq` để các service NestJS tái sử dụng cấu hình, kết nối và RMQ transport chuẩn NestJS.

Service import `RabbitMQModule.forRoot()`, cấu hình URI và queue qua `.env`, sử dụng cả `@EventPattern` cho event và `@MessagePattern` cho request/response (RPC).

Phạm vi v1:

- Quản lý cấu hình, kết nối/reconnect và shutdown.
- Gửi event hoặc request tới queue đích được chỉ định.
- Nhận message qua decorator chuẩn NestJS.
- Ack sau khi handler thành công; message lỗi chuyển vào dead-letter queue (DLQ).
- Timeout cho startup và các thao tác gửi/chờ phản hồi.
- Giữ nguyên kênh TCP hiện tại; cung cấp hướng dẫn chạy TCP và RMQ trong cùng service.

Chưa bao gồm broadcast qua nhiều queue, retry message tự động, outbox, deduplication bằng database hoặc cam kết exactly-once. Các replica cùng queue chia việc; mỗi message được giao cho một consumer trong nhóm đó.

## 2. Cách sử dụng và public API

### Import module và cấu hình

```ts
@Module({
  imports: [RabbitMQModule.forRoot()],
  controllers: [UserMessagesController],
})
export class AppModule {}
```

```dotenv
RABBITMQ_URI=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=user-service
```

Queue trong `.env` là queue nhận của chính service. Queue đích khi gửi được truyền riêng vào API, không mặc định gửi về queue của service gọi.

Module cung cấp:

- `RabbitMQModule.forRoot(options?)`: đọc cấu hình khi khởi tạo provider, sau khi ứng dụng nạp `.env`.
- `RabbitMQModule.forRootAsync(...)`: cấu hình qua dependency injection.
- `RabbitMQService.emit(queue, pattern, payload): Promise<void>`: gửi event tới queue đích.
- `RabbitMQService.send<T>(queue, pattern, payload, { timeoutMs? }): Promise<T>`: gửi request và chờ phản hồi; timeout mặc định 5 giây.
- `startRabbitMQ(app): Promise<void>`: gắn RMQ transport, chuẩn bị topology và khởi động listener bằng cấu hình đã đăng ký trong module.

Module export `RabbitMQService` để feature module sử dụng qua import/re-export chuẩn NestJS; không tự đặt global.

### Khai báo handler

```ts
@Controller()
export class UserMessagesController {
  @EventPattern('user.created')
  async onUserCreated(@Payload() data: UserCreated) {
    // Xử lý event.
  }

  @MessagePattern('user.find')
  async findUser(@Payload() data: FindUser) {
    return { id: data.id };
  }
}
```

Handler nằm trong controller theo cơ chế microservice chuẩn NestJS. Lib không định nghĩa decorator nhận message riêng.

### Bootstrap

Với RMQ transport chuẩn NestJS, import module cần đi kèm bước khởi động listener trong `main.ts`; bước này được đóng gói trong helper `startRabbitMQ`.

Service chạy cả TCP và RMQ sử dụng một Nest hybrid application, dùng chung application context:

- Gắn TCP transport hiện tại và RMQ transport.
- Bật `enableShutdownHooks()`.
- Khởi động cả hai listener và chỉ coi startup thành công khi cả hai sẵn sàng.
- Không mở HTTP listener. Bổ sung HTTP adapter mà hybrid application yêu cầu nếu service chưa có dependency này.
- Đảm bảo wrapper ack của lib được áp dụng cho RMQ listener, không tác động tới TCP handler.

## 3. Cấu hình và hành vi runtime

### Cấu hình và dependency

- `RABBITMQ_URI` và `RABBITMQ_QUEUE` bắt buộc khi import module; thiếu hoặc sai thì báo lỗi cấu hình.
- Option truyền trực tiếp ưu tiên hơn biến môi trường.
- Mặc định: queue durable, message persistent, `noAck: false`, prefetch 10.
- Dependency vận chuyển: `@nestjs/microservices`, `amqplib`, `amqp-connection-manager`; tương thích NestJS 12 của workspace.
- Tuân thủ quy ước package exports, build và typecheck của các lib hiện có.

### Kết nối, timeout và shutdown

- Dùng kết nối nhận cho queue của service; cache client gửi theo queue đích, không tạo client cho từng message.
- Chờ kết nối và listener sẵn sàng tối đa 10 giây khi startup. Thất bại thì đóng tài nguyên đã mở và báo lỗi.
- Sau startup, tự reconnect và phục hồi consumer khi broker trở lại.
- Lệnh gửi khi mất kết nối phải có thời hạn, không để Promise chờ vô hạn.
- Shutdown dừng nhận message mới, chờ handler đang chạy tối đa 10 giây rồi đóng listener và client. Message chưa ack được broker giao lại.
- Log trạng thái kết nối và lỗi; che thông tin đăng nhập trong URI.

### Ack, lỗi và DLQ

- Wrapper handler chỉ áp dụng cho RMQ transport: handler hoàn thành thành công mới ack; lỗi xử lý thì nack với `requeue: false`.
- Chuẩn bị dead-letter exchange và queue `<queue>.dlq` trước khi nhận message; cấu hình queue nguồn trỏ tới DLQ tương ứng.
- Với RPC, lỗi handler được trả về caller bằng cơ chế lỗi NestJS đồng thời đưa request lỗi vào DLQ; không tự retry.
- Ack/nack mỗi message đúng một lần; không ack message sau khi channel nhận ban đầu đã đóng.
- Handler cần xử lý idempotent vì message có thể được giao lại khi mất kết nối.
- Publisher confirm và consumer ack xác nhận hai giai đoạn khác nhau; gửi thành công không đồng nghĩa handler đã xử lý thành công.
- README ghi rõ giới hạn bảo đảm của dead-lettering theo loại queue; v1 không cam kết exactly-once.

## 4. Các bước triển khai

- [x] Dùng skill `nx-generate` và Nx generator để tạo lib; liên kết dependency bằng npm workspace theo skill `link-workspace-packages`.
- [x] Triển khai cấu hình đồng bộ/bất đồng bộ và public exports.
- [x] Triển khai client gửi event/RPC, cache client, timeout và cleanup.
- [x] Triển khai helper bootstrap, topology DLQ và wrapper pipeline handler ack/nack cho RMQ.
- [x] Hoàn thiện reconnect, xử lý startup thất bại và graceful shutdown.
- [x] Viết README: `.env`, import module, bootstrap TCP + RMQ, hai loại handler, gửi tới queue khác và giới hạn vận hành.
- [x] Chạy unit/integration test và build/typecheck qua Nx.

Theo yêu cầu triển khai bổ sung, `w-identity` đã import module và chạy TCP + RMQ trong cùng application context; readiness kiểm tra consumer RabbitMQ. Các handler identity hiện có giữ nguyên contract, không thêm event nghiệp vụ.

## 5. Kiểm thử và tiêu chí nghiệm thu

### Unit test

- Cấu hình từ `.env`, option override, thiếu/sai URI hoặc queue.
- Cấu hình qua `forRootAsync` và dependency injection.
- Cache client theo queue đích; timeout và đóng client khi shutdown.
- Ack khi handler thành công; nack không requeue khi handler lỗi; mỗi message được xử lý ack/nack đúng một lần.
- TCP handler không dùng wrapper RMQ.

### Integration test với RabbitMQ thật

- Event tới đúng `@EventPattern` handler.
- RPC nhận đúng kết quả, lỗi handler và timeout khi không có phản hồi.
- Message lỗi vào DLQ và không tạo vòng lặp requeue.
- Hai replica cùng queue chia việc; không nhân bản event thành broadcast.
- Mất kết nối rồi phục hồi consumer; thao tác gửi không chờ vô hạn.
- Startup không có broker thất bại trong thời hạn và giải phóng tài nguyên.
- Shutdown trong lúc xử lý không ack sớm; message chưa ack có thể được giao lại.
- TCP và RMQ hoạt động trong cùng application context.

### Hoàn thành khi

Một service NestJS có thể import module, cấu hình URI/queue qua `.env`, khởi động bằng helper, gửi/nhận cả event và RPC mà không phải tự viết lại logic kết nối RabbitMQ. Build/typecheck và các kiểm thử liên quan đều chạy qua Nx.

## Tài liệu tham khảo

- [NestJS RabbitMQ transport](https://docs.nestjs.com/microservices/rabbitmq)
- [RabbitMQ consumer acknowledgements và publisher confirms](https://www.rabbitmq.com/docs/confirms)
- [RabbitMQ dead-letter exchanges](https://www.rabbitmq.com/docs/dlx)
- [amqp-connection-manager](https://github.com/jwalton/node-amqp-connection-manager)


## Cập nhật Clean Architecture cho profile của worker

Domain quản lý trạng thái account và validation profile qua policy/error thuần. Application tiếp tục điều phối qua UserRepositoryPort. Presentation kiểm tra cấu trúc request và ánh xạ domain error thành 400/403. UserPersistenceEntity thuộc Infrastructure, giữ collection/pool và index hiện có. Đã kiểm chứng build/typecheck/unit, Mongo integration và kiểm thử profile qua TCP; full E2E hiện vướng policy quản trị trả 403 tại bước tạo user.


## CQRS cho w-identity

Đã tách 5 command và 3 query. Bus/decorator NestJS ở presentation adapter; logic handler Application và Domain vẫn độc lập framework. Một UserRepositoryPort chung cho query và command. Query trả profile null nếu chưa có và không ghi; command cập nhật upsert profile. Đã cập nhật OpenAPI và kiểm thử dispatch, validation, auth, không ghi khi query. Full E2E hiện thiếu fixture pm-realm.json.
