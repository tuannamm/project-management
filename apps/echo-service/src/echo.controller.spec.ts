import { RpcException } from '@nestjs/microservices';
import type { GatewayRequest } from './contracts';
import { EchoController } from './echo.controller';

// Yêu cầu Node ≥ 24.9 (NestJS 12 là ESM-only).
const req = (id: string): GatewayRequest => ({
  params: { id },
  query: {},
  meta: { requestId: 'r-1', operationId: 'user.getById', project: 'example' },
});

describe('EchoController', () => {
  const controller = new EchoController();

  it('echoes the gateway request', async () => {
    await expect(controller.getById(req('42'))).resolves.toEqual({ echo: req('42') });
  });

  it('throws a contract-compliant RpcException for a missing user', async () => {
    const error = await controller.getById(req('missing')).catch((e) => e);
    expect(error).toBeInstanceOf(RpcException);
    expect((error as RpcException).getError()).toMatchObject({ statusCode: 404, code: 'USER_NOT_FOUND' });
  });
});
