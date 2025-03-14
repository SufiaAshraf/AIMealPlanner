import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, ListItem } from '@rneui/themed';
import { LineChart } from 'react-native-chart-kit';
import { format, startOfWeek, addDays } from 'date-fns';
import { Meal } from '../types';
import { storageService } from '../services/storageService';

const CalorieTrackingScreen = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weeklyData, setWeeklyData] = useState({
    labels: [] as string[],
    datasets: [{ data: [] as number[] }]
  });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      const allMeals = await storageService.getMeals();
      setMeals(allMeals);
      updateWeeklyData(allMeals);
    } catch (error) {
      console.error('Error loading meals:', error);
    }
  };

  const updateWeeklyData = (allMeals: Meal[]) => {
    const startDate = startOfWeek(new Date());
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    
    const labels = weekDays.map(date => format(date, 'EEE'));
    const data = weekDays.map(date => {
      const dayMeals = allMeals.filter(meal => 
        format(new Date(meal.timestamp), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
    });

    setWeeklyData({
      labels,
      datasets: [{ data }]
    });
  };

  const todaysMeals = meals.filter(meal => 
    format(new Date(meal.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const totalCaloriesToday = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.chartContainer}>
        <Text h4 style={styles.sectionTitle}>Weekly Calorie Intake</Text>
        <LineChart
          data={weeklyData}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.mealsContainer}>
        <Text h4 style={styles.sectionTitle}>Today's Meals</Text>
        <Text style={styles.totalCalories}>Total: {totalCaloriesToday} calories</Text>
        {todaysMeals.map((meal) => (
          <ListItem key={meal.id} bottomDivider>
            <ListItem.Content>
              <ListItem.Title>{meal.name}</ListItem.Title>
              <ListItem.Subtitle>
                {format(new Date(meal.timestamp), 'h:mm a')} • {meal.calories} calories
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chartContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#2c3e50',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  mealsContainer: {
    padding: 16,
  },
  totalCalories: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 16,
  },
});

export default CalorieTrackingScreen; 