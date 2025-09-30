import { Stack } from 'expo-router';
import { useTheme } from '@/app/context/ThemeContext';

export default function WorkoutLayout() {
  const {colors} = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="AddExersiceDatabase" 
        options={{ 
          headerShown: true,
          title: "Add Exercises",
          headerTintColor: "white",
          headerStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
          animation: 'slide_from_bottom',
          animationDuration: 200
        }} 
      />
    </Stack>
  );
} 