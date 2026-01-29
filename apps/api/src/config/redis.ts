import Redis from 'ioredis';
import { config } from './index';

// Redis client singleton
let redis: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redis) {
        redis = new Redis(config.redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        redis.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });

        redis.on('error', (err) => {
            console.error('❌ Redis connection error:', err);
        });
    }

    return redis;
}

export async function connectRedis(): Promise<void> {
    const client = getRedisClient();
    await client.connect();
}

export async function disconnectRedis(): Promise<void> {
    if (redis) {
        await redis.quit();
        redis = null;
        console.log('Redis disconnected');
    }
}
