import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

const redisConfig: Redis.RedisOptions = {
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT, 10),
  password: env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

