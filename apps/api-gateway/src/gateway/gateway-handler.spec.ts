import type { GatewayRequest } from './contracts';
import type { Instance, ServiceDiscovery } from './discovery/types';
import { GatewayHandler, type GatewayLogger, type IncomingRequest } from './gateway-handler';
import { RouteTable } from './route-table';
import {
  RpcConnectionError,
  RpcPatternNotHandledError,
  RpcRemoteError,
  RpcTimeoutError,
  type RpcTransport,
} from './transport/types';
import type { RouteDefinition } from './types';

const instance: Instance = { id: 'user-1', service: 'user', host: '127.0.0.1', port: 4001 };

const routes: RouteDefinition[] = [
  { method: 'get', path: '/users/{id}', operationId: 'user.getById', successStatus: 200 },
  { method: 'post', path: '/users', operationId: 'user.create', successStatus: 201 },
  { method: 'delete', path: '/users/{id}', operationId: 'user.remove', successStatus: 204 },
  { method: 'get', path: '/orphans', operationId: 'orphan.list', successStatus: 200 },
];

/** Discovery giả: mọi pattern đều có instance, trừ "orphan.list". */
const discovery: ServiceDiscovery = {
  resolve: async (_project, pattern) => (pattern === 'orphan.list' ? [] : [instance]),
};

/** Transport giả: ghi lại lần gọi, trả kết quả hoặc ném lỗi tuỳ test. */
function fakeTransport(behaviour: (pattern: string, payload: GatewayRequest) => unknown) {
  const calls: { instance: Instance; pattern: string; payload: GatewayRequest; timeoutMs: number }[] = [];
  const transport: RpcTransport = {
    send: async (inst, pattern, payload, timeoutMs) => {
      calls.push({ instance: inst, pattern, payload: payload as GatewayRequest, timeoutMs });
      return behaviour(pattern, payload as GatewayRequest);
    },
    close: async () => undefined,
  };
  return { transport, calls };
}

function setup(behaviour: (pattern: string, payload: GatewayRequest) => unknown = () => ({ ok: true })) {
  const { transport, calls } = fakeTransport(behaviour);
  const logs: string[] = [];
  const logger: GatewayLogger = { warn: (m) => logs.push(`warn ${m}`), error: (m) => logs.push(`error ${m}`) };
  const handler = new GatewayHandler({
    project: 'shop',
    routeTable: RouteTable.from(routes),
    discovery,
    transport,
    rpcTimeoutMs: 1234,
    logger,
  });
  const handle = (req: Partial<IncomingRequest>) =>
    handler.handle({ method: 'GET', url: '/', headers: {}, ...req });
  return { handle, calls, logs };
}

describe('GatewayHandler: success path', () => {
  it('sends the operationId as the pattern with an allowlisted payload', async () => {
    const { handle, calls } = setup();

    await handle({
      method: 'POST',
      url: '/users?tag=a&tag=b&page=2',
      headers: { 'x-request-id': 'req-1', 'idempotency-key': 'idem-9', authorization: 'Bearer secret', 'x-user-id': 'admin' },
      body: { name: 'Nam' },
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].instance).toBe(instance);
    expect(calls[0].pattern).toBe('user.create');
    expect(calls[0].timeoutMs).toBe(1234);
    expect(calls[0].payload).toEqual({
      params: {},
      query: { tag: ['a', 'b'], page: '2' },
      body: { name: 'Nam' },
      meta: { requestId: 'req-1', operationId: 'user.create', project: 'shop', idempotencyKey: 'idem-9' },
    });
    // Header của client (kể cả danh tính giả) KHÔNG lọt xuống service.
    expect(JSON.stringify(calls[0].payload)).not.toMatch(/secret|admin/);
  });

  it('returns the success status declared in the spec, with the request id', async () => {
    const { handle } = setup(() => ({ id: 1 }));
    const res = await handle({ method: 'POST', url: '/users', headers: { 'x-request-id': 'req-2' } });

    expect(res).toEqual({
      status: 201,
      headers: { 'x-request-id': 'req-2', 'content-type': 'application/json; charset=utf-8' },
      body: { id: 1 },
    });
  });

  it('passes decoded path params', async () => {
    const { handle, calls } = setup();
    await handle({ url: '/users/Nguy%E1%BB%85n' });
    expect(calls[0].payload.params).toEqual({ id: 'Nguyễn' });
  });

  it('returns 204 without a body', async () => {
    const { handle } = setup(() => 'ignored');
    const res = await handle({ method: 'DELETE', url: '/users/1' });
    expect(res.status).toBe(204);
    expect(res.body).toBeUndefined();
    expect(res.headers['content-type']).toBeUndefined();
  });

  it('turns an undefined result into a JSON null body', async () => {
    const { handle } = setup(() => undefined);
    expect((await handle({ url: '/users/1' })).body).toBeNull();
  });

  it('generates a request id when the client sends none', async () => {
    const { handle, calls } = setup();
    const res = await handle({ url: '/users/1' });
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(calls[0].payload.meta.requestId).toBe(res.headers['x-request-id']);
  });

  it('ignores an over-long Idempotency-Key', async () => {
    const { handle, calls } = setup();
    await handle({ url: '/users/1', headers: { 'idempotency-key': 'k'.repeat(256) } });
    expect(calls[0].payload.meta.idempotencyKey).toBeUndefined();
  });
});

