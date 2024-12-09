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
      if (!userId || !planId) {
        console.error('Missing userId or planId:', { userId, planId });
        return null;
      }
      
      const planJson = await this.redis.hget(this.getUserPlansKey(userId), planId);
      if (!planJson) {
        console.log('No plan found for id:', planId);
        return null;
      }

      try {
        const plan = JSON.parse(planJson);
        if (!plan.id || !plan.topic || !plan.content) {
          console.error('Invalid plan format:', plan);
          return null;
        }
        return plan;
      } catch (parseError) {
        console.error('Error parsing plan JSON:', parseError, 'Raw JSON:', planJson);
        return null;
      }
    } catch (error) {
      console.error('Error getting plan:', error);
      return null;
    }
  }

  async savePlan(userId, planId, plan) {
    if (!this.redis) {
      console.error('Redis client not initialized');
      return false;
    }

    try {
      // Validate inputs
      if (!userId || !planId) {
        console.error('Missing required fields:', { userId, planId });
        return false;
      }

      if (!plan || typeof plan !== 'object') {
        console.error('Invalid plan object:', plan);
        return false;
      }

      // Validate plan structure
      const requiredFields = ['id', 'topic', 'content', 'createdAt'];
      const missingFields = requiredFields.filter(field => !plan[field]);
      if (missingFields.length > 0) {
        console.error('Plan missing required fields:', missingFields);
        return false;
      }

      const planWithTimestamp = {
        ...plan,
        lastUpdated: new Date().toISOString(),
      };

      // Log the plan we're trying to save
      console.log('Attempting to save plan:', {
        userId,
        planId,
        planFields: Object.keys(planWithTimestamp),
        key: this.getUserPlansKey(userId)
      });

      const result = await this.redis.hset(
        this.getUserPlansKey(userId),
        planId,
        JSON.stringify(planWithTimestamp)
      );

      console.log('Redis hset result:', result);
      return true;
    } catch (error) {
      console.error('Error saving plan:', {
        error: error.message,
        stack: error.stack,
        userId,
        planId
      });
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
