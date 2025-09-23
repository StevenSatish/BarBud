import React, { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';

// ===== Types =====
export type TrackingMethod = 'weight' | 'reps' | 'time' | 'distance' | 'rpe';

export type SetEntity = {
  id: string;            // stable UUID
  order: number;         // 1-based order for UI
  completed: boolean;
  trackingData: Partial<Record<TrackingMethod, number | null>>;
  timestamp: string;     // ISO
};

export type ExerciseEntity = {
  exerciseId: string;    // catalog ID for the exercise
  name: string;          // display label
  category: string;
  muscleGroup: string;
  secondaryMuscles?: string[];
  trackingMethods: TrackingMethod[];
  setIds: string[];      // ordered list of set IDs
};

export type WorkoutData = {
  startTimeISO: string;  // ISO start time
  exercises: ExerciseEntity[];
  setsById: Record<string, SetEntity>;
};

export type WorkoutState = {
  isActive: boolean;
  isMinimized: boolean;
  workout: WorkoutData | null;
};

export type WarningItem = { level: 'error' | 'warn'; message: string; ids?: string[] };

export type EndSummary = {
  durationMin: number;
  totalExercises: number;
  perExercise: {
    exerciseId: string;
    name: string;
    setCount: number;
    topWeight?: number;
    volume?: number;
    bestEst1RM?: number;
  }[];
  totals: { volume: number };
};

// ===== Reducer =====
type Action =
  | { type: 'START' }
  | { type: 'CANCEL' }
  | { type: 'MINIMIZE' }
  | { type: 'MAXIMIZE' }
  | { type: 'HYDRATE'; payload: WorkoutState }
  | { type: 'ADD_EXERCISES'; payload: Omit<ExerciseEntity, 'setIds'>[] }
  | { type: 'DELETE_EXERCISE'; exerciseId: string }
  | { type: 'ADD_SET'; exerciseId: string }
  | { type: 'DELETE_SET'; exerciseId: string; setId: string }
  | { type: 'UPDATE_SET_DATA'; exerciseId: string; setId: string; data: Partial<SetEntity['trackingData']> }
  | { type: 'UPDATE_SET_COMPLETED'; exerciseId: string; setId: string; completed: boolean };

const STORAGE_KEY = 'workoutState';

const initialState: WorkoutState = {
  isActive: false,
  isMinimized: false,
  workout: {
    startTimeISO: new Date().toISOString(),
    exercises: [],
    setsById: {},
  },
};

function reducer(state: WorkoutState, action: Action): WorkoutState {
  switch (action.type) {
    case 'START': {
      return {
        isActive: true,
        isMinimized: false,
        workout: {
          startTimeISO: new Date().toISOString(),
          exercises: [],
          setsById: {},
        },
      };
    }
    case 'CANCEL':
      return initialState;

    case 'MINIMIZE':
      return { ...state, isMinimized: true };

    case 'MAXIMIZE':
      return { ...state, isMinimized: false };

    case 'HYDRATE':
      return action.payload;

    case 'ADD_EXERCISES': {
      if (!state.workout) return state;
      const payload = action.payload.map(e => ({ ...e, setIds: [] as string[] }));
      return {
        ...state,
        workout: { ...state.workout, exercises: [...state.workout.exercises, ...payload] },
      };
    }

    case 'DELETE_EXERCISE': {
      if (!state.workout) return state;
      const ex = state.workout.exercises.find(e => e.exerciseId === action.exerciseId);
      if (!ex) return state;

      const setsById = { ...state.workout.setsById };
      ex.setIds.forEach(id => {
        delete setsById[id];
      });

      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: state.workout.exercises.filter(e => e.exerciseId !== action.exerciseId),
          setsById,
        },
      };
    }

    case 'ADD_SET': {
      if (!state.workout) return state;
      const idx = state.workout.exercises.findIndex(e => e.exerciseId === action.exerciseId);
      if (idx < 0) return state;

      const ex = state.workout.exercises[idx];
      const lastSet = ex.setIds.length ? state.workout.setsById[ex.setIds[ex.setIds.length - 1]] : undefined;

      const newId = Crypto.randomUUID();
      const newSet: SetEntity = {
        id: newId,
        order: ex.setIds.length + 1,
        completed: false,
        trackingData: ex.trackingMethods.reduce((acc, m) => {
          const prev = lastSet?.trackingData?.[m];
          acc[m] = (prev ?? null) as number | null;
          return acc;
        }, {} as Partial<Record<TrackingMethod, number | null>>),
        timestamp: new Date().toISOString(),
      };

      const setsById = { ...state.workout.setsById, [newId]: newSet };
      const exercises = state.workout.exercises.map((e, i) =>
        i === idx ? { ...e, setIds: [...e.setIds, newId] } : e
      );

      return { ...state, workout: { ...state.workout, setsById, exercises } };
    }

    case 'DELETE_SET': {
      if (!state.workout) return state;

      const exIdx = state.workout.exercises.findIndex(e => e.exerciseId === action.exerciseId);
      if (exIdx < 0) return state;

      const ex = state.workout.exercises[exIdx];
      if (!ex.setIds.includes(action.setId)) return state;

      const setsById = { ...state.workout.setsById };
      delete setsById[action.setId];

      // Keep stable IDs; only recompute 'order'
      const remaining = ex.setIds.filter(id => id !== action.setId);
      const reordered = remaining.map((id, i) => ({ ...setsById[id], order: i + 1 }));
      const patchedSetsById = { ...setsById };
      reordered.forEach(s => {
        patchedSetsById[s.id] = s;
      });

      const exercises = state.workout.exercises.map((e, i) =>
        i === exIdx ? { ...e, setIds: remaining } : e
      );

      return { ...state, workout: { ...state.workout, setsById: patchedSetsById, exercises } };
    }

    case 'UPDATE_SET_DATA': {
      if (!state.workout) return state;
      const set = state.workout.setsById[action.setId];
      if (!set) return state;

      return {
        ...state,
        workout: {
          ...state.workout,
          setsById: {
            ...state.workout.setsById,
            [action.setId]: { ...set, trackingData: { ...set.trackingData, ...action.data } },
          },
        },
      };
    }

    case 'UPDATE_SET_COMPLETED': {
      if (!state.workout) return state;
      const set = state.workout.setsById[action.setId];
      if (!set) return state;

      return {
        ...state,
        workout: {
          ...state.workout,
          setsById: {
            ...state.workout.setsById,
            [action.setId]: { ...set, completed: action.completed },
          },
        },
      };
    }

    default:
      return state;
  }
}

