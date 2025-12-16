import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { ActivityLog } from '../jobs/entities/activity-log.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isTest = process.env.NODE_ENV === 'test';
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'nestjs_test',
      entities: [User, Product, ActivityLog],
      synchronize: !isProduction, // Auto-sync in development and test
      dropSchema: isTest, // Drop schema in test mode
      logging: process.env.NODE_ENV === 'development',
    };
  }
}

