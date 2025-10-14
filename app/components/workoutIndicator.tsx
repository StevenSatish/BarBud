import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { useWorkout } from '../context/WorkoutContext';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function WorkoutIndicator() {
  const { workoutState, maximizeWorkout } = useWorkout();
  const { theme } = useTheme();
  // Don't render if no active workout or if it's not minimized
  if (!workoutState.isActive || !workoutState.isMinimized) {
    return null;
  }
  
  const handleMaximize = () => {
    maximizeWorkout();
  };

  return (
    <View className={`absolute bottom-[60px] left-0 right-0 bg-${theme}-accent flex-row h-[50px] items-center px-4 rounded-t-xl shadow-lg`}>
      <TouchableOpacity 
        className="flex-1 h-full justify-center"
        onPress={handleMaximize}
      >
        <Text size="lg" className="text-white font-bold text-center">Continue Workout</Text>
      </TouchableOpacity>
    
    </View>
  );
}