# PLAN: API Gateway contract-first

> Mục tiêu: build một API Gateway **tái sử dụng được** cho nhiều project. Mỗi project chỉ cần một file OpenAPI (`.yml`). Gateway đọc URL từ đó, dùng `operationId` (chính là `@MessagePattern` của service) để biết request thuộc service nào, tìm instance qua Service Discovery, rồi gửi message RPC qua TCP.
> Mục tiêu học: vừa build vừa hiểu concept để ôn phỏng vấn microservices. Kiến thức được theo dõi ở [KNOWLEDGE.md](./KNOWLEDGE.md).

---

## 1. Các quyết định đã chốt

| # | Quyết định | Ghi chú |
|---|---|---|
| 1 | File OpenAPI là **nguồn sự thật duy nhất** (contract-first) | Gateway sinh bảng route từ file này |
| 2 | **`operationId` bắt buộc** ở mọi operation | Thiếu là gateway **không khởi động** |
| 3 | `operationId` là **string tự do** (không rỗng, không trùng, không có khoảng trắng đầu/cuối) | VD `getUserById`, `user.getById` đều hợp lệ |
| 4 | **`operationId` = `@MessagePattern`** trong controller của service | Gateway gửi đúng pattern này xuống service |
| 4b | **Gateway hỏi registry "ai xử lý pattern này?"** | Mỗi service khai báo danh sách pattern khi đăng ký. Spec không ghi tên service (mục 8) |
| 5 | **Transport: TCP + Service Discovery** | Gateway là **bộ dịch giao thức HTTP → RPC**, không phải HTTP reverse proxy (mục 4) |
| 6 | Xử lý request bằng **catch-all handler** | Không viết controller theo từng route |
| 7 | **Service Discovery là project riêng** | Gateway chỉ là client qua 1 interface (mục 8) |
| 8 | **Một instance gateway = một project**, chọn bằng env `GATEWAY_PROJECT` | Mỗi project đúng **một** file spec (mục 12) |
| 9 | Lỗi theo **RFC 9457** (`application/problem+json`) | Mọi lỗi kèm `requestId` |
| 10 | Auth: **Keycloak + auth worker**; gateway chỉ verify JWT cục bộ | Mục 10 |
| 11 | Nền HTTP: NestJS (Fastify adapter) | Core viết framework-agnostic để tái sử dụng |
| 12 | **Không làm** ở gateway: API versioning, contract test spec vs service, WebSocket/SSE (khi nào cần mới làm), tối ưu hiệu năng (sau khi đưa vào dùng) | Người viết spec chịu trách nhiệm spec chính xác |

---

## 2. Gateway là gì và không phải là gì

- Là **điểm vào duy nhất** của hệ thống, đứng giữa client và các service.
- **Không** chứa business logic. Gateway "béo" là anti-pattern: nó thành monolith ở cửa trước và là single point of failure.
- Khác Nginx thuần: Nginx route theo cấu hình tĩnh ở tầng HTTP. Gateway này route theo **hợp đồng API (OpenAPI)**, áp policy theo từng operation, và **dịch** HTTP sang message RPC.

Lý do cần gateway:
- Client không cần biết có bao nhiêu service, ở đâu, nói giao thức gì.
- Auth, rate limit, logging làm một lần ở gateway.
- Đổi hoặc tách service mà không ảnh hưởng client.

---

## 3. Chức năng chính mà gateway đem lại

Cột "Nguồn cấu hình" cho thấy tính năng nào được điều khiển từ file OpenAPI (đúng tinh thần contract-first).

