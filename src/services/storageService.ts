import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meal, DailyGoal, UserPreferences } from '../types';

const STORAGE_KEYS = {
  MEALS: 'meals',
  GOALS: 'goals',
  PREFERENCES: 'preferences',
};

export const storageService = {
  // Meals
  async saveMeal(meal: Meal): Promise<void> {
    try {
      const meals = await this.getMeals();
      meals.push(meal);
      await AsyncStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
    } catch (error) {
      console.error('Error saving meal:', error);
      throw error;
    }
  },

  async getMeals(): Promise<Meal[]> {
    try {
      const meals = await AsyncStorage.getItem(STORAGE_KEYS.MEALS);
      return meals ? JSON.parse(meals) : [];
    } catch (error) {
      console.error('Error getting meals:', error);
      return [];
    }
  },

  // Goals
  async saveGoal(goal: DailyGoal): Promise<void> {
    try {
      const goals = await this.getGoals();
      const existingGoalIndex = goals.findIndex(g => g.date === goal.date);
      
      if (existingGoalIndex >= 0) {
        goals[existingGoalIndex] = goal;
      } else {
        goals.push(goal);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving goal:', error);
      throw error;
    }
  },

  async getGoals(): Promise<DailyGoal[]> {
    try {
      const goals = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
      return goals ? JSON.parse(goals) : [];
    } catch (error) {
      console.error('Error getting goals:', error);
      return [];
    }
  },

  // User Preferences
  async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  },

  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const preferences = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return preferences ? JSON.parse(preferences) : null;
    } catch (error) {
      console.error('Error getting preferences:', error);
      return null;
    }
  },

  // Clear all data (useful for testing or user logout)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.MEALS,
        STORAGE_KEYS.GOALS,
        STORAGE_KEYS.PREFERENCES,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
}; 