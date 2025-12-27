// app/services/workoutEditDatabase.ts
import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';

import { estimate1RM } from './workoutDatabase';
import { triggerExerciseRefetch } from '../context/ExerciseDBContext';

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
  order?: number;
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
  // weight×reps fields
  volume?: number;
  topWeight?: number;
  bestEst1RM?: number;
  completedRepCount?: number;
  topRepsAtTopWeight?: number;        // reps at the heaviest weight (for weight×reps)
  // weight×time fields
  topTimeAtTopWeight?: number;        // time at the heaviest weight (for weight×time)
  // reps-only fields
  topReps?: number;
  totalReps?: number;
  // time-only fields
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
  let topRepsAtTopWeight = 0;  // for weight×reps
  let topTimeAtTopWeight = 0;  // for weight×time
  let topReps = 0;             // for reps-only
  let totalReps = 0;           // for reps-only
  let topTime = 0;             // for time-only
  let totalTime = 0;           // for time-only

  // First pass: find topWeight (needed for weight×reps and weight×time)
  if (hasWeight) {
    sets.forEach((s) => {
      const w = (s.trackingData.weight ?? 0) as number;
      if (Number.isFinite(w)) topWeight = Math.max(topWeight, w);
    });
  }

  // Second pass: compute aggregates
  sets.forEach((s) => {
    const w = (s.trackingData.weight ?? 0) as number;
    const r = (s.trackingData.reps ?? 0) as number;
    const t = (s.trackingData.time ?? 0) as number;

    if (hasWeight && hasReps && Number.isFinite(w) && Number.isFinite(r) && r > 0) {
      // weight × reps
      volume += w * r;
      completedRepCount += r;
      if (w === topWeight) topRepsAtTopWeight = Math.max(topRepsAtTopWeight, r);
      const est = estimate1RM(w, r);
      if (est && est > bestEst1RM) bestEst1RM = est;
    } else if (hasWeight && hasTime && Number.isFinite(w) && Number.isFinite(t) && t > 0) {
      // weight × time
      if (w === topWeight) topTimeAtTopWeight = Math.max(topTimeAtTopWeight, t);
    } else if (!hasWeight && hasReps && Number.isFinite(r) && r > 0) {
      // reps only
      topReps = Math.max(topReps, r);
      completedRepCount += r;
      totalReps += r;
    } else if (!hasWeight && hasTime && Number.isFinite(t) && t > 0) {
      // time only
      topTime = Math.max(topTime, t);
      totalTime += t;
    }
  });

  return { volume, topWeight, bestEst1RM, completedRepCount, topRepsAtTopWeight, topTimeAtTopWeight, topReps, totalReps, topTime, totalTime };
};

