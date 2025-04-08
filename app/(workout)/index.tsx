import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { Box } from '@/components/ui/box';
import { useWorkout } from '../context/WorkoutContext';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Exercise from './exercise';
import WorkoutTimer from './workoutTimer';

export default function WorkoutScreen() {
  const { minimizeWorkout, endWorkout, workoutState } = useWorkout();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!workoutState.workoutData.startTime) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const start = workoutState.workoutData.startTime.getTime();
      setElapsedSeconds(Math.floor((now - start) / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [workoutState.workoutData.startTime]);

  return (
    <SafeAreaView className="bg-background-0 flex-1">
      <HStack className="w-full py-4 px-4 bg-background-0 items-center justify-between">
        <FontAwesome5 onPress={minimizeWorkout} name="chevron-down" size={24} color="white" />
        <WorkoutTimer elapsedSeconds={elapsedSeconds} />
        <Button>
          <ButtonText>
            Finish
          </ButtonText>
        </Button>
      </HStack>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ 
          padding: 16,
          flexGrow: 1, 
        }}
      >
        <VStack space="md" className="w-full">
          {workoutState.workoutData.exercises.map((exercise: any) => (
            <Exercise
              key={exercise.exerciseId} 
              exercise={exercise}
            />
          ))}
          <Button onPress={endWorkout} className="mt-auto">
            <ButtonText>Finish Workout</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}