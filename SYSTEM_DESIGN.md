# System Design: Real-Time Dashboard for Live User Activity

## Overview

This document explains the design of a real-time dashboard system that displays live user activity including user logins/logouts, API usage, and product creation events. The system is designed to be scalable, performant, and provide real-time updates to connected clients.

## Architecture Components

### 1. Event Generation Layer

**Location**: Application Services (Auth, Products, API Middleware)

Events are generated at the point of action:

- **User Authentication Events**: Generated in `AuthService` when users register or login
- **Product Events**: Generated in `ProductsService` when products are created, updated, or deleted
- **API Usage Events**: Generated via middleware/interceptors that track all API requests

**Event Structure**:
```typescript
{
  eventType: 'USER_LOGIN' | 'USER_LOGOUT' | 'PRODUCT_CREATED' | 'API_CALL',
  userId: string,
  timestamp: Date,
  metadata: {
    ipAddress?: string,
    userAgent?: string,
    endpoint?: string,
    method?: string,
    details?: any
  }
}
```

### 2. Event Processing Pipeline

#### 2.1 Background Job Queue (BullMQ)

**Purpose**: Decouple event generation from processing to prevent blocking the main application flow.

**Implementation**:
- Events are immediately queued to BullMQ (Redis-backed)
- Jobs are processed asynchronously by worker processes
- Supports retries with exponential backoff for failed jobs
- Handles high throughput without impacting API response times

**Queue Configuration**:
- Queue: `activity-log` for persistence
- Queue: `realtime-events` for immediate broadcasting
- Retry strategy: 3 attempts with exponential backoff (2s, 4s, 8s)

#### 2.2 Event Storage

**Database Layer** (PostgreSQL):
- `activity_logs` table stores all events for historical analysis
- Indexed on `userId`, `action`, and `createdAt` for fast queries
- Partitioned by date for better performance on large datasets

**Cache Layer** (Redis):
- Recent events cached for quick dashboard loading
- Key pattern: `dashboard:events:recent` (last 100 events)
- TTL: 5 minutes
- Aggregated statistics cached separately

### 3. Real-Time Delivery System

#### 3.1 WebSocket Gateway (Socket.IO)

**Architecture**:
- Separate namespace: `/dashboard` for dashboard clients
- Room-based broadcasting for different event types
- Authentication via JWT tokens in handshake

**Event Broadcasting**:
```typescript
// Broadcast to all connected dashboard clients
socket.to('dashboard').emit('activity:new', eventData);

// Broadcast specific event types to specific rooms
socket.to('dashboard:user-activity').emit('user:login', eventData);
socket.to('dashboard:product-activity').emit('product:created', eventData);
socket.to('dashboard:api-activity').emit('api:call', eventData);
```

#### 3.2 Event Aggregation

**Real-Time Statistics**:
- Maintain counters in Redis for:
  - Active users (last 5 minutes)
  - API requests per minute
  - Product creations today
  - Login/logout events per hour

**Update Frequency**: Events update counters immediately, dashboard polls every 5 seconds or receives push updates

### 4. Data Flow

```
┌─────────────────┐
│  User Action    │
│  (Login/API/etc)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Service Layer  │
│  (Auth/Products)│
└────────┬────────┘
         │
         ├─────────────────┐
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  BullMQ      │   │  WebSocket   │
│  Queue       │   │  Gateway     │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│  Worker      │   │  Broadcast   │
│  Processor   │   │  to Clients  │
└──────┬───────┘   └──────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  (Storage)   │
└──────────────┘
```

### 5. Scalability Considerations

#### 5.1 Horizontal Scaling

**Application Servers**:
- Multiple NestJS instances behind a load balancer
- Stateless design allows easy scaling
- WebSocket connections can be sticky-session based or use Redis adapter for Socket.IO

**Redis Adapter for Socket.IO**:
```typescript
// Enables cross-server WebSocket communication
import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = new Redis({ host: 'redis' });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

**Database**:
- Read replicas for dashboard queries
- Connection pooling (PgBouncer)
- Query optimization with proper indexes

#### 5.2 Caching Strategy

**Multi-Level Caching**:
1. **L1 (In-Memory)**: Recent events in application memory (last 50 events)
2. **L2 (Redis)**: Aggregated statistics and recent events (5-minute TTL)
3. **L3 (Database)**: Historical data with pagination

**Cache Invalidation**:
- Time-based expiration for statistics
- Event-driven invalidation for real-time data
- Background refresh for stale cache

#### 5.3 Message Queue Scaling

**BullMQ Configuration**:
- Multiple worker processes per queue
- Queue prioritization (real-time events > activity logs)
- Dead letter queue for failed jobs after max retries
- Monitoring and alerting for queue depth

#### 5.4 WebSocket Scaling

**Connection Management**:
- Connection limits per server instance
- Graceful degradation when at capacity
- Client reconnection with exponential backoff
- Heartbeat mechanism to detect dead connections

**Broadcasting Optimization**:
- Room-based broadcasting (only send to interested clients)
- Event filtering on client side
- Compression for large payloads
- Batching multiple events when possible

### 6. Performance Optimizations

#### 6.1 Database
- Indexes on frequently queried columns
- Materialized views for complex aggregations
- Partitioning for time-series data
- Connection pooling (max 20 connections per instance)

#### 6.2 Redis
- Pipeline operations for batch writes
- Use Redis Streams for event log (alternative to BullMQ)
- Memory optimization with appropriate data structures

#### 6.3 WebSocket
- Binary protocol for large payloads
- Compression enabled
- Rate limiting per connection
- Event debouncing for high-frequency events

### 7. Monitoring & Observability

**Metrics to Track**:
- WebSocket connection count
- Events per second
- Queue depth
- Database query performance
- Redis memory usage
- API response times

**Tools**:
- Prometheus for metrics
- Grafana for visualization
- ELK stack for log aggregation
- BullMQ dashboard for queue monitoring

### 8. Security Considerations

**WebSocket Authentication**:
- JWT token validation on connection
- Token refresh mechanism
- Role-based access control (admin-only dashboard)

**Rate Limiting**:
- Per-connection event rate limits
- Global API rate limits
- Queue processing rate limits

**Data Privacy**:
- PII masking in logs
- Secure transmission (WSS)
- Access logging and audit trails

### 9. Implementation Example

**Enhanced WebSocket Gateway**:
```typescript
@WebSocketGateway({
  namespace: '/dashboard',
  cors: { origin: '*' }
})
export class DashboardGateway {
  @WebSocketServer()
  server: Server;

  // Broadcast new activity event
  broadcastActivity(event: ActivityEvent) {
    this.server.emit('activity:new', event);
    
    // Also broadcast to specific rooms
    if (event.eventType === 'USER_LOGIN') {
      this.server.to('dashboard:user-activity').emit('user:login', event);
    }
  }

  // Send aggregated statistics
  broadcastStats(stats: DashboardStats) {
    this.server.emit('stats:update', stats);
  }
}
```

**Activity Tracking Middleware**:
```typescript
@Injectable()
export class ActivityTrackingMiddleware implements NestMiddleware {
  constructor(private jobsService: JobsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Track API usage
    if (req.user) {
      this.jobsService.logActivity({
        userId: req.user.id,
        action: 'API_CALL',
        details: `${req.method} ${req.path}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }
    next();
  }
}
```

## Conclusion

This design provides a scalable, real-time dashboard system that can handle high volumes of events while maintaining low latency for dashboard updates. The architecture separates concerns, uses appropriate technologies for each layer, and includes considerations for scaling, performance, and security.

