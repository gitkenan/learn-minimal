// lib/storage.js

class StorageService {
  constructor() {
    // We'll initialize this lazily when needed
    this.storage = null;
  }

  // Initialize storage if not already done
  initStorage() {
    if (!this.storage && typeof window !== 'undefined') {
      this.storage = window.localStorage;
      return true;
    }
    return false;
  }

  // Helper to get user's plans key
  getUserPlansKey(userId) {
    return `user:${userId}:plans`;
  }

  // Get all plans for a user
  getPlans(userId) {
    if (!this.initStorage()) {
      console.log('Storage not available - returning empty plans');
      return {};
    }

    try {
      const plansString = this.storage.getItem(this.getUserPlansKey(userId));
      if (!plansString) {
        // Initialize empty plans object if none exists
        this.storage.setItem(this.getUserPlansKey(userId), JSON.stringify({}));
        return {};
      }
      return JSON.parse(plansString);
    } catch (error) {
      console.error('Error getting plans:', error);
      return {};
    }
  }

  // Get a specific plan
  getPlan(userId, planId) {
    if (!this.initStorage()) {
      console.log('Storage not available - returning null plan');
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
    if (!this.initStorage()) {
      console.log('Storage not available - cannot save plan');
      return false;
    }

    try {
      const plans = this.getPlans(userId);
      plans[planId] = plan;
      
      // Log the data we're trying to save
      console.log('Saving plan data:', {
        userId,
        planId,
        planData: plan,
        allPlans: plans
      });

      const plansString = JSON.stringify(plans);
      this.storage.setItem(this.getUserPlansKey(userId), plansString);
      
      // Verify the save was successful
      const savedPlans = this.getPlans(userId);
      const savedPlan = savedPlans[planId];
      
      if (!savedPlan) {
        console.error('Plan was not saved successfully');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving plan:', error);
      return false;
    }
  }

  // Update plan progress
  updatePlanProgress(userId, planId, progress) {
    if (!this.initStorage()) return false;

    try {
      const plan = this.getPlan(userId, planId);
      if (!plan) return false;

      plan.progress = progress;
      return this.savePlan(userId, planId, plan);
    } catch (error) {
      console.error('Error updating plan progress:', error);
      return false;
    }
  }

  // Delete a plan
  deletePlan(userId, planId) {
    if (!this.initStorage()) return false;

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

  // Check if storage is available and has enough space
  checkStorage() {
    if (!this.initStorage()) return false;

    try {
      // Test storage by writing and removing a test item
      const testKey = '__storage_test__';
      this.storage.setItem(testKey, '1');
      this.storage.removeItem(testKey);
      return true;
    } catch (error) {
      console.error('Storage not available:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const storage = new StorageService();