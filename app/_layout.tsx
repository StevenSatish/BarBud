import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthProvider, useAuth } from './context/AuthProvider';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

function AppLayout() {
  const { user, loading } = useAuth();
  const { workoutState } = useWorkout();

  if (loading) return null;
  
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
    <GluestackUIProvider mode="dark">
      <AuthProvider>
        <WorkoutProvider>
          <AppLayout />
        </WorkoutProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </GluestackUIProvider>
  );
}
