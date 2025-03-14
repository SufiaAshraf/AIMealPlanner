import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@rneui/themed';
import TabNavigator from './src/navigation/TabNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <ThemeProvider>
        <TabNavigator />
      </ThemeProvider>
    </NavigationContainer>
  );
}
