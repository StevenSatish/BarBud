import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import { collection, doc, getDoc, query, orderBy, limit, getDocs, increment, setDoc } from 'firebase/firestore';
import { 
  writeSessionAndCollectInstances, 
  writeExerciseInstances, 
  writeExerciseMetricsForSession,
  estimate1RM,
} from '../services/workoutDatabase';
import calculateProgressionsForWorkout, { ProgressionsResult } from '../services/progressionService';

// ===== Types =====
export type TrackingMethod = 'weight' | 'reps' | 'time';

export type SetEntity = {
  id: string;            // stable UUID
  order: number;         // 1-based order for UI
  completed: boolean;
  trackingData: Partial<Record<TrackingMethod, number | null>>;
  timestamp: string;     // ISO
};

export type ExerciseEntity = {
  instanceId: string;    // per-workout unique ID to allow duplicates
  exerciseId: string;    // catalog ID for the exercise
  name: string;          // display label
  category: string;
  muscleGroup: string;
  secondaryMuscles?: string[];
  trackingMethods: TrackingMethod[];
  setIds: string[];      // ordered list of set IDs
  previousSets?: PreviousSetData[]; // Previous session data for pre-population
};

export type PreviousSetData = {
  order: number;
  trackingData: Partial<Record<TrackingMethod, number | null>>;
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
  | { type: 'ADD_EXERCISES'; payload: Omit<ExerciseEntity, 'setIds' | 'instanceId'>[] }
  | { type: 'DELETE_EXERCISE'; exerciseInstanceId: string }
  | { type: 'ADD_SET'; exerciseInstanceId: string }
  | { type: 'DELETE_SET'; exerciseInstanceId: string; setId: string }
  | { type: 'UPDATE_SET_DATA'; exerciseInstanceId: string; setId: string; data: Partial<SetEntity['trackingData']> }
  | { type: 'UPDATE_SET_COMPLETED'; exerciseInstanceId: string; setId: string; completed: boolean };

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
      const payload = action.payload.map(e => ({ instanceId: Crypto.randomUUID(), ...e, setIds: [] as string[] }));
      return {
        ...state,
        workout: { ...state.workout, exercises: [...state.workout.exercises, ...payload] },
      };
    }

    case 'DELETE_EXERCISE': {
      if (!state.workout) return state;
      const ex = state.workout.exercises.find(e => e.instanceId === action.exerciseInstanceId);
      if (!ex) return state;

      const setsById = { ...state.workout.setsById };
      ex.setIds.forEach(id => {
        delete setsById[id];
      });

      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: state.workout.exercises.filter(e => e.instanceId !== action.exerciseInstanceId),
          setsById,
        },
      };
    }

    case 'ADD_SET': {
      if (!state.workout) return state;
      const idx = state.workout.exercises.findIndex(e => e.instanceId === action.exerciseInstanceId);
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

      const exIdx = state.workout.exercises.findIndex(e => e.instanceId === action.exerciseInstanceId);
      if (exIdx < 0) return state;

      const ex = state.workout.exercises[exIdx];
      if (!ex.setIds.includes(action.setId)) return state;

      const setsById = { ...state.workout.setsById };
      delete setsById[action.setId];

      // Only update the exercise's setIds; avoid rewriting remaining sets
      const remaining = ex.setIds.filter(id => id !== action.setId);
      const exercises = state.workout.exercises.map((e, i) =>
        i === exIdx ? { ...e, setIds: remaining } : e
      );

      return { ...state, workout: { ...state.workout, setsById, exercises } };
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
  endWorkout: () => Promise<ProgressionsResult>;
  endWorkoutWarnings: () => WarningItem[];
  cancelWorkout: () => void;
  minimizeWorkout: () => void;
  maximizeWorkout: () => void;
  updateSet: (exerciseInstanceId: string, setId: string, newData: Partial<SetEntity['trackingData']>) => void;
  updateSetCompleted: (exerciseInstanceId: string, setId: string, completed: boolean) => void;
  addExercises: (exercises: Omit<ExerciseEntity, 'setIds' | 'instanceId' | 'previousSets'>[]) => Promise<void>;
  deleteSet: (exerciseInstanceId: string, setId: string) => void;
  deleteExercise: (exerciseInstanceId: string) => void;
  addSet: (exerciseInstanceId: string) => void;
};

