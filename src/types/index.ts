export enum MealType {
  BREAKFAST = 'Breakfast',
  LUNCH = 'Lunch',
  DINNER = 'Dinner'
}

export interface Ingredient {
  name: string;
  isChecked: boolean;
  quantity?: {
    value: number;
    unit: string;
  };
  servings?: number;
}

export interface RecipeStep {
  number: number;
  instruction: string;
}

export interface NutritionalValue {
  value: number;
  unit: string;
}

export interface NutritionalInfo {
  [key: string]: NutritionalValue;
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
  nutritionalInfo?: NutritionalInfo;
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
  UserProfile: undefined;
  SavedMeals: undefined;
}; 