// lib/storage.js

import { Redis } from '@upstash/redis';

class StorageService {
  constructor() {
    // We'll initialize this lazily when needed
    this.storage = null;
    this.redis = null;
    
    // Only initialize Redis on the server side
    if (typeof window === 'undefined') {
      this.initRedis();
    }
  }

  initRedis() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'Redis configuration missing. Please ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in your environment variables.'
      );
    }

    this.redis = new Redis({ url, token });
  }

  // Initialize storage if not already done
  initStorage() {
    if (this.storage) return true;
    
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage;
      return true;
    }
    
    // When running on server, don't fail but return false
    // This allows server components to continue working
    return false;
  }

  // Get all plans for a user
  async getPlans(userId) {
    if (this.initStorage()) {
      try {
        const plansString = this.storage.getItem(this.getUserPlansKey(userId));
        return plansString ? JSON.parse(plansString) : {};
      } catch (error) {
        console.error('Error getting plans:', error);
        return {};
      }
    } else {
      if (!this.redis) {
        throw new Error('Attempted to use Redis on the client side or Redis is not properly initialized');
      }
      const plansString = await this.redis.get(`user:${userId}:plans`);
      return plansString ? JSON.parse(plansString) : {};
    }
  }

  // Get a specific plan
  async getPlan(userId, planId) {
    try {
      const plans = await this.getPlans(userId);
      return plans[planId] || null;
    } catch (error) {
      console.error('Error getting plan:', error);
      return null;
    }
  }

  // Save a plan
  async savePlan(userId, planId, plan) {
    if (this.initStorage()) {
      try {
        // Get existing plans
        const plans = await this.getPlans(userId);
        
        // Add or update the plan
        plans[planId] = {
          ...plan,
          lastUpdated: new Date().toISOString()
        };

        // Save to storage
        this.storage.setItem(this.getUserPlansKey(userId), JSON.stringify(plans));

        // Verify the save was successful
        const verifiedPlan = await this.getPlan(userId, planId);
        if (!verifiedPlan) {
          console.error('Plan verification failed after save');
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error saving plan:', error);
        return false;
      }
    } else {
      if (!this.redis) {
        throw new Error('Attempted to use Redis on the client side or Redis is not properly initialized');
      }
      const plans = await this.getPlans(userId);
      plans[planId] = { ...plan, lastUpdated: new Date().toISOString() };
      await this.redis.set(`user:${userId}:plans`, JSON.stringify(plans));
      return true;
    }
  }

  getUserPlansKey(userId) {
    return `user:${userId}:plans`;
  }

  // Update plan progress
  async updatePlanProgress(userId, planId, progress) {
    if (this.initStorage()) {
      try {
        const plans = await this.getPlans(userId);
        if (!plans[planId]) return false;
        
        plans[planId].progress = progress;
        this.storage.setItem(this.getUserPlansKey(userId), JSON.stringify(plans));
        return true;
      } catch (error) {
        console.error('Error updating progress:', error);
        return false;
      }
    } else {
      if (!this.redis) {
        throw new Error('Attempted to use Redis on the client side or Redis is not properly initialized');
      }
      const plans = await this.getPlans(userId);
      if (!plans[planId]) return false;
      
      plans[planId].progress = progress;
      await this.redis.set(`user:${userId}:plans`, JSON.stringify(plans));
      return true;
    }
  }

  // Delete a plan
  async deletePlan(userId, planId) {
    if (this.initStorage()) {
      try {
        const plans = await this.getPlans(userId);
        if (!plans[planId]) return false;
        
        delete plans[planId];
        this.storage.setItem(this.getUserPlansKey(userId), JSON.stringify(plans));
        return true;
      } catch (error) {
        console.error('Error deleting plan:', error);
        return false;
      }
    } else {
      if (!this.redis) {
        throw new Error('Attempted to use Redis on the client side or Redis is not properly initialized');
      }
      const plans = await this.getPlans(userId);
      if (!plans[planId]) return false;
      
      delete plans[planId];
      await this.redis.set(`user:${userId}:plans`, JSON.stringify(plans));
      return true;
    }
  }
}

// Export a singleton instance
export const storage = new StorageService();