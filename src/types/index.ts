export enum MealType {
  BREAKFAST = 'Breakfast',
  LUNCH = 'Lunch',
  DINNER = 'Dinner'
}

export interface Ingredient {
  name: string;
  isChecked: boolean;
}

export interface RecipeStep {
  number: number;
  instruction: string;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  timestamp: string;
  description?: string;
  type?: MealType;
  recipe?: RecipeStep[];
  ingredients?: Ingredient[];
}

export interface DailyGoal {
  calories: number;
  date: string;
}

export interface UserPreferences {
  cuisinePreferences: string[];
  dietaryRestrictions: string[];
  calorieGoal: number;
}

export interface MealHistory {
  date: string;
  meals: Meal[];
  totalCalories: number;
}

export type RootStackParamList = {
  MealPlanner: undefined;
  CalorieTracking: undefined;
  GoalProgress: undefined;
}; 