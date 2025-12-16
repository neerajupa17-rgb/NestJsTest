import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { WebsocketsModule } from '../websockets/websockets.module';
import { JobsModule } from '../jobs/jobs.module';
import { RedisCacheService } from '../common/cache/redis-cache.store';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    WebsocketsModule,
    JobsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, RedisCacheService],
  exports: [ProductsService],
})
export class ProductsModule {}

