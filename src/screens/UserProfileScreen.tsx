import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Button, Input, Chip } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { storageService } from '../services/storageService';
import { UserPreferences } from '../types';

const CUISINE_OPTIONS = [
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'Mediterranean',
  'American',
  'Thai',
  'French',
  'Greek'
];

const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Low-Carb',
  'Paleo',
  'Pescatarian',
  'Nut-Free',
  'Halal'
];

const UserProfileScreen = () => {
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const preferences = await storageService.getPreferences();
      if (preferences) {
        setCalorieGoal(preferences.calorieGoal.toString());
        setSelectedCuisines(preferences.cuisinePreferences);
        setSelectedRestrictions(preferences.dietaryRestrictions);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSavePreferences = async () => {
    try {
      const preferences: UserPreferences = {
        calorieGoal: parseInt(calorieGoal),
        cuisinePreferences: selectedCuisines,
        dietaryRestrictions: selectedRestrictions,
      };
      await storageService.savePreferences(preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const toggleRestriction = (restriction: string) => {
    setSelectedRestrictions(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2ecc71', '#27ae60']}
        style={styles.headerGradient}
      >
        <Text h3 style={styles.headerTitle}>User Profile</Text>
        <Text style={styles.headerSubtitle}>Customize your preferences</Text>
      </LinearGradient>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Calorie Goal</Text>
          <Input
            value={calorieGoal}
            onChangeText={setCalorieGoal}
            keyboardType="numeric"
            placeholder="Enter your daily calorie goal"
            containerStyle={styles.inputContainer}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuisine Preferences</Text>
          <View style={styles.chipContainer}>
            {CUISINE_OPTIONS.map(cuisine => (
              <Chip
                key={cuisine}
                title={cuisine}
                type={selectedCuisines.includes(cuisine) ? 'solid' : 'outline'}
                onPress={() => toggleCuisine(cuisine)}
                containerStyle={styles.chip}
                buttonStyle={selectedCuisines.includes(cuisine) ? styles.selectedChip : styles.unselectedChip}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          <View style={styles.chipContainer}>
            {DIETARY_RESTRICTIONS.map(restriction => (
              <Chip
                key={restriction}
                title={restriction}
                type={selectedRestrictions.includes(restriction) ? 'solid' : 'outline'}
                onPress={() => toggleRestriction(restriction)}
                containerStyle={styles.chip}
                buttonStyle={selectedRestrictions.includes(restriction) ? styles.selectedChip : styles.unselectedChip}
              />
            ))}
          </View>
        </View>

        <Button
          title="Save Preferences"
          onPress={handleSavePreferences}
          buttonStyle={styles.saveButton}
          containerStyle={styles.saveButtonContainer}
        />
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    margin: 4,
  },
  selectedChip: {
    backgroundColor: '#2ecc71',
  },
  unselectedChip: {
    backgroundColor: 'transparent',
    borderColor: '#2ecc71',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 12,
  },
  saveButtonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
});

export default UserProfileScreen; 