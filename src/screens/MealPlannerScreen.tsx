import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, SafeAreaView, Platform, TouchableOpacity } from 'react-native';
import { Button, Input, Card, Text, CheckBox, Divider } from '@rneui/themed';
import { Meal, UserPreferences, MealType, Ingredient, RecipeStep } from '../types';
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
  const [recipeModalVisible, setRecipeModalVisible] = useState<boolean>(false);
  const [ingredientsModalVisible, setIngredientsModalVisible] = useState<boolean>(false);
  const [selectedMealForModal, setSelectedMealForModal] = useState<Meal | null>(null);
  const [localIngredients, setLocalIngredients] = useState<Ingredient[]>([]);
  const [nutritionModalVisible, setNutritionModalVisible] = useState<boolean>(false);
  const [modalServingSize, setModalServingSize] = useState<number>(1);

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
    setSuggestedMeals([]);
    try {
      const meals = await generateMealSuggestions(
        userPrompt,
        preferences?.cuisinePreferences || [],
        preferences?.dietaryRestrictions || [],
        1 // Always get recipe for 1 serving
      );
      setSuggestedMeals(meals);
      setUserPrompt('');
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

  const handleViewRecipe = (meal: Meal) => {
    setSelectedMealForModal(meal);
    setRecipeModalVisible(true);
  };

  const handleViewIngredients = (meal: Meal) => {
    setSelectedMealForModal(meal);
    setLocalIngredients(meal.ingredients?.map(ing => ({ ...ing })) || []);
    setModalServingSize(1); // Reset serving size to 1 when opening modal
    setIngredientsModalVisible(true);
  };

  const handleViewNutrition = (meal: Meal) => {
    setSelectedMealForModal(meal);
    setNutritionModalVisible(true);
  };

  const toggleIngredient = (index: number) => {
    setLocalIngredients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isChecked: !updated[index].isChecked };
      return updated;
    });
  };

  const handleSaveForLater = async (meal: Meal) => {
    try {
      await storageService.saveMealForLater(meal);
      Alert.alert('Success', 'Meal saved to your collection');
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal');
    }
  };

  const updateIngredientQuantities = (servings: number) => {
    if (!selectedMealForModal?.ingredients) return;
    
    setLocalIngredients(selectedMealForModal.ingredients.map(ing => ({
      ...ing,
      isChecked: false,
      quantity: ing.quantity ? {
        value: (ing.quantity.value / (ing.servings || 1)) * servings,
        unit: ing.quantity.unit
      } : undefined,
      servings
    })));
  };

  const handleServingSizeChange = (servings: number) => {
    setModalServingSize(servings);
    updateIngredientQuantities(servings);
  };

  const renderNutritionModal = () => (
    <Modal
      visible={nutritionModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setNutritionModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nutritional Information</Text>
          <Text style={styles.modalSubtitle}>{selectedMealForModal?.name}</Text>
          
          {selectedMealForModal?.nutritionalInfo && (
            <View style={styles.nutritionSection}>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{selectedMealForModal.calories}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                {Object.entries(selectedMealForModal.nutritionalInfo).map(([key, info]) => (
                  <View key={key} style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {info.value}
                      <Text style={styles.nutritionUnit}>{info.unit}</Text>
                    </Text>
                    <Text style={styles.nutritionLabel}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Button
            title="Close"
            onPress={() => setNutritionModalVisible(false)}
            buttonStyle={styles.closeButton}
          />
        </View>
      </View>
    </Modal>
  );

  const renderRecipeModal = () => (
    <Modal
      visible={recipeModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setRecipeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>{selectedMealForModal?.name}</Text>
            <Text style={styles.recipeSubtitle}>{selectedMealForModal?.description}</Text>

            <View style={styles.recipeSection}>
              <Text style={styles.sectionTitle}>Recipe Steps</Text>
              {selectedMealForModal?.recipe?.map((step) => (
                <View key={step.number} style={styles.recipeStep}>
                  <View style={styles.stepNumberContainer}>
                    <Text style={styles.stepNumber}>{step.number}</Text>
                  </View>
                  <View style={styles.stepInstructionContainer}>
                    <Text style={styles.stepInstruction}>{step.instruction}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Button
              title="Close"
              onPress={() => setRecipeModalVisible(false)}
              buttonStyle={styles.closeButton}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderIngredientsModal = () => (
    <Modal
      visible={ingredientsModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIngredientsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Ingredients</Text>
          
          <View style={styles.servingSizeContainer}>
            <Text style={styles.servingSizeLabel}>Servings:</Text>
            <View style={styles.servingSizeButtons}>
              {[1, 2, 4, 6].map(size => (
                <Button
                  key={size}
                  title={size.toString()}
                  type={modalServingSize === size ? 'solid' : 'outline'}
                  buttonStyle={[
                    styles.servingSizeButton,
                    modalServingSize === size && styles.selectedServingButton
                  ]}
                  titleStyle={[
                    styles.servingSizeButtonText,
                    modalServingSize === size && styles.selectedServingButtonText
                  ]}
                  onPress={() => handleServingSizeChange(size)}
                />
              ))}
            </View>
          </View>

          <ScrollView style={styles.modalScroll}>
            {localIngredients.map((ingredient, index) => (
              <CheckBox
                key={index}
                title={
                  <View style={styles.ingredientRow}>
                    <Text style={[
                      styles.ingredientName,
                      ingredient.isChecked && styles.strikethrough
                    ]}>
                      {ingredient.name}
                    </Text>
                    {ingredient.quantity && (
                      <Text style={[
                        styles.ingredientQuantity,
                        ingredient.isChecked && styles.strikethrough
                      ]}>
                        {ingredient.quantity.value.toFixed(1)} {ingredient.quantity.unit}
                      </Text>
                    )}
                  </View>
                }
                checked={ingredient.isChecked}
                onPress={() => toggleIngredient(index)}
                containerStyle={styles.checkboxContainer}
              />
            ))}
          </ScrollView>
          <Button
            title="Close"
            onPress={() => setIngredientsModalVisible(false)}
            buttonStyle={styles.closeButton}
          />
        </View>
      </View>
    </Modal>
  );

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
            disabled={loading}
            rightIcon={
              <Button
                title={loading ? '' : "Get Ideas"}
                loading={loading}
                onPress={handleGetSuggestions}
                type="solid"
                buttonStyle={[styles.searchButton, loading && styles.loadingButton]}
                titleStyle={styles.searchButtonText}
                loadingProps={{
                  color: '#fff',
                  size: 'small'
                }}
              />
            }
          />
        </View>

        <ScrollView style={styles.suggestionsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Preparing your meal suggestions...</Text>
            </View>
          ) : (
            <>
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
                  <View style={styles.bottomButtonRow}>
                    <Button
                      title="Add to Today's Meals"
                      type="solid"
                      buttonStyle={styles.addButton}
                      titleStyle={styles.addButtonText}
                      onPress={() => handleAddMeal(meal)}
                      disabled={!!selectedMealId && selectedMealId !== meal.id}
                      containerStyle={styles.mainActionButton}
                    />
                    <Button
                      title="Save"
                      type="outline"
                      buttonStyle={styles.saveButton}
                      titleStyle={styles.saveButtonText}
                      onPress={() => handleSaveForLater(meal)}
                      containerStyle={styles.saveButtonContainer}
                    />
                  </View>
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
            </>
          )}
        </ScrollView>

        {renderRecipeModal()}
        {renderIngredientsModal()}
        {renderNutritionModal()}

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
    minWidth: 100,
  },
  loadingButton: {
    backgroundColor: '#27ae60',
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
  description: {
    color: '#34495e',
    marginBottom: 20,
    lineHeight: 22,
    fontSize: 16,
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
  blurredCard: {
    opacity: 0.5,
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
  addButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2ecc71',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 24,
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
  modalScroll: {
    flexGrow: 0,
  },
  recipeSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 24,
    textAlign: 'center',
  },
  recipeStep: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#2ecc71',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  stepNumber: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  stepInstructionContainer: {
    flex: 1,
    backgroundColor: '#f8fff9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8f8f5',
  },
  stepInstruction: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  ingredientQuantity: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: '500',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 8,
    marginLeft: 0,
    marginRight: 0,
  },
  closeButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 24,
  },
  nutritionSection: {
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  nutritionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  nutritionItem: {
    alignItems: 'center',
    minWidth: '30%',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2ecc71',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  recipeSection: {
    marginBottom: 24,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  nutritionUnit: {
    fontSize: 12,
    color: '#2ecc71',
    marginLeft: 1,
  },
  bottomButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  mainActionButton: {
    flex: 1,
  },
  saveButtonContainer: {
    width: 80,
  },
  saveButton: {
    borderColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#f8fff9',
  },
  saveButtonText: {
    color: '#2ecc71',
    fontSize: 14,
    fontWeight: '600',
  },
  servingSizeContainer: {
    marginBottom: 16,
  },
  servingSizeLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
  },
  servingSizeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  servingSizeButton: {
    borderColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 60,
  },
  selectedServingButton: {
    backgroundColor: '#2ecc71',
  },
  servingSizeButtonText: {
    color: '#2ecc71',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedServingButtonText: {
    color: '#fff',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default MealPlannerScreen; 