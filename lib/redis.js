// lib/redis.js

import { Redis } from '@upstash/redis';

// Check for required environment variables
const requiredEnvVars = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Create Redis client with error handling
let redis;

try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    retry: {
      retries: 3,
      backoff: {
        min: 1000,
        max: 3000,
      },
    },
  });
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
  throw error;
}

// Wrapper function for Redis operations with error handling
export async function redisOperation(operation) {
  try {
    return await operation(redis);
  } catch (error) {
    console.error('Redis operation failed:', error);
    throw error;
  }
}

// Helper functions with error handling
export async function get(key) {
  return redisOperation(async (client) => {
    const value = await client.get(key);
    return value;
  });
}

export async function set(key, value, options = {}) {
  return redisOperation(async (client) => {
    await client.set(key, value, options);
  });
}

export async function del(key) {
  return redisOperation(async (client) => {
    await client.del(key);
  });
}

// Export the redis client for direct use if needed
export { redis };
