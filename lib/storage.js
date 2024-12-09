// lib/storage.js

class StorageService {
  constructor() {
    // Initialize storage if running in browser environment
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage;
    }
  }

  // Helper to get user's plans key
  getUserPlansKey(userId) {
    return `user:${userId}:plans`;
  }

  // Get all plans for a user
  getPlans(userId) {
    try {
      if (!this.storage) return {};
      const plansString = this.storage.getItem(this.getUserPlansKey(userId));
      return plansString ? JSON.parse(plansString) : {};
    } catch (error) {
      console.error('Error getting plans:', error);
      return {};
    }
  }

  // Get a specific plan
  getPlan(userId, planId) {
    try {
      const userPlans = this.getPlans(userId);
      return userPlans[planId] || null;
    } catch (error) {
      console.error('Error getting plan:', error);
      return null;
    }
  }

  // Save a plan
  savePlan(userId, planId, plan) {
    try {
      if (!this.storage) return false;
      const userPlans = this.getPlans(userId);
      userPlans[planId] = plan;
      this.storage.setItem(this.getUserPlansKey(userId), JSON.stringify(userPlans));
      return true;
    } catch (error) {
      console.error('Error saving plan:', error);
      return false;
    }
  }

  // Update plan progress
  updatePlanProgress(userId, planId, progress) {
    try {
      if (!this.storage) return false;
      const userPlans = this.getPlans(userId);
      if (!userPlans[planId]) return false;
      
      userPlans[planId].progress = progress;
      this.storage.setItem(this.getUserPlansKey(userId), JSON.stringify(userPlans));
      return true;
    } catch (error) {
      console.error('Error updating plan progress:', error);
      return false;
    }
  }

  // Delete a plan
  deletePlan(userId, planId) {
    try {
      if (!this.storage) return false;
      const userPlans = this.getPlans(userId);
      if (!userPlans[planId]) return false;
      
      delete userPlans[planId];
      this.storage.setItem(this.getUserPlansKey(userId), JSON.stringify(userPlans));
      return true;
    } catch (error) {
      console.error('Error deleting plan:', error);
      return false;
    }
  }

  // Clear all plans for a user
  clearPlans(userId) {
    try {
      if (!this.storage) return false;
      this.storage.removeItem(this.getUserPlansKey(userId));
      return true;
    } catch (error) {
      console.error('Error clearing plans:', error);
      return false;
    }
  }

  // Check storage space
  checkStorageSpace() {
    try {
      if (!this.storage) return 0;
      let total = 0;
      for (let key in this.storage) {
        if (this.storage.hasOwnProperty(key)) {
          total += (this.storage[key].length * 2) / 1024 / 1024; // Size in MB
        }
      }
      return total;
    } catch (error) {
      console.error('Error checking storage space:', error);
      return 0;
    }
  }
}

// Export a singleton instance
export const storage = new StorageService();
