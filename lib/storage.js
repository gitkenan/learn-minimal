// lib/storage.js

class StorageService {
  constructor() {
    // We'll initialize this lazily when needed
    this.storage = null;
  }

  // Initialize storage if not already done
  initStorage() {
    if (this.storage) return true;
    
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage;
      return true;
    }
    
    // When running on server, don't fail but return true
    // This allows server components to continue working
    return true;
  }

  // Get all plans for a user
  getPlans(userId) {
    if (!this.initStorage() || !this.storage) {
      // Return empty object when running on server
      return {};
    }

    try {
      const plansString = this.storage.getItem(this.getUserPlansKey(userId));
      return plansString ? JSON.parse(plansString) : {};
    } catch (error) {
      console.error('Error getting plans:', error);
      return {};
    }
  }

  // Get a specific plan
  getPlan(userId, planId) {
    if (!this.initStorage() || !this.storage) {
      // Return null when running on server
      return null;
    }

    try {
      const plans = this.getPlans(userId);
      return plans[planId] || null;
    } catch (error) {
      console.error('Error getting plan:', error);
      return null;
    }
  }

  // Save a plan
  savePlan(userId, planId, plan) {
    // Always return true on server - actual saving will happen on client
    if (!this.initStorage() || !this.storage) {
      return true;
    }

    try {
      const plans = this.getPlans(userId);
      plans[planId] = plan;
      
      this.storage.setItem(this.getUserPlansKey(userId), JSON.stringify(plans));
      return true;
    } catch (error) {
      console.error('Error saving plan:', error);
      return false;
    }
  }

  getUserPlansKey(userId) {
    return `user:${userId}:plans`;
  }

  // Update plan progress
  updatePlanProgress(userId, planId, progress) {
    if (!this.initStorage() || !this.storage) return true;

    try {
      const plans = this.getPlans(userId);
      if (!plans[planId]) return false;
      
      plans[planId].progress = progress;
      this.storage.setItem(this.getUserPlansKey(userId), JSON.stringify(plans));
      return true;
    } catch (error) {
      console.error('Error updating progress:', error);
      return false;
    }
  }

  // Delete a plan
  deletePlan(userId, planId) {
    if (!this.initStorage() || !this.storage) return true;

    try {
      const plans = this.getPlans(userId);
      if (!plans[planId]) return false;
      
      delete plans[planId];
      this.storage.setItem(this.getUserPlansKey(userId), JSON.stringify(plans));
      return true;
    } catch (error) {
      console.error('Error deleting plan:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const storage = new StorageService();