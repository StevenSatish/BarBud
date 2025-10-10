import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useWorkout } from '../context/WorkoutContext';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function WorkoutIndicator() {
  const { workoutState, maximizeWorkout, endWorkout } = useWorkout();
  const { theme } = useTheme();
  // Don't render if no active workout or if it's not minimized
  if (!workoutState.isActive || !workoutState.isMinimized) {
    return null;
  }
  
  const handleMaximize = () => {
    router.navigate('/(tabs)');
    maximizeWorkout();
  };

  return (
    <View className={`absolute bottom-[60px] left-0 right-0 bg-${theme}-accent flex-row h-[50px] items-center px-4 rounded-t-xl shadow-lg`}>
      <TouchableOpacity 
        className="flex-1 h-full justify-center"
        onPress={handleMaximize}
      >
        <Text className="text-white font-bold text-base">Continue Workout</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        className="w-10 h-10 justify-center items-center"
        onPress={endWorkout}
      >
        <Text className="text-white text-lg">✕</Text>
      </TouchableOpacity>
    </View>
  );
}