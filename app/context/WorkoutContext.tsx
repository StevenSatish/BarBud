import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import { collection, doc, writeBatch, getDoc } from 'firebase/firestore';

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
  endWorkout: () => Promise<EndSummary>;
  endWorkoutWarnings: () => WarningItem[];
  cancelWorkout: () => void;
  minimizeWorkout: () => void;
  maximizeWorkout: () => void;
  updateSet: (exerciseInstanceId: string, setId: string, newData: Partial<SetEntity['trackingData']>) => void;
  updateSetCompleted: (exerciseInstanceId: string, setId: string, completed: boolean) => void;
  addExercises: (exercises: Omit<ExerciseEntity, 'setIds' | 'instanceId'>[]) => void;
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

  const addExercises: Ctx['addExercises'] = exercises => {
    dispatch({ type: 'ADD_EXERCISES', payload: exercises });
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

  // Helpers
  const estimate1RM = (weight?: number | null, reps?: number | null): number | undefined => {
    if (weight == null || reps == null) return undefined;
    if (!Number.isFinite(weight) || !Number.isFinite(reps)) return undefined;
    if (reps <= 0 || reps > 5) return undefined;
    return Math.round(weight / (1.0278 - (0.0278 * reps))); // Brzycki formula
  };

  const formatDayKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  type ExerciseInstanceInput = {
    sessionId: string;
    exerciseId: string;
    exerciseInSessionId: string;
    date: Date;
    volume: number;
    topWeight: number;
    bestEst1RM: number;
    completedSetCount: number;
    completedRepCount: number;
  };

  const writeSessionAndCollectInstances = async (
    uid: string,
    ws: WorkoutData,
    startMs: number,
    endMs: number
  ): Promise<{ sessionId: string; date: Date; instances: ExerciseInstanceInput[] }> => {
    const sessionId = Crypto.randomUUID();
    const sessionRef = doc(FIREBASE_DB, `users/${uid}/sessions/${sessionId}`);
    const batch = writeBatch(FIREBASE_DB);

    const startDate = new Date(ws.startTimeISO);
    const dayKey = formatDayKey(startDate);
    const durationMin = Math.max(1, Math.round((endMs - startMs) / 1000 / 60));
    const exerciseCounts: { exerciseId: string; nameSnap: string; completedSetCount: number }[] = [];
    let totalCompletedSets = 0;
    const instanceInputs: ExerciseInstanceInput[] = [];

    ws.exercises.forEach((ex, orderIndex) => {
      const exerciseInSessionId = Crypto.randomUUID();
      const exRef = doc(collection(sessionRef, 'exercises'), exerciseInSessionId);

      const rawSets = ex.setIds.map(setId => ws.setsById[setId]).filter(Boolean);
      const completed = rawSets.filter(s => s.completed);
      const sets = completed.map((s, idx) => {
        const weight = (s.trackingData.weight ?? null) as number | null;
        const reps = (s.trackingData.reps ?? null) as number | null;
        const time = (s.trackingData.time ?? null) as number | null;
        return {
          id: s.id,
          order: idx + 1,
          trackingData: { weight, reps, time },
        } as const;
      });

      let bestEst1RM = 0;
      let topWeight = 0;
      let volume = 0;
      let completedRepCount = 0;
      completed.forEach(s => {
        const w = (s.trackingData.weight ?? 0) as number;
        const r = (s.trackingData.reps ?? 0) as number;
        if (Number.isFinite(w) && Number.isFinite(r) && r > 0) {
          topWeight = Math.max(topWeight, w);
          volume += w * r;
          completedRepCount += r;
        }
        const est = estimate1RM(s.trackingData.weight ?? null, s.trackingData.reps ?? null);
        if (est && est > bestEst1RM) bestEst1RM = est;
      });

      const completedSetCount = completed.length;
      totalCompletedSets += completedSetCount;
      exerciseCounts.push({ exerciseId: ex.exerciseId, nameSnap: `${ex.name} (${ex.category})`, completedSetCount });

      const exerciseDoc: any = {
        exerciseId: ex.exerciseId,
        order: orderIndex + 1,
        sets,
      };
      if (bestEst1RM > 0) exerciseDoc.est1rm = bestEst1RM;

      batch.set(exRef, exerciseDoc, { merge: true });

      if (completedSetCount > 0) {
        instanceInputs.push({
          sessionId,
          exerciseId: ex.exerciseId,
          exerciseInSessionId,
          date: startDate,
          volume,
          topWeight,
          bestEst1RM,
          completedSetCount,
          completedRepCount,
        });
      }
    });

    const sessionDoc: any = {
      startAt: startDate,
      endAt: new Date(endMs),
      durationMin,
      dayKey,
      totalCompletedSets,
      exerciseCounts,
    };

    batch.set(sessionRef, sessionDoc, { merge: true });
    await batch.commit();

    return { sessionId, date: startDate, instances: instanceInputs };
  };

  const writeExerciseInstances = async (uid: string, instances: ExerciseInstanceInput[]) => {
    if (!instances.length) return;
    const batch = writeBatch(FIREBASE_DB);
    instances.forEach(inst => {
      const instanceId = `${inst.sessionId}-${inst.exerciseInSessionId}`;
      const ref = doc(
        FIREBASE_DB,
        `users/${uid}/exercises/${inst.exerciseId}/instances/${instanceId}`
      );
      batch.set(ref, {
        sessionId: inst.sessionId,
        exerciseInSessionId: inst.exerciseInSessionId,
        date: inst.date,
        volume: inst.volume,
        topWeight: inst.topWeight,
        bestEst1RM: inst.bestEst1RM,
        completedSetCount: inst.completedSetCount,
        completedRepCount: inst.completedRepCount,
      });
    });
    await batch.commit();
  };

  const writeExerciseMetricsForSession = async (uid: string, ws: WorkoutData, sessionId: string) => {
    const lastBatch = writeBatch(FIREBASE_DB);
    const allTimeBatch = writeBatch(FIREBASE_DB);

    const startDate = new Date(ws.startTimeISO);

    // Compute per-exercise metrics from this session (completed sets only)
    for (const ex of ws.exercises) {
      const completedSets = ex.setIds
        .map(id => ws.setsById[id])
        .filter(s => s && s.completed);

      let lastTopWeight = 0;
      let lastTopRepsAtTopWeight = 0;
      let lastVolume = 0;
      let lastBestEst1RM = 0;
      let totalSets = 0;
      let totalReps = 0;

      completedSets.forEach(s => {
        const w = (s.trackingData.weight ?? 0) as number;
        const r = (s.trackingData.reps ?? 0) as number;
        if (Number.isFinite(w) && Number.isFinite(r) && r > 0) {
          if (w >= lastTopWeight) {
            lastTopWeight = w;
            lastTopRepsAtTopWeight = Math.max(lastTopRepsAtTopWeight, r);
          }
          lastVolume += w * r;
          totalReps += r;
          totalSets += 1;
        }
        const est = estimate1RM(s.trackingData.weight ?? null, s.trackingData.reps ?? null);
        if (est && est > lastBestEst1RM) lastBestEst1RM = est;
      });

      // Write last session metrics
      const lastRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/lastSessionMetrics`);
      lastBatch.set(lastRef, {
        lastPerformedAt: startDate,
        lastSessionId: sessionId,
        lastTopWeight: lastTopWeight || undefined,
        lastTopRepsAtTopWeight: lastTopRepsAtTopWeight || undefined,
        lastVolume: lastVolume || undefined,
        lastBestEst1RM: lastBestEst1RM || undefined,
      }, { merge: true });

      // Read current all-time metrics, then update totals and PRs
      const allTimeRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/allTimeMetrics`);
      const snap = await getDoc(allTimeRef);
      const prev = (snap.exists() ? snap.data() : {}) as any;

      const nextTotals = {
        totalSets: (prev.totalSets ?? 0) + totalSets,
        totalReps: (prev.totalReps ?? 0) + totalReps,
        totalVolumeAllTime: (prev.totalVolumeAllTime ?? 0) + lastVolume,
      };

      // Update maxTopWeight and maxTopRepsAtTopWeight ONLY together when topWeight increases
      let maxTopWeight = prev.maxTopWeight ?? 0;
      let maxTopRepsAtTopWeight = prev.maxTopRepsAtTopWeight ?? 0;
      if (lastTopWeight > (prev.maxTopWeight ?? 0)) {
        maxTopWeight = lastTopWeight;
        maxTopRepsAtTopWeight = lastTopRepsAtTopWeight || 0;
      }

      const maxBestEst1RM = Math.max(prev.maxBestEst1RM ?? 0, lastBestEst1RM ?? 0);

      allTimeBatch.set(allTimeRef, {
        ...nextTotals,
        maxTopWeight: maxTopWeight || undefined,
        maxTopRepsAtTopWeight: maxTopRepsAtTopWeight || undefined,
        maxBestEst1RM: maxBestEst1RM || undefined,
      }, { merge: true });
    }

    await lastBatch.commit();
    await allTimeBatch.commit();
  };

  const endWorkoutWarnings = (): WarningItem[] => {
    const ws = state.workout;
    if (!state.isActive || !ws) return [];
    const uncompletedCount = Object.values(ws.setsById).filter(set => !set.completed).length;

    return uncompletedCount > 0
      ? [{ level: 'warn', message: `${uncompletedCount} uncompleted set(s) will be ignored`, ids: [] }]
      : [];
  };

  const endWorkout = async (): Promise<EndSummary> => {
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

    // ===== Firestore Write (sessions + subcollection exercises) =====
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) throw new Error('Not authenticated');
      const uid = user.uid;

      // 1) Write session + subdocs, collect instance aggregates
      const { sessionId, instances } = await writeSessionAndCollectInstances(
        uid,
        ws,
        start,
        end
      );

      // 2) Write exercise instances under users/{uid}/exercises/{exerciseId}/instances
      await writeExerciseInstances(uid, instances);

      await writeExerciseMetricsForSession(uid, ws, sessionId);
    } catch (err) {
      console.error('Failed to write session to Firestore:', err);
    }

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
