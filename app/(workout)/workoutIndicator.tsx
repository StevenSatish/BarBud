import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useWorkout } from '../context/WorkoutContext';
import { router } from 'expo-router';

export default function WorkoutIndicator() {
  const { workoutState, maximizeWorkout, endWorkout } = useWorkout();
  
  // Don't render if no active workout or if it's not minimized
  if (!workoutState.isActive || !workoutState.isMinimized) {
    return null;
  }
  
  const handleMaximize = () => {
    router.navigate('/(tabs)/workout');
    maximizeWorkout();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.mainButton} onPress={handleMaximize}>
        <Text style={styles.text}>Continue Workout</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.closeButton} onPress={endWorkout}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50, // Position above tab bar
    left: 0,
    right: 0,
    backgroundColor: '#3498db',
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
    paddingHorizontal: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  mainButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 18,
  },
});