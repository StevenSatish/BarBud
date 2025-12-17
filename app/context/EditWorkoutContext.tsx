import React, { createContext, useContext, useReducer, useRef, useState } from 'react';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { FIREBASE_AUTH, FIREBASE_DB } from '@/FirebaseConfig';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { writeEditedSession } from '@/app/services/workoutEditDatabase';

export type TrackingMethod = 'weight' | 'reps' | 'time';

export type SetEntity = {
  id: string;
  order: number;
  completed: boolean;
  trackingData: Partial<Record<TrackingMethod, number | null>>;
};

export type ExerciseEntity = {
  instanceId: string;
  exerciseId: string;
  name: string;
  category: string;
  muscleGroup: string;
  secondaryMuscles?: string[];
  trackingMethods: TrackingMethod[];
  setIds: string[];
  previousSets?: PreviousSetData[];
  notes?: string;
  order?: number;
};

export type PreviousSetData = {
  order: number;
  trackingData: Partial<Record<TrackingMethod, number | null>>;
};

export type WorkoutData = {
  startTimeISO: string;
  endTimeISO: string;
  exercises: ExerciseEntity[];
  setsById: Record<string, SetEntity>;
};

export type WorkoutState = {
  isActive: boolean;
  isMinimized: boolean;
  isReorderingExercises: boolean;
  workout: WorkoutData | null;
};

export type WarningItem = { level: 'error' | 'warn'; message: string; ids?: string[] };

type Action =
  | { type: 'START' }
  | { type: 'CANCEL' }
  | { type: 'MINIMIZE' }
  | { type: 'MAXIMIZE' }
  | { type: 'HYDRATE'; payload: WorkoutState }
  | { type: 'ADD_EXERCISES'; payload: Omit<ExerciseEntity, 'setIds' | 'instanceId'>[] }
  | { type: 'REPLACE_EXERCISE_WITH'; targetInstanceId: string; payload: Omit<ExerciseEntity, 'setIds' | 'instanceId'>[] }
  | { type: 'DELETE_EXERCISE'; exerciseInstanceId: string }
  | { type: 'ADD_SET'; exerciseInstanceId: string }
  | { type: 'DELETE_SET'; exerciseInstanceId: string; setId: string }
  | { type: 'UPDATE_SET_DATA'; exerciseInstanceId: string; setId: string; data: Partial<SetEntity['trackingData']> }
  | { type: 'UPDATE_SET_COMPLETED'; exerciseInstanceId: string; setId: string; completed: boolean }
  | { type: 'UPDATE_EXERCISE_NOTES'; exerciseInstanceId: string; notes?: string }
  | { type: 'SET_REORDER_MODE'; enabled: boolean }
  | { type: 'SET_EXERCISE_ORDER'; order: string[] }
  | { type: 'SET_START_TIME'; iso: string }
  | { type: 'SET_END_TIME'; iso: string };

const initialState: WorkoutState = {
  isActive: false,
  isMinimized: false,     
  isReorderingExercises: false,
  workout: {
    startTimeISO: new Date().toISOString(),
    endTimeISO: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    exercises: [],
    setsById: {},
  },
};

const normalizeExerciseOrder = (exercises: ExerciseEntity[]): ExerciseEntity[] =>
  exercises.map((ex, idx) => ({ ...ex, order: idx + 1 }));

const sortAndNormalizePersistedOrder = (exercises: ExerciseEntity[]): ExerciseEntity[] =>
  [...exercises]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((ex, idx) => ({ ...ex, order: idx + 1 }));

