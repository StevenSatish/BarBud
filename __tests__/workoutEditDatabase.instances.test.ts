import writeEditedSession, { WorkoutData } from '@/app/services/workoutEditDatabase';
import { resetMockFirestore, getStore } from './helpers/mockFirestore';

const buildWorkout = (): WorkoutData => ({
  startTimeISO: new Date().toISOString(),
  exercises: [
    {
      instanceId: 'inst-wr',
      exerciseId: 'ex-wr',
      name: 'Bench',
      category: 'Barbell',
      trackingMethods: ['weight', 'reps'],
      setIds: ['s1', 's2'],
    },
    {
      instanceId: 'inst-wt',
      exerciseId: 'ex-wt',
      name: 'Farmers',
      category: 'Carry',
      trackingMethods: ['weight', 'time'],
      setIds: ['s3'],
    },
    {
      instanceId: 'inst-r',
      exerciseId: 'ex-r',
      name: 'Pull Ups',
      category: 'Bodyweight',
      trackingMethods: ['reps'],
      setIds: ['s4'],
    },
    {
      instanceId: 'inst-t',
      exerciseId: 'ex-t',
      name: 'Plank',
      category: 'Time',
      trackingMethods: ['time'],
      setIds: ['s5', 's6'],
    },
  ],
  setsById: {
    s1: { id: 's1', order: 2, trackingData: { weight: 100, reps: 5 }, completed: true },
    s2: { id: 's2', order: 1, trackingData: { weight: 140, reps: 3 }, completed: true },
    s3: { id: 's3', order: 1, trackingData: { weight: 180, time: 35 }, completed: true },
    s4: { id: 's4', order: 1, trackingData: { reps: 15 }, completed: true },
    s5: { id: 's5', order: 1, trackingData: { time: 45 }, completed: true },
    s6: { id: 's6', order: 2, trackingData: { time: 30 }, completed: true },
  },
});

