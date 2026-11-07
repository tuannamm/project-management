import { Module } from '@nestjs/common';
import { ServiceDiscoveryModule } from '@org/service-discovery-client';
import { EchoController } from './echo.controller';

/**
 * Chỉ cần import ServiceDiscoveryModule là service tự đăng ký lên Service Registry.
 * Cấu hình qua biến môi trường (.env): REGISTRY_URL và PORT. Không có REGISTRY_URL thì module tắt.
 */
@Module({
  imports: [ServiceDiscoveryModule.forRoot()],
  controllers: [EchoController],
})
export class AppModule {}
