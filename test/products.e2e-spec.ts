import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let productId: string;

  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
    process.env.DB_PORT = process.env.TEST_DB_PORT || '5432';
    process.env.DB_USERNAME = process.env.TEST_DB_USERNAME || 'postgres';
    process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';
    process.env.DB_DATABASE = process.env.TEST_DB_DATABASE || 'nestjs_test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.JWT_EXPIRES_IN = '1d';
    process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
    process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
    process.env.REDIS_BULLMQ_HOST = process.env.REDIS_BULLMQ_HOST || 'localhost';
    process.env.REDIS_BULLMQ_PORT = process.env.REDIS_BULLMQ_PORT || '6379';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Register and login to get access token
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'products-test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'products-test@example.com',
        password: 'password123',
      });

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/products (POST)', () => {
    it('should create a product successfully', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          stock: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Product');
          expect(res.body.price).toBe(99.99);
          expect(res.body.stock).toBe(10);
          productId = res.body.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Test Product',
          price: 99.99,
          stock: 10,
        })
        .expect(401);
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
          price: -10,
          stock: -5,
        })
        .expect(400);
    });
  });

  describe('/api/products (GET)', () => {
    it('should get all products', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(401);
    });
  });

  describe('/api/products/:id (GET)', () => {
    it('should get a product by id', () => {
      return request(app.getHttpServer())
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(productId);
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('price');
        });
    });

    it('should fail with non-existent id', () => {
      return request(app.getHttpServer())
        .get('/api/products/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/products/${productId}`)
        .expect(401);
    });
  });

  describe('/api/products/:id (PATCH)', () => {
    it('should update a product', () => {
      return request(app.getHttpServer())
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Product',
          price: 149.99,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(productId);
          expect(res.body.name).toBe('Updated Product');
          expect(res.body.price).toBe(149.99);
        });
    });

    it('should fail with non-existent id', () => {
      return request(app.getHttpServer())
        .patch('/api/products/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Product',
        })
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/api/products/${productId}`)
        .send({
          name: 'Updated Product',
        })
        .expect(401);
    });
  });

  describe('/api/products/:id (DELETE)', () => {
    let deleteProductId: string;

    beforeEach(async () => {
      // Create a product to delete
      const createResponse = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Product to Delete',
          description: 'Will be deleted',
          price: 50.0,
          stock: 5,
        });
      deleteProductId = createResponse.body.id;
    });

    it('should delete a product', () => {
      return request(app.getHttpServer())
        .delete(`/api/products/${deleteProductId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Product deleted successfully');
        });
    });

    it('should fail with non-existent id', () => {
      return request(app.getHttpServer())
        .delete('/api/products/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/products/${deleteProductId}`)
        .expect(401);
    });
  });
});

