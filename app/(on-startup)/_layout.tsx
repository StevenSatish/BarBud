import { Stack } from 'expo-router';

export default function OnStartupLayout() {
  return (
    <Stack
    screenOptions={{
        headerShown: false,  
        animation: 'slide_from_right',  
        contentStyle: {
        backgroundColor: '#121212',  
        },
    }}
    >
    <Stack.Screen
        name="index"
        options={{
        headerShown: false,
        }}
    />
    <Stack.Screen
        name="login"
        options={{
        headerShown: true,
        headerTitle: "", 
        headerStyle: {
          backgroundColor: '#121212',  
        },
        headerTintColor: 'white',  
        headerShadowVisible: false,  
        headerBackButtonDisplayMode: "minimal"
        }}
    />
    <Stack.Screen
        name="signup"
        options={{
        headerShown: true,
        headerTitle: "", 
        headerStyle: {
          backgroundColor: '#121212',  // Changed to match background-0
        },
        headerTintColor: 'white',  
        headerShadowVisible: false,  
        headerBackButtonDisplayMode: "minimal"
        }}
    />
    </Stack>
  );
}