import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { JobsModule } from './jobs/jobs.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),

    // BullMQ for background jobs
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_BULLMQ_HOST || 'localhost',
          port: parseInt(process.env.REDIS_BULLMQ_PORT || '6379', 10),
          password: process.env.REDIS_BULLMQ_PASSWORD || undefined,
        },
      }),
    }),

    // Application modules
    AuthModule,
    ProductsModule,
    JobsModule,
    WebsocketsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

