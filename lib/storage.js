import { Redis } from '@upstash/redis';

export class Storage {
  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  async savePlan(userId, planId, plan) {
    await this.redis.set(`plan:${userId}:${planId}`, JSON.stringify(plan));
  }

  async getPlan(userId, planId) {
    return await this.redis.get(`plan:${userId}:${planId}`);
  }

  async getPlans(userId) {
    const keys = await this.redis.keys(`plan:${userId}:*`);
    const plans = await Promise.all(
      keys.map(key => this.redis.get(key))
    );
    return plans.map(plan => JSON.parse(plan)).filter(Boolean);
  }
}

export const storage = new Storage();