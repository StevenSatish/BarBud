import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { Box } from '@/components/ui/box';
import { useWorkout } from '../context/WorkoutContext';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  AlertDialogBackdrop,
} from "@/components/ui/alert-dialog"
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Exercise from './exercise';
import WorkoutTimer from './workoutTimer';
import { Heading } from '@/components/ui/heading';
import { router } from 'expo-router';
import { useTheme } from '@/app/context/ThemeContext';

export default function WorkoutScreen() {
  const { theme } = useTheme();
  const { cancelWorkout, minimizeWorkout, endWorkout, endWorkoutWarnings, workoutState } = useWorkout();
  const [showEndWorkoutAlert, setShowEndWorkoutAlert] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!workoutState.workoutData.startTime) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const start = workoutState.workoutData.startTime;
      setElapsedSeconds(Math.floor((now - start) / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [workoutState.workoutData.startTime]);

  return (
    <SafeAreaView className={`bg-${theme}-background flex-1`}>
      <AlertDialog isOpen={showEndWorkoutAlert} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent className="bg-background-0 border-outline-100">
          <AlertDialogHeader>
            <Heading size="lg" className="text-typography-900 font-semibold">
              Finish Workout?
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody className="py-4">
            {endWorkoutWarnings().map((warning, index) => (
              <Text key={index} className="text-typography-700 mb-2">
                {warning}
              </Text>
            ))}
          </AlertDialogBody>
          <AlertDialogFooter className="gap-3">
            <Button
              variant="outline"
              action="secondary"
              size="sm"
              onPress={() => setShowEndWorkoutAlert(false)}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              size="sm"
              action="primary"
              onPress={endWorkout}
            >
              <ButtonText>Finish Workout</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <HStack className={`w-full py-4 px-2 bg-${theme}-background items-center justify-between`}>
        <Box className="w-24 pl-2 flex items-start">
          <FontAwesome5 onPress={minimizeWorkout} name="chevron-down" size={24} color="white" />
        </Box>
        
        <Box className="flex-1 flex items-center justify-center">
          <WorkoutTimer elapsedSeconds={elapsedSeconds} />
        </Box>
        
        <Box className="w-24 flex items-end pr-2">
          <Button size="md" onPress={() => setShowEndWorkoutAlert(true)}>
            <ButtonText>Finish</ButtonText>
          </Button>
        </Box>
      </HStack>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ 
          flexGrow: 1, 
        }}
      >
        <VStack space="md" className="w-full">
          { workoutState.workoutData.exercises.length > 0 && workoutState.workoutData.exercises.map((exercise: any) => (
            <Exercise
              key={exercise.exerciseId} 
              exercise={exercise}
            />
          ))}
          <Button onPress={() => router.push('/AddExersiceDatabase')} className={`mt-auto bg-${theme}-accent`}>
            <ButtonText>Add Exercise</ButtonText>
          </Button>
          <Button onPress={() => setShowEndWorkoutAlert(true)} className={`mt-auto bg-${theme}-accent`}>
            <ButtonText>Finish Workout</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}