# Testing Guide

This document provides comprehensive information about testing in this NestJS application.

## Quick Start

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run E2E tests only
npm run test:e2e

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Test Structure

### Unit Tests
Located in `src/**/*.spec.ts` - Test individual components in isolation.

### E2E Tests
Located in `test/**/*.e2e-spec.ts` - Test complete application flows.

## Test Coverage

### ✅ Authentication Module
- **AuthService**: Registration, login, user validation
- **AuthController**: HTTP endpoints, activity logging

### ✅ Products Module
- **ProductsService**: CRUD operations, caching logic
- **ProductsController**: HTTP endpoints, JWT protection

### ✅ Jobs Module
- **JobsService**: Queue job creation
- **ActivityLogProcessor**: Background job processing

### ✅ WebSockets Module
- **ProductGateway**: Real-time event broadcasting

### ✅ E2E Tests
- Authentication flow (register, login)
- Products CRUD operations
- JWT protection
- Error handling

## Running Tests

### Prerequisites

1. **PostgreSQL Database**
   - Running and accessible
   - Test database: `nestjs_test` (default)
   - Can use same database as dev (schema is dropped in test mode)

2. **Environment Variables**
   - Tests use environment variables from `.env.test` or process.env
   - Set `NODE_ENV=test` for test mode

### Unit Tests

Unit tests mock all external dependencies:
- Database repositories
- Redis cache
- JWT service
- BullMQ queues
- WebSocket server

**Example:**
```bash
npm run test:unit
```

### E2E Tests

E2E tests require:
- Running PostgreSQL database
- Optional: Redis (tests will skip if unavailable)

**Example:**
```bash
npm run test:e2e
```

**Note**: E2E tests will drop and recreate the database schema.

## Writing Tests

### Unit Test Example

```typescript
describe('MyService', () => {
  let service: MyService;
  let mockRepository: jest.Mocked<Repository<Entity>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: getRepositoryToken(Entity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should do something', async () => {
    // Arrange
    const mockData = { id: '1', name: 'Test' };
    mockRepository.findOne.mockResolvedValue(mockData);

    // Act
    const result = await service.doSomething();

    // Assert
    expect(result).toEqual(expectedResult);
  });
});
```

### E2E Test Example

```typescript
describe('MyController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/endpoint')
      .expect(200);
  });
});
```

## Test Configuration

### Jest Configuration
- **Unit tests**: `jest.config.js`
- **E2E tests**: `test/jest-e2e.json`

### Environment Variables
Tests use these environment variables (with defaults):
- `TEST_DB_HOST` (default: `localhost`)
- `TEST_DB_PORT` (default: `5432`)
- `TEST_DB_USERNAME` (default: `postgres`)
- `TEST_DB_PASSWORD` (default: `postgres`)
- `TEST_DB_DATABASE` (default: `nestjs_test`)

## Common Issues

### Database Connection Errors
- Ensure PostgreSQL is running
- Check database credentials
- Verify database exists

### Redis Connection Errors
- Redis is optional for most tests
- Tests will gracefully handle Redis unavailability
- Only required for BullMQ queue tests

### Port Conflicts
- Change `PORT` in test environment if needed
- E2E tests use configured port from environment

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clear mocks in `afterEach()`
3. **AAA Pattern**: Arrange-Act-Assert
4. **Descriptive Names**: Clear test descriptions
5. **Mock External Dependencies**: Don't hit real services in unit tests
6. **Test Edge Cases**: Include error scenarios

## CI/CD Integration

Tests are designed for CI/CD:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm run test:all
  env:
    TEST_DB_HOST: localhost
    TEST_DB_PORT: 5432
    TEST_DB_USERNAME: postgres
    TEST_DB_PASSWORD: postgres
    TEST_DB_DATABASE: nestjs_test
    JWT_SECRET: test-secret
```

## Coverage Goals

- **Unit Tests**: >80% coverage
- **E2E Tests**: Critical user flows
- **Integration Tests**: Key component interactions

Run coverage report:
```bash
npm run test:cov
```

## Debugging Tests

### Debug Unit Tests
```bash
npm run test:debug
```

### Debug E2E Tests
Add `debugger;` statement and run:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand test/products.e2e-spec.ts
```

## Test Utilities

Located in `test/test-utils.ts`:
- `createTestApp()`: Create test application
- `createMockUser()`: Generate mock user
- `createMockProduct()`: Generate mock product
- `generateTestToken()`: Generate JWT token for testing

