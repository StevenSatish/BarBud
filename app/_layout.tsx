import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { ExerciseDBProvider } from './context/ExerciseDBContext';
import { ThemeProvider } from './context/ThemeContext';
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
  const { user, loading } = useAuth();
  const { workoutState } = useWorkout();

  if (loading) return null;

  const platform = Platform.OS;
  const workoutAnimation = platform === "ios" ? "ios_from_right" : "slide_from_right";
  const tabsAnimation = platform === "ios" ? "ios_from_left" : "slide_from_left";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="(on-startup)" />
      ) : workoutState.isActive && !workoutState.isMinimized ? (
        <Stack.Screen 
          name="(workout)" 
          options={{
            animation: workoutAnimation,
            presentation: "modal",
            headerShown: false,
          }}
        />
      ) : (
        <Stack.Screen name="(tabs)" 
        options={{
          animation: tabsAnimation,
          presentation: "modal",
          headerShown: false,
        }}/>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <GluestackUIProvider mode="dark">
        <ThemeProvider>
          <AuthProvider>
            <WorkoutProvider>
              <ExerciseDBProvider>
                <AppLayout />
              </ExerciseDBProvider>
            </WorkoutProvider>
          </AuthProvider>
        </ThemeProvider>
        <StatusBar style="auto" />
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
