import { estimate1RM } from '@/app/services/workoutDatabase';

describe('workoutDatabase estimate1RM', () => {
  it('enforces bounds and rounds expected values', () => {
    expect(estimate1RM(200, 1)).toBe(200);
    expect(estimate1RM(120, 3)).toBe(132);
    expect(estimate1RM(100, 5)).toBe(117);
    expect(estimate1RM(300, 3)).toBe(330);
    expect(estimate1RM(250, 4)).toBe(283);
    expect(estimate1RM(205, 4)).toBe(232);
    expect(estimate1RM(200, 8)).toBeUndefined();
    expect(estimate1RM(undefined, 3)).toBeUndefined();
    expect(estimate1RM(150, 0)).toBeUndefined();
    expect(estimate1RM(150, 6)).toBeUndefined();
  });
});