### Nhóm 1: Định tuyến và dịch giao thức (cốt lõi)
| Chức năng | Làm gì | Nguồn cấu hình | Bước |
|---|---|---|---|
| **Routing** | Khớp `method + path` với route trong spec; tự trả 404/405 | `paths` | 1 |
| **Pattern resolution** | Hỏi registry: instance nào xử lý `operationId` này trong project (có cache) | `operationId` | 2, 3 |
| **Load balancing** | Round-robin theo từng `project\|pattern` | - | 3 ✅ |
| **Failover** | Instance chắc chắn chưa nhận request (`ECONNREFUSED`…) thì thử instance kế | `GATEWAY_FAILOVER_MAX_ATTEMPTS` | 3 ✅ |
| **Protocol translation** | Dựng payload từ HTTP, gửi `send(pattern, payload)` qua TCP, map kết quả về HTTP | `responses` (status 2xx) | 2 |
| **Connection pool** | Giữ kết nối TCP theo `host:port`, đóng khi instance biến mất | - | 2, 3 |

### Nhóm 2: Bảo vệ và kiểm soát traffic
| Chức năng | Làm gì | Nguồn cấu hình | Bước |
|---|---|---|---|
| **Authentication** | Verify JWT của Keycloak, đưa `user` vào payload | `security` | 4 |
| **Phân quyền thô** | Kiểm tra role | `x-roles` (tuỳ chọn) | 4 |
| **Request validation** | Validate path/query/body theo schema, sai trả 400 | `parameters`, `requestBody` | 4 |
| **Rate limiting** | Giới hạn số request, trả 429 + `Retry-After` | `x-rate-limit` | 4 |
| **Giới hạn an toàn** | Body tối đa, Content-Type, timeout (mục 11) | env, `x-timeout` | 2, 4 |
| **CORS / security headers** | Chuẩn hoá một lần cho mọi service | env | 4 |

### Nhóm 3: Chịu lỗi (resilience)
| Chức năng | Làm gì | Nguồn cấu hình | Bước |
|---|---|---|---|
| **Timeout RPC** | Không chờ service vô hạn (504) | env, `x-timeout` | 2 |
| **Retry** | Chỉ với thao tác idempotent, có backoff + jitter | `x-retry` | 5 |
| **Circuit breaker** | Ngừng gọi service đang hỏng, phục hồi từ từ | env | 5 |
| **Stale-on-error** | Registry chết thì dùng cache instance cũ | - | 7 |

### Nhóm 4: Quan sát và vận hành
| Chức năng | Làm gì | Bước |
|---|---|---|
| **Request id** | Sinh/nhận `x-request-id`, đưa vào payload và response | 2 |
| **Structured log + metrics** | Log JSON, số request, lỗi, latency p50/p95/p99 | 5 |
| **Health endpoint** | Liveness và readiness của chính gateway | 5 |
| **Hot reload spec** | Đổi spec không cần restart, atomic swap | sau 1 |
| **Cấu hình theo project** | Chọn spec bằng `GATEWAY_PROJECT` | 1 |
| **Graceful shutdown** | Hoàn tất request đang xử lý, đóng kết nối TCP trước khi thoát | 6 |

### Giá trị mang lại
- **Cho client:** một địa chỉ HTTP duy nhất, không cần biết service ở đâu và nói giao thức gì.
- **Cho service:** không phải tự làm auth, rate limit, CORS, mở HTTP; chỉ cần viết `@MessagePattern`.
- **Cho vận hành:** quan sát, giới hạn và bảo vệ tập trung ở một điểm.
- **Cho nhiều project:** spec là thứ duy nhất khác nhau; mã gateway dùng lại nguyên vẹn.

### Ngoài phạm vi (gateway KHÔNG làm)
| Việc | Lý do | Ai làm |
|---|---|---|
| Business logic | Gateway "béo" thành monolith ở cửa trước | Các service |
| Login, logout, refresh, CRUD user, gọi Keycloak Admin API | Nghiệp vụ định danh | auth worker |
| Service registry (đăng ký, heartbeat, health) | Hệ thống riêng (mục 8) | `apps/service-registry` |
| Kết nối RabbitMQ / publish event | Event là giao tiếp giữa service; gateway chỉ lo request của client | Các service |
| Lưu dữ liệu nghiệp vụ | Gateway stateless để scale ngang | Các service |

---

## 4. Kiến trúc tổng thể

