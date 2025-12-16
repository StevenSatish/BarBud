// app/services/workoutEditDatabase.ts
import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';

import { estimate1RM } from './workoutDatabase';

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
  trackingMethods: TrackingMethod[];
  setIds: string[];
};

export type WorkoutData = {
  startTimeISO: string;
  durationMin?: number;
  exercises: ExerciseEntity[];
  setsById: Record<string, SetEntity>;
};

export type ExerciseInstanceDoc = {
  sessionId: string;
  exerciseId: string;
  exerciseInSessionId: string;
  date: Date;
  completedSetCount: number;
  volume?: number;
  topWeight?: number;
  bestEst1RM?: number;
  completedRepCount?: number;
  topReps?: number;
  totalReps?: number;
  topTime?: number;
  totalTime?: number;
};

const formatDayKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const buildInstanceId = (sessionId: string, exerciseInstanceId: string) =>
  `${sessionId}-${exerciseInstanceId}`;

const isCompleted = (set?: SetEntity) => Boolean(set && set.completed);

const normalizeCompletedSets = (ex: ExerciseEntity, setsById: WorkoutData['setsById']) => {
  const raw = ex.setIds.map((id) => setsById[id]).filter(isCompleted) as SetEntity[];
  return raw
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s, idx) => ({
      id: s.id,
      order: idx + 1,
      trackingData: {
        weight: (s.trackingData.weight ?? null) as number | null,
        reps: (s.trackingData.reps ?? null) as number | null,
        time: (s.trackingData.time ?? null) as number | null,
      },
      completed: true,
    }));
};

const computeExerciseAggregates = (sets: ReturnType<typeof normalizeCompletedSets>, tracking: TrackingMethod[]) => {
  const hasWeight = tracking.includes('weight');
  const hasReps = tracking.includes('reps');
  const hasTime = tracking.includes('time');

  let volume = 0;
  let topWeight = 0;
  let bestEst1RM = 0;
  let completedRepCount = 0;
  let topReps = 0;
  let totalReps = 0;
  let topTime = 0;
  let totalTime = 0;

  sets.forEach((s) => {
    const w = (s.trackingData.weight ?? 0) as number;
    const r = (s.trackingData.reps ?? 0) as number;
    const t = (s.trackingData.time ?? 0) as number;
    if (hasWeight) topWeight = Math.max(topWeight, w);
    if (hasWeight && hasReps && Number.isFinite(w) && Number.isFinite(r) && r > 0) {
      volume += w * r;
      completedRepCount += r;
      if (w === topWeight) topReps = Math.max(topReps, r);
      const est = estimate1RM(w, r);
      if (est && est > bestEst1RM) bestEst1RM = est;
    }
    if (hasWeight && hasTime && Number.isFinite(w) && Number.isFinite(t) && t > 0) {
      topTime = w === topWeight ? Math.max(topTime, t) : topTime;
      totalTime += t;
    }
    if (!hasWeight && hasReps && Number.isFinite(r) && r > 0) {
      topReps = Math.max(topReps, r);
      totalReps += r;
    }
    if (!hasWeight && hasTime && Number.isFinite(t) && t > 0) {
      topTime = Math.max(topTime, t);
      totalTime += t;
    }
  });

  return { volume, topWeight, bestEst1RM, completedRepCount, topReps, totalReps, topTime, totalTime };
};