// ===== Context API =====
type Ctx = {
  workoutState: WorkoutState;
  startWorkout: () => void;
  endWorkout: () => EndSummary;
  endWorkoutWarnings: () => WarningItem[];
  cancelWorkout: () => void;
  minimizeWorkout: () => void;
  maximizeWorkout: () => void;
  updateSet: (exerciseId: string, setId: string, newData: Partial<SetEntity['trackingData']>) => void;
  updateSetCompleted: (exerciseId: string, setId: string, completed: boolean) => void;
  addExercises: (exercises: Omit<ExerciseEntity, 'setIds'>[]) => void;
  deleteSet: (exerciseId: string, setId: string) => void;
  deleteExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
};

const WorkoutContext = createContext<Ctx | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from storage once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as WorkoutState;
          dispatch({ type: 'HYDRATE', payload: parsed });
        }
      } catch (e) {
        console.error('Error loading workout state:', e);
      }
    })();
  }, []);

  // Persist on every change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Error saving workout state:', e);
      }
    })();
  }, [state]);

  // Actions
  const startWorkout = () => {
    dispatch({ type: 'START' });
    router.replace('/(workout)');
  };

  const cancelWorkout = () => {
    dispatch({ type: 'CANCEL' });
    AsyncStorage.removeItem(STORAGE_KEY);
    router.replace('/(tabs)');
  };

  const minimizeWorkout = () => {
    dispatch({ type: 'MINIMIZE' });
    router.replace({ pathname: '/(tabs)', params: { direction: 'down' } });
  };

  const maximizeWorkout = () => {
    dispatch({ type: 'MAXIMIZE' });
    router.replace('/(workout)');
  };

  const addExercises: Ctx['addExercises'] = exercises => {
    dispatch({ type: 'ADD_EXERCISES', payload: exercises });
  };

  const deleteExercise: Ctx['deleteExercise'] = exerciseId => {
    dispatch({ type: 'DELETE_EXERCISE', exerciseId });
  };

  const addSet: Ctx['addSet'] = exerciseId => {
    dispatch({ type: 'ADD_SET', exerciseId });
  };

  const deleteSet: Ctx['deleteSet'] = (exerciseId, setId) => {
    dispatch({ type: 'DELETE_SET', exerciseId, setId });
  };

  const updateSet: Ctx['updateSet'] = (exerciseId, setId, newData) => {
    dispatch({ type: 'UPDATE_SET_DATA', exerciseId, setId, data: newData });
  };

  const updateSetCompleted: Ctx['updateSetCompleted'] = (exerciseId, setId, completed) => {
    dispatch({ type: 'UPDATE_SET_COMPLETED', exerciseId, setId, completed });
  };

  // Helpers
  const estimate1RM = (weight?: number | null, reps?: number | null): number | undefined => {
    if (weight == null || reps == null) return undefined;
    if (!Number.isFinite(weight) || !Number.isFinite(reps)) return undefined;
    if (reps <= 0 || reps > 6) return undefined;
    return Math.round(weight * (1 + reps / 30)); // Epley
  };

  const endWorkoutWarnings = (): WarningItem[] => {
    const ws = state.workout;
    if (!state.isActive || !ws) return [];
    const uncompletedCount = Object.values(ws.setsById).filter(set => !set.completed).length;

    return uncompletedCount > 0
      ? [{ level: 'warn', message: `${uncompletedCount} uncompleted set(s) will be ignored`, ids: [] }]
      : [];
  };

  const endWorkout = (): EndSummary => {
    const ws = state.workout;
    if (!state.isActive || !ws) {
      return { durationMin: 0, totalExercises: 0, perExercise: [], totals: { volume: 0 } };
    }

    const start = new Date(ws.startTimeISO).getTime();
    const end = Date.now();
    let totalVolume = 0;

    const perExercise = ws.exercises.map(ex => {
      let topWeight = 0;
      let volume = 0;
      let bestEst = 0;

      ex.setIds.forEach(id => {
        const s = ws.setsById[id];
        const w = (s.trackingData.weight ?? 0) as number;
        const r = (s.trackingData.reps ?? 0) as number;
        if (s.completed && Number.isFinite(w) && Number.isFinite(r)) {
          topWeight = Math.max(topWeight, w);
          volume += w * r;
          const e1 = estimate1RM(w, r);
          if (e1) bestEst = Math.max(bestEst, e1);
        }
      });

      totalVolume += volume;

      return {
        exerciseId: ex.exerciseId,
        name: ex.name,
        setCount: ex.setIds.length,
        topWeight: topWeight || undefined,
        volume: volume || undefined,
        bestEst1RM: bestEst || undefined,
      };
    });

    // Basic console log for now (MVP)
    console.log('🏋️ WORKOUT COMPLETED 🏋️');
    console.log('=====================================');
    console.log(`Start Time: ${new Date(ws.startTimeISO)}`);
    console.log(`End Time: ${new Date(end)}`);
    console.log(`Duration: ${Math.max(1, Math.round((end - start) / 1000 / 60))} minutes`);
    console.log(`Total Exercises: ${ws.exercises.length}`);
    console.log('=====================================');
    ws.exercises.forEach((exercise, i) => {
      console.log(`\n${i + 1}. ${exercise.name}`);
      console.log(`   Category: ${exercise.category}`);
      console.log(`   Muscle Group: ${exercise.muscleGroup}`);
      console.log(`   Tracking Methods: ${exercise.trackingMethods.join(', ')}`);
      console.log(`   Sets: ${exercise.setIds.length}`);
      exercise.setIds.forEach((sid, j) => {
        const set = ws.setsById[sid];
        console.log(`   Set ${j + 1}:`);
        console.log(`     Completed: ${set.completed ? '✅' : '❌'}`);
        console.log(`     Tracking Data:`, set.trackingData);
      });
    });
    console.log('\n=====================================');
    console.log('🏋️ END OF WORKOUT LOG 🏋️');

    const summary: EndSummary = {
      durationMin: Math.max(1, Math.round((end - start) / 1000 / 60)),
      totalExercises: ws.exercises.length,
      perExercise,
      totals: { volume: totalVolume },
    };

    // Navigate away and reset
    router.replace('/(tabs)');
    AsyncStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'CANCEL' });

    return summary;
  };

  const value: Ctx = {
    workoutState: state,
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
    addSet,
  };

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within a WorkoutProvider');
  return context;
};

export default useWorkout;