```
                                         ┌────────────────────┐
  user-service ─── register/heartbeat ─► │  Service Registry  │
   (patterns: getUserById, createUser)   │   (project riêng)  │
  order-service, auth worker ────────►   └─────────▲──────────┘
       ▲                                           │ ai xử lý ("shop", "getUserById")? (cache)
       │ TCP: send('user.getById', payload)  ┌─────┴────────┐
       └──────────────────────────────────── │ API Gateway  │ ◄──HTTP── Client
                                             └──────────────┘
  RabbitMQ: chỉ dùng cho event giữa các service, gateway không kết nối.
  Keycloak: chỉ auth worker gọi; gateway chỉ tải public key (JWKS) để verify token.
```

### Protocol translation thay cho reverse proxy
Service **không mở API HTTP** cho gateway. Nó chỉ lắng nghe message:

```ts
// user-service
@MessagePattern('user.getById')
getById(@Payload() req: GatewayRequest) { ... }
```

Gateway nhận HTTP, dựng payload, gửi message, đợi kết quả, rồi trả HTTP cho client. Vì vậy các khái niệm của HTTP proxy (hop-by-hop headers, streaming body, path rewrite, `X-Forwarded-*`) **không áp dụng**: path chỉ tồn tại ở phía gateway.

---

## 5. Hai "mặt phẳng": control plane và data plane

| | Control plane | Data plane |
|---|---|---|
| Việc | Chuẩn bị: đọc spec, validate, dựng route table | Xử lý từng request thật |
| Khi nào | Lúc khởi động và khi spec đổi (hot reload) | Mỗi request |
| Yêu cầu | Đúng, fail sớm | Nhanh, không I/O thừa |

Nguyên tắc: **việc nặng làm ở control plane một lần** (parse yml, validate, build trie). Data plane chỉ tra cứu trong bộ nhớ. Danh sách instance cũng được đồng bộ ở nền; request không gọi registry trực tiếp.

---

## 6. Vòng đời một request (data plane)

```
Client: GET /users/42?active=true   (Authorization: Bearer ...)

 1. Catch-all handler nhận request; lấy hoặc sinh x-request-id
 2. RouteTable.match(GET, /users/42)
      → khớp:  { operationId: "user.getById", params: { id: "42" } }
      → không khớp path: 404; khớp path sai method: 405 + Allow
 3. (Bước 4) Auth theo `security`, validate, rate limit
 4. Dựng payload GatewayRequest (allowlist, mục 7)
 5. Discovery: ai xử lý ("shop", "user.getById")? → [10.0.0.5:4001, ...] (cache); rỗng → 503
 6. Round-robin (theo project|pattern) cho ra thứ tự thử [A, B, C]
 7. ClientTCP(host:port).send("user.getById", payload) với timeout
      chưa kết nối được (ECONNREFUSED…) → thử instance kế (failover), tối đa GATEWAY_FAILOVER_MAX_ATTEMPTS
      lỗi khác (timeout, đứt giữa chừng, lỗi service) → KHÔNG thử lại
 8. Map kết quả:
      thành công → status 2xx lấy từ spec + body
      service ném RpcException({statusCode,...}) → problem+json với statusCode đó
      không kết nối được → 502, quá timeout → 504
 9. Gắn x-request-id vào response
```

---

## 7. Hợp đồng message giữa gateway và service

**Nguồn chuẩn:** `src/gateway/contracts.ts`. Không có lib dùng chung: mỗi service giữ một **bản copy** (VD `apps/echo-service/src/contracts.ts`) kèm chú thích trỏ về nguồn chuẩn. Đổi hợp đồng thì cập nhật bản copy ở các service.

```ts
interface GatewayRequest<TBody = unknown> {
  params: Record<string, string>;            // đã decode
  query: Record<string, string | string[]>;  // key lặp lại → mảng
  body?: TBody;
  user?: GatewayUser;                        // Bước 4: từ JWT đã verify
  meta: { requestId: string; operationId: string; project: string; idempotencyKey?: string };
}

interface GatewayRpcError { statusCode: number; message: string; code?: string; details?: unknown }
```

