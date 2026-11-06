import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import type { GatewayRequest, GatewayRpcError } from './contracts';

/** Đủ lâu để vượt timeout mặc định của gateway (10s), để thử 504. */
const SLOW_MS = Number(process.env.ECHO_SLOW_MS ?? 12_000);
const INSTANCE_PORT = process.env.ECHO_PORT ?? '4001';

/**
 * Service mẫu: mỗi @MessagePattern khớp CHÍNH XÁC một operationId trong
 * apps/api-gateway/specs/example/openapi.yml. Đây cũng là khuôn để viết service thật.
 */
@Controller()
export class EchoController {
  private readonly logger = new Logger(EchoController.name);

  @MessagePattern('user.getById')
  async getById(@Payload() req: GatewayRequest) {
    this.log(req);
    if (req.params.id === 'missing') {
      // Lỗi nghiệp vụ theo hợp đồng → gateway trả 404 problem+json với code này.
      throw new RpcException({
        statusCode: 404,
        message: `User ${req.params.id} not found`,
        code: 'USER_NOT_FOUND',
      } satisfies GatewayRpcError);
    }
    if (req.params.id === 'slow') {
      await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
    }
    return { echo: req };
  }

  @MessagePattern('user.list')
  list(@Payload() req: GatewayRequest) {
    this.log(req);
    return { echo: req };
  }

  @MessagePattern('user.create')
  create(@Payload() req: GatewayRequest) {
    this.log(req);
    return { echo: req };
  }

  @MessagePattern('auth.login')
  login(@Payload() req: GatewayRequest) {
    this.log(req);
    return { echo: req };
  }

  // Cố ý KHÔNG có 'auth.logout' (gateway: không ai đăng ký → 503).

  /**
   * Log kèm requestId (cùng mã với log của gateway, tìm một mã là thấy cả hành trình)
   * và cổng của instance (chạy nhiều instance thì thấy được request được chia về đâu).
   */
  private log(req: GatewayRequest): void {
    this.logger.log(
      `[echo:${INSTANCE_PORT}] [${req.meta.requestId}] ${req.meta.operationId} params=${JSON.stringify(req.params)}`,
    );
  }
}
