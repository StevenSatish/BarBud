import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { WorkoutProvider } from './context/WorkoutContext';
import { EditWorkoutProvider } from './context/EditWorkoutContext';
import { ExerciseDBProvider } from './context/ExerciseDBContext';
import { TemplateFoldersProvider } from './context/TemplateFoldersContext';
import { ThemeProvider } from './context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { Platform } from 'react-native';


function AppLayout() {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
  });
  const { loading } = useAuth();

  if (loading) return null;

  const platform = Platform.OS;
  const sidePageAnimation = platform === "ios" ? "ios_from_right" : "slide_from_right";
  const tabsAnimation = platform === "ios" ? "ios_from_left" : "slide_from_left";
  const appBackgroundColor = '#121212';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: appBackgroundColor },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(on-startup)" />
      <Stack.Screen 
        name="(tabs)" 
        options={{
          animation: tabsAnimation,
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="(workout)" 
        options={{
          animation: sidePageAnimation,
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="(editWorkout)" 
        options={{
          animation: sidePageAnimation,
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="(template)" 
        options={{
          animation: sidePageAnimation,
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="(exerciseHistory)" 
        options={{
          animation: sidePageAnimation,
          presentation: "fullScreenModal",
          gestureEnabled: false,
          fullScreenGestureEnabled: false,
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#121212' }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#121212' }}>
        <GluestackUIProvider mode="dark">
          <ThemeProvider>
            <AuthProvider>
              <WorkoutProvider>
                <EditWorkoutProvider>
                  <ExerciseDBProvider>
                    <TemplateFoldersProvider>
                      <AppLayout />
                    </TemplateFoldersProvider>
                  </ExerciseDBProvider>
                </EditWorkoutProvider>
              </WorkoutProvider>
            </AuthProvider>
          </ThemeProvider>
          <StatusBar style="auto" />
        </GluestackUIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