- Gateway **tự dựng payload từ đầu** (allowlist), không chuyển nguyên header của client. Client không thể giả `user` hay header nội bộ.
- **Thành công:** service trả data; gateway trả status = mã 2xx nhỏ nhất khai báo trong `responses` (mặc định 200). 204 thì không có body. Service trả `undefined` thì body là `null`.
- **Lỗi nghiệp vụ:** service ném `new RpcException({ statusCode, message, code } satisfies GatewayRpcError)`; gateway trả `problem+json` với `statusCode` và `code` đó.

### Bảng mã lỗi do gateway trả (body RFC 9457, luôn có `code` và `requestId`)
| Mã | `code` | Khi nào | Bước |
|---|---|---|---|
| 400 | `INVALID_PATH` | Path có percent-encoding hỏng | 2 ✅ |
| 400 | `BAD_REQUEST` | Body JSON hỏng | 2 ✅ |
| 400 | (sẽ định nghĩa) | Request sai schema | 4 |
| 401 / 403 | (sẽ định nghĩa) | Thiếu/sai token / không đủ quyền | 4 |
| 404 | `ROUTE_NOT_FOUND` | Không có route | 2 ✅ |
| 405 | `METHOD_NOT_ALLOWED` | Có path nhưng sai method (kèm `Allow`) | 2 ✅ |
| 413 | `PAYLOAD_TOO_LARGE` | Body vượt `GATEWAY_BODY_LIMIT` | 2 ✅ |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Body không phải `application/json` | 2 ✅ |
| 429 | (sẽ định nghĩa) | Vượt rate limit | 4 |
| 4xx/5xx | `code` của service | Service ném `RpcException` đúng hợp đồng | 2 ✅ |
| 500 | `INTERNAL_ERROR` | Lỗi của chính gateway (chỉ log chi tiết, không trả cho client) | 2 ✅ |
| 502 | `UPSTREAM_UNAVAILABLE` | Không kết nối được instance | 2 ✅ |
| 502 | `PATTERN_NOT_HANDLED` | Service không có `@MessagePattern` cho `operationId` (spec và service lệch) | 2 ✅ |
| 502 | `UPSTREAM_ERROR` | Service ném lỗi không theo hợp đồng | 2 ✅ |
| 503 | `NO_INSTANCE` | Không có instance nào xử lý pattern | 2 ✅ |
| 504 | `UPSTREAM_TIMEOUT` | Service không trả lời trong `GATEWAY_RPC_TIMEOUT_MS` | 2 ✅ |

---

## 8. Service Discovery và ranh giới với gateway

**Tra theo pattern, không theo tên service.** Spec chỉ có `operationId`. Mỗi service khi đăng ký khai báo các `@MessagePattern` nó xử lý; gateway hỏi registry "trong project này, instance nào xử lý pattern X?".

```ts
interface ServiceDiscovery {
  /** Instance healthy xử lý `pattern` trong `project`. Rỗng → gateway trả 503. */
  resolve(project: string, pattern: string): Promise<Instance[]>;
  watch?(project: string, cb: (table: Map<string, Instance[]>) => void): () => void;
}

interface Instance {
  id: string;
  service: string;    // tên service (để log, metrics, circuit breaker theo service)
  host: string;
  port: number;       // cổng TCP của microservice
  metadata?: Record<string, string>;
}
```

Dữ liệu đăng ký (service gửi lên registry):
```json
{ "project": "shop", "service": "user", "id": "user-1", "host": "10.0.0.5", "port": 4001,
  "patterns": ["user.getById", "user.create"] }
```

