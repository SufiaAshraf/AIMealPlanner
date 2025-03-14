import OpenAI from 'openai';
import { config } from '../config';
import { Meal, RecipeStep } from '../types';

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend service
});

// Dummy meal suggestions for testing
const dummyMealSuggestions = [
  "Grilled Chicken Salad with Avocado (450 calories) - Fresh mixed greens topped with grilled chicken breast, avocado, cherry tomatoes, and light vinaigrette",
  "Quinoa Buddha Bowl (380 calories) - Protein-rich quinoa with roasted vegetables, chickpeas, and tahini dressing",
  "Salmon with Sweet Potato (520 calories) - Baked salmon fillet with roasted sweet potato wedges and steamed broccoli",
  "Mediterranean Wrap (400 calories) - Whole grain wrap filled with hummus, falafel, fresh vegetables, and tzatziki sauce",
  "Vegetarian Stir-Fry (350 calories) - Mixed vegetables and tofu stir-fried in light soy sauce with brown rice"
];

export const generateMealSuggestions = async (
  prompt: string,
  preferences: string[],
  restrictions: string[]
): Promise<Meal[]> => {
  try {
    console.log('Generating meal suggestions for:', { prompt, preferences, restrictions });

    const systemPrompt = `You are a nutrition expert AI. Generate 5 meal suggestions based on the user's request. 
    Consider these preferences: ${preferences.join(', ')} and restrictions: ${restrictions.join(', ')}.
    IMPORTANT: Format each suggestion exactly as follows (one per line, separated by double newlines):
    "Meal Name (X calories) - Description
    INGREDIENTS: ingredient1, ingredient2, ingredient3, etc.
    RECIPE: Step1. Step2. Step3. etc."
    Do not include any other text in your response.`;

    console.log('System prompt:', systemPrompt);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('Raw API response:', JSON.stringify(response.choices[0]?.message?.content, null, 2));

    const rawSuggestions = response.choices[0]?.message?.content?.split('\n\n') || [];
    console.log('Split suggestions:', rawSuggestions);

    const suggestions = rawSuggestions
      .filter(block => {
        const lines = block.split('\n');
        const mealLine = lines[0]?.trim();
        if (!mealLine) {
          console.log('Filtering out empty block');
          return false;
        }

        // Only include blocks that match the meal format
        const mealFormat = /^.+\(\d+\s*calories\)\s*-\s*.+$/i;
        const isValidFormat = mealFormat.test(mealLine);
        console.log('Block format check:', { mealLine, isValid: isValidFormat });
        return isValidFormat;
      });

    console.log('Filtered suggestions:', suggestions);

    if (suggestions.length === 0) {
      console.log('No valid suggestions found, using dummy suggestions');
      return dummyMealSuggestions.map((suggestion, index) => ({
        id: `${Date.now()}-${index}`,
        name: suggestion.split('(')[0].trim(),
        calories: parseInt(suggestion.match(/\((\d+)\s*calories\)/)?.[1] || '0'),
        description: suggestion,
        timestamp: new Date().toISOString(),
        ingredients: [],
        recipe: []
      }));
    }

    // Parse the suggestions into meal objects
    const meals: Meal[] = suggestions.map((block, index) => {
      const lines = block.split('\n');
      const mealLine = lines[0].trim().replace(/^"|"$/g, '');
      const name = mealLine.split('(')[0].trim();
      const calorieMatch = mealLine.match(/\((\d+)\s*calories\)/i);
      const calories = parseInt(calorieMatch?.[1] || '0');
      
      // Parse ingredients
      const ingredientsLine = lines.find(line => line.trim().startsWith('INGREDIENTS:'))?.trim() || '';
      const ingredientsList = ingredientsLine.replace('INGREDIENTS:', '').split(',')
        .map(ingredient => ({
          name: ingredient.trim().replace(/^"|"$/g, ''),
          isChecked: false
        }))
        .filter(ingredient => ingredient.name.length > 0);

      // Parse recipe
      const recipeLine = lines.find(line => line.trim().startsWith('RECIPE:'))?.trim() || '';
      const recipeSteps = recipeLine
        .replace('RECIPE:', '')
        .split(/\s*\.\s*/)
        .map(step => step.trim().replace(/^"|"$/g, ''))
        .filter(step => 
          step.length > 0 && 
          !step.toLowerCase().includes('recipe') &&
          !/^step\s*\d+$/i.test(step)
        )
        .map((step, index) => ({
          number: index + 1,
          instruction: step.charAt(0).toUpperCase() + step.slice(1)
        }));
      
      const meal = {
        id: `${Date.now()}-${index}`,
        name,
        calories,
        description: mealLine,
        timestamp: new Date().toISOString(),
        ingredients: ingredientsList,
        recipe: recipeSteps
      };
      
      console.log('Parsed meal:', meal);
      return meal;
    });

    console.log('Final meals array:', meals);
    return meals;

  } catch (error) {
    console.error('Error generating meal suggestions:', error);
    // Fallback to dummy suggestions in case of error
    return dummyMealSuggestions.map((suggestion, index) => ({
      id: `${Date.now()}-${index}`,
      name: suggestion.split('(')[0].trim(),
      calories: parseInt(suggestion.match(/\((\d+)\s*calories\)/)?.[1] || '0'),
      description: suggestion,
      timestamp: new Date().toISOString(),
      ingredients: [],
      recipe: []
    }));
  }
}; 