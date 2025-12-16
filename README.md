# NestJS Backend Service

A scalable backend service built with NestJS featuring authentication, caching, background jobs, and real-time communication.

## Features

- 🔐 JWT Authentication & Authorization
- 📦 Product Management (CRUD)
- ⚡ Redis Caching
- 🔄 Background Job Processing (BullMQ)
- 🔌 WebSocket Real-time Events
- 📚 Swagger API Documentation
- 🚦 Rate Limiting
- 🐳 Docker Support

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Caching**: Redis
- **Background Jobs**: BullMQ
- **Real-time**: Socket.IO

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v15 or higher)
- Redis (v7 or higher)
- Docker (optional)

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

## Environment Variables

See `.env.example` for required environment variables. Key variables:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` - PostgreSQL configuration
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `CACHE_TTL` - Cache time-to-live in seconds (default: 300)

## Running the Application

### Development Mode

```bash
# Start services (PostgreSQL and Redis)
docker-compose up -d postgres redis

# Start the application in watch mode (auto-reload on changes)
npm run start:dev
```

The application will:
- Start on http://localhost:3000
- Auto-reload when you make code changes
- Show detailed error messages
- Connect to PostgreSQL and Redis automatically

### Production Mode

```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod
```

### Stop the Application

Press `Ctrl+C` in the terminal where the app is running.

### Stop Docker Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (cleanup)
docker-compose down -v
```

## API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:3000/api
- **API Base URL**: http://localhost:3000/api

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Products (JWT Protected)
- `GET /api/products` - Get all products (cached)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create a new product
- `PATCH /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

## WebSocket Events

Connect to the WebSocket server at `http://localhost:3000/products` namespace.

**Events:**
- `product:created` - Emitted when a new product is created

**Testing WebSocket:**
Use a WebSocket client or browser console to connect to `ws://localhost:3000/products` namespace and listen for `product:created` events.

## Docker

```bash
# Build and run all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Testing the Application

### Using Swagger UI (Recommended)

1. Open http://localhost:3000/api in your browser
2. You'll see all available endpoints with documentation
3. Click "Try it out" on any endpoint
4. Fill in the required parameters
5. Click "Execute" to test

### Using cURL

#### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"password123\",\"firstName\":\"John\",\"lastName\":\"Doe\"}"
```

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"password123\"}"
```

Save the `accessToken` from the response.

#### 3. Create a Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{\"name\":\"Laptop\",\"description\":\"High-performance laptop\",\"price\":999.99,\"stock\":10}"
```

#### 4. Get All Products
```bash
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Get Product by ID
```bash
curl -X GET http://localhost:3000/api/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Running Automated Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run E2E tests only
npm run test:e2e

# Run with coverage
npm run test:cov
```

## Project Structure

```
src/
├── auth/              # Authentication module
│   ├── dto/          # Data transfer objects
│   ├── entities/     # User entity
│   ├── strategies/   # Passport strategies (JWT, Local)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── products/         # Product management module
│   ├── dto/          # DTOs for product operations
│   ├── entities/     # Product entity
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.module.ts
├── jobs/             # Background job processing
│   ├── entities/     # Activity log entity
│   ├── processors/   # BullMQ job processors
│   ├── jobs.service.ts
│   └── jobs.module.ts
├── websockets/       # WebSocket gateway
│   ├── product.gateway.ts
│   └── websockets.module.ts
├── common/           # Shared utilities
│   ├── cache/        # Redis cache service
│   ├── decorators/   # Custom decorators
│   ├── filters/      # Exception filters
│   └── guards/        # Auth guards
├── config/           # Configuration files
│   ├── database.config.ts
│   └── redis.config.ts
├── app.module.ts     # Root module
└── main.ts           # Application entry point
```

## Key Features Implementation

### 1. Authentication & Authorization
- User registration and login with bcrypt password hashing
- JWT token generation and validation
- Protected routes using JWT guards
- Rate limiting on auth endpoints

### 2. Product Management
- Full CRUD operations
- All endpoints protected with JWT authentication
- Input validation using DTOs and class-validator

### 3. Redis Caching
- Product listing cached in Redis
- Cache invalidation on create/update/delete
- Configurable TTL
- Cache-aside pattern implementation

### 4. Background Jobs
- Activity logging using BullMQ
- Retry mechanism with exponential backoff
- Job persistence in Redis
- Separate queue for activity logs

### 5. WebSocket Real-time Events
- Socket.IO gateway for product events
- Real-time broadcasting when products are created
- Namespace-based organization
- CORS enabled for cross-origin connections

## System Design

See `SYSTEM_DESIGN.md` for detailed explanation of the real-time dashboard architecture.

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Input validation and sanitization
- Rate limiting on sensitive endpoints
- Global exception handling
- CORS configuration

## Testing

The project includes comprehensive unit tests and E2E tests.

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run E2E tests only
npm run test:e2e

# Run with coverage
npm run test:cov
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Docker Desktop (for PostgreSQL and Redis)
- npm or yarn

### Step-by-Step Setup

1. **Clone the repository** (if applicable)
   ```bash
   git clone <repository-url>
   cd NestJsTest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env file with your configuration (optional - defaults work for local development)
   ```

4. **Start Docker services** (PostgreSQL and Redis)
   ```bash
   docker-compose up -d postgres redis
   ```
   
   Wait a few seconds for services to be ready. Verify with:
   ```bash
   docker ps
   ```

5. **Start the application**
   ```bash
   npm run start:dev
   ```

6. **Access the application**
   - **Swagger UI**: http://localhost:3000/api
   - **API Base URL**: http://localhost:3000/api

### Verify Installation

Once the app is running, you should see:
```
Application is running on: http://localhost:3000
Swagger documentation: http://localhost:3000/api
```

Open http://localhost:3000/api in your browser to see the Swagger documentation.

## Available Scripts

```bash
# Development
npm run start:dev      # Start in development mode with watch
npm run start:debug     # Start in debug mode
npm run start:prod      # Start in production mode

