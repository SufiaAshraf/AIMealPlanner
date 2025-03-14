import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, SafeAreaView, Platform } from 'react-native';
import { Button, Input, Card, Text } from '@rneui/themed';
import { Meal, UserPreferences, MealType } from '../types';
import { generateMealSuggestions } from '../services/aiService';
import { storageService } from '../services/storageService';
import { LinearGradient } from 'expo-linear-gradient';

const MealPlannerScreen = () => {
  const [userPrompt, setUserPrompt] = useState('');
  const [suggestedMeals, setSuggestedMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [mealTypeVisible, setMealTypeVisible] = useState<boolean>(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [finalizedMeals, setFinalizedMeals] = useState<Meal[]>([]);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const userPrefs = await storageService.getPreferences();
    setPreferences(userPrefs);
  };

  const handleGetSuggestions = async () => {
    if (!userPrompt.trim()) {
      Alert.alert('Error', 'Please enter what you would like to eat');
      return;
    }

    setLoading(true);
    try {
      const meals = await generateMealSuggestions(
        userPrompt,
        preferences?.cuisinePreferences || [],
        preferences?.dietaryRestrictions || []
      );
      setSuggestedMeals(meals);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate meal suggestions. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMealTypeSelect = (type: MealType) => {
    setSelectedMealType(type);
  };

  const handleAddMeal = (meal: Meal) => {
    setSelectedMealId(meal.id);
    setMealTypeVisible(true);
  };

  const handleFinalizeMeal = async () => {
    if (!selectedMealId || !selectedMealType) return;

    const selectedMeal = suggestedMeals.find(meal => meal.id === selectedMealId);
    if (!selectedMeal) return;

    const finalizedMeal: Meal = {
      ...selectedMeal,
      type: selectedMealType,
    };

    try {
      await storageService.saveMeal(finalizedMeal);
      setFinalizedMeals([...finalizedMeals, finalizedMeal]);
      setSuggestedMeals(suggestedMeals.filter(meal => meal.id !== selectedMealId));
      setSelectedMealId(null);
      setSelectedMealType(null);
      setMealTypeVisible(false);
      Alert.alert('Success', 'Meal added to your daily tracking');
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#2ecc71', '#27ae60']}
        style={styles.headerGradient}
      >
        <Text h3 style={styles.headerTitle}>Meal Planner</Text>
        <Text style={styles.headerSubtitle}>Plan your nutrition journey</Text>
      </LinearGradient>

      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Input
            placeholder="What would you like to eat?"
            value={userPrompt}
            onChangeText={setUserPrompt}
            containerStyle={styles.inputWrapper}
            inputContainerStyle={styles.input}
            rightIcon={
              <Button
                title="Get Ideas"
                loading={loading}
                onPress={handleGetSuggestions}
                type="solid"
                buttonStyle={styles.searchButton}
                titleStyle={styles.searchButtonText}
              />
            }
          />
        </View>

        <ScrollView style={styles.suggestionsContainer}>
          {suggestedMeals.map((meal) => (
            <Card 
              key={meal.id} 
              containerStyle={[
                styles.mealCard,
                selectedMealId && selectedMealId !== meal.id && styles.blurredCard
              ]}
            >
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>{meal.name}</Text>
                <Text style={styles.calories}>{meal.calories} cal</Text>
              </View>
              <Card.Divider />
              <Text style={styles.description}>{meal.description}</Text>
              <Button
                title="Add to Today's Meals"
                type="solid"
                buttonStyle={styles.addButton}
                titleStyle={styles.buttonText}
                onPress={() => handleAddMeal(meal)}
                disabled={!!selectedMealId && selectedMealId !== meal.id}
              />
            </Card>
          ))}

          {finalizedMeals.length > 0 && (
            <Card containerStyle={styles.finalizedCard}>
              <Text style={styles.finalizedTitle}>Today's Meal Plan</Text>
              <Card.Divider />
              {finalizedMeals.map((meal) => (
                <View key={meal.id} style={styles.finalizedMeal}>
                  <View style={styles.mealTypeContainer}>
                    <Text style={styles.mealType}>{meal.type}</Text>
                  </View>
                  <View style={styles.mealDetails}>
                    <Text style={styles.finalizedMealName}>{meal.name}</Text>
                    <Text style={styles.finalizedCalories}>{meal.calories} cal</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>

        <Modal
          visible={mealTypeVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setMealTypeVisible(false);
            setSelectedMealType(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Meal Type</Text>
              {Object.values(MealType).map((type) => (
                <Button
                  key={type}
                  title={type}
                  type={selectedMealType === type ? 'solid' : 'outline'}
                  containerStyle={styles.mealTypeButton}
                  buttonStyle={[
                    styles.mealTypeButtonStyle,
                    selectedMealType === type && styles.selectedMealTypeButton
                  ]}
                  titleStyle={[
                    styles.mealTypeButtonText,
                    selectedMealType === type && styles.selectedMealTypeText
                  ]}
                  onPress={() => handleMealTypeSelect(type)}
                />
              ))}
              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  type="outline"
                  onPress={() => {
                    setMealTypeVisible(false);
                    setSelectedMealType(null);
                  }}
                  containerStyle={styles.modalButton}
                  buttonStyle={styles.cancelButton}
                />
                <Button
                  title="Confirm"
                  disabled={!selectedMealType}
                  onPress={handleFinalizeMeal}
                  containerStyle={styles.modalButton}
                  buttonStyle={styles.confirmButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
    backgroundColor: '#f8f9fa',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  inputWrapper: {
    paddingHorizontal: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  mealCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  description: {
    color: '#34495e',
    marginBottom: 16,
    lineHeight: 20,
  },
  calories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ecc71',
  },
  blurredCard: {
    opacity: 0.5,
  },
  addButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  finalizedCard: {
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
  },
  finalizedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  finalizedMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
  finalizedMealName: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  finalizedCalories: {
    fontSize: 14,
    color: '#2ecc71',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  mealTypeButton: {
    marginVertical: 6,
  },
  mealTypeButtonStyle: {
    borderColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 12,
  },
  selectedMealTypeButton: {
    backgroundColor: '#2ecc71',
  },
  mealTypeButtonText: {
    color: '#2ecc71',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedMealTypeText: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    width: '48%',
  },
  cancelButton: {
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 12,
  },
  confirmButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 12,
  },
});

export default MealPlannerScreen; 