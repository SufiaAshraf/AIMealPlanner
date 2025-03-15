import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import { RootStackParamList } from '../types';
import MealPlannerScreen from '../screens/MealPlannerScreen';
import CalorieTrackingScreen from '../screens/CalorieTrackingScreen';
import GoalProgressScreen from '../screens/GoalProgressScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SavedMealsScreen from '../screens/SavedMealsScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2ecc71',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e9ecef',
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="MealPlanner"
        component={MealPlannerScreen}
        options={{
          tabBarLabel: 'Planner',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CalorieTracking"
        component={CalorieTrackingScreen}
        options={{
          tabBarLabel: 'Tracking',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GoalProgress"
        component={GoalProgressScreen}
        options={{
          tabBarLabel: 'Goals',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SavedMeals"
        component={SavedMealsScreen}
        options={{
          tabBarLabel: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator; 