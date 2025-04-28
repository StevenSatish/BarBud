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
import { Modal } from 'react-native';
import ExerciseDatabase from '../components/exerciseDatabase';

export default function WorkoutScreen() {
  const { cancelWorkout, minimizeWorkout, endWorkout, endWorkoutWarnings, workoutState } = useWorkout();
  const [showEndWorkoutAlert, setShowEndWorkoutAlert] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);

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

  // Toggle selection
  const handleExerciseToggle = (exercise: any) => {
    setSelectedExercises((prev: any[]) => {
      const exists = prev.find(e => e.id === exercise.id);
      if (exists) {
        return prev.filter(e => e.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  // Add all selected exercises to workout
  const handleAddExercises = () => {
    // TODO: Add selectedExercises to workout here
    setShowAddExerciseModal(false);
    setSelectedExercises([]);
  };

  return (
    <SafeAreaView className="bg-background-0 flex-1">
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
      <HStack className="w-full py-4 px-2 bg-background-0 items-center justify-between">
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
          <Button onPress={() => setShowAddExerciseModal(true)} className="mt-auto">
            <ButtonText>Add Exercise</ButtonText>
          </Button>
          <Button onPress={() => setShowEndWorkoutAlert(true)} className="mt-auto">
            <ButtonText>Finish Workout</ButtonText>
          </Button>
        </VStack>
      </ScrollView>

      <Modal
        visible={showAddExerciseModal}
        animationType="slide"
        onRequestClose={() => setShowAddExerciseModal(false)}
      >
        <SafeAreaView className="flex-1 bg-background-0">
          <HStack className="w-full justify-between px-4 py-2">
            <Button onPress={() => setShowAddExerciseModal(false)}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button onPress={handleAddExercises}>
              <ButtonText>Add</ButtonText>
            </Button>
          </HStack>
          <ExerciseDatabase
            selectedExercises={selectedExercises as never[]}
            handleExercisePress={handleExerciseToggle}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}