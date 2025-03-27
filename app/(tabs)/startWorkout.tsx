import React from 'react';
import { Box } from '@/components/ui/box';
import { useWorkout } from '../context/WorkoutContext';
import { Button, ButtonText } from '@/components/ui/button';

export default function StartWorkoutTab() {
  const { startWorkout } = useWorkout();

  // Otherwise show options to start a workout
  return (
    <Box style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button onPress={startWorkout}>
        <ButtonText>
          Start Workout
        </ButtonText>
      </Button>
    </Box>
  );
}