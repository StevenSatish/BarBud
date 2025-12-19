import writeEditedSession, { WorkoutData } from '@/app/services/workoutEditDatabase';
import { resetMockFirestore, getStore } from './helpers/mockFirestore';

const buildWorkout = () : WorkoutData => ({
  startTimeISO: new Date().toISOString(),
  exercises: [
    {
      instanceId: 'inst-a',
      exerciseId: 'ex-1',
      name: 'Bench',
      category: 'Barbell',
      trackingMethods: ['weight', 'reps'],
      setIds: ['s1', 's2'],
    },
    {
      instanceId: 'inst-b',
      exerciseId: 'ex-2',
      name: 'Carry',
      category: 'Carry',
      trackingMethods: ['weight', 'time'],
      setIds: ['s3', 's4'],
    },
  ],
  setsById: {
    s1: { id: 's1', order: 2, trackingData: { weight: 100, reps: 5 }, completed: true },
    s2: { id: 's2', order: 1, trackingData: { weight: 120, reps: 3 }, completed: true },
    s3: { id: 's3', order: 1, trackingData: { weight: 80, time: 40 }, completed: true },
    s4: { id: 's4', order: 2, trackingData: { weight: 90, time: 30 }, completed: true },
  },
});

describe('workoutEditDatabase session writes', () => {
  beforeEach(() => {
  });

  it('persists session doc and removes stale exercise docs', async () => {
    const start = Date.now();
    const end = start + 5 * 60 * 1000;
    const startDate = new Date(start);
    const dayKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(
      startDate.getDate()
    ).padStart(2, '0')}`;
    const staleSessionPath = 'users/uid-edit/sessions/session-123/exercises/stale-inst';
    const staleInstancePath = 'users/uid-edit/exercises/stale-ex/instances/session-123-stale-inst';

    resetMockFirestore({
      [staleSessionPath]: { exerciseId: 'stale-ex', order: 1 },
      [staleInstancePath]: { exerciseId: 'stale-ex', completedSetCount: 1 },
      // existing session/exercise that should be replaced
      'users/uid-edit/sessions/session-123': {
        startAt: new Date(start - 1000),
        endAt: new Date(start - 500),
        durationMin: 1,
        totalCompletedSets: 1,
        exerciseCounts: [{ exerciseId: 'old-ex', name: 'Old', category: 'Old', completedSetCount: 1 }],
        dayKey,
      },
      'users/uid-edit/sessions/session-123/exercises/inst-a': {
        exerciseId: 'old-ex',
        order: 5,
        sets: [{ id: 'old', order: 1, trackingData: { weight: 1, reps: 1, time: null } }],
      },
    });

    const result = await writeEditedSession('uid-edit', 'session-123', buildWorkout(), end);
    expect(result?.date).toBeInstanceOf(Date);

    const store = getStore();
    const sessionDoc = store.get('users/uid-edit/sessions/session-123');
    expect(sessionDoc).toMatchObject({
      totalCompletedSets: 4,
      exerciseCounts: expect.any(Array),
      durationMin: 5,
      dayKey,
    });
    expect(sessionDoc.exerciseCounts.find((c: any) => c.exerciseId === 'stale-ex')).toBeUndefined();
    expect(sessionDoc.exerciseCounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exerciseId: 'ex-1',
          name: 'Bench',
          category: 'Barbell',
          completedSetCount: 2,
        }),
        expect.objectContaining({
          exerciseId: 'ex-2',
          name: 'Carry',
          category: 'Carry',
          completedSetCount: 2,
        }),
      ])
    );
    expect(new Date(sessionDoc.startAt).getTime()).toBeGreaterThan(0);
    expect(new Date(sessionDoc.endAt).getTime()).toBeGreaterThan(0);

    // Exercise subdoc schema
    const exDoc = store.get('users/uid-edit/sessions/session-123/exercises/inst-a');
    expect(exDoc).toMatchObject({
      exerciseId: 'ex-1',
      order: 1,
    });
    expect(exDoc.sets).toEqual([
      {
        id: 's2',
        order: 1,
        trackingData: { weight: 120, reps: 3, time: null },
      },
      {
        id: 's1',
        order: 2,
        trackingData: { weight: 100, reps: 5, time: null },
      },
    ]);

    const carryDoc = store.get('users/uid-edit/sessions/session-123/exercises/inst-b');
    expect(carryDoc).toMatchObject({
      exerciseId: 'ex-2',
      order: 2,
    });
    expect(carryDoc.sets).toEqual([
      {
        id: 's3',
        order: 1,
        trackingData: { weight: 80, reps: null, time: 40 },
      },
      {
        id: 's4',
        order: 2,
        trackingData: { weight: 90, reps: null, time: 30 },
      },
    ]);
  });
});
