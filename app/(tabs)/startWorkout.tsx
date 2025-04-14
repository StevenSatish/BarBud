import React from 'react';
import { Box } from '@/components/ui/box';
import { useWorkout } from '../context/WorkoutContext';
import { Button, ButtonText } from '@/components/ui/button';

export default function StartWorkoutTab() {
  const { startWorkout } = useWorkout();
  
  return (
    <Box className="flex-1 justify-center items-center bg-background-0">
      <Button onPress={startWorkout}>
        <ButtonText>
          Start Workout
        </ButtonText>
      </Button>
    </Box>
  );
}