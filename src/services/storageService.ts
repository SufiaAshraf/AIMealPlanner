import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meal, DailyGoal, UserPreferences, MealHistory } from '../types';
import { format } from 'date-fns';

const STORAGE_KEYS = {
  MEALS: 'meals',
  MEAL_HISTORY: 'mealHistory',
  PREFERENCES: 'preferences',
  GOALS: 'goals',
  SAVED_MEALS: 'savedMeals'
};

export const storageService = {
  // Meals
  async saveMeal(meal: Meal): Promise<void> {
    try {
      // Save to meals storage
      const meals = await this.getMeals();
      meals.push(meal);
      await AsyncStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));

      // Update meal history
      const history = await this.getMealHistory();
      const mealDate = format(new Date(meal.timestamp), 'yyyy-MM-dd');
      
      let dayHistory = history.find(day => day.date === mealDate);
      if (dayHistory) {
        dayHistory.meals.push(meal);
        dayHistory.totalCalories = dayHistory.meals.reduce((sum, m) => sum + m.calories, 0);
      } else {
        dayHistory = {
          date: mealDate,
          meals: [meal],
          totalCalories: meal.calories
        };
        history.push(dayHistory);
      }

      await AsyncStorage.setItem('mealHistory', JSON.stringify(history));
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

  clearMealHistory: async () => {
    try {
      await AsyncStorage.removeItem('mealHistory');
      console.log('Meal history cleared successfully');
    } catch (error) {
      console.error('Error clearing meal history:', error);
      throw error;
    }
  },

  clearGoalsHistory: async () => {
    try {
      await AsyncStorage.removeItem('dailyGoals');
      console.log('Goals history cleared successfully');
    } catch (error) {
      console.error('Error clearing goals history:', error);
      throw error;
    }
  },

  getMealHistory: async (): Promise<MealHistory[]> => {
    try {
      const jsonValue = await AsyncStorage.getItem('mealHistory');
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error getting meal history:', error);
      throw error;
    }
  },

  async saveMealForLater(meal: Meal): Promise<void> {
    try {
      const savedMeals = await this.getSavedMeals();
      const updatedSavedMeals = [...savedMeals, meal];
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(updatedSavedMeals));
    } catch (error) {
      console.error('Error saving meal for later:', error);
      throw error;
    }
  },

  async getSavedMeals(): Promise<Meal[]> {
    try {
      const savedMealsJson = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_MEALS);
      return savedMealsJson ? JSON.parse(savedMealsJson) : [];
    } catch (error) {
      console.error('Error getting saved meals:', error);
      return [];
    }
  },

  async removeSavedMeal(mealId: string): Promise<void> {
    try {
      const savedMeals = await this.getSavedMeals();
      const updatedSavedMeals = savedMeals.filter(meal => meal.id !== mealId);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(updatedSavedMeals));
    } catch (error) {
      console.error('Error removing saved meal:', error);
      throw error;
    }
  },
}; 