const writeSessionAndExercises = async (
  uid: string,
  sessionId: string,
  ws: WorkoutData,
  endMs: number
): Promise<{
  date: Date;
  instances: ExerciseInstanceDoc[];
  changedExerciseIds: Set<string>;
  staleInstances: Array<{ exerciseId: string; exerciseInSessionId: string }>;
}> => {
  const sessionRef = doc(FIREBASE_DB, `users/${uid}/sessions/${sessionId}`);
  const exercisesRef = collection(sessionRef, 'exercises');
  const existingExerciseDocs = await getDocs(exercisesRef);

  const batch = writeBatch(FIREBASE_DB);

  const startDate = new Date(ws.startTimeISO);
  const dayKey = formatDayKey(startDate);
  const durationMin = Math.max(1, Math.round((endMs - startDate.getTime()) / 1000 / 60));

  const exerciseCounts: Array<{ exerciseId: string; name: string; category: string; completedSetCount: number; order: number }> = [];
  let totalCompletedSets = 0;
  const instances: ExerciseInstanceDoc[] = [];
  const changedExerciseIds = new Set<string>();
  const staleInstances: Array<{ exerciseId: string; exerciseInSessionId: string }> = [];

  const currentExerciseIds = new Set<string>();

  const orderedExercises = ws.exercises
    .map((ex, idx) => ({ ex, idx }))
    .sort((a, b) => {
      const ao = a.ex.order ?? a.idx + 1;
      const bo = b.ex.order ?? b.idx + 1;
      if (ao !== bo) return ao - bo;
      return a.idx - b.idx;
    })
    .map(({ ex }, idx) => ({ ...ex, order: idx + 1 }));

  orderedExercises.forEach((ex, orderIndex) => {
    const completedSets = normalizeCompletedSets(ex, ws.setsById);
    if (completedSets.length === 0) return;
    currentExerciseIds.add(ex.instanceId);

    const prevDoc = (existingExerciseDocs.docs.find((d) => d.id === ex.instanceId)?.data() as any) || null;
    const prevSets = (prevDoc?.sets ?? []).map((s: any) => ({
      id: s.id,
      order: s.order,
      trackingData: {
        weight: s.trackingData?.weight ?? null,
        reps: s.trackingData?.reps ?? null,
        time: s.trackingData?.time ?? null,
      },
    }));
    const nextSets = completedSets.map((s) => ({
      id: s.id,
      order: s.order,
      trackingData: {
        weight: s.trackingData.weight ?? null,
        reps: s.trackingData.reps ?? null,
        time: s.trackingData.time ?? null,
      },
    }));
    const setsChanged =
      prevDoc?.exerciseId !== ex.exerciseId ||
      prevSets.length !== nextSets.length ||
      prevSets.some(
        (s: any, idx: number) =>
          s.id !== nextSets[idx].id ||
          s.order !== nextSets[idx].order ||
          s.trackingData.weight !== nextSets[idx].trackingData.weight ||
          s.trackingData.reps !== nextSets[idx].trackingData.reps ||
          s.trackingData.time !== nextSets[idx].trackingData.time
      );

    const aggregates = computeExerciseAggregates(completedSets, ex.trackingMethods);

    totalCompletedSets += completedSets.length;
    exerciseCounts.push({
      exerciseId: ex.exerciseId,
      name: ex.name,
      category: ex.category,
      completedSetCount: completedSets.length,
      order: ex.order ?? orderIndex + 1,
    });

    const exRef = doc(exercisesRef, ex.instanceId);
    const exerciseDoc: any = {
      exerciseId: ex.exerciseId,
      order: ex.order ?? orderIndex + 1,
      sets: completedSets.map((s) => ({
        id: s.id,
        order: s.order,
        trackingData: s.trackingData,
      })),
    };
    if (aggregates.bestEst1RM > 0) exerciseDoc.est1rm = aggregates.bestEst1RM;

    if (setsChanged || !prevDoc) {
      // Overwrite stale exercise doc entirely
      batch.set(exRef, exerciseDoc, { merge: false });
      changedExerciseIds.add(ex.exerciseId);

      const hasWeight = ex.trackingMethods.includes('weight');
      const hasReps = ex.trackingMethods.includes('reps');
      const hasTime = ex.trackingMethods.includes('time');

      const instanceDoc: ExerciseInstanceDoc = {
        sessionId,
        exerciseInSessionId: ex.instanceId,
        exerciseId: ex.exerciseId,
        date: startDate,
        completedSetCount: completedSets.length,
        // weight×reps fields
        volume: hasWeight && hasReps ? (aggregates.volume || undefined) : undefined,
        topWeight: hasWeight ? (aggregates.topWeight || undefined) : undefined,
        bestEst1RM: hasWeight && hasReps ? (aggregates.bestEst1RM || undefined) : undefined,
        topRepsAtTopWeight: hasWeight && hasReps ? (aggregates.topRepsAtTopWeight || undefined) : undefined,
        // weight×time fields
        topTimeAtTopWeight: hasWeight && hasTime ? (aggregates.topTimeAtTopWeight || undefined) : undefined,
        // reps fields (both weight×reps and reps-only)
        completedRepCount: hasReps ? (aggregates.completedRepCount || undefined) : undefined,
        // reps-only fields
        topReps: !hasWeight && hasReps ? (aggregates.topReps || undefined) : undefined,
        totalReps: !hasWeight && hasReps ? (aggregates.totalReps || undefined) : undefined,
        // time-only fields
        topTime: !hasWeight && hasTime ? (aggregates.topTime || undefined) : undefined,
        totalTime: !hasWeight && hasTime ? (aggregates.totalTime || undefined) : undefined,
      } as ExerciseInstanceDoc & { exerciseId: string };
      instances.push(instanceDoc);
    } else {
      // Sets unchanged: keep session exercise doc in sync (ordering)
      batch.set(exRef, exerciseDoc, { merge: true });
    }
  });

  // Remove stale exercise docs (present before, absent or now with zero completed sets)
  existingExerciseDocs.forEach((snap) => {
    if (currentExerciseIds.has(snap.id)) return;
    const data = snap.data() as any;
    if (data?.exerciseId) changedExerciseIds.add(data.exerciseId);
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

  return { date: startDate, instances, changedExerciseIds, staleInstances };
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
    // weight×reps fields
    if (inst.volume) payload.volume = inst.volume;
    if (inst.topWeight) payload.topWeight = inst.topWeight;
    if (inst.bestEst1RM) payload.bestEst1RM = inst.bestEst1RM;
    if (inst.completedRepCount) payload.completedRepCount = inst.completedRepCount;
    if (inst.topRepsAtTopWeight) payload.topRepsAtTopWeight = inst.topRepsAtTopWeight;
    // weight×time fields
    if (inst.topTimeAtTopWeight) payload.topTimeAtTopWeight = inst.topTimeAtTopWeight;
    // reps-only fields
    if (inst.topReps) payload.topReps = inst.topReps;
    if (inst.totalReps) payload.totalReps = inst.totalReps;
    // time-only fields
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
  const hasWeight = inst.topWeight !== undefined || inst.bestEst1RM !== undefined || inst.volume !== undefined || inst.topRepsAtTopWeight !== undefined || inst.topTimeAtTopWeight !== undefined;
  const hasReps = inst.topReps !== undefined || inst.totalReps !== undefined || inst.completedRepCount !== undefined || inst.topRepsAtTopWeight !== undefined;
  const hasTime = inst.topTime !== undefined || inst.totalTime !== undefined || inst.topTimeAtTopWeight !== undefined;
  const methods: TrackingMethod[] = [];
  if (hasWeight) methods.push('weight');
  if (hasReps) methods.push('reps');
  if (hasTime) methods.push('time');
  return methods;
};

const recomputeMetricsForExercise = async (
  uid: string,
  exerciseId: string,
  trackingFromState: TrackingMethod[] | undefined,
  currentSessionId?: string,
  currentSessionStartDate?: Date,
  currentSessionEndDate?: Date
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

    const hasWeight = tracking.includes('weight');
    const hasReps = tracking.includes('reps');
    const hasTime = tracking.includes('time');

    if (hasWeight && hasReps) {
      // weight x reps
      agg.maxTopWeight = Math.max(agg.maxTopWeight, data.topWeight || 0);
      agg.maxBestEst1RM = Math.max(agg.maxBestEst1RM, data.bestEst1RM || 0);
      agg.maxTopRepsAtTopWeight = Math.max(agg.maxTopRepsAtTopWeight, data.topRepsAtTopWeight || 0);
      agg.totalVolumeAllTime += data.volume || 0;
      agg.totalReps += data.completedRepCount || 0;
    } else if (hasWeight && hasTime) {
      // weight x time
      agg.maxTopWeight = Math.max(agg.maxTopWeight, data.topWeight || 0);
      agg.maxTopTimeAtTopWeight = Math.max(agg.maxTopTimeAtTopWeight, data.topTimeAtTopWeight || 0);
    } else if (hasReps) {
      // reps only
      agg.totalReps += data.totalReps || data.completedRepCount || 0;
      agg.maxTopReps = Math.max(agg.maxTopReps, data.topReps || 0);
      agg.maxTotalReps = Math.max(agg.maxTotalReps, data.totalReps || data.completedRepCount || 0);
    } else if (hasTime) {
      // time only
      agg.totalTime += data.totalTime || 0;
      agg.maxTopTime = Math.max(agg.maxTopTime, data.topTime || 0);
      agg.maxTotalTime = Math.max(agg.maxTotalTime, data.totalTime || 0);
    }

    if (date.getTime() > lastSessionDate) {
      lastSessionDate = date.getTime();
      lastSessionId = data.sessionId;

      if (hasWeight && hasReps) {
        // weight x reps
        agg.lastTopWeight = data.topWeight || 0;
        agg.lastBestEst1RM = data.bestEst1RM || 0;
        agg.lastVolume = data.volume || 0;
        agg.lastTopRepsAtTopWeight = data.topRepsAtTopWeight || 0;
      } else if (hasWeight && hasTime) {
        // weight x time
        agg.lastTopWeight = data.topWeight || 0;
        agg.lastTopTimeAtTopWeight = data.topTimeAtTopWeight || 0;
      } else if (hasReps) {
        // reps only
        agg.lastTopReps = data.topReps || 0;
        agg.lastTotalReps = data.totalReps || data.completedRepCount || 0;
      } else if (hasTime) {
        // time only
        agg.lastTopTime = data.topTime || 0;
        agg.lastTotalTime = data.totalTime || 0;
      }
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
  // Use currentSessionEndDate if the most recent session is the one being edited
  if (agg.totalSets > 0 && lastSessionId) {
    let lastPerformedDate: Date | null = null;
    
    // If the most recent session is the one being edited, use the provided endDate
    if (currentSessionId && currentSessionStartDate && currentSessionEndDate && 
        lastSessionId === currentSessionId && 
        Math.abs(lastSessionDate - currentSessionStartDate.getTime()) < 60000) { // Within 1 minute tolerance
      lastPerformedDate = currentSessionEndDate;
    } else if (lastSessionDate) {
      // Fall back to startDate if not the edited session
      lastPerformedDate = new Date(lastSessionDate);
    }
    
    if (lastPerformedDate) {
      const exerciseRef = doc(FIREBASE_DB, `users/${uid}/exercises/${exerciseId}`);
      batch.set(exerciseRef, { lastPerformedAt: lastPerformedDate }, { merge: true });
    }
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

  // Write session & exercises, collect instance payloads and changed exercises
  const { date, instances, changedExerciseIds, staleInstances } = await writeSessionAndExercises(
    uid,
    sessionId,
    ws,
    endMs
  );
  await writeExerciseInstances(uid, sessionId, instances, staleInstances);

  // Recompute metrics for changed exercises
  const stateTracking = new Map(ws.exercises.map((ex) => [ex.exerciseId, ex.trackingMethods]));
  const startDate = new Date(ws.startTimeISO);
  const endDate = new Date(endMs);
  for (const exerciseId of changedExerciseIds) {
    await recomputeMetricsForExercise(uid, exerciseId, stateTracking.get(exerciseId), sessionId, startDate, endDate);
  }

  await triggerExerciseRefetch();

  return { date };
};

export default writeEditedSession;