# Building
npm run build           # Build the application

# Testing
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Run tests with coverage
npm run test:e2e        # Run E2E tests

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
```

## Project Structure

```
src/
├── auth/              # Authentication module
│   ├── dto/          # Data transfer objects
│   ├── entities/     # User entity
│   ├── strategies/   # Passport strategies (JWT, Local)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── products/         # Product management module
│   ├── dto/          # DTOs for product operations
│   ├── entities/     # Product entity
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.module.ts
├── jobs/             # Background job processing
│   ├── entities/     # Activity log entity
│   ├── processors/   # BullMQ job processors
│   ├── jobs.service.ts
│   └── jobs.module.ts
├── websockets/       # WebSocket gateway
│   ├── product.gateway.ts
│   └── websockets.module.ts
├── common/           # Shared utilities
│   ├── cache/        # Redis cache service
│   ├── decorators/   # Custom decorators
│   ├── filters/      # Exception filters
│   └── guards/        # Auth guards
├── config/           # Configuration files
│   ├── database.config.ts
│   └── redis.config.ts
├── app.module.ts     # Root module
└── main.ts           # Application entry point
```

## Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nestjs_test

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# BullMQ
REDIS_BULLMQ_HOST=localhost
REDIS_BULLMQ_PORT=6379

# Cache
CACHE_TTL=300
```

## Docker Commands

```bash
# Start services
docker-compose up -d postgres redis

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Remove everything (including volumes)
docker-compose down -v
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Products (JWT Protected)
- `GET /api/products` - Get all products (cached)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create a new product
- `PATCH /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

## Features

### ✅ Implemented
- JWT Authentication & Authorization
- User Registration & Login
- Product CRUD Operations
- Redis Caching (product listing)
- Cache Invalidation
- Background Job Processing (BullMQ)
- Activity Logging
- WebSocket Real-time Events
- Swagger API Documentation
- Rate Limiting
- Input Validation
- Global Exception Handling
- Comprehensive Testing

## Troubleshooting

### Application Won't Start

**Error: Cannot connect to database**
```bash
# Check if PostgreSQL container is running
docker ps

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

**Error: Port 3000 already in use**
```bash
# Option 1: Change port in .env file
PORT=3001

# Option 2: Find and stop the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Error: Module not found**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

**Database connection refused**
- Ensure PostgreSQL container is running: `docker ps`
- Check `.env` file has correct database credentials
- Verify database exists (TypeORM creates it automatically in development)

**Redis connection errors**
- Redis is optional for basic functionality
- Required for caching and background jobs
- Check Redis container: `docker-compose logs redis`

### Authentication Issues

**401 Unauthorized errors**
- Ensure you're including the JWT token in the Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN`
- Token expires after 1 day (configurable in `.env`)
- Re-login to get a new token

**409 Conflict on registration**
- Email already exists in the database
- Use a different email or login with existing credentials

### Docker Issues

**Docker not running**
- Start Docker Desktop
- Wait for it to fully start before running `docker-compose up`

**Port conflicts**
- PostgreSQL uses port 5432
- Redis uses port 6379
- Change ports in `docker-compose.yml` if needed

### Common Commands

```bash
# View running containers
docker ps

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Clean restart (removes volumes)
docker-compose down -v
docker-compose up -d postgres redis
```

## License

MIT

## Support

For issues and questions:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Review the [TESTING.md](./TESTING.md) guide
3. Check the [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) for architecture details

