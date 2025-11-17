import React from 'react';
import { Stack } from 'expo-router';

export default function ExerciseHistoryLayout() {
  return (
    <Stack screenOptions={ {headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false} } />
  );
}