function reducer(state: WorkoutState, action: Action): WorkoutState {
  switch (action.type) {
    case 'START': {
      return {
        isActive: true,
        isMinimized: false,
        isReorderingExercises: false,
        workout: {
          startTimeISO: new Date().toISOString(),
          endTimeISO: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          exercises: [],
    setsById: {},
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
      const payload = action.payload.map((e) => ({
        instanceId: Crypto.randomUUID(),
        ...e,
        setIds: [],
      }));
      return {
        ...state,
        workout: { ...state.workout, exercises: normalizeExerciseOrder([...state.workout.exercises, ...payload]) },
      };
    }
    case 'DELETE_EXERCISE': {
      if (!state.workout) return state;
      const ex = state.workout.exercises.find((e) => e.instanceId === action.exerciseInstanceId);
      if (!ex) return state;

      const setsById = { ...state.workout.setsById };
      ex.setIds.forEach((id) => {
        delete setsById[id];
      });

      const remainingExercises = state.workout.exercises.filter((e) => e.instanceId !== action.exerciseInstanceId);

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
      const exIdx = state.workout.exercises.findIndex((e) => e.instanceId === action.targetInstanceId);
      if (exIdx < 0) return state;

      const oldExercise = state.workout.exercises[exIdx];
      const cleanedSetsById = { ...state.workout.setsById };
      oldExercise.setIds.forEach((id) => {
        delete cleanedSetsById[id];
      });

      const replacementExercises: ExerciseEntity[] = action.payload.map((e) => ({
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
      const idx = state.workout.exercises.findIndex((e) => e.instanceId === action.exerciseInstanceId);
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

      const exIdx = state.workout.exercises.findIndex((e) => e.instanceId === action.exerciseInstanceId);
      if (exIdx < 0) return state;

      const ex = state.workout.exercises[exIdx];
      if (!ex.setIds.includes(action.setId)) return state;

      const setsById = { ...state.workout.setsById };
      delete setsById[action.setId];

      const remaining = ex.setIds.filter((id) => id !== action.setId);
      const exercises = state.workout.exercises.map((e, i) => (i === exIdx ? { ...e, setIds: remaining } : e));

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
    case 'UPDATE_EXERCISE_NOTES': {
      if (!state.workout) return state;
      const exercises = state.workout.exercises.map((ex) =>
        ex.instanceId === action.exerciseInstanceId ? { ...ex, notes: action.notes } : ex
      );
      return { ...state, workout: { ...state.workout, exercises } };
    }
    case 'SET_REORDER_MODE':
      return { ...state, isReorderingExercises: action.enabled };
    case 'SET_EXERCISE_ORDER': {
      if (!state.workout) return state;
      const exerciseMap = state.workout.exercises.reduce<Record<string, ExerciseEntity>>((acc, ex) => {
        acc[ex.instanceId] = ex;
        return acc;
      }, {});

      const reordered = action.order.map((id) => exerciseMap[id]).filter((ex): ex is ExerciseEntity => Boolean(ex));
      const missing = state.workout.exercises.filter((ex) => !action.order.includes(ex.instanceId));

      return {
        ...state,
        workout: { ...state.workout, exercises: normalizeExerciseOrder([...reordered, ...missing]) },
      };
    }
    case 'SET_START_TIME': {
      if (!state.workout) return state;
      return { ...state, workout: { ...state.workout, startTimeISO: action.iso } };
    }
    case 'SET_END_TIME': {
      if (!state.workout) return state;
      return { ...state, workout: { ...state.workout, endTimeISO: action.iso } };
    }
    default:
      return state;
  }
}

type Ctx = {
  workoutState: WorkoutState;
  endWorkout: () => Promise<void>;
  endWorkoutWarnings: () => WarningItem[];
  cancelWorkout: () => Promise<void>;
  isSaving: boolean;
  setStartTime: (date: Date) => void;
  setEndTime: (date: Date) => void;
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
  startEditing: (sessionId: string) => Promise<void>;
};

const EditWorkoutContext = createContext<Ctx | undefined>(undefined);

export const EditWorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const editingSessionIdRef = useRef<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startEditing: Ctx['startEditing'] = async (sessionId) => {
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user || !sessionId) return;
      editingSessionIdRef.current = sessionId;

      const sessionRef = doc(FIREBASE_DB, `users/${user.uid}/sessions/${sessionId}`);
      const sessionSnap = await getDoc(sessionRef);
      if (!sessionSnap.exists()) return;
      const sessionData = sessionSnap.data() as any;
      const startAt: Date =
        (sessionData.startAt && typeof sessionData.startAt.toDate === 'function'
          ? sessionData.startAt.toDate()
          : new Date(sessionData.startAt ?? Date.now())) || new Date();
      const endAt: Date =
        (sessionData.endAt && typeof sessionData.endAt.toDate === 'function'
          ? sessionData.endAt.toDate()
          : sessionData.endAt
          ? new Date(sessionData.endAt)
          : null) ||
        (typeof sessionData.durationMin === 'number' && sessionData.durationMin > 0
          ? new Date(startAt.getTime() + sessionData.durationMin * 60 * 1000)
          : new Date(startAt.getTime() + 60 * 60 * 1000));

      // Map exerciseId -> name/category from exerciseCounts to recover display info
      const displayByExerciseId: Record<string, { name?: string; category?: string }> = {};
      const orderByExerciseId: Record<string, number> = {};
      if (Array.isArray(sessionData.exerciseCounts)) {
        sessionData.exerciseCounts.forEach((item: any, idx: number) => {
          if (item?.exerciseId) {
            displayByExerciseId[item.exerciseId] = {
              name: item.name ?? '',
              category: item.category ?? '',
            };
            if (orderByExerciseId[item.exerciseId] === undefined) {
              orderByExerciseId[item.exerciseId] =
                typeof item.order === 'number' ? item.order : idx + 1;
            }
          }
        });
      }

      const exercisesSnap = await getDocs(collection(sessionRef, 'exercises'));
      const setsById: WorkoutData['setsById'] = {};
      const exercises = exercisesSnap.docs.map((exSnap) => {
        const d = exSnap.data() as any;
        const rawSets: any[] = Array.isArray(d.sets) ? d.sets : [];
        const sortedSets = [...rawSets].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
        const setIds: string[] = [];
        sortedSets.forEach((s, idx) => {
          const id = s?.id || Crypto.randomUUID();
          const trackingData = s?.trackingData ?? {};
          const normWeight = Number.isFinite(trackingData.weight) ? Number(trackingData.weight) : trackingData.weight ?? null;
          const normReps = Number.isFinite(trackingData.reps) ? Number(trackingData.reps) : trackingData.reps ?? null;
          const normTime = Number.isFinite(trackingData.time) ? Number(trackingData.time) : trackingData.time ?? null;
          const cleanedTracking: Partial<Record<TrackingMethod, number | null>> = {};
          if (normWeight !== null && normWeight !== undefined) cleanedTracking.weight = normWeight;
          if (normReps !== null && normReps !== undefined) cleanedTracking.reps = normReps;
          if (normTime !== null && normTime !== undefined) cleanedTracking.time = normTime;
          setIds.push(id);
          setsById[id] = {
            id,
            order: s?.order ?? idx + 1,
            completed: s?.completed ?? true,
            trackingData: cleanedTracking,
          };
        });

        // Tracking methods: prefer stored list; otherwise derive from set keys
        const trackingMethodsFromDoc: TrackingMethod[] = Array.isArray(d?.trackingMethods)
          ? (d.trackingMethods.filter((m: any) => ['weight', 'reps', 'time'].includes(m)) as TrackingMethod[])
          : [];
        const firstSetTracking = setIds.length ? setsById[setIds[0]]?.trackingData ?? {} : {};
        const trackingMethods = trackingMethodsFromDoc.length
          ? trackingMethodsFromDoc
          : (['weight', 'reps', 'time'] as TrackingMethod[]).filter((k) => firstSetTracking[k] !== undefined);

        const exerciseId = d?.exerciseId ?? '';
        const display = displayByExerciseId[exerciseId] ?? {};

        return {
          instanceId: exSnap.id,
          exerciseId,
          name: display.name || d?.name || 'Exercise',
          category: display.category || d?.category || '',
          muscleGroup: d?.muscleGroup ?? '',
          secondaryMuscles: d?.secondaryMuscles ?? [],
          trackingMethods,
          setIds,
          previousSets: [],
          notes: d?.notes ?? '',
          order: typeof d?.order === 'number' ? d.order : orderByExerciseId[exerciseId],
        } as ExerciseEntity;
      });

      const loadedState: WorkoutState = {
        isActive: true,
        isMinimized: false,
        isReorderingExercises: false,
        workout: {
          startTimeISO: startAt.toISOString(),
          endTimeISO: endAt.toISOString(),
          exercises: normalizeExerciseOrder(exercises),
          setsById,
        },
      };

      dispatch({ type: 'HYDRATE', payload: loadedState });

      router.replace('/(editWorkout)');
    } catch (err) {
      console.error('Failed to start editing session', err);
    }
  };

  const navigateToTabs = () => {
    router.replace('/(tabs)');
  };

  const cancelWorkout = async () => {
    dispatch({ type: 'CANCEL' });
    editingSessionIdRef.current = null;
    await navigateToTabs();
  };

  const addExercises: Ctx['addExercises'] = async (exercises) => {
    const normalized = exercises.map((exercise) => ({
      ...exercise,
      notes: exercise.notes ?? '',
      previousSets: [],
    }));
    dispatch({ type: 'ADD_EXERCISES', payload: normalized });
  };

  const replaceExerciseWith: Ctx['replaceExerciseWith'] = async (targetInstanceId, exercises) => {
    const normalized = exercises.map((exercise) => ({
      ...exercise,
      notes: exercise.notes ?? '',
      previousSets: [],
    }));
    dispatch({ type: 'REPLACE_EXERCISE_WITH', targetInstanceId, payload: normalized });
  };

  const deleteExercise: Ctx['deleteExercise'] = (exerciseInstanceId) => {
    dispatch({ type: 'DELETE_EXERCISE', exerciseInstanceId });
  };

  const addSet: Ctx['addSet'] = (exerciseInstanceId) => {
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

  const setStartTime: Ctx['setStartTime'] = (date) => {
    dispatch({ type: 'SET_START_TIME', iso: date.toISOString() });
  };

  const setEndTime: Ctx['setEndTime'] = (date) => {
    dispatch({ type: 'SET_END_TIME', iso: date.toISOString() });
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
    const uncompletedCount = Object.values(ws.setsById).filter((set) => !set.completed).length;

    return uncompletedCount > 0
      ? [{ level: 'warn', message: `${uncompletedCount} uncompleted set(s) will be ignored`, ids: [] }]
      : [];
  };

  const endWorkout = async (): Promise<void> => {
    const ws = state.workout;
    const sessionId = editingSessionIdRef.current;
    const user = FIREBASE_AUTH.currentUser;
    if (!state.isActive || !ws || !sessionId || !user) {
      router.replace('/(tabs)');
      return;
    }

    const startMs = new Date(ws.startTimeISO).getTime();
    const parsedEnd = ws.endTimeISO ? new Date(ws.endTimeISO).getTime() : 0;
    const endMs = parsedEnd > startMs ? parsedEnd : startMs + 60 * 1000;
    setIsSaving(true);
    try {
      await writeEditedSession(user.uid, sessionId, ws, endMs);
    } catch (err) {
      console.error('Failed to write edited session', err);
    } finally {
      editingSessionIdRef.current = null;
      dispatch({ type: 'CANCEL' });
      navigateToTabs();
      setIsSaving(false);
    }
  };

  const value: Ctx = {
    workoutState: state,
    endWorkout,
    endWorkoutWarnings,
    cancelWorkout,
    isSaving,
    setStartTime,
    setEndTime,
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
    startEditing,
  };

  return <EditWorkoutContext.Provider value={value}>{children}</EditWorkoutContext.Provider>;
};

export const useEditWorkout = () => {
  const context = useContext(EditWorkoutContext);
  if (!context) throw new Error('useEditWorkout must be used within an EditWorkoutProvider');
  return context;
};

export default useEditWorkout;
