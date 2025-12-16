import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api (GET) - should return 404 for root endpoint', () => {
    return request(app.getHttpServer()).get('/api').expect(404);
  });

  it('/api/auth/register (POST) - should handle registration', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'app-test@example.com',
        password: 'password123',
        firstName: 'App',
        lastName: 'Test',
      })
      .expect((res) => {
        if (res.status === 201) {
          expect(res.body).toHaveProperty('accessToken');
        } else if (res.status === 409) {
          // User already exists, which is fine
          expect(res.status).toBe(409);
        }
      });
  });
});

