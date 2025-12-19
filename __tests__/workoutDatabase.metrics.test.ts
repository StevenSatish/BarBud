import { writeExerciseMetricsForSession, WorkoutData } from '@/app/services/workoutDatabase';
import { resetMockFirestore, getStore } from './helpers/mockFirestore';
import { triggerExerciseRefetch } from '@/app/context/ExerciseDBContext';

describe('workoutDatabase metric writing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes metrics for weight x reps', async () => {
    resetMockFirestore({
      'users/uid-2/exercises/ex-wr/metrics/lastSessionMetrics': {
        lastSessionId: 'prev',
        lastTopWeight: 110,
        lastTopRepsAtTopWeight: 3,
        lastVolume: 400,
        lastBestEst1RM: 121,
      },
      'users/uid-2/exercises/ex-wr/metrics/allTimeMetrics': {
        totalSets: 5,
        totalReps: 20,
        totalVolumeAllTime: 1000,
        maxTopWeight: 115,
        maxTopRepsAtTopWeight: 2,
        maxBestEst1RM: 123,
      },
    });

    const workout: WorkoutData = {
      startTimeISO: new Date().toISOString(),
      exercises: [
        {
          exerciseId: 'ex-wr',
          name: 'Bench',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['a', 'b'],
        },
      ],
      setsById: {
        a: { id: 'a', trackingData: { weight: 100, reps: 5 }, completed: true },
        b: { id: 'b', trackingData: { weight: 120, reps: 3 }, completed: true },
      },
    };

    await writeExerciseMetricsForSession('uid-2', workout, 'session-wr');

    const store = getStore();
    const lastWR = store.get('users/uid-2/exercises/ex-wr/metrics/lastSessionMetrics');
    const allWR = store.get('users/uid-2/exercises/ex-wr/metrics/allTimeMetrics');
    expect(lastWR).toMatchObject({
      lastSessionId: 'session-wr',
      lastTopWeight: 120,
      lastTopRepsAtTopWeight: 3,
      lastVolume: 860,
      lastBestEst1RM: 132,
    });
    expect(allWR).toMatchObject({
      totalSets: 7, // 5 prev + 2 new
      totalReps: 28, // 20 prev + 8 new
      totalVolumeAllTime: 1860, // 1000 prev + 860 new
      maxTopWeight: 120,
      maxTopRepsAtTopWeight: 3,
      maxBestEst1RM: 132,
    });
    expect(triggerExerciseRefetch).toHaveBeenCalledTimes(1);
  });

  it('writes metrics for weight x reps: TEST 2', async () => {
    resetMockFirestore({
      'users/uid-2/exercises/ex-wr/metrics/lastSessionMetrics': {
        lastSessionId: 'prev',
        lastTopWeight: 145,
        lastTopRepsAtTopWeight: 6,
        lastVolume: 1595,
        lastBestEst1RM: 169,
      },
      'users/uid-2/exercises/ex-wr/metrics/allTimeMetrics': {
        totalSets: 72,
        totalReps: 899,
        totalVolumeAllTime: 60075,
        maxTopWeight: 145,
        maxTopRepsAtTopWeight: 5,
        maxBestEst1RM: 169,
      },
    });

    const workout: WorkoutData = {
      startTimeISO: new Date().toISOString(),
      exercises: [
        {
          exerciseId: 'ex-wr',
          name: 'Bench',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['a', 'b'],
        },
      ],
      setsById: {
        a: { id: 'a', trackingData: { weight: 145, reps: 6 }, completed: true },
        b: { id: 'b', trackingData: { weight: 145, reps: 5 }, completed: true },
      },
    };

    await writeExerciseMetricsForSession('uid-2', workout, 'session-wr');

    const store = getStore();
    const lastWR = store.get('users/uid-2/exercises/ex-wr/metrics/lastSessionMetrics');
    const allWR = store.get('users/uid-2/exercises/ex-wr/metrics/allTimeMetrics');
    expect(lastWR).toMatchObject({
      lastSessionId: 'session-wr',
      lastTopWeight: 145,
      lastTopRepsAtTopWeight: 6,
      lastVolume: 1595,
      lastBestEst1RM: 169,
    });
    expect(allWR).toMatchObject({
      totalSets: 74, // 72 prev + 2 new
      totalReps: 910, // 899 prev + 11 new
      totalVolumeAllTime: 61670, // 60075 prev + 1595 new
      maxTopWeight: 145,
      maxTopRepsAtTopWeight: 6,
      maxBestEst1RM: 169,
    });
    expect(triggerExerciseRefetch).toHaveBeenCalledTimes(1);
  });

  it('writes metrics for weight x time', async () => {
    resetMockFirestore({
      'users/uid-3/exercises/ex-wt/metrics/lastSessionMetrics': {
        lastSessionId: 'prev',
        lastTopWeight: 170,
        lastTopTimeAtTopWeight: 28,
      },
      'users/uid-3/exercises/ex-wt/metrics/allTimeMetrics': {
        totalSets: 3,
        totalTime: 120,
        maxTopWeight: 170,
        maxTopTimeAtTopWeight: 28,
      },
    });

    const workout: WorkoutData = {
      startTimeISO: new Date().toISOString(),
      exercises: [
        {
          exerciseId: 'ex-wt',
          name: 'Farmers',
          category: 'Carry',
          trackingMethods: ['weight', 'time'],
          setIds: ['a', 'b'],
        },
      ],
      setsById: {
        a: { id: 'a', trackingData: { weight: 180, time: 30 }, completed: true },
        b: { id: 'b', trackingData: { weight: 170, time: 25 }, completed: true },
      },
    };

    await writeExerciseMetricsForSession('uid-3', workout, 'session-wt');

    const store = getStore();
    const last = store.get('users/uid-3/exercises/ex-wt/metrics/lastSessionMetrics');
    const all = store.get('users/uid-3/exercises/ex-wt/metrics/allTimeMetrics');
    expect(last).toMatchObject({
      lastSessionId: 'session-wt',
      lastTopWeight: 180,
      lastTopTimeAtTopWeight: 30,
    });
    expect(all).toMatchObject({
      totalSets: 5, // 3 prev + 2 new
      maxTopWeight: 180,
      maxTopTimeAtTopWeight: 30,
      totalTime: 175, // 120 prev + 55 new
    });
  });

  it('writes metrics for reps-only', async () => {
    resetMockFirestore({
      'users/uid-4/exercises/ex-r/metrics/lastSessionMetrics': {
        lastSessionId: 'prev',
        lastTopReps: 12,
        lastTotalReps: 22,
      },
      'users/uid-4/exercises/ex-r/metrics/allTimeMetrics': {
        totalSets: 4,
        totalReps: 50,
        maxTopReps: 14,
        maxTotalReps: 50,
      },
    });

    const workout: WorkoutData = {
      startTimeISO: new Date().toISOString(),
      exercises: [
        {
          exerciseId: 'ex-r',
          name: 'Pull Ups',
          category: 'Bodyweight',
          trackingMethods: ['reps'],
          setIds: ['a', 'b'],
        },
      ],
      setsById: {
        a: { id: 'a', trackingData: { reps: 15 }, completed: true },
        b: { id: 'b', trackingData: { reps: 12 }, completed: true },
      },
    };

    await writeExerciseMetricsForSession('uid-4', workout, 'session-r');

    const store = getStore();
    const last = store.get('users/uid-4/exercises/ex-r/metrics/lastSessionMetrics');
    const all = store.get('users/uid-4/exercises/ex-r/metrics/allTimeMetrics');
    expect(last).toMatchObject({
      lastSessionId: 'session-r',
      lastTopReps: 15,
      lastTotalReps: 27,
    });
    expect(all).toMatchObject({
      totalSets: 6, // 4 prev + 2 new
      totalReps: 77, // 50 prev + 27 new
      maxTopReps: 15,
      maxTotalReps: 50,
    });
  });

  it('writes metrics for time-only', async () => {
    resetMockFirestore({
      'users/uid-5/exercises/ex-t/metrics/lastSessionMetrics': {
        lastSessionId: 'prev',
        lastTopTime: 35,
        lastTotalTime: 60,
      },
      'users/uid-5/exercises/ex-t/metrics/allTimeMetrics': {
        totalSets: 3,
        totalTime: 90,
        maxTopTime: 35,
        maxTotalTime: 90,
      },
    });

    const workout: WorkoutData = {
      startTimeISO: new Date().toISOString(),
      exercises: [
        {
          exerciseId: 'ex-t',
          name: 'Plank',
          category: 'Time',
          trackingMethods: ['time'],
          setIds: ['a', 'b'],
        },
      ],
      setsById: {
        a: { id: 'a', trackingData: { time: 50 }, completed: true },
        b: { id: 'b', trackingData: { time: 45 }, completed: true },
      },
    };

    await writeExerciseMetricsForSession('uid-5', workout, 'session-t');

    const store = getStore();
    const last = store.get('users/uid-5/exercises/ex-t/metrics/lastSessionMetrics');
    const all = store.get('users/uid-5/exercises/ex-t/metrics/allTimeMetrics');
    expect(last).toMatchObject({
      lastSessionId: 'session-t',
      lastTopTime: 50,
      lastTotalTime: 95,
    });
    expect(all).toMatchObject({
      totalSets: 5, // 3 prev + 2 new
      totalTime: 185, // 90 prev + 95 new
      maxTopTime: 50,
      maxTotalTime: 95,
    });
  });
});
