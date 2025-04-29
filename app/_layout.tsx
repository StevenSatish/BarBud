import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { ExerciseDBProvider } from './context/ExerciseDBContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';


function AppLayout() {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
  });
  const { user, loading } = useAuth();
  const { workoutState } = useWorkout();

  if (loading) return null;
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="(on-startup)" />
      ) : workoutState.isActive && !workoutState.isMinimized ? (
        <Stack.Screen 
          name="(workout)" 
          options={{
            animation: "slide_from_bottom",
            presentation: "modal",
            headerShown: false,
          }}
        />
      ) : (
        <Stack.Screen name="(tabs)" 
        options={{
          animation: "slide_from_bottom",
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
        <AuthProvider>
          <WorkoutProvider>
            <ExerciseDBProvider>
              <AppLayout />
            </ExerciseDBProvider>
          </WorkoutProvider>
        </AuthProvider>
        <StatusBar style="auto" />
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
