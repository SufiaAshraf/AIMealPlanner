import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import { RootStackParamList } from '../types';

import MealPlannerScreen from '../screens/MealPlannerScreen';
import CalorieTrackingScreen from '../screens/CalorieTrackingScreen';
import GoalProgressScreen from '../screens/GoalProgressScreen';

const Tab = createBottomTabNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2ecc71',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#2ecc71',
        },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen
        name="MealPlanner"
        component={MealPlannerScreen}
        options={{
          title: 'Meal Planner',
          tabBarIcon: ({ color, size }) => (
            <Icon name="restaurant-menu" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CalorieTracking"
        component={CalorieTrackingScreen}
        options={{
          title: 'Calorie Tracking',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bar-chart" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="GoalProgress"
        component={GoalProgressScreen}
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => (
            <Icon name="target" type="material-community" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator; 