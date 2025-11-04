import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from './context/AuthProvider';
import { useWorkout } from './context/WorkoutContext';

export default function Index() {
  const { user, loading } = useAuth();
  const { workoutState } = useWorkout();

  if (loading) return null;
  if (!user) return <Redirect href="/(on-startup)" />;
  if (workoutState.isActive && !workoutState.isMinimized) return <Redirect href="/(workout)" />;
  return <Redirect href="/(tabs)" />;
}