- Pattern được tra **trong phạm vi project**: hai project dùng chung tên pattern không lẫn nhau.
- **Một pattern chỉ thuộc một service** trong một project. Registry từ chối đăng ký nếu service khác đã giữ pattern đó (tránh hai service cùng nhận một request).
- Endpoint dự kiến phía registry (làm sau): `PUT /projects/{project}/instances/{id}` (register + heartbeat, kèm `patterns`), `DELETE ...` (deregister), `GET /projects/{project}/patterns/{pattern}/instances?healthy=true`.
- Tài liệu hoá: NestJS không tự liệt kê `@MessagePattern`; service cần tự thu thập danh sách pattern (VD qua `DiscoveryService` của NestJS) khi đăng ký. Làm ở bước registry.
- Đánh đổi: gateway **không kiểm tra được lúc khởi động** pattern nào chưa có service xử lý (registry thay đổi liên tục), chỉ biết lúc request (503). Có thể bổ sung log cảnh báo định kỳ "pattern trong spec chưa có ai đăng ký".
- Lộ trình: `StaticDiscovery` (✅ Bước 2) → registry riêng (`apps/service-registry`) → `HttpRegistryAdapter`.
- **Định dạng file `GATEWAY_DISCOVERY_FILE`** (cùng hình dạng với dữ liệu đăng ký ở trên; ví dụ: `discovery.local.json`):
  ```json
  { "instances": [
      { "project": "example", "service": "echo", "id": "echo-1",
        "host": "127.0.0.1", "port": 4001,
        "patterns": ["user.getById", "user.list", "user.create", "auth.login"] } ] }
  ```
  Validate lúc khởi động (gom mọi lỗi): thiếu field, port sai, id trùng, hai service khác nhau giữ cùng một pattern trong một project.
- Gateway cần **cache TTL** và **stale-on-error**.

---

## 9. Từ OpenAPI sang route (control plane)

```yaml
paths:
  /users/{id}:
    get:
      operationId: user.getById      # = @MessagePattern('user.getById'), string tự do
      responses:
        '200': { description: OK }   # successStatus = 200
```

### 9.1 Fail-fast lúc khởi động
Gom **tất cả** lỗi rồi báo một lần:
- Spec không hợp lệ theo OpenAPI
- Thiếu `operationId`
- `operationId` trùng nhau
- `operationId` rỗng hoặc có khoảng trắng đầu/cuối (sẽ không bao giờ khớp `@MessagePattern`)
- Hai route cùng method, chỉ khác tên tham số (`/items/{id}` và `/items/{itemId}`)

### 9.2 RouteTable: segment trie
- Mỗi segment path là 1 node; `{id}` là node tham số.
- Segment **tĩnh được ưu tiên** trước tham số (`/users/me` thắng `/users/{id}`), có backtrack.
- Tên tham số lưu ở **lá**, nên `/users/{id}` và `/users/{userId}/orders` cùng tồn tại.
- Mỗi lá có map `method → route`, phân biệt 404 và 405.
- Match O(số segment), không phụ thuộc số route.
- Chuẩn hoá: bỏ query string, bỏ `/` cuối, decode param an toàn.

---

## 10. Auth: Keycloak + auth worker

| Thành phần | Trách nhiệm |
|---|---|
| **Keycloak** | Identity provider: lưu thông tin đăng nhập, phát và ký token, quản lý session |
| **auth worker** (service riêng, có collection `user`) | Login, logout, refresh, CRUD user; nơi **duy nhất** gọi Keycloak; liên kết user qua `keycloakId` = `sub` |
| **Gateway** | Chỉ **verify** token mỗi request; không login, không biết collection `user` |

```
Login:   Client ─POST /auth/login─► Gateway ─TCP 'auth.login'─► auth worker ─► Keycloak
         (security: [] → không đòi token)                         ◄── access + refresh token
Gọi API: Client ─GET /orders (Bearer)─► Gateway verify bằng JWKS (cục bộ, có cache)
                                        → payload.user = { sub, roles } ─TCP─► order service
Logout:  Client ─POST /auth/logout─► Gateway ─TCP 'auth.logout'─► auth worker ─► Keycloak
```

