// lib/storage.js
import { Redis } from '@upstash/redis';

export class Storage {
  constructor() {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Redis configuration missing');
    }

    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  async savePlan(plan) {
    console.log('Storage: Saving plan:', plan);
    const key = `plan:${plan.id}`;
    console.log('Storage: Using key:', key);
    await this.redis.set(key, JSON.stringify(plan));
    console.log('Storage: Plan saved successfully');
  }

  async getPlan(planId) {
    console.log('Storage: Getting plan with ID:', planId);
    const key = `plan:${planId}`;
    console.log('Storage: Using key:', key);
    const data = await this.redis.get(key);
    console.log('Storage: Raw data from Redis:', data);
    
    if (!data) {
      console.log('Storage: No data found for this key');
      return null;
    }

    try {
      const parsed = JSON.parse(data);
      console.log('Storage: Successfully parsed plan data');
      return parsed;
    } catch (error) {
      console.error('Storage: Error parsing plan data:', error);
      return null;
    }
  }
}

export const storage = new Storage();