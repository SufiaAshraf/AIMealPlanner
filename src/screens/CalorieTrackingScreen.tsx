import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Dimensions } from 'react-native';
import { Text, Card, Button } from '@rneui/themed';
import { MealHistory } from '../types';
import { storageService } from '../services/storageService';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { format, startOfWeek, addDays } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

const CalorieTrackingScreen = () => {
  const [mealHistory, setMealHistory] = useState<MealHistory[]>([]);
  const [weeklyData, setWeeklyData] = useState({
    labels: [] as string[],
    datasets: [{ data: [] as number[] }]
  });

  useFocusEffect(
    React.useCallback(() => {
      loadMealHistory();
    }, [])
  );

  const loadMealHistory = async () => {
    try {
      const history = await storageService.getMealHistory();
      setMealHistory(history);
      updateWeeklyData(history);
    } catch (error) {
      console.error('Error loading meal history:', error);
      Alert.alert('Error', 'Failed to load meal history');
    }
  };

  const updateWeeklyData = (history: MealHistory[]) => {
    const startDate = startOfWeek(new Date());
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    
    const labels = weekDays.map(date => format(date, 'EEE'));
    const data = weekDays.map(date => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const dayHistory = history.find(day => day.date === formattedDate);
      return dayHistory?.totalCalories || 0;
    });

    setWeeklyData({
      labels,
      datasets: [{ data }]
    });
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all meal history? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clearMealHistory();
              setMealHistory([]);
              setWeeklyData({
                labels: weeklyData.labels,
                datasets: [{ data: Array(7).fill(0) }]
              });
              Alert.alert('Success', 'Meal history cleared successfully');
            } catch (error) {
              console.error('Error clearing meal history:', error);
              Alert.alert('Error', 'Failed to clear meal history');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2ecc71', '#27ae60']}
        style={styles.headerGradient}
      >
        <Text h3 style={styles.headerTitle}>Calorie Tracking</Text>
        <Text style={styles.headerSubtitle}>Monitor your daily intake</Text>
      </LinearGradient>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text h4 style={styles.sectionTitle}>Weekly Calorie Intake</Text>
            <Button
              title="Clear History"
              type="outline"
              onPress={handleClearHistory}
              buttonStyle={styles.clearButton}
              titleStyle={styles.clearButtonText}
            />
          </View>
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

        <View style={styles.historyContainer}>
          <Text h4 style={styles.sectionTitle}>Daily Breakdown</Text>
          {mealHistory.length === 0 ? (
            <Card containerStyle={styles.emptyCard}>
              <Text style={styles.emptyText}>No meal history available</Text>
            </Card>
          ) : (
            mealHistory.map((day) => (
              <Card key={day.date} containerStyle={styles.historyCard}>
                <Text style={styles.dateText}>{new Date(day.date).toLocaleDateString()}</Text>
                <Card.Divider />
                {day.meals.map((meal) => (
                  <View key={meal.id} style={styles.mealItem}>
                    <View style={styles.mealTypeContainer}>
                      <Text style={styles.mealType}>{meal.type}</Text>
                    </View>
                    <View style={styles.mealDetails}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.calories}>{meal.calories} cal</Text>
                    </View>
                  </View>
                ))}
                <View style={styles.totalContainer}>
                  <Text style={styles.totalText}>Total Calories:</Text>
                  <Text style={styles.totalCalories}>{day.totalCalories}</Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  headerTitle: {
    color: '#fff',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    opacity: 0.9,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  chartContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 0,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  historyContainer: {
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  clearButton: {
    borderColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    color: '#e74c3c',
  },
  emptyCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#95a5a6',
    fontSize: 16,
  },
  historyCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeContainer: {
    backgroundColor: '#e8f8f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  mealType: {
    color: '#2ecc71',
    fontWeight: '600',
    fontSize: 14,
  },
  mealDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  calories: {
    fontSize: 14,
    color: '#2ecc71',
    fontWeight: '600',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalCalories: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2ecc71',
  },
});

export default CalorieTrackingScreen; 