- Route `/auth/*` khai báo trong spec như mọi route khác; gateway không xử lý đặc biệt.
- **Verify cục bộ bằng JWKS**, không hỏi auth worker mỗi request (tránh thêm độ trễ và điểm nghẽn).
- **RS256 + JWKS:** Keycloak công khai public key tại `{issuer}/protocol/openid-connect/certs`; gateway không giữ bí mật nào. Không dùng HS256.
- Kiểm tra chữ ký, `exp`/`nbf`, `iss`, `aud`/`azp`. Cache JWKS, gặp `kid` lạ thì tải lại (xoay khoá). Thư viện `jose`.
- Route công khai: `security: []`. Có `security` toàn cục thì mặc định mọi route cần auth.
- Phân quyền thô theo role (`x-roles`) ở gateway; phân quyền theo dữ liệu ở service.
- **Logout và JWT stateless:** access token vẫn hợp lệ tới khi hết hạn. Dùng access token ngắn (~5 phút) + huỷ refresh token khi logout. Thu hồi tức thì (blacklist `jti`, introspection) để sau.
- Env: `GATEWAY_JWT_ISSUER`, `GATEWAY_JWT_AUDIENCE`.

---

## 11. Giới hạn an toàn

| Giới hạn | Mặc định | Env | Lỗi |
|---|---|---|---|
| Kích thước body | 1 MB | `GATEWAY_BODY_LIMIT` | 413 |
| Timeout gọi RPC | 10 s (ghi đè bằng `x-timeout`) | `GATEWAY_RPC_TIMEOUT_MS` | 504 |
| Số instance thử khi failover | 3 (1 = tắt, tối đa 10) | `GATEWAY_FAILOVER_MAX_ATTEMPTS` | 502 khi hết lượt |
| `x-request-id` từ client | ≤ 128 ký tự, `[A-Za-z0-9._-]`; sai thì sinh mới | - | - |
| Payload xuống service | Chỉ allowlist (mục 7) | - | - |
| Content-Type có body | `application/json` | - | 415 |

---

## 12. Cấu hình theo project

```
specs/
├── shop/openapi.yml
├── blog/openapi.yml
└── hr/openapi.yml
```

| Biến | Bắt buộc | Mặc định | Ý nghĩa |
|---|---|---|---|
| `GATEWAY_PROJECT` | Có | - | Tên project, VD `shop` |
| `GATEWAY_SPECS_DIR` | Không | `./specs` | Thư mục chứa các project |
| `GATEWAY_SPEC_FILE` | Không | `openapi.yml` | Tên file trong thư mục project |

- Đường dẫn nạp: `<GATEWAY_SPECS_DIR>/<GATEWAY_PROJECT>/<GATEWAY_SPEC_FILE>`. Mỗi project đúng **một** file.
- Chạy nhiều project = chạy nhiều instance với env khác nhau.
- Fail-fast: thiếu env, thư mục hoặc file không tồn tại → không khởi động, **liệt kê project hiện có**.
- **Chống path traversal:** tên project `[a-z0-9_-]+`; đường dẫn sau `resolve` phải nằm trong `GATEWAY_SPECS_DIR`.
- Vì sao một instance = một project: cô lập lỗi và tải, scale riêng, data plane không cần phân biệt tenant. Đánh đổi: nhiều process hơn.

---

## 13. Ranh giới với kiến trúc event-driven (RabbitMQ)

- Gateway **không kết nối RabbitMQ**. Request/response giữa gateway và service đi qua TCP; event giữa các service đi qua RabbitMQ.
- **Async request:** service có thể trả `202 Accepted` + id để client hỏi trạng thái sau; với gateway chỉ là một response bình thường.
- **Truy vết:** service copy `meta.requestId` vào header của message khi publish event.
- **Idempotency:** gateway đưa `Idempotency-Key` vào `meta.idempotencyKey`; chống xử lý trùng là việc của service.
- Service chỉ làm worker cho event (không có `@MessagePattern` cho client) thì không xuất hiện trong spec.

---

## 14. Các tình huống biên

