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
} from '../services/workoutDatabase';
import calculateProgressionsForWorkout, { ProgressionsResult } from '../services/progressionService';

// ===== Types =====
export type TrackingMethod = 'weight' | 'reps' | 'time';

export type SetEntity = {
  id: string;            // stable UUID
  order: number;         // 1-based order for UI
  completed: boolean;
  trackingData: Partial<Record<TrackingMethod, number | null | string>>;
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
  order?: number;        // explicit order for rendering/persistence
};

export type PreviousSetData = {
  order: number;
  trackingData: Partial<Record<TrackingMethod, number | null>>;
};

export type TemplateSource = {
  folderId: string;
  templateId: string;
};

export type WorkoutData = {
  startTimeISO: string;  // ISO start time
  exercises: ExerciseEntity[];
  setsById: Record<string, SetEntity>;
  templateSource?: TemplateSource;
};

export type WorkoutState = {
  isActive: boolean;
  isMinimized: boolean;
  isReorderingExercises: boolean;
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
  | {
      type: 'ADD_TEMPLATE_EXERCISES';
      payload: Array<
        Omit<ExerciseEntity, 'setIds' | 'instanceId'> & {
          numSets: number;
          previousSets?: PreviousSetData[];
          notes?: string;
        }
      >;
    }
  | { type: 'SET_TEMPLATE_SOURCE'; payload: TemplateSource | undefined }
  | { type: 'REPLACE_EXERCISE_WITH'; targetInstanceId: string; payload: Omit<ExerciseEntity, 'setIds' | 'instanceId'>[] }
  | { type: 'DELETE_EXERCISE'; exerciseInstanceId: string }
  | { type: 'ADD_SET'; exerciseInstanceId: string }
  | { type: 'DELETE_SET'; exerciseInstanceId: string; setId: string }
  | { type: 'UPDATE_SET_DATA'; exerciseInstanceId: string; setId: string; data: Partial<SetEntity['trackingData']> }
  | { type: 'UPDATE_SET_COMPLETED'; exerciseInstanceId: string; setId: string; completed: boolean }
  | { type: 'UPDATE_EXERCISE_NOTES'; exerciseInstanceId: string; notes?: string }
  | { type: 'SET_REORDER_MODE'; enabled: boolean }
  | { type: 'SET_EXERCISE_ORDER'; order: string[] };

const STORAGE_KEY = 'workoutState';

const normalizeExerciseOrder = (exercises: ExerciseEntity[]): ExerciseEntity[] =>
  exercises.map((ex, idx) => ({ ...ex, order: idx + 1 }));

const sortAndNormalizePersistedOrder = (exercises: ExerciseEntity[]): ExerciseEntity[] =>
  [...exercises]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((ex, idx) => ({ ...ex, order: idx + 1 }));

const initialState: WorkoutState = {
  isActive: false,
  isMinimized: false,
  isReorderingExercises: false,
  workout: {
    startTimeISO: new Date().toISOString(),
    exercises: [],
    setsById: {},
    templateSource: undefined,
  },
};

function reducer(state: WorkoutState, action: Action): WorkoutState {
  switch (action.type) {
    case 'START': {
      return {
        isActive: true,
        isMinimized: false,
        isReorderingExercises: false,
        workout: {
          startTimeISO: new Date().toISOString(),
          exercises: [],
          setsById: {},
          templateSource: undefined,
        },
      };
    }
    case 'CANCEL':
      return initialState;

    case 'MINIMIZE':
      return { ...state, isMinimized: true, isReorderingExercises: false };

    case 'MAXIMIZE':
      return { ...state, isMinimized: false };

    case 'HYDRATE':
      return {
        ...action.payload,
        isReorderingExercises: action.payload?.isReorderingExercises ?? false,
        workout: action.payload?.workout
          ? {
              ...action.payload.workout,
              exercises: sortAndNormalizePersistedOrder(action.payload.workout.exercises ?? []),
            }
          : action.payload.workout,
      };

    case 'ADD_EXERCISES': {
      if (!state.workout) return state;
      const payload = action.payload.map(e => ({ instanceId: Crypto.randomUUID(), ...e, setIds: [] as string[] }));
      return {
        ...state,
        workout: { ...state.workout, exercises: normalizeExerciseOrder([...state.workout.exercises, ...payload]) },
      };
    }

    case 'ADD_TEMPLATE_EXERCISES': {
      if (!state.workout) return state;
      const setsById = { ...state.workout.setsById };
      const newExercises: ExerciseEntity[] = action.payload.map((e) => {
        const instanceId = Crypto.randomUUID();
        const setIds: string[] = [];
        const trackingMethods = e.trackingMethods ?? [];
        const setCount = Math.max(1, Number(e.numSets ?? 1));
        for (let i = 0; i < setCount; i += 1) {
          const setId = Crypto.randomUUID();
          setIds.push(setId);
          setsById[setId] = {
            id: setId,
            order: i + 1,
            completed: false,
            trackingData: trackingMethods.reduce((acc, m) => ({ ...acc, [m]: null }), {} as Partial<Record<TrackingMethod, number | null>>),
          };
        }
        return {
          instanceId,
          exerciseId: e.exerciseId,
          name: e.name,
          category: e.category,
          muscleGroup: e.muscleGroup,
          secondaryMuscles: e.secondaryMuscles,
          trackingMethods,
          setIds,
          notes: e.notes ?? '',
          previousSets: e.previousSets ?? [],
        };
      });

      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: normalizeExerciseOrder([...state.workout.exercises, ...newExercises]),
          setsById,
        },
      };
    }

    case 'SET_TEMPLATE_SOURCE': {
      if (!state.workout) return state;
      return {
        ...state,
        workout: {
          ...state.workout,
          templateSource: action.payload,
        },
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

      const remainingExercises = state.workout.exercises.filter(e => e.instanceId !== action.exerciseInstanceId);

      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: normalizeExerciseOrder(remainingExercises),
          setsById,
        },
        isReorderingExercises: remainingExercises.length > 0 ? state.isReorderingExercises : false,
      };
    }

    case 'REPLACE_EXERCISE_WITH': {
      if (!state.workout) return state;
      const exIdx = state.workout.exercises.findIndex(e => e.instanceId === action.targetInstanceId);
      if (exIdx < 0) return state;

      const oldExercise = state.workout.exercises[exIdx];
      const cleanedSetsById = { ...state.workout.setsById };
      // Remove all sets that belonged to the old exercise
      oldExercise.setIds.forEach(id => {
        delete cleanedSetsById[id];
      });

      const replacementExercises: ExerciseEntity[] = action.payload.map(e => ({
        instanceId: Crypto.randomUUID(),
        ...e,
        setIds: [],
      }));

      const before = state.workout.exercises.slice(0, exIdx);
      const after = state.workout.exercises.slice(exIdx + 1);
      const newExercises = normalizeExerciseOrder([...before, ...replacementExercises, ...after]);

      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: newExercises,
          setsById: cleanedSetsById,
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

      // Parse tracking data values from strings to floats when completing the set
      let parsedTrackingData = { ...set.trackingData };
      if (action.completed) {
        parsedTrackingData = Object.entries(set.trackingData).reduce((acc, [key, value]) => {
          const method = key as TrackingMethod;
          if (typeof value === 'string') {
            const trimmed = value.replace(',', '.').trim();
            if (trimmed === '') {
              acc[method] = null;
            } else {
              const parsed = parseFloat(trimmed);
              acc[method] = Number.isFinite(parsed) ? parsed : null;
            }
          } else {
            acc[method] = value;
          }
          return acc;
        }, {} as Partial<Record<TrackingMethod, number | null | string>>);
      }

      return {
        ...state,
        workout: {
          ...state.workout,
          setsById: {
            ...state.workout.setsById,
            [action.setId]: { ...set, completed: action.completed, trackingData: parsedTrackingData },
          },
        },
      };
    }

    case 'UPDATE_EXERCISE_NOTES': {
      if (!state.workout) return state;
      const exercises = state.workout.exercises.map(ex =>
        ex.instanceId === action.exerciseInstanceId ? { ...ex, notes: action.notes } : ex
      );
      return { ...state, workout: { ...state.workout, exercises } };
    }

    case 'SET_REORDER_MODE': {
      return { ...state, isReorderingExercises: action.enabled };
    }

    case 'SET_EXERCISE_ORDER': {
      if (!state.workout) return state;
      const exerciseMap = state.workout.exercises.reduce<Record<string, ExerciseEntity>>((acc, ex) => {
        acc[ex.instanceId] = ex;
        return acc;
      }, {});

      const reordered = action.order
        .map((id) => exerciseMap[id])
        .filter((ex): ex is ExerciseEntity => Boolean(ex));

      // Append any exercises not present in the provided order to avoid accidental loss
      const missing = state.workout.exercises.filter((ex) => !action.order.includes(ex.instanceId));

      return {
        ...state,
        workout: { ...state.workout, exercises: normalizeExerciseOrder([...reordered, ...missing]) },
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
  startWorkoutFromTemplate: (templateExercises: Array<{
    exerciseId: string;
    name: string;
    category: string;
    muscleGroup?: string;
    secondaryMuscles?: string[];
    trackingMethods?: TrackingMethod[];
    numSets?: number;
    notes?: string;
    templateMeta?: TemplateSource;
  }>) => Promise<void>;
  endWorkout: () => Promise<{ result: ProgressionsResult; persistPromise: Promise<void> }>;
  endWorkoutWarnings: () => WarningItem[];
  cancelWorkout: () => Promise<void>;
  minimizeWorkout: () => void;
  maximizeWorkout: () => void;
  updateSet: (exerciseInstanceId: string, setId: string, newData: Partial<SetEntity['trackingData']>) => void;
  updateSetCompleted: (exerciseInstanceId: string, setId: string, completed: boolean) => void;
  addExercises: (
    exercises: Array<Omit<ExerciseEntity, 'setIds' | 'instanceId' | 'previousSets'> & { notes?: string }>
  ) => Promise<void>;
  replaceExerciseWith: (
    targetInstanceId: string,
    exercises: Array<Omit<ExerciseEntity, 'setIds' | 'instanceId' | 'previousSets'> & { notes?: string }>
  ) => Promise<void>;
  deleteSet: (exerciseInstanceId: string, setId: string) => void;
  deleteExercise: (exerciseInstanceId: string) => void;
  addSet: (exerciseInstanceId: string) => void;
  updateExerciseNotes: (exerciseInstanceId: string, notes?: string) => void;
  startReorderExercises: () => void;
  finishReorderExercises: () => void;
  reorderExercises: (order: string[]) => void;
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
    }, 1000);

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

  const cancelWorkout = async () => {
    await navigateToLastTab('down');
    dispatch({ type: 'CANCEL' });
    AsyncStorage.removeItem(STORAGE_KEY);
  };

  const minimizeWorkout = () => {
    dispatch({ type: 'MINIMIZE' });
    navigateToLastTab('down');
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
          notes: exercise.notes ?? '',
          previousSets
        };
      })
    );
    
    dispatch({ type: 'ADD_EXERCISES', payload: exercisesWithPreviousData });
  };

  const replaceExerciseWith: Ctx['replaceExerciseWith'] = async (targetInstanceId, exercises) => {
    const exercisesWithPreviousData = await Promise.all(
      exercises.map(async (exercise) => {
        const previousSets = await fetchPreviousSessionData(exercise.exerciseId);
        return {
          ...exercise,
          notes: exercise.notes ?? '',
          previousSets
        };
      })
    );
    dispatch({ type: 'REPLACE_EXERCISE_WITH', targetInstanceId, payload: exercisesWithPreviousData });
  };

  const startWorkoutFromTemplate: Ctx['startWorkoutFromTemplate'] = async (templateExercises) => {
    const enriched = await Promise.all(
      templateExercises.map(async (ex, idx) => {
        const previousSets = await fetchPreviousSessionData(ex.exerciseId);
        return {
          exerciseId: ex.exerciseId,
          name: ex.name,
          category: ex.category,
          muscleGroup: ex.muscleGroup ?? '',
          secondaryMuscles: ex.secondaryMuscles ?? [],
          trackingMethods: ex.trackingMethods ?? [],
          numSets: Math.max(1, Number(ex.numSets ?? 1)),
          notes: ex.notes ?? '',
          previousSets,
        };
      })
    );

    dispatch({ type: 'START' });
    const templateMeta = (templateExercises as any[]).find((t) => t.templateMeta)
      ?.templateMeta as TemplateSource | undefined;
    dispatch({ type: 'SET_TEMPLATE_SOURCE', payload: templateMeta });
    dispatch({ type: 'ADD_TEMPLATE_EXERCISES', payload: enriched });
    router.replace('/(workout)');
  };

  // Navigate back to last visited tab (stored in AsyncStorage), defaulting to /(tabs)
  const navigateToLastTab = (direction: string = 'down'): Promise<void> => {
    const resolvePath = (p?: string | null) => {
      const allowed = new Set(['startWorkout', 'settings', 'historyDatabase', 'index']);
      if (!p || p === 'index') return '/(tabs)';
      return allowed.has(p) ? (`/(tabs)/${p}` as const) : '/(tabs)';
    };

    return AsyncStorage.getItem('lastPage')
      .then((p) => {
        const path = resolvePath(p);
        router.replace({ pathname: path as any, params: { direction } });
      })
      .catch(() => {
        router.replace({ pathname: '/(tabs)', params: { direction } });
      });
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

  const updateExerciseNotes: Ctx['updateExerciseNotes'] = (exerciseInstanceId, notes) => {
    dispatch({ type: 'UPDATE_EXERCISE_NOTES', exerciseInstanceId, notes });
  };

  const startReorderExercises = () => {
    dispatch({ type: 'SET_REORDER_MODE', enabled: true });
  };

  const finishReorderExercises = () => {
    dispatch({ type: 'SET_REORDER_MODE', enabled: false });
  };

  const reorderExercises: Ctx['reorderExercises'] = (order) => {
    dispatch({ type: 'SET_EXERCISE_ORDER', order });
  };

  const endWorkoutWarnings = (): WarningItem[] => {
    const ws = state.workout;
    if (!state.isActive || !ws) return [];
    const uncompletedCount = Object.values(ws.setsById).filter(set => !set.completed).length;

    return uncompletedCount > 0
      ? [{ level: 'warn', message: `${uncompletedCount} uncompleted set(s) will be ignored`, ids: [] }]
      : [];
  };

  const endWorkout = async (): Promise<{ result: ProgressionsResult; persistPromise: Promise<void> }> => {
    const ws = state.workout;
    if (!state.isActive || !ws) {
      return { result: { title: 'Workout Progressions', items: [] }, persistPromise: Promise.resolve() };
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

    // 2) Fire writes in background so navigation is snappy; surface promise to callers
    const persistPromise = (async () => {
      try {
        if (!user) return; // skip writes if not authenticated

        const start = new Date(ws.startTimeISO).getTime();
        const end = Date.now();

        const { sessionId, instances } = await writeSessionAndCollectInstances(uid, ws, start, end);

        await writeExerciseInstances(uid, instances);
        await writeExerciseMetricsForSession(uid, ws, sessionId);

        // Update template lastPerformedAt if this workout started from a template
        try {
          const templateSource = ws.templateSource;
          if (templateSource) {
            const templateRef = doc(
              FIREBASE_DB,
              `users/${uid}/folders/${templateSource.folderId}/templates/${templateSource.templateId}`
            );
            await setDoc(templateRef, { lastPerformedAt: new Date() }, { merge: true });
          }
        } catch (e) {
          console.error('Failed to update template lastPerformedAt:', e);
        }

        // Increment workoutsCompleted counter on user doc
        try {
          const userRef = doc(FIREBASE_DB, 'users', uid);
          await setDoc(userRef, { workoutsCompleted: increment(1) }, { merge: true });
        } catch (e) {
          console.error('Failed to increment workoutsCompleted:', e);
        }
      } catch (err) {
        console.error('Failed to write session to Firestore:', err);
      }
    })();

    // 3) Return progressions immediately plus the persist promise for optional chaining
    return { result: { ...progressions, workoutsCompletedBefore }, persistPromise };
  };

  const value: Ctx = {
    workoutState: state,
    startWorkout,
    startWorkoutFromTemplate,
    endWorkout,
    endWorkoutWarnings,
    cancelWorkout,
    minimizeWorkout,
    maximizeWorkout,
    updateSet,
    updateSetCompleted,
    deleteSet,
    addExercises,
    replaceExerciseWith,
    deleteExercise,
    addSet,
    updateExerciseNotes,
    startReorderExercises,
    finishReorderExercises,
    reorderExercises,
  };

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within a WorkoutProvider');
  return context;
};

export default useWorkout;
