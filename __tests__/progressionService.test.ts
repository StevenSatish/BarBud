  it('weight x reps: does not emit reps PR when top weight changed (all-time gate)', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-6/metrics/allTimeMetrics`]: {
        maxTopWeight: 150,
        maxTopRepsAtTopWeight: 8,
      },
      [`users/${uid}/exercises/ex-6/metrics/lastSessionMetrics`]: {
        lastTopWeight: 150,
        lastTopRepsAtTopWeight: 8,
      },
    });

    const setsById = {
      s1: { trackingData: { weight: 170, reps: 6 }, completed: true },
    };
    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-6',
          name: 'Press',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1'],
        },
      ],
      setsById
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: 'Weight',
    });
    expect(result.items.find((i) => i.changeSpec === 'Reps')).toBeUndefined();
  });

  it('weight x reps: can emit last-session reps PR without matching all-time weight', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-8/metrics/allTimeMetrics`]: {
        maxTopWeight: 200,
        maxTopRepsAtTopWeight: 4,
      },
      [`users/${uid}/exercises/ex-8/metrics/lastSessionMetrics`]: {
        lastTopWeight: 180,
        lastTopRepsAtTopWeight: 6,
      },
    });

    const setsById = {
      s1: { trackingData: { weight: 180, reps: 8 }, completed: true },
    };
    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-8',
          name: 'Incline',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1'],
        },
      ],
      setsById
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: 'Reps',
      kind: 'lastSession',
    });
  });

  it('weight x time: does not emit time PR when top weight changed (all-time gate)', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-7/metrics/allTimeMetrics`]: {
        maxTopWeight: 100,
        maxTopTimeAtTopWeight: 40,
      },
      [`users/${uid}/exercises/ex-7/metrics/lastSessionMetrics`]: {
        lastTopWeight: 100,
        lastTopTimeAtTopWeight: 40,
      },
    });

    const setsById = {
      s1: { trackingData: { weight: 120, time: 60 }, completed: true },
    };
    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-7',
          name: 'Hold',
          category: 'Carry',
          trackingMethods: ['weight', 'time'],
          setIds: ['s1'],
        },
      ],
      setsById
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: 'Weight',
    });
    expect(result.items.find((i) => i.changeSpec === 'Time')).toBeUndefined();
  });
import calculateProgressionsForWorkout from '@/app/services/progressionService';
import { resetMockFirestore } from './helpers/mockFirestore';
import { WorkoutData } from '@/app/services/workoutDatabase';

const uid = 'user-1';

const makeWorkout = (exercises: any[], setsById: Record<string, any>): WorkoutData => ({
  startTimeISO: new Date().toISOString(),
  exercises,
  setsById,
});

describe('progressionService', () => {
  afterEach(() => resetMockFirestore());

  // weight x reps ------------------------------------------------------------
  it('weight x reps: all-time top weight and est 1RM', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-1/metrics/allTimeMetrics`]: { maxTopWeight: 100 },
      [`users/${uid}/exercises/ex-1/metrics/lastSessionMetrics`]: { lastTopWeight: 95 },
    });

    const setsById = {
      s1: { trackingData: { weight: 110, reps: 5 }, completed: true },
      s2: { trackingData: { weight: 120, reps: 3 }, completed: true },
    };
    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-1',
          name: 'Bench',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1', 's2'],
        },
      ],
      setsById
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          changeType: 'Top Set',
          changeSpec: 'Weight',
          kind: 'allTime',
        }),
        expect.objectContaining({
          category: 'est1RM',
          changeSpec: '1RM:',
          changeType: 'New Estimated',
        }),
      ])
    );
  });

  it('weight x reps: all-time reps PR when weight ties', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-2/metrics/allTimeMetrics`]: {
        maxTopWeight: 150,
        maxTopRepsAtTopWeight: 5,
      },
      [`users/${uid}/exercises/ex-2/metrics/lastSessionMetrics`]: {
        lastTopWeight: 150,
        lastTopRepsAtTopWeight: 5,
      },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-2',
          name: 'Squat',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1'],
        },
      ],
      { s1: { trackingData: { weight: 150, reps: 7 }, completed: true } }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeType: 'Top Set',
      changeSpec: 'Reps',
      kind: 'allTime',
    });
  });

  it('weight x reps: last-session weight PR (below all-time)', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-9/metrics/allTimeMetrics`]: { maxTopWeight: 200, maxBestEst1RM: 195 },
      [`users/${uid}/exercises/ex-9/metrics/lastSessionMetrics`]: { lastTopWeight: 150 },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-9',
          name: 'Row',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1'],
        },
      ],
      { s1: { trackingData: { weight: 170, reps: 5 }, completed: true } }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: '1RM:',
      change: `198lbs`,
      category: `est1RM`,
      kind: 'allTime',
    });
    expect(result.items[1]).toMatchObject({
      changeType: 'Top Set',
      changeSpec: 'Weight',
      kind: 'lastSession',
    });
  });

  it('weight x reps: last-session reps PR when weight ties last session', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-8/metrics/allTimeMetrics`]: {
        maxTopWeight: 200,
        maxTopRepsAtTopWeight: 10,
      },
      [`users/${uid}/exercises/ex-8/metrics/lastSessionMetrics`]: {
        lastTopWeight: 180,
        lastTopRepsAtTopWeight: 6,
      },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-8',
          name: 'Incline',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1'],
        },
      ],
      { s1: { trackingData: { weight: 180, reps: 8 }, completed: true } }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: 'Reps',
      kind: 'lastSession',
    });
  });

  it('weight x reps: last-session volume PR when top set unchanged', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-10/metrics/lastSessionMetrics`]: {
        lastTopWeight: 150,
        lastTopRepsAtTopWeight: 8,
        lastVolume: 150 * 8,
      },
      [`users/${uid}/exercises/ex-10/metrics/allTimeMetrics`]: {
        maxTopWeight: 200,
        maxTopRepsAtTopWeight: 10,
      },
    });

    const setsById = {
      s1: { trackingData: { weight: 150, reps: 8 }, completed: true },
      s2: { trackingData: { weight: 140, reps: 12 }, completed: true },
    };
    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-10',
          name: 'Bench Volume',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1', 's2'],
        },
      ],
      setsById
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeType: 'Total',
      changeSpec: 'Volume',
      kind: 'lastSession',
    });
  });

  // weight x time ------------------------------------------------------------
  it('weight x time: all-time top weight', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-7/metrics/allTimeMetrics`]: {
        maxTopWeight: 100,
        maxTopTimeAtTopWeight: 40,
      },
      [`users/${uid}/exercises/ex-7/metrics/lastSessionMetrics`]: {
        lastTopWeight: 100,
        lastTopTimeAtTopWeight: 40,
      },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-7',
          name: 'Hold',
          category: 'Carry',
          trackingMethods: ['weight', 'time'],
          setIds: ['s1'],
        },
      ],
      { s1: { trackingData: { weight: 120, time: 60 }, completed: true } }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: 'Weight',
      kind: 'allTime',
    });
  });

  it('weight x time: all-time time-at-top-weight when weight ties', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-11/metrics/allTimeMetrics`]: {
        maxTopWeight: 150,
        maxTopTimeAtTopWeight: 40,
      },
      [`users/${uid}/exercises/ex-11/metrics/lastSessionMetrics`]: {
        lastTopWeight: 150,
        lastTopTimeAtTopWeight: 35,
      },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-11',
          name: 'Farmers',
          category: 'Carry',
          trackingMethods: ['weight', 'time'],
          setIds: ['s1'],
        },
      ],
      { s1: { trackingData: { weight: 150, time: 50 }, completed: true } }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: 'Time',
      kind: 'allTime',
    });
  });

  it('weight x time: last-session weight PR (below all-time)', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-12/metrics/allTimeMetrics`]: {
        maxTopWeight: 220,
        maxTopTimeAtTopWeight: 20,
      },
      [`users/${uid}/exercises/ex-12/metrics/lastSessionMetrics`]: {
        lastTopWeight: 180,
        lastTopTimeAtTopWeight: 25,
      },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-12',
          name: 'Yoke',
          category: 'Carry',
          trackingMethods: ['weight', 'time'],
          setIds: ['s1'],
        },
      ],
      { s1: { trackingData: { weight: 200, time: 15 }, completed: true } }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: 'Weight',
      kind: 'lastSession',
    });
  });

  it('weight x time: last-session time PR when weight ties last session', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-3/metrics/lastSessionMetrics`]: {
        lastTopWeight: 200,
        lastTopTimeAtTopWeight: 30,
      },
      [`users/${uid}/exercises/ex-3/metrics/allTimeMetrics`]: {
        maxTopWeight: 250,
        maxTopTimeAtTopWeight: 45,
      },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-3',
          name: 'Farmers Walk',
          category: 'Carry',
          trackingMethods: ['weight', 'time'],
          setIds: ['s1', 's2'],
        },
      ],
      {
        s1: { trackingData: { weight: 200, time: 45 }, completed: true },
        s2: { trackingData: { weight: 180, time: 55 }, completed: true },
      }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeType: 'Top Set',
      changeSpec: 'Time',
      kind: 'lastSession',
    });
  });

  // reps-only ---------------------------------------------------------------
  it('reps-only: all-time top reps', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-4/metrics/allTimeMetrics`]: { maxTopReps: 15 },
      [`users/${uid}/exercises/ex-4/metrics/lastSessionMetrics`]: { lastTopReps: 15 },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-4',
          name: 'Pull Ups',
          category: 'Bodyweight',
          trackingMethods: ['reps'],
          setIds: ['s1', 's2'],
        },
      ],
      {
        s1: { trackingData: { reps: 18 }, completed: true },
        s2: { trackingData: { reps: 12 }, completed: true },
      }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: 'Reps',
      kind: 'allTime',
    });
  });

  it('reps-only: all-time total reps', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-13/metrics/allTimeMetrics`]: { maxTopReps: 15, maxTotalReps: 30 },
      [`users/${uid}/exercises/ex-13/metrics/lastSessionMetrics`]: { lastTotalReps: 20 },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-13',
          name: 'Situps',
          category: 'Bodyweight',
          trackingMethods: ['reps'],
          setIds: ['s1', 's2', 's3'],
        },
      ],
      {
        s1: { trackingData: { reps: 12 }, completed: true },
        s2: { trackingData: { reps: 12 }, completed: true },
        s3: { trackingData: { reps: 12 }, completed: true },
      }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeType: 'Total',
      changeSpec: 'Reps',
      kind: 'allTime',
    });
  });

  it('reps-only: last-session top reps', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-14/metrics/lastSessionMetrics`]: { lastTopReps: 10, lastTotalReps: 15 },
      [`users/${uid}/exercises/ex-14/metrics/allTimeMetrics`]: { maxTopReps: 13, maxTotalReps: 25 },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-14',
          name: 'Pushups',
          category: 'Bodyweight',
          trackingMethods: ['reps'],
          setIds: ['s1', 's2'],
        },
      ],
      { 
        s1: { trackingData: { reps: 12 }, completed: true },
        s2: { trackingData: { reps: 12 }, completed: true } 
      }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeType: 'Top Set',
      changeSpec: 'Reps',
      kind: 'lastSession',
    });
  });

  it('reps-only: last-session total reps', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-15/metrics/lastSessionMetrics`]: { lastTopReps: 15, lastTotalReps: 20 },
      [`users/${uid}/exercises/ex-15/metrics/allTimeMetrics`]: { maxTopReps: 15, maxTotalReps: 40 },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-15',
          name: 'Air Squats',
          category: 'Bodyweight',
          trackingMethods: ['reps'],
          setIds: ['s1', 's2'],
        },
      ],
      {
        s1: { trackingData: { reps: 15 }, completed: true },
        s2: { trackingData: { reps: 15 }, completed: true },
      }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeType: 'Total',
      changeSpec: 'Reps',
      kind: 'lastSession',
    });
  });

  // time-only ---------------------------------------------------------------
  it('time-only: all-time top time', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-16/metrics/allTimeMetrics`]: { maxTopTime: 40 },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-16',
          name: 'Plank',
          category: 'Time',
          trackingMethods: ['time'],
          setIds: ['s1'],
        },
      ],
      { s1: { trackingData: { time: 60 }, completed: true } }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: 'Time',
      kind: 'allTime',
    });
  });

  it('time-only: all-time total time', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-17/metrics/allTimeMetrics`]: { maxTopTime: 60, maxTotalTime: 100 },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-17',
          name: 'Wall Sit',
          category: 'Time',
          trackingMethods: ['time'],
          setIds: ['s1', 's2'],
        },
      ],
      {
        s1: { trackingData: { time: 60 }, completed: true },
        s2: { trackingData: { time: 50 }, completed: true },
      }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeType: 'Total',
      changeSpec: 'Time',
      kind: 'allTime',
    });
  });

  it('time-only: last-session top time', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-18/metrics/lastSessionMetrics`]: { lastTopTime: 45, lastTotalTime: 80 },
      [`users/${uid}/exercises/ex-18/metrics/allTimeMetrics`]: { maxTopTime: 60, maxTotalTime: 100 },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-18',
          name: 'Hollow Hold',
          category: 'Time',
          trackingMethods: ['time'],
          setIds: ['s1', 's2'],
        },
      ],
      { 
        s1: { trackingData: { time: 60 }, completed: true },
        s2: { trackingData: { time: 30 }, completed: true } }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeType: 'Top Set',
      changeSpec: 'Time',
      kind: 'lastSession',
    });
  });

  it('time-only: last-session total time', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-19/metrics/lastSessionMetrics`]: { lastTopTime: 45, lastTotalTime: 80 },
      [`users/${uid}/exercises/ex-19/metrics/allTimeMetrics`]: { maxTopTime: 60, maxTotalTime: 100 },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-19',
          name: 'Jump Rope',
          category: 'Time',
          trackingMethods: ['time'],
          setIds: ['s1', 's2', 's3'],
        },
      ],
      {
        s1: { trackingData: { time: 40 }, completed: true },
        s2: { trackingData: { time: 30 }, completed: true },
        s3: { trackingData: { time: 25 }, completed: true },
      }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeType: 'Total',
      changeSpec: 'Time',
      kind: 'lastSession',
    });
  });

  // Guards -------------------------------------------------------------------
  it('weight x reps: does not emit reps PR when top weight changed (all-time gate)', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-6/metrics/allTimeMetrics`]: {
        maxTopWeight: 150,
        maxTopRepsAtTopWeight: 8,
      },
      [`users/${uid}/exercises/ex-6/metrics/lastSessionMetrics`]: {
        lastTopWeight: 150,
        lastTopRepsAtTopWeight: 8,
      },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-6',
          name: 'Press',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1'],
        },
      ],
      { s1: { trackingData: { weight: 170, reps: 6 }, completed: true } }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: 'Weight',
    });
    expect(result.items.find((i) => i.changeSpec === 'Reps')).toBeUndefined();
  });

  it('weight x time: does not emit time PR when top weight changed (all-time gate)', async () => {
    resetMockFirestore({
      [`users/${uid}/exercises/ex-20/metrics/allTimeMetrics`]: {
        maxTopWeight: 100,
        maxTopTimeAtTopWeight: 40,
      },
      [`users/${uid}/exercises/ex-20/metrics/lastSessionMetrics`]: {
        lastTopWeight: 100,
        lastTopTimeAtTopWeight: 40,
      },
    });

    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-20',
          name: 'Hold Heavy',
          category: 'Carry',
          trackingMethods: ['weight', 'time'],
          setIds: ['s1'],
        },
      ],
      { s1: { trackingData: { weight: 120, time: 60 }, completed: true } }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items[0]).toMatchObject({
      changeSpec: 'Weight',
    });
    expect(result.items.find((i) => i.changeSpec === 'Time')).toBeUndefined();
  });

  it('no completed sets: returns no progression items', async () => {
    const workout = makeWorkout(
      [
        {
          exerciseId: 'ex-5',
          name: 'Row',
          category: 'Machine',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1'],
        },
      ],
      { s1: { trackingData: { weight: 50, reps: 10 }, completed: false } }
    );

    const result = await calculateProgressionsForWorkout(uid, workout);
    expect(result.items).toHaveLength(0);
  });
});
