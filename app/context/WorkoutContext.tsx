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
  endWorkoutWarnings:() => any[];
  cancelWorkout: () => void;
  minimizeWorkout: () => void;
  maximizeWorkout: () => void;
  updateSet: (exerciseId: string, setId: string, newData: any) => void;
  updateSetCompleted: (exerciseId: string, setId: string, completed: boolean) => void;
  addExercises: (exercises: any) => void;
  deleteSet: (exerciseId: string, setId: string) => void;
  deleteExercise: (exerciseId: string) => void;
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
          // Double state setting to fix the startTime bug
          setWorkoutState(prev => ({
            ...prev,
            workoutData: {
              ...prev.workoutData,
              startTime: new Date(JSON.parse(savedState).workoutData.startTime)
            }
          }));
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
        exercises: [],
      },
    });
    router.replace('/(workout)')
  };

  const endWorkout = () => {
    // TODO: Save workout to database
    setWorkoutState(nullWorkoutState);
    AsyncStorage.removeItem('workoutState');
    router.replace('/(tabs)')
  };

  const endWorkoutWarnings = () => {
    return [ "One invalid Set Will be Removed"]
  };

  const cancelWorkout = () => {
    setWorkoutState(nullWorkoutState);
    AsyncStorage.removeItem('workoutState');
    router.replace('/(tabs)')
  };

  const minimizeWorkout = () => {
    // First set minimized state
    setWorkoutState(prev => ({ ...prev, isMinimized: true }));
    // Then navigate back with animation
    router.replace({
      pathname: '/(tabs)',
      params: { direction: 'down' }
    });
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

  const updateSetCompleted = (exerciseId: string, setId: string, completed: boolean) => {
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
                    ? { ...set, completed: completed }
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
        exercises: prev.workoutData.exercises.map((exercise: { exerciseId: string; sets: any[]; }) => {
          if (exercise.exerciseId === exerciseId) {
            const filteredSets = exercise.sets.filter(
              (set: { setId: string; }) => set.setId !== setId
            );
            
            // Then, renumber the setIds for all remaining sets
            const renumberedSets = filteredSets.map((set: any, index: number) => ({
              ...set,
              setId: `${exerciseId}-${index + 1}`
            }));
            
            return {
              ...exercise,
              sets: renumberedSets
            };
          }
          return exercise;
        })
      }
    }));
  };

  const addSet = (exerciseId: string) => {
    setWorkoutState(prev => ({
      ...prev,
      workoutData: {
        ...prev.workoutData,
        exercises: prev.workoutData.exercises.map((exercise: { exerciseId: string; sets: any[]; trackingMethods: any[]; }) => {
          if (exercise.exerciseId === exerciseId) {
            const existingSets = exercise.sets;
            const previousSetData = existingSets.length > 0 
              ? existingSets[existingSets.length - 1].trackingData 
              : null;
              
            // Create new tracking data based on previous set if available
            const newTrackingData = exercise.trackingMethods.reduce((acc: any, method: any) => {
              // Use previous value if it exists and isn't null/undefined
              const valueFromPrevious = previousSetData && previousSetData[method] !== null 
                ? previousSetData[method] 
                : null;
                
              return {
                ...acc,
                [method]: valueFromPrevious
              };
            }, {});
            
            return {
              ...exercise,
              sets: [...existingSets, {
                setId: `${exerciseId}-${existingSets.length + 1}`,
                trackingData: newTrackingData
              }]
            };
          }
          return exercise;
        })
      }
    }));
  };

  const addExercises = (exercises: any) => {
    const newExercises: any[] = [];
    exercises.forEach((exercise: any) => {
      newExercises.push({
        ...exercise,
        sets: [],
        completed: false
      });
    });
    setWorkoutState(prev => ({
      ...prev,
      workoutData: {
        ...prev.workoutData,
        exercises: [...prev.workoutData.exercises, ...newExercises]
      }
    }));
  };

  const deleteExercise = (exerciseId: string) => {
    setWorkoutState(prev => ({
      ...prev,
      workoutData: {
        ...prev.workoutData,
        exercises: prev.workoutData.exercises.filter((exercise: { exerciseId: string; }) => exercise.exerciseId !== exerciseId)
      }
    }));
  };

  return (
    <WorkoutContext.Provider
      value={{
        workoutState,
        startWorkout,
        endWorkout,
        endWorkoutWarnings,
        cancelWorkout,
        minimizeWorkout,
        maximizeWorkout,
        updateSet,
        updateSetCompleted,
        deleteSet,
        addExercises,
        deleteExercise,
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