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

    try {
      console.log('Initializing Redis with URL:', process.env.UPSTASH_REDIS_REST_URL);
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      if (!this.redis) {
        throw new Error('Redis client not initialized');
      }
      const testKey = 'test:connection';
      const testValue = 'test-' + Date.now();
      await this.redis.set(testKey, testValue);
      const result = await this.redis.get(testKey);
      await this.redis.del(testKey);
      return result === testValue;
    } catch (error) {
      console.error('Redis connection test failed:', error);
      return false;
    }
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
    console.log('Starting savePlan operation...');
    
    if (!this.redis) {
      console.error('Redis client not initialized');
      return false;
    }

    try {
      // Test connection first
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.error('Redis connection test failed');
        return false;
      }

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

      const key = this.getUserPlansKey(userId);
      console.log('Saving plan with key:', key);

      // Try a simple set operation first to test Redis connection
      const testKey = `test:${userId}:${planId}`;
      await this.redis.set(testKey, 'test');
      console.log('Test key set successfully');

      // Now try to save the actual plan
      const result = await this.redis.hset(
        key,
        planId,
        JSON.stringify(planWithTimestamp)
      );

      console.log('Redis hset result:', result);
      
      // Verify the save
      const savedPlan = await this.redis.hget(key, planId);
      if (!savedPlan) {
        console.error('Plan was not saved properly');
        return false;
      }

      console.log('Plan saved and verified successfully');
      return true;
    } catch (error) {
      console.error('Error in savePlan:', {
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
