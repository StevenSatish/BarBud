import { Stack } from 'expo-router';
import { useTheme } from '@/app/context/ThemeContext';
import { Platform } from 'react-native';

export default function TemplateLayout() {
  const { colors } = useTheme();
  const platform = Platform.OS;
  const animation = platform === "ios" ? "ios_from_right" : "slide_from_right";
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="AddExersiceDatabaseProxy" 
        options={{ 
          headerShown: true,
          title: "Add Exercises",
          headerTintColor: "white",
          headerStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
          animation: animation,
          animationDuration: 200
        }} 
      />
    </Stack>
    
  );
}

