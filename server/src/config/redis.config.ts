import { redisStore } from 'cache-manager-redis-store';

import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

export const getRedisConfig = async (
  configService: ConfigService,
): Promise<CacheModuleOptions> => ({
  store: await redisStore({
    socket: {
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      tls: true, // Enable TLS connection
      connectTimeout: 15000,
      keepAlive: 5000,
    },
    username: configService.get<string>('REDIS_USERNAME'),
    password: configService.get<string>('REDIS_PASSWORD'),
    database: configService.get<number>('REDIS_DB', 0),
  }),
  ttl: configService.get<number>('CACHE_TTL', 3600), // 1 hour default
  max: 100, // Maximum number of items in cache
});
