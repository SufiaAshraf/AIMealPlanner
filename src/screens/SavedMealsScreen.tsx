import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView, Platform } from 'react-native';
import { Button, Card, Text } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { Meal } from '../types';
import { storageService } from '../services/storageService';
import { useFocusEffect } from '@react-navigation/native';

const SavedMealsScreen = () => {
  const [savedMeals, setSavedMeals] = useState<Meal[]>([]);
  const [recipeModalVisible, setRecipeModalVisible] = useState<boolean>(false);
  const [ingredientsModalVisible, setIngredientsModalVisible] = useState<boolean>(false);
  const [nutritionModalVisible, setNutritionModalVisible] = useState<boolean>(false);
  const [selectedMealForModal, setSelectedMealForModal] = useState<Meal | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadSavedMeals();
    }, [])
  );

  const loadSavedMeals = async () => {
    try {
      const meals = await storageService.getSavedMeals();
      setSavedMeals(meals);
    } catch (error) {
      Alert.alert('Error', 'Failed to load saved meals');
    }
  };

  const handleRemoveMeal = async (mealId: string) => {
    try {
      await storageService.removeSavedMeal(mealId);
      setSavedMeals(prev => prev.filter(meal => meal.id !== mealId));
      Alert.alert('Success', 'Meal removed from saved meals');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove meal');
    }
  };

  const handleViewRecipe = (meal: Meal) => {
    setSelectedMealForModal(meal);
    setRecipeModalVisible(true);
  };

  const handleViewIngredients = (meal: Meal) => {
    setSelectedMealForModal(meal);
    setIngredientsModalVisible(true);
  };

  const handleViewNutrition = (meal: Meal) => {
    setSelectedMealForModal(meal);
    setNutritionModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#2ecc71', '#27ae60']}
        style={styles.headerGradient}
      >
        <Text h3 style={styles.headerTitle}>Saved Meals</Text>
        <Text style={styles.headerSubtitle}>Your recipe collection</Text>
      </LinearGradient>

      <ScrollView style={styles.container}>
        {savedMeals.map((meal) => (
          <Card key={meal.id} containerStyle={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>{meal.name}</Text>
              <Text style={styles.calories}>{meal.calories} cal</Text>
            </View>
            <Card.Divider />
            <Text style={styles.description}>{meal.description}</Text>
            <View style={styles.buttonRow}>
              <Button
                title="Recipe"
                type="outline"
                buttonStyle={styles.actionButton}
                titleStyle={styles.buttonText}
                onPress={() => handleViewRecipe(meal)}
              />
              <Button
                title="Nutrition"
                type="outline"
                buttonStyle={styles.actionButton}
                titleStyle={styles.buttonText}
                onPress={() => handleViewNutrition(meal)}
              />
              <Button
                title="Ingredients"
                type="outline"
                buttonStyle={styles.actionButton}
                titleStyle={styles.buttonText}
                onPress={() => handleViewIngredients(meal)}
              />
            </View>
            <Button
              title="Remove"
              type="solid"
              buttonStyle={styles.removeButton}
              titleStyle={styles.removeButtonText}
              onPress={() => handleRemoveMeal(meal.id)}
            />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
  container: {
    flex: 1,
    padding: 16,
  },
  mealCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#fff',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 12,
  },
  calories: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2ecc71',
    backgroundColor: '#e8f8f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  description: {
    color: '#34495e',
    marginBottom: 20,
    lineHeight: 22,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  actionButton: {
    borderColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 10,
    flex: 1,
    backgroundColor: '#f8fff9',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2ecc71',
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SavedMealsScreen; 