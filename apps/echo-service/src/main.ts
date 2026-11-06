import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

/**
 * Microservice thuần TCP: KHÔNG mở cổng HTTP. Chỉ gateway nói chuyện với nó qua message.
 */
async function bootstrap(): Promise<void> {
  const host = process.env.ECHO_HOST ?? '0.0.0.0';
  const port = Number(process.env.ECHO_PORT ?? 4001);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: { host, port },
  });
  app.enableShutdownHooks();
  await app.listen();
  new Logger('Echo').log(`TCP microservice listening on ${host}:${port}`);
}

void bootstrap();
