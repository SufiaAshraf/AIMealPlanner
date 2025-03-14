import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, Button, Input, Card } from '@rneui/themed';
import { format, subDays, parseISO } from 'date-fns';
import CalendarPicker from 'react-native-calendar-picker';
import { DailyGoal, Meal } from '../types';
import { storageService } from '../services/storageService';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

const GoalProgressScreen = () => {
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [isEditing, setIsEditing] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<DailyGoal[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayMeals, setSelectedDayMeals] = useState<Meal[]>([]);
  const [showMealModal, setShowMealModal] = useState(false);
  const [goals, setGoals] = useState<DailyGoal[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      loadGoals();
    }, [])
  );

  const loadData = async () => {
    try {
      const [loadedMeals, loadedGoals, preferences] = await Promise.all([
        storageService.getMeals(),
        storageService.getGoals(),
        storageService.getPreferences(),
      ]);

      setMeals(loadedMeals);
      
      // Generate dummy data for the past week if no data exists
      if (loadedGoals.length === 0) {
        const dummyData = generateDummyWeekData();
        setWeeklyProgress(dummyData);
        await Promise.all(dummyData.map(goal => storageService.saveGoal(goal)));
      } else {
        setWeeklyProgress(loadedGoals);
      }

      if (preferences) {
        setCalorieGoal(preferences.calorieGoal.toString());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadGoals = async () => {
    try {
      const savedGoals = await storageService.getGoals();
      setGoals(savedGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Error', 'Failed to load goals');
    }
  };

  const generateDummyWeekData = (): DailyGoal[] => {
    const goalCalories = parseInt(calorieGoal);
    return Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const variation = Math.random() * 600 - 300; // Random variation between -300 and +300
      const calories = Math.max(0, Math.round(goalCalories + variation));
      return { date, calories };
    });
  };

  const handleSaveGoal = async () => {
    try {
      const goal = parseInt(calorieGoal);
      if (isNaN(goal) || goal <= 0) {
        throw new Error('Invalid calorie goal');
      }

      await storageService.savePreferences({
        calorieGoal: goal,
        cuisinePreferences: [],
        dietaryRestrictions: [],
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const calculateDailyProgress = (date: string): number => {
    const dayMeals = meals.filter(meal => 
      format(new Date(meal.timestamp), 'yyyy-MM-dd') === date
    );
    return dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  };

  const renderProgressRing = (achieved: number, goal: number) => {
    const percentage = (achieved / goal) * 100;
    const displayPercentage = Math.round(percentage);
    let color = '#2ecc71'; // Default green
    let ringStyle = {};
    let textStyle = {};

    if (percentage > 100) {
      color = '#e74c3c'; // Red for excess
      ringStyle = {
        transform: [{ scale: 1.05 }],
        borderWidth: 14,
      };
      textStyle = { color: '#e74c3c' };
    } else if (percentage >= 90) {
      color = '#f1c40f'; // Yellow for near goal
    }

    return (
      <View style={styles.ringContainer}>
        <View style={[styles.ring, { borderColor: color }, ringStyle]}>
          <Text style={[styles.ringText, textStyle]}>{displayPercentage}%</Text>
          {percentage > 100 && (
            <Text style={[styles.excessText, textStyle]}>+{Math.round(percentage - 100)}%</Text>
          )}
        </View>
        <Text style={styles.ringLabel}>of daily goal</Text>
        <Text style={[styles.calorieText, percentage > 100 && { color: '#e74c3c' }]}>
          {achieved} / {goal} cal
        </Text>
      </View>
    );
  };

  const todayProgress = calculateDailyProgress(format(new Date(), 'yyyy-MM-dd'));

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = format(date, 'yyyy-MM-dd');
    loadSelectedDayMeals(formattedDate);
  };

  const loadSelectedDayMeals = async (formattedDate: string) => {
    try {
      const history = await storageService.getMealHistory();
      const dayHistory = history.find(day => day.date === formattedDate);
      setSelectedDayMeals(dayHistory?.meals || []);
      setShowMealModal(true);
    } catch (error) {
      console.error('Error loading selected day meals:', error);
      Alert.alert('Error', 'Failed to load meals for selected day');
    }
  };

  const getCustomDatesStyles = () => {
    return weeklyProgress.map(day => {
      const date = parseISO(day.date);
      const achieved = calculateDailyProgress(day.date);
      const goal = parseInt(calorieGoal);
      const percentage = (achieved / goal) * 100;
      
      return {
        date,
        style: {
          backgroundColor: percentage > 100 ? '#e74c3c' : '#2ecc71',
          borderRadius: 20,
        },
        textStyle: {
          color: '#ffffff',
        },
      };
    });
  };

  const renderMealModal = () => (
    <Modal
      visible={showMealModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowMealModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text h4 style={styles.modalTitle}>
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
          </Text>
          <ScrollView style={styles.mealList}>
            {selectedDayMeals.map((meal, index) => (
              <Card key={index} containerStyle={styles.mealCard}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealType}>{meal.type}</Text>
                <Text style={styles.mealCalories}>{meal.calories} calories</Text>
              </Card>
            ))}
            {selectedDayMeals.length === 0 && (
              <Text style={styles.noMealsText}>No meals recorded for this day</Text>
            )}
          </ScrollView>
          <Button
            title="Close"
            onPress={() => setShowMealModal(false)}
            buttonStyle={styles.closeButton}
          />
        </View>
      </View>
    </Modal>
  );

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Goals History',
      'Are you sure you want to clear all goals history? This action cannot be undone.',
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
              await storageService.clearGoalsHistory();
              await storageService.clearMealHistory();
              setGoals([]);
              setMeals([]);
              setSelectedDayMeals([]);
              setWeeklyProgress([]);
              setShowMealModal(false);
              Alert.alert('Success', 'History cleared successfully');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Error', 'Failed to clear history');
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
        <Text h3 style={styles.headerTitle}>Goals Progress</Text>
        <Text style={styles.headerSubtitle}>Track your calorie goals</Text>
      </LinearGradient>

      <ScrollView style={styles.contentContainer}>
        <Card containerStyle={styles.goalCard}>
          <Card.Title>Daily Calorie Goal</Card.Title>
          <Card.Divider />
          {isEditing ? (
            <View style={styles.editContainer}>
              <Input
                value={calorieGoal}
                onChangeText={setCalorieGoal}
                keyboardType="numeric"
                label="Daily Calorie Target"
              />
              <Button
                title="Save"
                onPress={handleSaveGoal}
                buttonStyle={styles.saveButton}
              />
            </View>
          ) : (
            <View style={styles.goalContainer}>
              <Text h3 style={styles.goalText}>{calorieGoal} calories</Text>
              <Button
                title="Edit Goal"
                type="outline"
                onPress={() => setIsEditing(true)}
              />
            </View>
          )}
        </Card>

        <Card containerStyle={styles.calendarCard}>
          <View style={styles.cardHeader}>
            <Card.Title>Meal History</Card.Title>
            <Button
              title="Clear History"
              type="outline"
              onPress={handleClearHistory}
              buttonStyle={styles.clearButton}
              titleStyle={styles.clearButtonText}
            />
          </View>
          <Card.Divider />
          <CalendarPicker
            onDateChange={handleDateSelect}
            customDatesStyles={getCustomDatesStyles()}
            selectedDayColor="#3498db"
            selectedDayTextColor="#ffffff"
            todayBackgroundColor="#f1c40f"
            todayTextStyle={{ color: '#ffffff' }}
            textStyle={{ fontSize: 14 }}
            width={320}
          />
        </Card>

        <View style={styles.progressContainer}>
          <Text h4 style={styles.sectionTitle}>Today's Progress</Text>
          {renderProgressRing(todayProgress, parseInt(calorieGoal))}
        </View>

        {renderMealModal()}
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
  goalCard: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editContainer: {
    marginBottom: 16,
  },
  goalContainer: {
    alignItems: 'center',
    padding: 16,
  },
  goalText: {
    marginBottom: 16,
    color: '#2c3e50',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 12,
  },
  calendarCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  clearButton: {
    borderColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
  },
  clearButtonText: {
    color: '#e74c3c',
    fontSize: 12,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  ringContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  excessText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  ringLabel: {
    marginTop: 8,
    color: '#7f8c8d',
  },
  calorieText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#2c3e50',
  },
  mealList: {
    maxHeight: 400,
  },
  mealCard: {
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  mealType: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ecc71',
    marginTop: 4,
  },
  noMealsText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 20,
  },
  closeButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    marginTop: 16,
  },
});

export default GoalProgressScreen; 