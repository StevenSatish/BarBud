import { writeSessionAndCollectInstances, WorkoutData } from '@/app/services/workoutDatabase';
import { resetMockFirestore } from './helpers/mockFirestore';

describe('workoutDatabase instance collection', () => {
  beforeEach(() => resetMockFirestore());

  it('collects weight x reps instance', async () => {
    const start = Date.now();
    const end = start + 10 * 60 * 1000;
    const workout: WorkoutData = {
      startTimeISO: new Date(start).toISOString(),
      exercises: [
        {
          exerciseId: 'ex-wr',
          name: 'Bench',
          category: 'Barbell',
          trackingMethods: ['weight', 'reps'],
          setIds: ['s1', 's2'],
        },
      ],
      setsById: {
        s1: { id: 's1', trackingData: { weight: 150, reps: 3 }, completed: true },
        s2: { id: 's2', trackingData: { weight: 140, reps: 4 }, completed: true },
      },
    };

    const { instances } = await writeSessionAndCollectInstances('uid-1', workout, start, end);

    const wr = instances.find((i) => i.exerciseId === 'ex-wr');
    expect(wr).toMatchObject({
      exerciseId: 'ex-wr',
      topWeight: 150,
      volume: 150 * 3 + 140 * 4,
      completedRepCount: 7,
      completedSetCount: 2,
      bestEst1RM: 165,
    });
  });

  it('collects weight x time instance', async () => {
    const start = Date.now();
    const end = start + 5 * 60 * 1000;
    const workout: WorkoutData = {
      startTimeISO: new Date(start).toISOString(),
      exercises: [
        {
          exerciseId: 'ex-wt',
          name: 'Carry',
          category: 'Carry',
          trackingMethods: ['weight', 'time'],
          setIds: ['s1', 's2'],
        },
      ],
      setsById: {
        s1: { id: 's1', trackingData: { weight: 180, time: 30 }, completed: true },
        s2: { id: 's2', trackingData: { weight: 170, time: 25 }, completed: true },
      },
    };

    const { instances } = await writeSessionAndCollectInstances('uid-2', workout, start, end);
    const wt = instances.find((i) => i.exerciseId === 'ex-wt');
    expect(wt).toMatchObject({
      exerciseId: 'ex-wt',
      topWeight: 180,
      completedSetCount: 2,
    });
  });

  it('collects reps-only instance', async () => {
    const start = Date.now();
    const end = start + 5 * 60 * 1000;
    const workout: WorkoutData = {
      startTimeISO: new Date(start).toISOString(),
      exercises: [
        {
          exerciseId: 'ex-r',
          name: 'Pull Ups',
          category: 'Bodyweight',
          trackingMethods: ['reps'],
          setIds: ['s1', 's2'],
        },
      ],
      setsById: {
        s1: { id: 's1', trackingData: { reps: 10 }, completed: true },
        s2: { id: 's2', trackingData: { reps: 8 }, completed: true },
      },
    };

    const { instances } = await writeSessionAndCollectInstances('uid-3', workout, start, end);
    const r = instances.find((i) => i.exerciseId === 'ex-r');
    expect(r).toMatchObject({
      exerciseId: 'ex-r',
      topReps: 10,
      totalReps: 18,
      completedRepCount: 18,
      completedSetCount: 2,
    });
  });

  it('collects time-only instance', async () => {
    const start = Date.now();
    const end = start + 5 * 60 * 1000;
    const workout: WorkoutData = {
      startTimeISO: new Date(start).toISOString(),
      exercises: [
        {
          exerciseId: 'ex-t',
          name: 'Plank',
          category: 'Time',
          trackingMethods: ['time'],
          setIds: ['s1', 's2'],
        },
      ],
      setsById: {
        s1: { id: 's1', trackingData: { time: 40 }, completed: true },
        s2: { id: 's2', trackingData: { time: 35 }, completed: true },
      },
    };

    const { instances } = await writeSessionAndCollectInstances('uid-4', workout, start, end);
    const t = instances.find((i) => i.exerciseId === 'ex-t');
    expect(t).toMatchObject({
      exerciseId: 'ex-t',
      topTime: 40,
      totalTime: 75,
      completedSetCount: 2,
    });
  });
});
