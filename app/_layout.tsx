import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { populatePresetExercises }  from './TempDBInit';
import { useEffect } from "react";

function AppLayout() {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
  });
  const { user, loading } = useAuth();
  const { workoutState } = useWorkout();

  if (loading) return null;

  useEffect(() => {
    populatePresetExercises();
  }, []);
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="(on-startup)" />
      ) : workoutState.isActive && !workoutState.isMinimized ? (
        <Stack.Screen name="(workout)" />
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <GluestackUIProvider mode="dark">
        <AuthProvider>
          <WorkoutProvider>
            <AppLayout />
          </WorkoutProvider>
        </AuthProvider>
        <StatusBar style="auto" />
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
