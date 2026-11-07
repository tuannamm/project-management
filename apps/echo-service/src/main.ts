import { existsSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

// Chạy local: nạp .env (nếu có) giống gateway. Biến đã có trong môi trường (export, dòng lệnh,
// Docker) KHÔNG bị ghi đè, nên `PORT=4002 npm run start:dev` vẫn chạy được instance thứ hai.
if (existsSync('.env')) process.loadEnvFile('.env');

/**
 * Microservice thuần TCP: KHÔNG mở cổng HTTP. Chỉ gateway nói chuyện với nó qua message.
 */
async function bootstrap(): Promise<void> {
  // Lắng nghe 0.0.0.0 (mọi card mạng); địa chỉ QUẢNG BÁ cho registry do ServiceDiscoveryModule lo.
  const host = process.env.ECHO_HOST ?? '0.0.0.0';
  const port = Number(process.env.PORT ?? 4001);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: { host, port },
    },
  );
  // Cần để ServiceDiscoveryModule huỷ đăng ký (DELETE) khi nhận SIGTERM.
  app.enableShutdownHooks();
  await app.listen();
  new Logger('Echo').log(`TCP microservice listening on ${host}:${port}`);
}

void bootstrap();
