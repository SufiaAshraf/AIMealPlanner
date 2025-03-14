# AI-Powered Nutrition Tracker

A cross-platform mobile application that helps users track and plan their meals using AI-powered suggestions, while monitoring their daily calorie intake and progress towards their nutritional goals.

## Demo

https://github.com/sufiaashraf/AIMealPlanner/assets/demo/demo.mov

Watch our demo video to see the app in action! The demo showcases:
- AI-powered meal suggestions
- Meal type selection and tracking
- Daily calorie monitoring with visual indicators
- Interactive calendar view with meal history
- Goal setting and progress tracking

## Features

1. **AI Meal Planner**
   - Get personalized meal suggestions based on your preferences
   - AI considers your meal history and dietary restrictions
   - Real-time calorie information for each suggestion
   - Easy to add meals to your daily tracking

2. **Calorie Tracking & History**
   - Visual representation of your calorie intake
   - Weekly progress chart
   - Detailed meal history with timestamps
   - Daily calorie summaries

3. **Goal Setting & Progress**
   - Set and manage daily calorie goals
   - Visual progress indicators
   - Weekly history view
   - Color-coded progress rings

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS) or Android Emulator (for Android)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AIMealPlanner
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your OpenAI API key:
```
EXPO_PUBLIC_OPENAI_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm start
```

5. Run on your preferred platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with Expo Go app for physical devices

## Technology Stack

- React Native with Expo
- TypeScript
- OpenAI API for meal suggestions
- React Navigation for routing
- React Native Elements UI library
- AsyncStorage for local data persistence
- date-fns for date manipulation
- react-native-chart-kit for data visualization

## Project Structure

```
src/
├── components/       # Reusable UI components
├── screens/         # Main application screens
├── services/        # API and storage services
├── navigation/      # Navigation configuration
├── types/          # TypeScript type definitions
├── config/         # Configuration files
└── utils/          # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 