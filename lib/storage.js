// lib/storage.js
import { Redis } from '@upstash/redis';

class StorageService {
  constructor() {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Redis configuration missing');
    }

    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  async savePlan(userId, planId, plan) {
    const key = `plan:${userId}:${planId}`;
    await this.redis.set(key, JSON.stringify(plan));
    return true;
  }

  async getPlan(userId, planId) {
    const key = `plan:${userId}:${planId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async getPlans(userId) {
    const pattern = `plan:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    const plans = [];
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) plans.push(JSON.parse(data));
    }
    return plans;
  }
}

export const storage = new StorageService();
