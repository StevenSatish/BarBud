import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import dummyData from '../(workout)/dummyWorkout';

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
  updateSet: (exerciseId: string, setId: string, newData: any) => void;
  deleteSet: (exerciseId: string, setId: string) => void;
  addSet: (exerciseId: string) => void;
};

const nullWorkoutState: WorkoutState = {
  isActive: false,
  isMinimized: false,
  workoutData: null,
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [workoutState, setWorkoutState] = useState<WorkoutState>(nullWorkoutState);

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
      workoutData: { 
        startTime: new Date(), 
        exercises: dummyData 
      },
    });
    router.replace('/(workout)')
  };

  const endWorkout = () => {
    console.log("ending workout");
    setWorkoutState(nullWorkoutState);
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

  const updateSet = (exerciseId: string, setId: string, newData: any) => {
    setWorkoutState(prev => ({
      ...prev,
      workoutData: {
        ...prev.workoutData,
        exercises: prev.workoutData.exercises.map((exercise: { exerciseId: string; sets: any[]; }) => 
          exercise.exerciseId === exerciseId 
            ? {
                ...exercise,
                sets: exercise.sets.map((set: { setId: string; }) => 
                  set.setId === setId 
                    ? { ...set, trackingData: newData }
                    : set
                )
              }
            : exercise
        )
      }
    }));
  };

  const deleteSet = (exerciseId: string, setId: string) => {
    setWorkoutState(prev => ({
      ...prev,
      workoutData: {
        ...prev.workoutData,
        exercises: prev.workoutData.exercises.map((exercise: { exerciseId: string; sets: any[]; }) => 
          exercise.exerciseId === exerciseId 
            ? {
                ...exercise,
                sets: exercise.sets.filter((set: { setId: string; }) => set.setId !== setId)
              }
            : exercise
        )
      }
    }));
  };

  const addSet = (exerciseId: string) => {
    setWorkoutState(prev => ({
      ...prev,
      workoutData: {
        ...prev.workoutData,
        exercises: prev.workoutData.exercises.map((exercise: { exerciseId: string; sets: string | any[]; trackingMethods: any[]; }) => 
          exercise.exerciseId === exerciseId 
            ? {
                ...exercise,
                sets: [...exercise.sets, {
                  setId: `${exerciseId}-${exercise.sets.length + 1}`,
                  trackingData: exercise.trackingMethods.reduce((acc: any, method: any) => ({
                    ...acc,
                    [method]: null
                  }), {})
                }]
              }
            : exercise
        )
      }
    }));
  };

  return (
    <WorkoutContext.Provider
      value={{
        workoutState,
        startWorkout,
        endWorkout,
        minimizeWorkout,
        maximizeWorkout,
        updateSet,
        deleteSet,
        addSet
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

export default useWorkout;