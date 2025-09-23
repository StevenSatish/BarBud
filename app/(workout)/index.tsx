import React, { useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '@/app/context/ThemeContext';

import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  AlertDialogBackdrop,
} from '@/components/ui/alert-dialog';

import WorkoutTimer from './workoutTimer';
import Exercise from './exercise';

export default function WorkoutScreen() {
  const { theme } = useTheme();
  const {
    workoutState,
    minimizeWorkout,
    endWorkout,
    endWorkoutWarnings,
  } = useWorkout();

  const [showEndWorkoutAlert, setShowEndWorkoutAlert] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // convenience refs
  const currentWorkout = workoutState.workout;
  const startTimeISO = currentWorkout?.startTimeISO;

  // Build a compatibility list for Exercise component:
  // each exercise gets a synthetic `sets` array built from setsById.
  const exercisesForUI = useMemo(() => {
    if (!currentWorkout) return [];
    const { exercises, setsById } = currentWorkout;
    return exercises.map((ex) => ({
      ...ex,
      // legacy shape expected by your Exercise component:
      // convert SetEntity -> { setId, trackingData, completed, ... }
      sets: ex.setIds.map((id) => {
        const s = setsById[id];
        return {
          ...s,
          setId: s.id, // alias for legacy consumers
        };
      }),
    }));
  }, [currentWorkout]);

  // Timer tied to startTimeISO
  useEffect(() => {
    if (!startTimeISO) return;
    const startMs = new Date(startTimeISO).getTime();
    const update = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startMs) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTimeISO]);

  // Handle finish confirmation
  const handleConfirmFinish = () => {
    // optional: could read the summary and show a toast/snackbar
    // const summary = endWorkout();
    endWorkout();
    setShowEndWorkoutAlert(false);
  };

  // If no active workout, show a minimal placeholder
  if (!workoutState.isActive || !currentWorkout) {
    return (
      <SafeAreaView className={`bg-${theme}-background flex-1`}>
        <VStack className="flex-1 items-center justify-center px-6">
          <Heading size="xl" className="text-typography-900 mb-3">
            No active workout
          </Heading>
          <Text className="text-typography-700 mb-6 text-center">
            Start a workout to begin tracking sets and reps.
          </Text>
          <Button onPress={() => router.replace('/(tabs)')} className={`bg-${theme}-accent`}>
            <ButtonText>Go Home</ButtonText>
          </Button>
        </VStack>
      </SafeAreaView>
    );
  }

  const warnings = endWorkoutWarnings();

  return (
    <SafeAreaView className={`bg-${theme}-background flex-1`}>
      <AlertDialog isOpen={showEndWorkoutAlert} size="md" onClose={() => setShowEndWorkoutAlert(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent className="bg-background-0 border-outline-100">
          <AlertDialogHeader>
            <Heading size="lg" className="text-typography-900 font-semibold">
              Finish Workout?
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody className="py-4">
            {warnings.length === 0 ? (
              <Text className="text-typography-700">You’re about to finish this workout.</Text>
            ) : (
              warnings.map((w, idx) => (
                <Text key={idx} className="text-typography-700 mb-2">
                  {w.message}
                </Text>
              ))
            )}
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
            <Button size="sm" action="primary" onPress={handleConfirmFinish}>
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
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <VStack space="md" className="w-full px-2 pb-4">
          {exercisesForUI.length > 0 &&
            exercisesForUI.map((exercise: any) => (
              <Exercise key={exercise.exerciseId} exercise={exercise} />
            ))}

          <Button
            onPress={() => router.push('/AddExersiceDatabase')}
            className={`mt-auto bg-${theme}-accent`}
          >
            <ButtonText>Add Exercise</ButtonText>
          </Button>

          <Button
            onPress={() => setShowEndWorkoutAlert(true)}
            className={`mt-2 bg-${theme}-accent`}
          >
            <ButtonText>Finish Workout</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}