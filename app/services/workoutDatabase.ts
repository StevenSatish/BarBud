// app/services/workoutDatabase.ts
import { collection, doc, writeBatch, getDoc, WriteBatch } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';
import * as Crypto from 'expo-crypto';

// Types
export type ExerciseInstanceInput = {
  sessionId: string;
  exerciseId: string;
  exerciseInSessionId: string;
  date: Date;
  completedSetCount: number;
  // Fields that depend on tracking methods
  volume?: number;
  topWeight?: number;
  bestEst1RM?: number;
  completedRepCount?: number;
  topReps?: number;
  totalReps?: number;
  topTime?: number;
  totalTime?: number;
};

export type WorkoutData = {
  startTimeISO: string;  // ISO start time
  exercises: any[];
  setsById: Record<string, any>;
};

export type SetEntity = {
  id: string;
  order: number;
  completed: boolean;
  trackingData: Partial<Record<string, number | null>>;
  timestamp: string;
};

export type ExerciseEntity = {
  instanceId: string;
  exerciseId: string;
  name: string;
  category: string;
  muscleGroup: string;
  secondaryMuscles?: string[];
  trackingMethods: string[];
  setIds: string[];
  previousSets?: any[];
};

// Helper functions (exact same as in WorkoutContext)
export const estimate1RM = (weight?: number | null, reps?: number | null): number | undefined => {
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

// Database writing functions (exact same as in WorkoutContext)
export const writeSessionAndCollectInstances = async (
  uid: string,
  ws: WorkoutData,
  startMs: number,
  endMs: number
): Promise<{ sessionId: string; date: Date; instances: ExerciseInstanceInput[] }> => {
  // Check if there are any completed sets across all exercises
  const hasAnyCompletedSets = ws.exercises.some((ex: ExerciseEntity) => 
    ex.setIds.some((id: string) => {
      const set = ws.setsById[id];
      return set && set.completed;
    })
  );

  // If no completed sets, return empty result without writing anything
  if (!hasAnyCompletedSets) {
    console.log('No completed sets found, skipping session write');
    return { sessionId: '', date: new Date(), instances: [] };
  }

  const sessionId = Crypto.randomUUID();
  const sessionRef = doc(FIREBASE_DB, `users/${uid}/sessions/${sessionId}`);
  const batch = writeBatch(FIREBASE_DB);

  const startDate = new Date(ws.startTimeISO);
  const dayKey = formatDayKey(startDate);
  const durationMin = Math.max(1, Math.round((endMs - startMs) / 1000 / 60));
  const exerciseCounts: { exerciseId: string; nameSnap: string; completedSetCount: number }[] = [];
  let totalCompletedSets = 0;
  const instanceInputs: ExerciseInstanceInput[] = [];

  ws.exercises.forEach((ex: ExerciseEntity, orderIndex: number) => {
    const exerciseInSessionId = Crypto.randomUUID();
    const exRef = doc(collection(sessionRef, 'exercises'), exerciseInSessionId);

    const rawSets = ex.setIds.map((setId: string) => ws.setsById[setId]).filter(Boolean);
    const completed = rawSets.filter((s: SetEntity) => s.completed);
    const sets = completed.map((s: SetEntity, idx: number) => {
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
    completed.forEach((s: SetEntity) => {
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
      // Create instance data based on tracking methods
      const instanceData: ExerciseInstanceInput = {
        sessionId,
        exerciseId: ex.exerciseId,
        exerciseInSessionId,
        date: startDate,
        completedSetCount,
      };

      // Determine which fields to include based on tracking methods
      const hasWeight = ex.trackingMethods.includes('weight');
      const hasReps = ex.trackingMethods.includes('reps');
      const hasTime = ex.trackingMethods.includes('time');

      if (hasWeight && hasReps) {
        // (weight, reps) combination
        instanceData.volume = volume;
        instanceData.topWeight = topWeight;
        instanceData.bestEst1RM = bestEst1RM;
        instanceData.completedRepCount = completedRepCount;
      } else if (hasWeight && hasTime) {
        // (weight, time) combination
        instanceData.topWeight = topWeight;
        // Note: No volume calculation for weight x time
      } else if (hasReps) {
        // (reps) only
        instanceData.topReps = Math.max(...completed.map(s => s.trackingData.reps ?? 0));
        instanceData.totalReps = completedRepCount;
        instanceData.completedRepCount = completedRepCount;
      } else if (hasTime) {
        // (time) only
        instanceData.topTime = Math.max(...completed.map(s => s.trackingData.time ?? 0));
        instanceData.totalTime = completed.reduce((sum, s) => sum + (s.trackingData.time ?? 0), 0);
      }

      instanceInputs.push(instanceData);
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

export const writeExerciseInstances = async (uid: string, instances: ExerciseInstanceInput[]) => {
  if (!instances.length) return;
  const batch = writeBatch(FIREBASE_DB);
  instances.forEach(inst => {
    const instanceId = `${inst.sessionId}-${inst.exerciseInSessionId}`;
    const ref = doc(
      FIREBASE_DB,
      `users/${uid}/exercises/${inst.exerciseId}/instances/${instanceId}`
    );
    
    // Create instance document with only the fields that are present
    const instanceDoc: any = {
      sessionId: inst.sessionId,
      exerciseInSessionId: inst.exerciseInSessionId,
      date: inst.date,
      completedSetCount: inst.completedSetCount,
    };

    // Add optional fields only if they exist
    if (inst.volume !== undefined) instanceDoc.volume = inst.volume;
    if (inst.topWeight !== undefined) instanceDoc.topWeight = inst.topWeight;
    if (inst.bestEst1RM !== undefined) instanceDoc.bestEst1RM = inst.bestEst1RM;
    if (inst.completedRepCount !== undefined) instanceDoc.completedRepCount = inst.completedRepCount;
    if (inst.topReps !== undefined) instanceDoc.topReps = inst.topReps;
    if (inst.totalReps !== undefined) instanceDoc.totalReps = inst.totalReps;
    if (inst.topTime !== undefined) instanceDoc.topTime = inst.topTime;
    if (inst.totalTime !== undefined) instanceDoc.totalTime = inst.totalTime;

    batch.set(ref, instanceDoc);
  });
  await batch.commit();
};

// New metrics writers split by tracking method
export default async function writeExerciseMetricsWeightReps(
  uid: string,
  ex: ExerciseEntity,
  completedSets: SetEntity[],
  sessionId: string,
  lastBatch: WriteBatch,
  allTimeBatch: WriteBatch
): Promise<void> {
  // last-session metrics
  let lastTopWeight = 0;
  let lastTopRepsAtTopWeight = 0;
  let lastVolume = 0;
  let lastBestEst1RM = 0;
  let totalSets = 0;
  let totalReps = 0;

  completedSets.forEach((s: SetEntity) => {
    const w = (s.trackingData.weight ?? 0) as number;
    const r = (s.trackingData.reps ?? 0) as number;
    totalSets += 1;
    if (Number.isFinite(w) && Number.isFinite(r) && r > 0) {
      if (w > lastTopWeight) {
        lastTopWeight = w;
        lastTopRepsAtTopWeight = r;
      } else if (w === lastTopWeight) {
        lastTopRepsAtTopWeight = Math.max(lastTopRepsAtTopWeight, r);
      }
      lastVolume += w * r;
      totalReps += r;
    }
    const est = estimate1RM(s.trackingData.weight ?? null, s.trackingData.reps ?? null);
    if (est && est > lastBestEst1RM) lastBestEst1RM = est;
  });

  // last session metrics
  const lastRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/lastSessionMetrics`);
  const lastSessionData: any = { lastSessionId: sessionId };
  if (lastTopWeight > 0) lastSessionData.lastTopWeight = lastTopWeight;
  if (lastTopRepsAtTopWeight > 0) lastSessionData.lastTopRepsAtTopWeight = lastTopRepsAtTopWeight;
  if (lastVolume > 0) lastSessionData.lastVolume = lastVolume;
  if (lastBestEst1RM > 0) lastSessionData.lastBestEst1RM = lastBestEst1RM;
  lastBatch.set(lastRef, lastSessionData, { merge: true });

  // all-time metrics
  const allTimeRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/allTimeMetrics`);
  const snap = await getDoc(allTimeRef);
  const prev = (snap.exists() ? snap.data() : {}) as any;

  const allTimeData: any = {};
  allTimeData.totalSets = (prev.totalSets ?? 0) + totalSets;
  allTimeData.totalReps = (prev.totalReps ?? 0) + totalReps;
  if (lastVolume > 0) allTimeData.totalVolumeAllTime = (prev.totalVolumeAllTime ?? 0) + lastVolume;

  let maxTopWeight = prev.maxTopWeight ?? 0;
  let maxTopRepsAtTopWeight = prev.maxTopRepsAtTopWeight ?? 0;
  if (lastTopWeight > (prev.maxTopWeight ?? 0)) {
    maxTopWeight = lastTopWeight;
    maxTopRepsAtTopWeight = lastTopRepsAtTopWeight || 0;
  }
  if (maxTopWeight > 0) allTimeData.maxTopWeight = maxTopWeight;
  if (maxTopRepsAtTopWeight > 0) allTimeData.maxTopRepsAtTopWeight = maxTopRepsAtTopWeight;

  const maxBestEst1RM = Math.max(prev.maxBestEst1RM ?? 0, lastBestEst1RM ?? 0);
  if (maxBestEst1RM > 0) allTimeData.maxBestEst1RM = maxBestEst1RM;

  allTimeBatch.set(allTimeRef, allTimeData, { merge: true });
}

export async function writeExerciseMetricsWeightTime(
  uid: string,
  ex: ExerciseEntity,
  completedSets: SetEntity[],
  sessionId: string,
  lastBatch: WriteBatch,
  allTimeBatch: WriteBatch
): Promise<void> {
  let totalSets = 0;
  let lastTopWeight = 0;
  let lastTopTimeAtTopWeight = 0;
  let totalTime = 0;

  // Determine top weight (by time presence) and best time at that weight
  completedSets.forEach((s: SetEntity) => {
    const w = (s.trackingData.weight ?? 0) as number;
    const t = (s.trackingData.time ?? 0) as number;
    totalSets += 1;
    if (!Number.isFinite(w) || !Number.isFinite(t) || t <= 0) return;
    if (w > lastTopWeight) {
      lastTopWeight = w;
      lastTopTimeAtTopWeight = t;
    } else if (w === lastTopWeight) {
      lastTopTimeAtTopWeight = Math.max(lastTopTimeAtTopWeight, t);
    }
    totalTime += t;
  });

  const lastRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/lastSessionMetrics`);
  const lastSessionData: any = { lastSessionId: sessionId };
  if (lastTopWeight > 0) lastSessionData.lastTopWeight = lastTopWeight;
  if (lastTopTimeAtTopWeight > 0) lastSessionData.lastTopTimeAtTopWeight = lastTopTimeAtTopWeight;
  lastBatch.set(lastRef, lastSessionData, { merge: true });

  const allTimeRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/allTimeMetrics`);
  const snap = await getDoc(allTimeRef);
  const prev = (snap.exists() ? snap.data() : {}) as any;

  const allTimeData: any = {};
  allTimeData.totalSets = (prev.totalSets ?? 0) + totalSets;
  if (totalTime > 0) allTimeData.totalTime = (prev.totalTime ?? 0) + totalTime;

  let maxTopWeight = prev.maxTopWeight ?? 0;
  let maxTopTimeAtTopWeight = prev.maxTopTimeAtTopWeight ?? 0;
  if (lastTopWeight > (prev.maxTopWeight ?? 0)) {
    maxTopWeight = lastTopWeight;
    maxTopTimeAtTopWeight = lastTopTimeAtTopWeight || 0;
  }
  if (maxTopWeight > 0) allTimeData.maxTopWeight = maxTopWeight;
  if (maxTopTimeAtTopWeight > 0) allTimeData.maxTopTimeAtTopWeight = maxTopTimeAtTopWeight;

  allTimeBatch.set(allTimeRef, allTimeData, { merge: true });
}

export async function writeExerciceMetricsReps(
  uid: string,
  ex: ExerciseEntity,
  completedSets: SetEntity[],
  sessionId: string,
  lastBatch: WriteBatch,
  allTimeBatch: WriteBatch
): Promise<void> {
  let totalSets = 0;
  let lastTopReps = 0;
  let lastTotalReps = 0;

  completedSets.forEach((s: SetEntity) => {
    const r = (s.trackingData.reps ?? 0) as number;
    totalSets += 1;
    if (!Number.isFinite(r) || r <= 0) return;
    lastTopReps = Math.max(lastTopReps, r);
    lastTotalReps += r;
  });

  const lastRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/lastSessionMetrics`);
  const lastSessionData: any = { lastSessionId: sessionId };
  if (lastTopReps > 0) lastSessionData.lastTopReps = lastTopReps;
  if (lastTotalReps > 0) lastSessionData.lastTotalReps = lastTotalReps;
  lastBatch.set(lastRef, lastSessionData, { merge: true });

  const allTimeRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/allTimeMetrics`);
  const snap = await getDoc(allTimeRef);
  const prev = (snap.exists() ? snap.data() : {}) as any;

  const allTimeData: any = {};
  allTimeData.totalSets = (prev.totalSets ?? 0) + totalSets;
  allTimeData.totalReps = (prev.totalReps ?? 0) + lastTotalReps;

  const maxTopReps = Math.max(prev.maxTopReps ?? 0, lastTopReps);
  if (maxTopReps > 0) allTimeData.maxTopReps = maxTopReps;

  const maxTotalReps = Math.max(prev.maxTotalReps ?? 0, lastTotalReps);
  if (maxTotalReps > 0) allTimeData.maxTotalReps = maxTotalReps;

  allTimeBatch.set(allTimeRef, allTimeData, { merge: true });
}

export async function writeExerciseMetricsTime(
  uid: string,
  ex: ExerciseEntity,
  completedSets: SetEntity[],
  sessionId: string,
  lastBatch: WriteBatch,
  allTimeBatch: WriteBatch
): Promise<void> {
  let totalSets = 0;
  let lastTopTime = 0;
  let totalTime = 0;

  completedSets.forEach((s: SetEntity) => {
    const t = (s.trackingData.time ?? 0) as number;
    totalSets += 1;
    if (!Number.isFinite(t) || t <= 0) return;
    lastTopTime = Math.max(lastTopTime, t);
    totalTime += t;
  });

  const lastRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/lastSessionMetrics`);
  const lastSessionData: any = { lastSessionId: sessionId };
  if (lastTopTime > 0) lastSessionData.lastTopTime = lastTopTime;
  if (totalTime > 0) lastSessionData.lastTotalTime = totalTime;
  lastBatch.set(lastRef, lastSessionData, { merge: true });

  const allTimeRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/allTimeMetrics`);
  const snap = await getDoc(allTimeRef);
  const prev = (snap.exists() ? snap.data() : {}) as any;

  const allTimeData: any = {};
  allTimeData.totalSets = (prev.totalSets ?? 0) + totalSets;
  if (totalTime > 0) allTimeData.totalTime = (prev.totalTime ?? 0) + totalTime;

  const maxTopTime = Math.max(prev.maxTopTime ?? 0, lastTopTime);
  if (maxTopTime > 0) allTimeData.maxTopTime = maxTopTime;

  const maxTotalTime = Math.max(prev.maxTotalTime ?? 0, totalTime);
  if (maxTotalTime > 0) allTimeData.maxTotalTime = maxTotalTime;

  allTimeBatch.set(allTimeRef, allTimeData, { merge: true });
}

export const writeExerciseMetricsForSession = async (uid: string, ws: WorkoutData, sessionId: string) => {
  // Check if there are any completed sets across all exercises
  const hasAnyCompletedSets = ws.exercises.some((ex: ExerciseEntity) => 
    ex.setIds.some((id: string) => {
      const set = ws.setsById[id];
      return set && set.completed;
    })
  );

  // If no completed sets, don't write anything
  if (!hasAnyCompletedSets) {
    return;
  }

  const lastBatch = writeBatch(FIREBASE_DB);
  const allTimeBatch = writeBatch(FIREBASE_DB);

  const startDate = new Date(ws.startTimeISO);

  // Compute per-exercise metrics from this session (completed sets only)
  for (const ex of ws.exercises) {
    const completedSets = ex.setIds
      .map((id: string) => ws.setsById[id])
      .filter((s: SetEntity) => s && s.completed);

    if (completedSets.length === 0) continue;

    // Update lastPerformedAt here for any exercise with completed sets
    const exerciseRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}`);
    lastBatch.set(exerciseRef, { lastPerformedAt: startDate }, { merge: true });

    const hasWeight = ex.trackingMethods.includes('weight');
    const hasReps = ex.trackingMethods.includes('reps');
    const hasTime = ex.trackingMethods.includes('time');

    if (hasWeight && hasReps) {
      await writeExerciseMetricsWeightReps(uid, ex, completedSets, sessionId, lastBatch, allTimeBatch);
    } else if (hasWeight && hasTime) {
      await writeExerciseMetricsWeightTime(uid, ex, completedSets, sessionId, lastBatch, allTimeBatch);
    } else if (hasReps) {
      await writeExerciceMetricsReps(uid, ex, completedSets, sessionId, lastBatch, allTimeBatch);
    } else if (hasTime) {
      await writeExerciseMetricsTime(uid, ex, completedSets, sessionId, lastBatch, allTimeBatch);
    }
  }

  await lastBatch.commit();
  await allTimeBatch.commit();
};
