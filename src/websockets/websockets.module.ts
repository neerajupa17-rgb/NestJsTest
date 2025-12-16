import { Module } from '@nestjs/common';
import { ProductGateway } from './product.gateway';

@Module({
  providers: [ProductGateway],
  exports: [ProductGateway],
})
export class WebsocketsModule {}

