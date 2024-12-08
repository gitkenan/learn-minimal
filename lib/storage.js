import { Redis } from '@upstash/redis';

export class Storage {
  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  // Simple key structure: plan:{id}
  async savePlan(plan) {
    await this.redis.set(`plan:${plan.id}`, JSON.stringify(plan));
  }

  async getPlan(planId) {
    const data = await this.redis.get(`plan:${planId}`);
    return data ? JSON.parse(data) : null;
  }
}

export const storage = new Storage();