describe('workoutEditDatabase instance writes', () => {
  beforeEach(() => {
    resetMockFirestore({
      // prior instances that should be replaced (schema-consistent)
      'users/uid-edit/exercises/ex-wr/instances/session-123-inst-wr': {
        sessionId: 'session-123',
        exerciseInSessionId: 'inst-wr',
        date: new Date(Date.now() - 1000),
        exerciseId: 'ex-wr',
        topWeight: 50,
        volume: 100,
        bestEst1RM: 55,
        completedSetCount: 1,
        completedRepCount: 2,
      },
      'users/uid-edit/exercises/ex-wt/instances/session-123-inst-wt': {
        sessionId: 'session-123',
        exerciseInSessionId: 'inst-wt',
        date: new Date(Date.now() - 1000),
        exerciseId: 'ex-wt',
        topWeight: 70,
        completedSetCount: 1,
      },
      'users/uid-edit/exercises/ex-r/instances/session-123-inst-r': {
        sessionId: 'session-123',
        exerciseInSessionId: 'inst-r',
        date: new Date(Date.now() - 1000),
        exerciseId: 'ex-r',
        topReps: 5,
        totalReps: 5,
        completedSetCount: 1,
        completedRepCount: 5,
      },
      'users/uid-edit/exercises/ex-t/instances/session-123-inst-t': {
        sessionId: 'session-123',
        exerciseInSessionId: 'inst-t',
        date: new Date(Date.now() - 1000),
        exerciseId: 'ex-t',
        topTime: 20,
        totalTime: 20,
        completedSetCount: 1,
      },
    });
  });

  it('writes weight x reps instance with aggregates', async () => {
    await writeEditedSession('uid-edit', 'session-123', buildWorkout(), Date.now());

    const store = getStore();
    const wrInst = store.get('users/uid-edit/exercises/ex-wr/instances/session-123-inst-wr');
    expect(wrInst).toMatchObject({
      topWeight: 140,
      volume: 100 * 5 + 140 * 3,
      completedRepCount: 8,
      completedSetCount: 2,
      sessionId: 'session-123',
      exerciseInSessionId: 'inst-wr',
    });
    expect(new Date(wrInst.date).getTime()).toBeGreaterThan(0);
    expect(wrInst.bestEst1RM).toBeGreaterThan(0);
    expect(wrInst.topReps).toBeUndefined();
    expect(wrInst.totalReps).toBeUndefined();
    expect(wrInst.topTime).toBeUndefined();
    expect(wrInst.totalTime).toBeUndefined();

    const exDoc = store.get('users/uid-edit/sessions/session-123/exercises/inst-wr');
    expect(exDoc.sets.map((s: any) => s.order)).toEqual([1, 2]);
  });

  it('writes weight x time instance aggregates', async () => {
    await writeEditedSession('uid-edit', 'session-123', buildWorkout(), Date.now());
    const store = getStore();
    const wtInst = store.get('users/uid-edit/exercises/ex-wt/instances/session-123-inst-wt');
    expect(wtInst).toMatchObject({
      topWeight: 180,
      completedSetCount: 1,
      sessionId: 'session-123',
      exerciseInSessionId: 'inst-wt',
    });
    expect(new Date(wtInst.date).getTime()).toBeGreaterThan(0);
    expect(wtInst.volume).toBeUndefined();
    expect(wtInst.topTime).toBeUndefined(); // weight-time stores time in allTime/last metrics only
  });

  it('writes reps-only instance aggregates', async () => {
    await writeEditedSession('uid-edit', 'session-123', buildWorkout(), Date.now());
    const store = getStore();
    const rInst = store.get('users/uid-edit/exercises/ex-r/instances/session-123-inst-r');
    expect(rInst).toMatchObject({
      topReps: 15,
      totalReps: 15,
      completedRepCount: 15,
      completedSetCount: 1,
      sessionId: 'session-123',
      exerciseInSessionId: 'inst-r',
    });
    expect(new Date(rInst.date).getTime()).toBeGreaterThan(0);
    expect(rInst.topWeight).toBeUndefined();
    expect(rInst.volume).toBeUndefined();
  });

  it('writes time-only instance aggregates', async () => {
    await writeEditedSession('uid-edit', 'session-123', buildWorkout(), Date.now());
    const store = getStore();
    const tInst = store.get('users/uid-edit/exercises/ex-t/instances/session-123-inst-t');
    expect(tInst).toMatchObject({
      topTime: 45,
      totalTime: 75,
      completedSetCount: 2,
      sessionId: 'session-123',
      exerciseInSessionId: 'inst-t',
    });
    expect(new Date(tInst.date).getTime()).toBeGreaterThan(0);
    expect(tInst.topWeight).toBeUndefined();
    expect(tInst.topReps).toBeUndefined();
  });

  it('does not rewrite instances when sets are unchanged', async () => {
    resetMockFirestore({
      'users/uid-edit/exercises/ex-unch/instances/session-123-inst-unch': {
        sessionId: 'session-123',
        exerciseInSessionId: 'inst-unch',
        date: new Date(Date.now() - 5000),
        exerciseId: 'ex-unch',
        topWeight: 200,
        volume: 400,
        completedRepCount: 10,
        completedSetCount: 2,
      },
      'users/uid-edit/sessions/session-123/exercises/inst-unch': {
        exerciseId: 'ex-unch',
        order: 9,
        sets: [
          { id: 's9', order: 1, trackingData: { weight: 100, reps: 5, time: null } },
          { id: 's10', order: 2, trackingData: { weight: 100, reps: 5, time: null } },
        ],
      },
    });

    const workout = buildWorkout();
    workout.exercises.push({
      instanceId: 'inst-unch',
      exerciseId: 'ex-unch',
      name: 'Press',
      category: 'Barbell',
      trackingMethods: ['weight', 'reps'],
      setIds: ['s9', 's10'],
    });
    workout.setsById['s9'] = { id: 's9', order: 1, trackingData: { weight: 100, reps: 5 }, completed: true };
    workout.setsById['s10'] = { id: 's10', order: 2, trackingData: { weight: 100, reps: 5 }, completed: true };

    await writeEditedSession('uid-edit', 'session-123', workout, Date.now());
    const store = getStore();
    const unchangedInst = store.get('users/uid-edit/exercises/ex-unch/instances/session-123-inst-unch');
    expect(unchangedInst).toMatchObject({
      topWeight: 200,
      volume: 400,
      completedRepCount: 10,
      completedSetCount: 2,
    });
  });
});
