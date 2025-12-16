import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisConfig {
  getRedisConfig() {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      ttl: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes default
    };
  }
}

