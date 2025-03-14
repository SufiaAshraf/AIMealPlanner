import OpenAI from 'openai';
import { config } from '../config';
import { Meal } from '../types';

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
    // Comment out the OpenAI API call for now
    /*
    const systemPrompt = `You are a nutrition expert AI. Generate meal suggestions based on the user's request, 
    considering their preferences: ${preferences.join(', ')} and restrictions: ${restrictions.join(', ')}.
    Provide detailed meal suggestions with accurate calorie counts.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const suggestions = response.choices[0]?.message?.content;
    if (!suggestions) throw new Error('No suggestions generated');
    */

    // Use dummy suggestions instead
    const suggestions = dummyMealSuggestions;
    
    // Parse the suggestions into meal objects
    const meals: Meal[] = suggestions
      .map((suggestion, index) => ({
        id: `${Date.now()}-${index}`,
        name: suggestion.split('(')[0].trim(),
        calories: parseInt(suggestion.match(/\((\d+)\s*calories\)/)?.[1] || '0'),
        description: suggestion,
        timestamp: new Date().toISOString()
      }));

    return meals;
  } catch (error) {
    console.error('Error generating meal suggestions:', error);
    throw error;
  }
}; 