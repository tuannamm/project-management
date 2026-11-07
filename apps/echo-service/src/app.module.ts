import { Module } from '@nestjs/common';
import { HealthModule } from '@org/health';
import { ServiceDiscoveryModule } from '@org/service-discovery-client';
import { EchoController } from './echo.controller';

/**
 * Chỉ cần import ServiceDiscoveryModule là service tự đăng ký lên Service Registry.
 * Cấu hình qua biến môi trường (.env): REGISTRY_URL và PORT. Không có REGISTRY_URL thì module tắt.
 *
 * HealthModule mở /health/live và /health/ready ở cổng mặc định 9001 (service này không có HTTP nên dùng cổng riêng).
 * Không cần khai báo HEALTH_PORT. Echo không có dependency ngoài, nên chỉ dùng indicator mặc định.
 */
@Module({
  imports: [ServiceDiscoveryModule.forRoot(), HealthModule.forRoot()],
  controllers: [EchoController],
})
export class AppModule {}
