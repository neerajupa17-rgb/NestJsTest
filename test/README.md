# Testing Guide

This project includes comprehensive unit tests, integration tests, and end-to-end (E2E) tests.

## Test Structure

```
test/
├── jest-e2e.json          # E2E test configuration
├── test-utils.ts          # Test utilities and helpers
├── auth.e2e-spec.ts       # E2E tests for authentication
├── products.e2e-spec.ts   # E2E tests for products
└── app.e2e-spec.ts        # E2E tests for app

src/
├── auth/
│   ├── auth.service.spec.ts
│   └── auth.controller.spec.ts
├── products/
│   ├── products.service.spec.ts
│   └── products.controller.spec.ts
├── jobs/
│   ├── jobs.service.spec.ts
│   └── processors/
│       └── activity-log.processor.spec.ts
└── websockets/
    └── product.gateway.spec.ts
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run E2E Tests Only
```bash
npm run test:e2e
```

### Run All Tests (Unit + E2E)
```bash
npm run test:all
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:cov
```

## Test Setup

### Prerequisites

1. **Test Database**: A separate PostgreSQL database for testing
   - Default: `nestjs_test` (same as dev, but will be dropped/recreated)
   - Set via `TEST_DB_DATABASE` in `.env.test`

2. **Environment Variables**: Copy `.env.test` and configure:
   ```bash
   cp .env.test .env.test.local
   ```

### Test Database Configuration

Tests use a separate database configuration that:
- Drops and recreates the schema before each test suite
- Uses `synchronize: true` for automatic schema creation
- Is isolated from development database

## Test Types

### Unit Tests

Unit tests test individual components in isolation:
- **Services**: Business logic without dependencies
- **Controllers**: Request/response handling
- **Processors**: Background job processing
- **Gateways**: WebSocket event handling

**Location**: `src/**/*.spec.ts`

### Integration Tests

Integration tests verify component interactions:
- Service + Repository interactions
- Controller + Service interactions
- Module-level functionality

**Location**: `src/**/*.spec.ts` (same as unit tests, but with more dependencies)

### E2E Tests

End-to-end tests verify the entire application flow:
- HTTP request/response cycles
- Authentication flows
- CRUD operations
- Error handling

**Location**: `test/**/*.e2e-spec.ts`

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
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should do something', async () => {
    // Arrange
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
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
      });
  });
});
```

## Test Coverage

Current test coverage includes:

- ✅ Authentication Service (register, login, validation)
- ✅ Authentication Controller
- ✅ Products Service (CRUD operations, caching)
- ✅ Products Controller
- ✅ Jobs Service (activity logging)
- ✅ Activity Log Processor
- ✅ Product Gateway (WebSocket events)
- ✅ E2E Authentication Flow
- ✅ E2E Products CRUD Flow

## Mocking

### Common Mocks

- **Repository**: Use `getRepositoryToken()` with jest mocks
- **JWT Service**: Mock `sign()` and `verify()` methods
- **Redis Cache**: Mock `get()`, `set()`, `del()` methods
- **BullMQ Queue**: Mock `add()` method
- **WebSocket Server**: Mock `emit()` method

### Example Mock Setup

```typescript
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
};

const module = await Test.createTestingModule({
  providers: [
    MyService,
    {
      provide: getRepositoryToken(Entity),
      useValue: mockRepository,
    },
  ],
}).compile();
```

## Troubleshooting

### Database Connection Issues

If tests fail with database connection errors:
1. Ensure PostgreSQL is running
2. Check `TEST_DB_*` environment variables
3. Verify database exists and is accessible

### Redis Connection Issues

Redis is optional for most unit tests. If Redis is required:
1. Ensure Redis is running
2. Tests will gracefully handle Redis unavailability

### Port Conflicts

If port 3000 is in use:
- E2E tests use the configured port from `.env.test`
- Change `PORT` in `.env.test` if needed

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `afterEach()` to clear mocks
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **Descriptive Names**: Use clear test descriptions
5. **Mock External Dependencies**: Don't hit real databases/APIs in unit tests
6. **Test Edge Cases**: Include error scenarios and boundary conditions

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    npm install
    npm run test:all
  env:
    TEST_DB_HOST: localhost
    TEST_DB_PORT: 5432
    TEST_DB_USERNAME: postgres
    TEST_DB_PASSWORD: postgres
    TEST_DB_DATABASE: nestjs_test
```

