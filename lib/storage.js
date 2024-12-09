// lib/storage.js
import { Redis } from '@upstash/redis';

class StorageService {
  constructor() {
    if (typeof window !== 'undefined') {
      // Client-side, do not initialize Redis
      this.redis = null;
      return;
    }

    // Log Redis configuration
    console.log('Redis URL configured:', !!process.env.UPSTASH_REDIS_REST_URL);
    console.log('Redis token configured:', !!process.env.UPSTASH_REDIS_REST_TOKEN);

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Redis configuration missing');
    }

    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  getUserPlansKey(userId) {
    return `user:${userId}:plans`;
  }

  async savePlan(userId, planId, plan) {
    try {
      if (!this.redis) {
        throw new Error('Redis client not initialized');
      }

      // Try a simple test first
      const testKey = `test:${Date.now()}`;
      await this.redis.set(testKey, 'test');
      const testResult = await this.redis.get(testKey);
      await this.redis.del(testKey);

      if (testResult !== 'test') {
        throw new Error('Redis test operation failed');
      }

      // Now try to save the plan
      const key = this.getUserPlansKey(userId);
      const value = JSON.stringify({
        ...plan,
        lastUpdated: new Date().toISOString(),
      });

      // Use set instead of hset for now to simplify
      await this.redis.set(`${key}:${planId}`, value);
      return true;
    } catch (error) {
      console.error('Storage error:', {
        message: error.message,
        stack: error.stack,
        userId,
        planId
      });
      throw error; // Let the route handler catch and format the error
    }
  }

  async getPlan(userId, planId) {
    try {
      if (!this.redis) {
        throw new Error('Redis client not initialized');
      }

      const key = `${this.getUserPlansKey(userId)}:${planId}`;
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting plan:', error);
      return null;
    }
  }

  async getPlans(userId) {
    // We'll implement this later
    return {};
  }

  async deletePlan(userId, planId) {
    try {
      if (!this.redis) {
        throw new Error('Redis client not initialized');
      }

      const key = `${this.getUserPlansKey(userId)}:${planId}`;
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Error deleting plan:', error);
      return false;
    }
  }
}

export const storage = new StorageService();
