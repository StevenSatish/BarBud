import writeEditedSession, { WorkoutData } from '@/app/services/workoutEditDatabase';
import { resetMockFirestore, getStore } from './helpers/mockFirestore';
import { triggerExerciseRefetch } from '@/app/context/ExerciseDBContext';

describe('workoutEditDatabase metrics & orchestration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes metrics for weight x reps and updates lastPerformedAt (triggers refetch)', async () => {
    // Seed previous instances (different session) to test cumulative aggregation
    resetMockFirestore({
      // Previous instance from older session (should be summed)
      'users/uid-edit/exercises/ex-wr/instances/prev-session-inst-prev': {
        sessionId: 'prev-session',
        exerciseInSessionId: 'inst-prev',
        date: new Date(Date.now() - 86400000), // yesterday
        topWeight: 115,
        topRepsAtTopWeight: 2,
        volume: 1000,
        bestEst1RM: 130,
        completedSetCount: 5,
        completedRepCount: 20,
      },
      // Stale instance for current session (should be replaced)
      'users/uid-edit/exercises/ex-wr/instances/session-wr-inst-a': {
        sessionId: 'session-wr',
        exerciseInSessionId: 'inst-a',
        date: new Date(Date.now() - 1000),
        topWeight: 50,
        volume: 100,
        completedSetCount: 1,
        completedRepCount: 2,
      },
      'users/uid-edit/sessions/session-wr/exercises/inst-a': {
        exerciseId: 'ex-wr',
        order: 99,
        sets: [{ id: 'old', order: 1, trackingData: { weight: 1, reps: 1, time: null } }],
      },
    });

    const workout: WorkoutData = {
      startTimeISO: new Date().toISOString(),
      exercises: [
        {
          instanceId: 'inst-a',
          exerciseId: 'ex-wr',
          name: 'Bench',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1', 's2'],
        },
      ],
      setsById: {
        s1: { id: 's1', order: 2, trackingData: { weight: 100, reps: 5 }, completed: true },
        s2: { id: 's2', order: 1, trackingData: { weight: 120, reps: 3 }, completed: true },
      },
    };

    await writeEditedSession('uid-edit', 'session-wr', workout, Date.now());

    const store = getStore();
    const lastBench = store.get('users/uid-edit/exercises/ex-wr/metrics/lastSessionMetrics');
    const allBench = store.get('users/uid-edit/exercises/ex-wr/metrics/allTimeMetrics');
    expect(lastBench).toMatchObject({
      lastTopWeight: 120,
      lastTopRepsAtTopWeight: 3,
      lastVolume: 860,
    });
    expect(allBench).toMatchObject({
      maxTopWeight: 120,
      maxTopRepsAtTopWeight: 3,
      totalVolumeAllTime: 1860, // 1000 prev + 860 new
      totalReps: 28, // 20 prev + 8 new
      totalSets: 7, // 5 prev + 2 new
      maxBestEst1RM: expect.any(Number),
    });

    const benchMeta = store.get('users/uid-edit/exercises/ex-wr');
    expect(benchMeta?.lastPerformedAt).toBeTruthy();
    expect(triggerExerciseRefetch).toHaveBeenCalledTimes(1);
  });

  it('writes metrics for weight x time', async () => {
    // Seed previous instance from older session
    resetMockFirestore({
      'users/uid-edit/exercises/ex-wt/instances/prev-session-inst-prev': {
        sessionId: 'prev-session',
        exerciseInSessionId: 'inst-prev',
        date: new Date(Date.now() - 86400000),
        topWeight: 150,
        topTimeAtTopWeight: 25,
        completedSetCount: 4,
      },
    });

    const workout: WorkoutData = {
      startTimeISO: new Date().toISOString(),
      exercises: [
        {
          instanceId: 'inst-b',
          exerciseId: 'ex-wt',
          name: 'Carry',
          category: 'Carry',
          trackingMethods: ['weight', 'time'],
          setIds: ['s3', 's4'],
        },
      ],
      setsById: {
        s3: { id: 's3', order: 1, trackingData: { weight: 80, time: 40 }, completed: true },
        s4: { id: 's4', order: 2, trackingData: { weight: 90, time: 30 }, completed: true },
      },
    };

    await writeEditedSession('uid-edit', 'session-wt', workout, Date.now());

    const store = getStore();
    const last = store.get('users/uid-edit/exercises/ex-wt/metrics/lastSessionMetrics');
    const all = store.get('users/uid-edit/exercises/ex-wt/metrics/allTimeMetrics');
    expect(last).toMatchObject({
      lastTopWeight: 90,
      lastTopTimeAtTopWeight: 30,
    });
    expect(all).toMatchObject({
      maxTopWeight: 150, // max(150 prev, 90 new)
      maxTopTimeAtTopWeight: 30, // max(25 prev, 30 new)
      totalSets: 6, // 4 prev + 2 new
    });
  });

  it('writes metrics for reps-only', async () => {
    // Seed previous instance from older session
    resetMockFirestore({
      'users/uid-edit/exercises/ex-r/instances/prev-session-inst-prev': {
        sessionId: 'prev-session',
        exerciseInSessionId: 'inst-prev',
        date: new Date(Date.now() - 86400000),
        topReps: 13,
        totalReps: 40,
        completedSetCount: 3,
        completedRepCount: 40,
      },
    });

    const workout: WorkoutData = {
      startTimeISO: new Date().toISOString(),
      exercises: [
        {
          instanceId: 'inst-c',
          exerciseId: 'ex-r',
          name: 'Pull Ups',
          category: 'Bodyweight',
          trackingMethods: ['reps'],
          setIds: ['s1', 's2'],
        },
      ],
      setsById: {
        s1: { id: 's1', order: 1, trackingData: { reps: 12 }, completed: true },
        s2: { id: 's2', order: 2, trackingData: { reps: 10 }, completed: true },
      },
    };

    await writeEditedSession('uid-edit', 'session-r', workout, Date.now());

    const store = getStore();
    const last = store.get('users/uid-edit/exercises/ex-r/metrics/lastSessionMetrics');
    const all = store.get('users/uid-edit/exercises/ex-r/metrics/allTimeMetrics');
    expect(last).toMatchObject({
      lastTopReps: 12,
      lastTotalReps: 22,
    });
    expect(all).toMatchObject({
      totalSets: 5, // 3 prev + 2 new
      totalReps: 62, // 40 prev + 22 new
      maxTopReps: 13, // max(13 prev, 12 new)
      maxTotalReps: 40, // max(40 prev, 22 new)
    });
  });

  it('writes metrics for time-only', async () => {
    // Seed previous instance from older session
    resetMockFirestore({
      'users/uid-edit/exercises/ex-t/instances/prev-session-inst-prev': {
        sessionId: 'prev-session',
        exerciseInSessionId: 'inst-prev',
        date: new Date(Date.now() - 86400000),
        topTime: 35,
        totalTime: 70,
        completedSetCount: 2,
      },
    });

    const workout: WorkoutData = {
      startTimeISO: new Date().toISOString(),
      exercises: [
        {
          instanceId: 'inst-d',
          exerciseId: 'ex-t',
          name: 'Plank',
          category: 'Time',
          trackingMethods: ['time'],
          setIds: ['s1', 's2'],
        },
      ],
      setsById: {
        s1: { id: 's1', order: 1, trackingData: { time: 45 }, completed: true },
        s2: { id: 's2', order: 2, trackingData: { time: 30 }, completed: true },
      },
    };

    await writeEditedSession('uid-edit', 'session-t', workout, Date.now());

    const store = getStore();
    const last = store.get('users/uid-edit/exercises/ex-t/metrics/lastSessionMetrics');
    const all = store.get('users/uid-edit/exercises/ex-t/metrics/allTimeMetrics');
    expect(last).toMatchObject({
      lastTopTime: 45,
      lastTotalTime: 75,
    });
    expect(all).toMatchObject({
      totalSets: 4, // 2 prev + 2 new
      totalTime: 145, // 70 prev + 75 new
      maxTopTime: 45, // max(35 prev, 45 new)
      maxTotalTime: 75, // max(70 prev, 75 new)
    });
  });

  it('does not rewrite metrics when sets are unchanged', async () => {
    resetMockFirestore({
      // existing session exercise with unchanged sets
      'users/uid-edit/sessions/session-unch/exercises/inst-unch': {
        exerciseId: 'ex-unch',
        order: 1,
        sets: [
          { id: 's1', order: 1, trackingData: { weight: 100, reps: 5, time: null } },
          { id: 's2', order: 2, trackingData: { weight: 100, reps: 5, time: null } },
        ],
      },
      // existing instance and metrics
      'users/uid-edit/exercises/ex-unch/instances/session-unch-inst-unch': {
        sessionId: 'session-unch',
        exerciseInSessionId: 'inst-unch',
        exerciseId: 'ex-unch',
        date: new Date(Date.now() - 5000),
        completedSetCount: 2,
        topWeight: 100,
        volume: 1000,
        completedRepCount: 10,
      },
      'users/uid-edit/exercises/ex-unch/metrics/lastSessionMetrics': {
        lastSessionId: 'session-unch',
        lastTopWeight: 100,
        lastTopRepsAtTopWeight: 5,
        lastVolume: 1000,
      },
      'users/uid-edit/exercises/ex-unch/metrics/allTimeMetrics': {
        totalSets: 10,
        totalReps: 50,
        totalVolumeAllTime: 5000,
        maxTopWeight: 120,
        maxTopRepsAtTopWeight: 6,
      },
    });

    const workout: WorkoutData = {
      startTimeISO: new Date().toISOString(),
      exercises: [
        {
          instanceId: 'inst-unch',
          exerciseId: 'ex-unch',
          name: 'Bench',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1', 's2'],
        },
      ],
      setsById: {
        s1: { id: 's1', order: 1, trackingData: { weight: 100, reps: 5 }, completed: true },
        s2: { id: 's2', order: 2, trackingData: { weight: 100, reps: 5 }, completed: true },
      },
    };

    await writeEditedSession('uid-edit', 'session-unch', workout, Date.now());

    const store = getStore();
    const last = store.get('users/uid-edit/exercises/ex-unch/metrics/lastSessionMetrics');
    const all = store.get('users/uid-edit/exercises/ex-unch/metrics/allTimeMetrics');
    expect(last).toMatchObject({
      lastSessionId: 'session-unch',
      lastTopWeight: 100,
      lastTopRepsAtTopWeight: 5,
      lastVolume: 1000,
    });
    expect(all).toMatchObject({
      totalSets: 10,
      totalReps: 50,
      totalVolumeAllTime: 5000,
      maxTopWeight: 120,
      maxTopRepsAtTopWeight: 6,
    });
  });

  it('no-ops when workout payload is empty', async () => {
    resetMockFirestore({});
    const result = await writeEditedSession('uid-empty', 'session-empty', {} as any, Date.now());
    expect(result).toBeUndefined();
    expect(getStore().size).toBe(0);
    expect(triggerExerciseRefetch).not.toHaveBeenCalled();
  });
});
