// lib/storage.js
import { Redis } from '@upstash/redis';

class StorageService {
  constructor() {
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
    const plansString = await this.redis.get(this.getUserPlansKey(userId));
    return plansString ? JSON.parse(plansString) : {};
  }

  async getPlan(userId, planId) {
    const plans = await this.getPlans(userId);
    return plans[planId] || null;
  }

  async savePlan(userId, planId, plan) {
    const plans = await this.getPlans(userId);
    plans[planId] = {
      ...plan,
      lastUpdated: new Date().toISOString()
    };
    await this.redis.set(this.getUserPlansKey(userId), JSON.stringify(plans));
    return true;
  }

  async deletePlan(userId, planId) {
    const plans = await this.getPlans(userId);
    if (!plans[planId]) return false;

    delete plans[planId];
    await this.redis.set(this.getUserPlansKey(userId), JSON.stringify(plans));
    return true;
  }
}

export const storage = new StorageService();
