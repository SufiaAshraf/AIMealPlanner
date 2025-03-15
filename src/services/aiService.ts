import OpenAI from 'openai';
import { config } from '../config';
import { Meal, RecipeStep, NutritionalInfo } from '../types';

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY
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
  restrictions: string[],
  servings: number = 4
): Promise<Meal[]> => {
  try {
    console.log('Generating meal suggestions for:', { prompt, preferences, restrictions, servings });

    const systemPrompt = `You are a nutrition expert AI. Generate 8 meal suggestions based on the user's request. 
    Consider these preferences: ${preferences.join(', ')} and restrictions: ${restrictions.join(', ')}.
    Each recipe should serve ${servings} people.
    IMPORTANT: Format each suggestion exactly as follows (one per line, separated by double newlines):
    "Meal Name (X calories per serving) - Description
    NUTRITIONAL INFO: key1: value1 unit1, key2: value2 unit2, etc. (include any relevant nutritional information per serving)
    INGREDIENTS (for ${servings} servings): ingredient1: quantity1 unit1, ingredient2: quantity2 unit2, etc.
    RECIPE: 1. First step. 2. Second step. 3. Third step. etc."
    
    For nutritional info, provide any relevant nutritional values (e.g., Protein, Carbs, Fats, Fiber, Vitamins, Minerals, etc.).
    For ingredients, ALWAYS specify the quantity in appropriate units (g, kg, ml, cups, tbsp, etc.) using the format "ingredient: quantity unit".
    For recipe steps, ALWAYS use numbered steps starting from 1, with a period after each number (e.g., "1. First step. 2. Second step.").
    Do not include any other text in your response.`;

    console.log('System prompt:', systemPrompt);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
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
        const mealFormat = /^.+\(\d+\s*calories.*\)\s*-\s*.+$/i;
        const isValidFormat = mealFormat.test(mealLine);
        console.log('Block format check:', { mealLine, isValid: isValidFormat });
        return isValidFormat;
      })
      .map(block => {
        const lines = block.split('\n');
        const [nameCaloriesLine, nutritionLine, ingredientsLine, recipeLine] = lines;

        // Parse meal name, calories, and description
        const nameCaloriesMatch = nameCaloriesLine.match(/^(.+?)\s*\((\d+)\s*calories.*\)\s*-\s*(.+)$/i);
        if (!nameCaloriesMatch) return null;

        const [, name, calories, description] = nameCaloriesMatch;

        // Parse nutritional info dynamically
        const nutritionalInfo: Record<string, { value: number; unit: string }> = {};
        
        if (nutritionLine) {
          const nutritionText = nutritionLine.replace(/^NUTRITIONAL INFO:\s*/i, '');
          const nutritionPairs = nutritionText.split(',').map(pair => pair.trim());
          
          for (const pair of nutritionPairs) {
            const [key, valueWithUnit] = pair.split(':').map(s => s.trim());
            if (key && valueWithUnit) {
              const match = valueWithUnit.match(/^([\d.]+)\s*([a-zA-Z%]+)$/);
              if (match) {
                const [, value, unit] = match;
                nutritionalInfo[key.toLowerCase()] = {
                  value: parseFloat(value),
                  unit
                };
              }
            }
          }
        }

        // Parse recipe steps
        const recipeSteps = recipeLine
          ?.replace(/^RECIPE:\s*/i, '')
          ?.split(/\s*\d+\.\s*|\.\s*(?=\d+\.|\s*$)/)  // Split by numbered steps or periods
          ?.filter(step => step.trim())
          ?.map((step, index) => ({
            number: index + 1,
            instruction: step.trim().replace(/^\d+\.\s*/, '')  // Remove any remaining step numbers
          })) || [];

        // Parse ingredients with quantities
        const ingredients = ingredientsLine
          ?.replace(/^INGREDIENTS.*?:\s*/i, '')
          ?.split(',')
          ?.map(ingredient => {
            const parts = ingredient.trim().split(':').map(s => s.trim());
            if (parts.length < 2) {
              // If no colon found, try to parse quantity from the name
              const match = parts[0].match(/^([\d.]+)\s*([a-zA-Z]+)\s+(.+)$/);
              if (match) {
                return {
                  name: match[3],
                  isChecked: false,
                  quantity: {
                    value: parseFloat(match[1]),
                    unit: match[2]
                  },
                  servings
                };
              }
              // If no quantity found, return ingredient with name only
              return {
                name: parts[0],
                isChecked: false,
                servings
              };
            }

            // Parse quantity if it exists after the colon
            const [name, quantityStr] = parts;
            const quantityMatch = quantityStr.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
            
            return {
              name,
              isChecked: false,
              quantity: quantityMatch ? {
                value: parseFloat(quantityMatch[1]),
                unit: quantityMatch[2]
              } : undefined,
              servings
            };
          })
          .filter((ingredient): ingredient is NonNullable<typeof ingredient> => 
            ingredient !== null && ingredient.name.trim().length > 0
          ) || [];

        const meal: Meal = {
          id: Math.random().toString(36).substr(2, 9),
          name: name.trim(),
          calories: parseInt(calories),
          description: description.trim(),
          timestamp: new Date().toISOString(),
          ingredients,
          recipe: recipeSteps,
          nutritionalInfo
        };

        return meal;
      })
      .filter((meal): meal is NonNullable<typeof meal> => meal !== null);

    console.log('Processed suggestions:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('Error generating meal suggestions:', error);
    throw error;
  }
}; 