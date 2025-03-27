import React from 'react';
import { StyleSheet } from 'react-native';
import { Box } from '@/components/ui/box';
import { useWorkout } from '../context/WorkoutContext';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';

export default function WorkoutScreen() {
  const { minimizeWorkout, endWorkout } = useWorkout();

  return (
    <Box className="bg-background-0 flex-1 items-center justify-center">
      <VStack space="md">
        <Button onPress={endWorkout}>
          <ButtonText>End Workout</ButtonText>
        </Button>
        <Button onPress={minimizeWorkout}>
          <ButtonText>Minimize Workout</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({

});