| Tình huống | Hành vi |
|---|---|
| Không khớp route | 404, không gửi message |
| Khớp path, sai method | 405 + `Allow` |
| Không có instance healthy nào xử lý pattern | 503 |
| Pattern trong spec chưa có service nào đăng ký | Không chặn lúc khởi động (registry là động); 503 lúc request + log rõ pattern |
| Hai service cùng đăng ký một pattern trong một project | Registry từ chối đăng ký thứ hai |
| Service có instance nhưng không có `@MessagePattern` tương ứng | Service trả lỗi "no matching handler" → gateway trả 502 và log rõ (lỗi cấu hình spec) |
| Không kết nối được / quá timeout | 502 / 504 |
| Spec đổi lúc đang chạy | Dựng route table mới rồi atomic swap; spec lỗi thì giữ bảng cũ |
| Registry chết | Dùng cache cũ (stale-on-error) |

---

## 15. Lộ trình

| Bước | Nội dung | Khái niệm học được |
|---|---|---|
| 0 ✅ | Dọn repo: một lockfile ở root, sửa `rootDir` cho TypeScript 6 | npm workspaces, Nx project |
| 1 ✅ | Config theo project + SpecLoader + RouteTable (unit test) | Contract-first, trie routing, fail-fast, path traversal |
| 2 ✅ | Catch-all handler + `StaticDiscovery` + TCP transport + request id + timeout + body limit + lỗi RFC 9457; `apps/echo-service` (chạy local, Docker ở Bước 6) | Protocol translation, RPC, connection pool, mã lỗi gateway |
| 3 ✅ | Load balancing (round-robin theo pattern) + failover an toàn (`delivered`) | Round-robin, khi nào retry sang instance khác là an toàn |
| 4 | Auth (Keycloak JWKS), validate, rate limit, giới hạn an toàn | JWT, JWKS, token bucket, Redis |
| 5 | Observability + resilience | Log/metrics, retry, circuit breaker |
| 6 | Đóng gói Docker + README "dùng cho project mới" | Cấu hình bằng env, graceful shutdown |
| 7 | Service Registry (project riêng) + `HttpRegistryAdapter` + **cache discovery** (TTL, stale-on-error, single-flight; dời từ Bước 3 vì chỉ có ý nghĩa khi gọi registry ở xa) | Heartbeat, TTL, CAP, cache stampede |

Mỗi bước có plan riêng để duyệt trước khi code.

**Cách chạy local:** xem [README.md](./README.md).

**Cấu trúc code sau Bước 2:**
```
src/
├── main.ts                  control plane (buildGateway) → fail-fast → listen
├── create-app.ts            NestJS + Fastify (bodyLimit, chỉ JSON, filter lỗi)
├── gateway.module.ts        đưa Gateway đã dựng vào DI; đóng kết nối khi tắt
├── gateway.controller.ts    catch-all @All('*'), lớp mỏng
├── problem.filter.ts        lỗi Fastify (413/415/400) → RFC 9457
└── gateway/                 CORE, không phụ thuộc NestJS (trừ transport/tcp-transport.ts)
    ├── config.ts, spec-loader.ts, route-table.ts      control plane (Bước 1)
    ├── bootstrap.ts                                   gom control plane
    ├── gateway-handler.ts                             data plane: match → payload → resolve → send → map lỗi
    ├── contracts.ts, request-id.ts, problem.ts
    ├── discovery/ (types, static-discovery)
    └── transport/ (types, tcp-transport)
```

**Yêu cầu môi trường:** Node **≥ 24.9**. NestJS 12 và một dependency của `swagger-parser` là ESM-only; Jest chỉ load được chúng trên Node ≥ 24.9 (Node 22 vẫn chạy app được, nhưng test không chạy được).

---

## 16. Cách làm việc

Claude viết code, bạn đọc, hiểu và hỏi lại. Với mỗi file: giải thích "tại sao" trước, kèm câu hỏi phỏng vấn liên quan. Sau mỗi bước cập nhật [KNOWLEDGE.md](./KNOWLEDGE.md).