describe('GatewayHandler: error mapping (RFC 9457)', () => {
  async function expectProblem(
    res: Awaited<ReturnType<ReturnType<typeof setup>['handle']>>,
    status: number,
    code: string,
  ) {
    expect(res.status).toBe(status);
    expect(res.headers['content-type']).toBe('application/problem+json');
    expect(res.body).toMatchObject({ type: 'about:blank', status, code, requestId: res.headers['x-request-id'] });
  }

  it('404 when no route matches, without calling any service', async () => {
    const { handle, calls } = setup();
    const res = await handle({ url: '/nope?x=1' });
    await expectProblem(res, 404, 'ROUTE_NOT_FOUND');
    expect(res.body).toMatchObject({ instance: '/nope' });
    expect(calls).toHaveLength(0);
  });

  it('405 with an Allow header', async () => {
    const { handle } = setup();
    const res = await handle({ method: 'PATCH', url: '/users/1' });
    await expectProblem(res, 405, 'METHOD_NOT_ALLOWED');
    expect(res.headers.allow).toBe('DELETE, GET');
  });

  it('400 for malformed percent-encoding', async () => {
    const { handle } = setup();
    await expectProblem(await handle({ url: '/users/%E0%A4%A' }), 400, 'INVALID_PATH');
  });

  it('503 when no instance handles the pattern (and logs it)', async () => {
    const { handle, calls, logs } = setup();
    await expectProblem(await handle({ url: '/orphans' }), 503, 'NO_INSTANCE');
    expect(calls).toHaveLength(0);
    expect(logs.join()).toContain('orphan.list');
  });

  it('504 on timeout', async () => {
    const { handle } = setup((pattern) => {
      throw new RpcTimeoutError(pattern, instance, 1234);
    });
    await expectProblem(await handle({ url: '/users/1' }), 504, 'UPSTREAM_TIMEOUT');
  });

  it('502 when the service is unreachable', async () => {
    const { handle } = setup(() => {
      throw new RpcConnectionError(instance, new Error('connect ECONNREFUSED'));
    });
    await expectProblem(await handle({ url: '/users/1' }), 502, 'UPSTREAM_UNAVAILABLE');
  });

  it('502 when the service has no handler for the pattern (and logs it)', async () => {
    const { handle, logs } = setup((pattern) => {
      throw new RpcPatternNotHandledError(pattern, instance);
    });
    await expectProblem(await handle({ url: '/users/1' }), 502, 'PATTERN_NOT_HANDLED');
    expect(logs.join()).toContain('no handler for pattern "user.getById"');
  });

  it('uses status, code, message and details from a contract-compliant service error', async () => {
    const { handle } = setup((pattern) => {
      throw new RpcRemoteError(pattern, instance, {
        statusCode: 409,
        message: 'Email taken',
        code: 'EMAIL_TAKEN',
        details: { field: 'email' },
      });
    });
    const res = await handle({ url: '/users/1' });
    await expectProblem(res, 409, 'EMAIL_TAKEN');
    expect(res.body).toMatchObject({ detail: 'Email taken', details: { field: 'email' } });
  });

  it.each([
    ['NestJS default for a plain Error', { status: 'error', message: 'Internal server error' }],
    ['statusCode out of range', { statusCode: 200, message: 'ok?' }],
    ['a string', 'boom'],
  ])('502 UPSTREAM_ERROR for a non-contract service error (%s)', async (_label, payload) => {
    const { handle } = setup((pattern) => {
      throw new RpcRemoteError(pattern, instance, payload);
    });
    await expectProblem(await handle({ url: '/users/1' }), 502, 'UPSTREAM_ERROR');
  });

  it('500 for unexpected gateway errors, without leaking details', async () => {
    const { handle, logs } = setup(() => {
      throw new TypeError('secret internal detail');
    });
    const res = await handle({ url: '/users/1' });
    await expectProblem(res, 500, 'INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('secret internal detail');
    expect(logs.join()).toContain('secret internal detail');
  });
});
