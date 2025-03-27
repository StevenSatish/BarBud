import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type WorkoutState = {
  isActive: boolean;
  isMinimized: boolean;
  workoutData: any;
};

type WorkoutContextType = {
  workoutState: WorkoutState;
  startWorkout: () => void;
  endWorkout: () => void;
  minimizeWorkout: () => void;
  maximizeWorkout: () => void;
  // Other functions
};

const initialWorkoutState: WorkoutState = {
  isActive: false,
  isMinimized: false,
  workoutData: null,
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [workoutState, setWorkoutState] = useState<WorkoutState>(initialWorkoutState);

  useEffect(() => {
    const loadWorkoutState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('workoutState');
        if (savedState) {
          setWorkoutState(JSON.parse(savedState));
        }
      } catch (error) {
        console.error('Error loading workout state:', error);
      }
    };
    
    loadWorkoutState();
  }, []);

  useEffect(() => {
    const saveWorkoutState = async () => {
      try {
        await AsyncStorage.setItem('workoutState', JSON.stringify(workoutState));
      } catch (error) {
        console.error('Error saving workout state:', error);
      }
    };
    
    if (workoutState.isActive) {
      saveWorkoutState();
    }
  }, [workoutState]);

  const startWorkout = () => {
    console.log("starting workout!");
    setWorkoutState({
      isActive: true,
      isMinimized: false,
      workoutData: { startTime: new Date(), exercises: [] },
    });
    router.replace('/(workout)')
  };

  const endWorkout = () => {
    console.log("ending workout");
    setWorkoutState(initialWorkoutState);
    AsyncStorage.removeItem('workoutState');
    router.replace('/(tabs)')
  };

  const minimizeWorkout = () => {
    setWorkoutState(prev => ({ ...prev, isMinimized: true }));
    router.replace('/(tabs)');
  };

  const maximizeWorkout = () => {
    setWorkoutState(prev => ({ ...prev, isMinimized: false }));
    router.replace('/(workout)');
  };

  return (
    <WorkoutContext.Provider
      value={{
        workoutState,
        startWorkout,
        endWorkout,
        minimizeWorkout,
        maximizeWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};