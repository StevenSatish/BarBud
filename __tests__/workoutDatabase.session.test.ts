import { writeSessionAndCollectInstances, WorkoutData } from '@/app/services/workoutDatabase';
import { resetMockFirestore, getStore } from './helpers/mockFirestore';

describe('workoutDatabase session writing', () => {
  beforeEach(() => resetMockFirestore());

  it('no completed sets yields empty result', async () => {
    const workout: WorkoutData = {
      startTimeISO: new Date().toISOString(),
      exercises: [
        {
          exerciseId: 'ex-none',
          name: 'None',
          category: 'Other',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1'],
        },
      ],
      setsById: {
        s1: { trackingData: { weight: 50, reps: 10 }, completed: false },
      },
    };

    const result = await writeSessionAndCollectInstances('uid-0', workout, Date.now(), Date.now());
    expect(result.instances).toHaveLength(0);
    expect(result.sessionId).toBe('');
    expect(getStore().size).toBe(0);
  });

  it('captures instances and session metadata', async () => {
    const start = Date.now();
    const end = start + 10 * 60 * 1000;
    const startDate = new Date(start);
    const dayKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(
      startDate.getDate()
    ).padStart(2, '0')}`;
    const workout: WorkoutData = {
      startTimeISO: new Date(start).toISOString(),
      exercises: [
        {
          exerciseId: 'ex-1',
          name: 'Bench',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1', 's2'],
        },
      ],
      setsById: {
        s1: { id: 's1', trackingData: { weight: 100, reps: 5 }, completed: true },
        s2: { id: 's2', trackingData: { weight: 110, reps: 3 }, completed: true },
      },
    };

    const { sessionId, instances } = await writeSessionAndCollectInstances('uid-1', workout, start, end);

    expect(sessionId).toBeTruthy();
    expect(instances).toHaveLength(1);

    // Session document persisted
    const sessionPath = `users/uid-1/sessions/${sessionId}`;
    const store = getStore();
    expect(store.has(sessionPath)).toBe(true);
    const sessionDoc = store.get(sessionPath);
    expect(sessionDoc).toMatchObject({
      totalCompletedSets: 2,
      durationMin: 10,
      dayKey,
      exerciseCounts: [
        {
          exerciseId: 'ex-1',
          name: 'Bench',
          category: 'Barbell',
          completedSetCount: 2,
        },
      ],
    });
    expect(new Date(sessionDoc.startAt).getTime()).toBeGreaterThan(0);
    expect(new Date(sessionDoc.endAt).getTime()).toBeGreaterThan(0);

    // Exercise subdoc schema
    const exDoc = Array.from(store.values()).find(
      (v: any) => v && v.exerciseId === 'ex-1' && Array.isArray(v.sets)
    );
    expect(exDoc).toBeTruthy();
    expect(exDoc).toMatchObject({
      exerciseId: 'ex-1',
      order: 1,
    });
    expect(exDoc.sets).toEqual([
      {
        id: 's1',
        order: 1,
        trackingData: { weight: 100, reps: 5, time: null },
      },
      {
        id: 's2',
        order: 2,
        trackingData: { weight: 110, reps: 3, time: null },
      },
    ]);
  });
});
