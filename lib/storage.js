// lib/storage.js
import { Redis } from '@upstash/redis';

class StorageService {
  constructor() {
    if (typeof window !== 'undefined') {
      // Client-side, do not initialize Redis
      this.redis = null;
      return;
    }

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        'Redis configuration missing. Please ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.'
      );
    }
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  getUserPlansKey(userId) {
    return `user:${userId}:plans`;
  }

  async getPlans(userId) {
    if (!this.redis) return {};
    try {
      const plans = await this.redis.hgetall(this.getUserPlansKey(userId));
      return Object.entries(plans || {}).reduce((acc, [key, value]) => {
        acc[key] = JSON.parse(value);
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting plans:', error);
      return {};
    }
  }

  async getPlan(userId, planId) {
    if (!this.redis) return null;
    try {
      const planJson = await this.redis.hget(this.getUserPlansKey(userId), planId);
      return planJson ? JSON.parse(planJson) : null;
    } catch (error) {
      console.error('Error getting plan:', error);
      return null;
    }
  }

  async savePlan(userId, planId, plan) {
    if (!this.redis) return false;
    try {
      const planWithTimestamp = {
        ...plan,
        lastUpdated: new Date().toISOString(),
      };
      await this.redis.hset(
        this.getUserPlansKey(userId),
        planId,
        JSON.stringify(planWithTimestamp)
      );
      return true;
    } catch (error) {
      console.error('Error saving plan:', error);
      return false;
    }
  }

  async deletePlan(userId, planId) {
    if (!this.redis) return false;
    try {
      await this.redis.hdel(this.getUserPlansKey(userId), planId);
      return true;
    } catch (error) {
      console.error('Error deleting plan:', error);
      return false;
    }
  }
}

export const storage = new StorageService();
