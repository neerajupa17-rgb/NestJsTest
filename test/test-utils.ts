import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../src/auth/entities/user.entity';
import { Product } from '../src/products/entities/product.entity';
import { ActivityLog } from '../src/jobs/entities/activity-log.entity';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
        username: process.env.TEST_DB_USERNAME || 'postgres',
        password: process.env.TEST_DB_PASSWORD || 'postgres',
        database: process.env.TEST_DB_DATABASE || 'nestjs_test',
        entities: [User, Product, ActivityLog],
        synchronize: true,
        dropSchema: true,
      }),
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  return app;
}

export function createMockUser() {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockProduct() {
  return {
    id: 'test-product-id',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function generateTestToken(
  jwtService: JwtService,
  userId: string = 'test-user-id',
  email: string = 'test@example.com',
): Promise<string> {
  return jwtService.sign({ email, sub: userId });
}