const WorkoutContext = createContext<Ctx | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Persist on change (debounced to reduce UI stalls)
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      (async () => {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error('Error saving workout state:', e);
        }
      })();
    }, 300);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
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

  // Fetch previous session data for an exercise
  const fetchPreviousSessionData = async (exerciseId: string): Promise<PreviousSetData[]> => {
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) return [];

      // Get the most recent session for this exercise
      const instancesRef = collection(FIREBASE_DB, `users/${user.uid}/exercises/${exerciseId}/instances`);
      const instancesQuery = query(instancesRef, orderBy('date', 'desc'), limit(1));
      const instancesSnapshot = await getDocs(instancesQuery);
      
      if (instancesSnapshot.empty) return [];

      const instanceDoc = instancesSnapshot.docs[0];
      const instanceData = instanceDoc.data();
      const { sessionId, exerciseInSessionId } = instanceData;

      // Get the session data
      const sessionRef = doc(FIREBASE_DB, `users/${user.uid}/sessions/${sessionId}`);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) return [];

      // Get the exercise data from the session
      const exerciseRef = doc(FIREBASE_DB, `users/${user.uid}/sessions/${sessionId}/exercises/${exerciseInSessionId}`);
      const exerciseDoc = await getDoc(exerciseRef);
      
      if (!exerciseDoc.exists()) return [];

      const exerciseData = exerciseDoc.data();
      const sets = exerciseData.sets || [];

      // Convert to PreviousSetData format
      return sets.map((set: any) => ({
        order: set.order,
        trackingData: set.trackingData || {}
      }));

    } catch (error) {
      console.error('Error fetching previous session data:', error);
      return [];
    }
  };

  const addExercises: Ctx['addExercises'] = async exercises => {
    // Fetch previous session data for each exercise
    const exercisesWithPreviousData = await Promise.all(
      exercises.map(async (exercise) => {
        const previousSets = await fetchPreviousSessionData(exercise.exerciseId);
        return {
          ...exercise,
          previousSets
        };
      })
    );
    
    dispatch({ type: 'ADD_EXERCISES', payload: exercisesWithPreviousData });
  };

  const deleteExercise: Ctx['deleteExercise'] = exerciseInstanceId => {
    dispatch({ type: 'DELETE_EXERCISE', exerciseInstanceId });
  };

  const addSet: Ctx['addSet'] = exerciseInstanceId => {
    dispatch({ type: 'ADD_SET', exerciseInstanceId });
  };

  const deleteSet: Ctx['deleteSet'] = (exerciseInstanceId, setId) => {
    dispatch({ type: 'DELETE_SET', exerciseInstanceId, setId });
  };

  const updateSet: Ctx['updateSet'] = (exerciseInstanceId, setId, newData) => {
    dispatch({ type: 'UPDATE_SET_DATA', exerciseInstanceId, setId, data: newData });
  };

  const updateSetCompleted: Ctx['updateSetCompleted'] = (exerciseInstanceId, setId, completed) => {
    dispatch({ type: 'UPDATE_SET_COMPLETED', exerciseInstanceId, setId, completed });
  };

  const endWorkoutWarnings = (): WarningItem[] => {
    const ws = state.workout;
    if (!state.isActive || !ws) return [];
    const uncompletedCount = Object.values(ws.setsById).filter(set => !set.completed).length;

    return uncompletedCount > 0
      ? [{ level: 'warn', message: `${uncompletedCount} uncompleted set(s) will be ignored`, ids: [] }]
      : [];
  };

  const endWorkout = async (): Promise<ProgressionsResult> => {
    const ws = state.workout;
    if (!state.isActive || !ws) {
      return { title: 'Workout Progressions', items: [] };
    }

    const user = FIREBASE_AUTH.currentUser;
    const uid = user?.uid ?? '';

    // 1) Compute progressions first (no writes yet)
    const progressions = await calculateProgressionsForWorkout(uid, ws);

    // 1a) Fetch workoutsCompleted BEFORE increment
    let workoutsCompletedBefore = 0;
    try {
      if (uid) {
        const userRef = doc(FIREBASE_DB, 'users', uid);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? (snap.data() as any) : {};
        const raw = data?.workoutsCompleted;
        if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
          workoutsCompletedBefore = raw;
        }
      }
    } catch {}

    // 2) Kick off writes in the background on next tick so UI can render modal first
    setTimeout(() => {
      (async () => {
        try {
          if (!user) return; // skip writes if not authenticated

          const start = new Date(ws.startTimeISO).getTime();
          const end = Date.now();

          const { sessionId, instances } = await writeSessionAndCollectInstances(
            uid,
            ws,
            start,
            end
          );

          await writeExerciseInstances(uid, instances);
          await writeExerciseMetricsForSession(uid, ws, sessionId);

          // Increment workoutsCompleted counter on user doc
          try {
            const userRef = doc(FIREBASE_DB, 'users', uid);
            await setDoc(userRef, { workoutsCompleted: increment(1) }, { merge: true });
          } catch (e) {
            console.error('Failed to increment workoutsCompleted (background):', e);
          }
        } catch (err) {
          console.error('Failed to write session to Firestore (background):', err);
        }
      })();
    }, 0);

    // 3) Return progressions so UI can show popup immediately
    return { ...progressions, workoutsCompletedBefore };
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
