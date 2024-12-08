// lib/storage.js
import { Redis } from '@upstash/redis';

class StorageService {
  constructor() {
    if (typeof window !== 'undefined') {
      this.redis = null;
      return;
    }

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Redis configuration missing');
    }

    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  async savePlan(userId, planId, plan) {
    if (!this.redis) throw new Error('Redis client not initialized');
    const key = `plan:${userId}:${planId}`;
    const stringifiedPlan = JSON.stringify(plan);
    await this.redis.set(key, stringifiedPlan);
    return true;
  }

  async getPlan(userId, planId) {
    if (!this.redis) throw new Error('Redis client not initialized');
    const key = `plan:${userId}:${planId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async getPlans(userId) {
    if (!this.redis) throw new Error('Redis client not initialized');
    const pattern = `plan:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    const plans = [];
    
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        try {
          plans.push(JSON.parse(data));
        } catch (error) {
          console.error(`Failed to parse plan data for key ${key}:`, error);
        }
      }
    }
    
    return plans;
  }
}

export const storage = new StorageService();