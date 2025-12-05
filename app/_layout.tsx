import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { WorkoutProvider } from './context/WorkoutContext';
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
  const workoutAndHistoryAnimation = platform === "ios" ? "ios_from_right" : "slide_from_right";
  const tabsAnimation = platform === "ios" ? "ios_from_left" : "slide_from_left";

  return (
    <Stack screenOptions={{ headerShown: false }}>
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
          animation: workoutAndHistoryAnimation,
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="(exerciseHistory)" 
        options={{
          animation: workoutAndHistoryAnimation,
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <GluestackUIProvider mode="dark">
          <ThemeProvider>
            <AuthProvider>
              <WorkoutProvider>
                <ExerciseDBProvider>
                  <TemplateFoldersProvider>
                    <AppLayout />
                  </TemplateFoldersProvider>
                </ExerciseDBProvider>
              </WorkoutProvider>
            </AuthProvider>
          </ThemeProvider>
          <StatusBar style="auto" />
        </GluestackUIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
