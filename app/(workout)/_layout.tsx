import { Stack } from 'expo-router';

export default function WorkoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="AddExersiceDatabase" 
        options={{ 
          headerShown: true,
          title: "Add Exercises",
          headerTintColor: "white",
          headerStyle: { backgroundColor: "#11131A" },
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false
        }} 
      />
    </Stack>
  );
} 