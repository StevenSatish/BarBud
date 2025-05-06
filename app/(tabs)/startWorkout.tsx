import React from 'react';
import { Box } from '@/components/ui/box';
import { useWorkout } from '../context/WorkoutContext';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/app/context/ThemeContext';

export default function StartWorkoutTab() {
  const { startWorkout } = useWorkout();
  const { theme } = useTheme();
  
  return (
    <Box className={`flex-1 justify-center items-center bg-${theme}-background`}>
      <Button onPress={startWorkout}>
        <ButtonText>
          Start Workout
        </ButtonText>
      </Button>
    </Box>
  );
}