const writeSessionAndExercises = async (
  uid: string,
  sessionId: string,
  ws: WorkoutData,
  endMs: number
): Promise<{
  date: Date;
  instances: ExerciseInstanceDoc[];
  touchedExerciseIds: Set<string>;
  staleInstances: Array<{ exerciseId: string; exerciseInSessionId: string }>;
}> => {
  const sessionRef = doc(FIREBASE_DB, `users/${uid}/sessions/${sessionId}`);
  const exercisesRef = collection(sessionRef, 'exercises');
  const existingExerciseDocs = await getDocs(exercisesRef);

  const batch = writeBatch(FIREBASE_DB);

  const startDate = new Date(ws.startTimeISO);
  const dayKey = formatDayKey(startDate);
  const durationMin = Math.max(1, Math.round((endMs - startDate.getTime()) / 1000 / 60));

  const exerciseCounts: Array<{ exerciseId: string; name: string; category: string; completedSetCount: number }> = [];
  let totalCompletedSets = 0;
  const instances: ExerciseInstanceDoc[] = [];
  const touchedExerciseIds = new Set<string>();
  const staleInstances: Array<{ exerciseId: string; exerciseInSessionId: string }> = [];

  const currentExerciseIds = new Set<string>();

  ws.exercises.forEach((ex, orderIndex) => {
    touchedExerciseIds.add(ex.exerciseId);

    const completedSets = normalizeCompletedSets(ex, ws.setsById);
    if (completedSets.length === 0) return;
    currentExerciseIds.add(ex.instanceId);

    const aggregates = computeExerciseAggregates(completedSets, ex.trackingMethods);

    totalCompletedSets += completedSets.length;
    exerciseCounts.push({
      exerciseId: ex.exerciseId,
      name: ex.name,
      category: ex.category,
      completedSetCount: completedSets.length,
    });

    const exRef = doc(exercisesRef, ex.instanceId);
    const exerciseDoc: any = {
      exerciseId: ex.exerciseId,
      order: orderIndex + 1,
      sets: completedSets.map((s) => ({
        id: s.id,
        order: s.order,
        trackingData: s.trackingData,
      })),
    };
    if (aggregates.bestEst1RM > 0) exerciseDoc.est1rm = aggregates.bestEst1RM;
    batch.set(exRef, exerciseDoc, { merge: true });

    const instanceDoc: ExerciseInstanceDoc = {
      sessionId,
      exerciseInSessionId: ex.instanceId,
      exerciseId: ex.exerciseId,
      date: startDate,
      completedSetCount: completedSets.length,
      volume: aggregates.volume || undefined,
      topWeight: aggregates.topWeight || undefined,
      bestEst1RM: aggregates.bestEst1RM || undefined,
      completedRepCount: aggregates.completedRepCount || undefined,
      topReps: aggregates.topReps || undefined,
      totalReps: aggregates.totalReps || undefined,
      topTime: aggregates.topTime || undefined,
      totalTime: aggregates.totalTime || undefined,
    } as ExerciseInstanceDoc & { exerciseId: string };
    instances.push(instanceDoc);
  });

  // Remove stale exercise docs (present before, absent or now with zero completed sets)
  existingExerciseDocs.forEach((snap) => {
    if (currentExerciseIds.has(snap.id)) return;
    const data = snap.data() as any;
    if (data?.exerciseId) touchedExerciseIds.add(data.exerciseId);
    if (data?.exerciseId) staleInstances.push({ exerciseId: data.exerciseId, exerciseInSessionId: snap.id });
    batch.delete(snap.ref);
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

  return { date: startDate, instances, touchedExerciseIds, staleInstances };
};

const writeExerciseInstances = async (
  uid: string,
  sessionId: string,
  instances: ExerciseInstanceDoc[],
  staleInstanceRefs: Array<{ exerciseId: string; exerciseInSessionId: string }>
) => {
  const batch = writeBatch(FIREBASE_DB);

  instances.forEach((inst) => {
    const instanceId = buildInstanceId(sessionId, inst.exerciseInSessionId);
    const ref = doc(FIREBASE_DB, `users/${uid}/exercises/${inst.exerciseId}/instances/${instanceId}`);
    const payload: any = {
      sessionId,
      exerciseInSessionId: inst.exerciseInSessionId,
      date: inst.date,
      completedSetCount: inst.completedSetCount,
    };
    if (inst.volume) payload.volume = inst.volume;
    if (inst.topWeight) payload.topWeight = inst.topWeight;
    if (inst.bestEst1RM) payload.bestEst1RM = inst.bestEst1RM;
    if (inst.completedRepCount) payload.completedRepCount = inst.completedRepCount;
    if (inst.topReps) payload.topReps = inst.topReps;
    if (inst.totalReps) payload.totalReps = inst.totalReps;
    if (inst.topTime) payload.topTime = inst.topTime;
    if (inst.totalTime) payload.totalTime = inst.totalTime;
    batch.set(ref, payload);
  });

  staleInstanceRefs.forEach(({ exerciseId, exerciseInSessionId }) => {
    const ref = doc(
      FIREBASE_DB,
      `users/${uid}/exercises/${exerciseId}/instances/${buildInstanceId(sessionId, exerciseInSessionId)}`
    );
    batch.delete(ref);
  });

  await batch.commit();
};

type MetricAgg = {
  totalSets: number;
  totalReps: number;
  totalVolumeAllTime: number;
  totalTime: number;
  maxTopWeight: number;
  maxTopRepsAtTopWeight: number;
  maxBestEst1RM: number;
  maxTopTimeAtTopWeight: number;
  maxTopReps: number;
  maxTotalReps: number;
  maxTopTime: number;
  maxTotalTime: number;
  lastSessionId?: string;
  lastTopWeight?: number;
  lastTopRepsAtTopWeight?: number;
  lastVolume?: number;
  lastBestEst1RM?: number;
  lastTopTimeAtTopWeight?: number;
  lastTopReps?: number;
  lastTotalReps?: number;
  lastTopTime?: number;
  lastTotalTime?: number;
};

const emptyMetricAgg = (): MetricAgg => ({
  totalSets: 0,
  totalReps: 0,
  totalVolumeAllTime: 0,
  totalTime: 0,
  maxTopWeight: 0,
  maxTopRepsAtTopWeight: 0,
  maxBestEst1RM: 0,
  maxTopTimeAtTopWeight: 0,
  maxTopReps: 0,
  maxTotalReps: 0,
  maxTopTime: 0,
  maxTotalTime: 0,
});

const deriveTrackingFromInstance = (inst: ExerciseInstanceDoc, fallback: TrackingMethod[]): TrackingMethod[] => {
  if (fallback?.length) return fallback;
  const hasWeight = inst.topWeight !== undefined || inst.bestEst1RM !== undefined || inst.volume !== undefined;
  const hasReps = inst.topReps !== undefined || inst.totalReps !== undefined || inst.completedRepCount !== undefined;
  const hasTime = inst.topTime !== undefined || inst.totalTime !== undefined;
  const methods: TrackingMethod[] = [];
  if (hasWeight) methods.push('weight');
  if (hasReps) methods.push('reps');
  if (hasTime) methods.push('time');
  return methods;
};

const recomputeMetricsForExercise = async (
  uid: string,
  exerciseId: string,
  trackingFromState: TrackingMethod[] | undefined
) => {
  const instancesSnap = await getDocs(
    collection(FIREBASE_DB, `users/${uid}/exercises/${exerciseId}/instances`)
  );
  if (instancesSnap.empty) {
    // No instances: clear metrics
    const lastRef = doc(FIREBASE_DB, `users/${uid}/exercises/${exerciseId}/metrics/lastSessionMetrics`);
    const allTimeRef = doc(FIREBASE_DB, `users/${uid}/exercises/${exerciseId}/metrics/allTimeMetrics`);
    const batch = writeBatch(FIREBASE_DB);
    batch.set(lastRef, {}, { merge: true });
    batch.set(allTimeRef, {}, { merge: true });
    await batch.commit();
    return;
  }

  const agg = emptyMetricAgg();

  let lastSessionDate = 0;
  let lastSessionId: string | undefined;
  for (const snap of instancesSnap.docs) {
    const data = snap.data() as ExerciseInstanceDoc;
    const tracking = deriveTrackingFromInstance(data, trackingFromState ?? []);
    const date = (data.date instanceof Date ? data.date : new Date((data as any).date?.seconds * 1000 || data.date)) as Date;
    const completedSetCount = data.completedSetCount || 0;
    agg.totalSets += completedSetCount;

    if (tracking.includes('reps')) {
      agg.totalReps += data.totalReps || data.completedRepCount || 0;
      agg.maxTopReps = Math.max(agg.maxTopReps, data.topReps || 0);
      agg.maxTotalReps = Math.max(
        agg.maxTotalReps,
        data.totalReps || data.completedRepCount || 0
      );
    }
    if (tracking.includes('time') && !tracking.includes('weight')) {
      agg.totalTime += data.totalTime || 0;
      agg.maxTopTime = Math.max(agg.maxTopTime, data.topTime || 0);
      agg.maxTotalTime = Math.max(agg.maxTotalTime, data.totalTime || 0);
    }
    if (tracking.includes('weight')) {
      agg.maxTopWeight = Math.max(agg.maxTopWeight, data.topWeight || 0);
      agg.maxBestEst1RM = Math.max(agg.maxBestEst1RM, data.bestEst1RM || 0);
      if (tracking.includes('reps')) {
        agg.maxTopRepsAtTopWeight = Math.max(
          agg.maxTopRepsAtTopWeight,
          data.topReps || 0
        );
        agg.totalVolumeAllTime += data.volume || 0;
        agg.totalReps += data.totalReps || data.completedRepCount || 0;
      }
      if (tracking.includes('time')) {
        agg.maxTopTimeAtTopWeight = Math.max(
          agg.maxTopTimeAtTopWeight,
          data.topTime || 0
        );
        agg.totalTime += data.totalTime || 0;
      }
    }

    if (date.getTime() > lastSessionDate) {
      lastSessionDate = date.getTime();
      lastSessionId = data.sessionId;
      // store aggregates for last session after loop
      agg.lastTopWeight = data.topWeight || 0;
      agg.lastBestEst1RM = data.bestEst1RM || 0;
      agg.lastVolume = data.volume || 0;
      agg.lastTopRepsAtTopWeight = tracking.includes('reps') ? data.topReps || 0 : undefined;
      agg.lastTopTimeAtTopWeight = tracking.includes('time') ? data.topTime || 0 : undefined;
      agg.lastTopReps = !tracking.includes('weight') && tracking.includes('reps') ? data.topReps || 0 : undefined;
      agg.lastTotalReps =
        !tracking.includes('weight') && tracking.includes('reps')
          ? data.totalReps || data.completedRepCount || 0
          : undefined;
      agg.lastTopTime =
        !tracking.includes('weight') && tracking.includes('time') ? data.topTime || 0 : undefined;
      agg.lastTotalTime =
        !tracking.includes('weight') && tracking.includes('time') ? data.totalTime || 0 : undefined;
    }
  }

  agg.lastSessionId = lastSessionId;

  const lastRef = doc(FIREBASE_DB, `users/${uid}/exercises/${exerciseId}/metrics/lastSessionMetrics`);
  const allTimeRef = doc(FIREBASE_DB, `users/${uid}/exercises/${exerciseId}/metrics/allTimeMetrics`);
  const batch = writeBatch(FIREBASE_DB);

  const lastDoc: any = { lastSessionId };
  if (agg.lastTopWeight) lastDoc.lastTopWeight = agg.lastTopWeight;
  if (agg.lastTopRepsAtTopWeight) lastDoc.lastTopRepsAtTopWeight = agg.lastTopRepsAtTopWeight;
  if (agg.lastVolume) lastDoc.lastVolume = agg.lastVolume;
  if (agg.lastBestEst1RM) lastDoc.lastBestEst1RM = agg.lastBestEst1RM;
  if (agg.lastTopTimeAtTopWeight) lastDoc.lastTopTimeAtTopWeight = agg.lastTopTimeAtTopWeight;
  if (agg.lastTopReps) lastDoc.lastTopReps = agg.lastTopReps;
  if (agg.lastTotalReps) lastDoc.lastTotalReps = agg.lastTotalReps;
  if (agg.lastTopTime) lastDoc.lastTopTime = agg.lastTopTime;
  if (agg.lastTotalTime) lastDoc.lastTotalTime = agg.lastTotalTime;

  batch.set(lastRef, lastDoc, { merge: true });

  const allTimeDoc: any = {};
  if (agg.totalSets) allTimeDoc.totalSets = agg.totalSets;
  if (agg.totalReps) allTimeDoc.totalReps = agg.totalReps;
  if (agg.totalVolumeAllTime) allTimeDoc.totalVolumeAllTime = agg.totalVolumeAllTime;
  if (agg.totalTime) allTimeDoc.totalTime = agg.totalTime;
  if (agg.maxTopWeight) allTimeDoc.maxTopWeight = agg.maxTopWeight;
  if (agg.maxTopRepsAtTopWeight) allTimeDoc.maxTopRepsAtTopWeight = agg.maxTopRepsAtTopWeight;
  if (agg.maxBestEst1RM) allTimeDoc.maxBestEst1RM = agg.maxBestEst1RM;
  if (agg.maxTopTimeAtTopWeight) allTimeDoc.maxTopTimeAtTopWeight = agg.maxTopTimeAtTopWeight;
  if (agg.maxTopReps) allTimeDoc.maxTopReps = agg.maxTopReps;
  if (agg.maxTotalReps) allTimeDoc.maxTotalReps = agg.maxTotalReps;
  if (agg.maxTopTime) allTimeDoc.maxTopTime = agg.maxTopTime;
  if (agg.maxTotalTime) allTimeDoc.maxTotalTime = agg.maxTotalTime;

  batch.set(allTimeRef, allTimeDoc, { merge: true });

  // Update lastPerformedAt when there were completed sets
  if (agg.totalSets > 0 && lastSessionDate) {
    const exerciseRef = doc(FIREBASE_DB, `users/${uid}/exercises/${exerciseId}`);
    batch.set(exerciseRef, { lastPerformedAt: new Date(lastSessionDate) }, { merge: true });
  }

  await batch.commit();
};

export const writeEditedSession = async (
  uid: string,
  sessionId: string,
  ws: WorkoutData,
  endMs: number
) => {
  if (!ws?.exercises?.length || !ws.setsById) return;

  // Write session & exercises, collect instance payloads and touched exercises
  const { date, instances, touchedExerciseIds, staleInstances } = await writeSessionAndExercises(
    uid,
    sessionId,
    ws,
    endMs
  );
  await writeExerciseInstances(uid, sessionId, instances, staleInstances);

  // Recompute metrics for all touched exercises
  const stateTracking = new Map(ws.exercises.map((ex) => [ex.exerciseId, ex.trackingMethods]));
  for (const exerciseId of touchedExerciseIds) {
    await recomputeMetricsForExercise(uid, exerciseId, stateTracking.get(exerciseId));
  }

  return { date };
};

export default writeEditedSession;