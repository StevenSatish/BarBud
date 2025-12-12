import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-gesture-handler';
import { Link, useRootNavigationState, router } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '@/app/context/ThemeContext';
import useTemplateFolders from '../context/TemplateFoldersContext';

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
    cancelWorkout,
  } = useWorkout();
  const { fetchFolders, fetchTemplates } = useTemplateFolders();
  const navigationState = useRootNavigationState();

  const [showEndWorkoutAlert, setShowEndWorkoutAlert] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentWorkout = workoutState.workout;
  const startTimeISO = currentWorkout?.startTimeISO;

  // Always compute warnings and run effects before any early returns
  const warnings = endWorkoutWarnings();
  // Safely prefetch Add Exercise screen only after root navigation is ready
  useEffect(() => {
    if (!navigationState?.key) return;
    // Prefetch by rendering an offscreen Link to warm bundle after nav is ready
    // No-op here; the visible Link will be enough now that nav is mounted
  }, [navigationState?.key]);

  // Timer
  useEffect(() => {
    if (!startTimeISO) return;
    const startMs = new Date(startTimeISO).getTime();
    const update = () =>
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTimeISO]);

  const handleConfirmFinish = async () => {
    setShowEndWorkoutAlert(false);
    const { result, persistPromise } = await endWorkout();
    // Navigate first for snappier UX
    router.replace({ pathname: '/(workout)/progressions', params: { data: JSON.stringify(result) } });
    // Refresh folders/templates in the background after writes finish
    persistPromise
      .then(() => Promise.all([fetchFolders(), fetchTemplates()]))
      .catch((e) => console.error('Failed to refresh folders/templates after finish:', e));
  };

  // No active workout placeholder
  if (!workoutState.isActive || !currentWorkout) {
    return (
      <SafeAreaView className={`bg-${theme}-background flex-1`}>
        <VStack className="flex-1 items-center justify-center px-6">
          <Heading size="xl" className="text-typography-900 mb-3">
            No active workout
          </Heading>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`bg-${theme}-background flex-1`}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <AlertDialog
          isOpen={showEndWorkoutAlert}
          size="md"
          onClose={() => setShowEndWorkoutAlert(false)}
        >
          <AlertDialogBackdrop />
          <AlertDialogContent className="bg-background-0 border-outline-100">
            <AlertDialogHeader>
              <Heading size="lg" className="text-typography-900 font-semibold">
                Finish Workout?
              </Heading>
            </AlertDialogHeader>
            <AlertDialogBody className="py-4">
              {warnings.length === 0 ? (
                <Text className="text-typography-700">You're about to finish this workout.</Text>
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
          <Pressable 
            onPress={minimizeWorkout}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 20 }}
            className="w-24 pl-2 flex items-start"
          >
            <FontAwesome5
              name="chevron-left"
              size={24}
              color="white"
            />
          </Pressable>

        <Box className="flex-1 flex items-center justify-center">
            <WorkoutTimer elapsedSeconds={elapsedSeconds} />
          </Box>

          <Box className={`w-24 flex items-end pr-2`}>
            <Button size="md" onPress={() => setShowEndWorkoutAlert(true)} className={`bg-primary-800`}>
              <ButtonText className={`text-secondary-0`}>Finish</ButtonText>
            </Button>
          </Box>
        </HStack>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          <VStack space="md" className="w-full px-2 pb-4">
              {currentWorkout.exercises.length > 0 &&
                currentWorkout.exercises.map((exercise) => (
                  <Exercise
                    key={exercise.instanceId}
                    exercise={exercise}
                  />
                ))}

            <Link href="/AddExersiceDatabase" asChild>
              <Button
                className={`mt-auto bg-${theme}-button`}
              >
                <ButtonText className={`text-primary-800`}>Add Exercise</ButtonText>
              </Button>
            </Link>

            <Button
              onPress={() => setShowEndWorkoutAlert(true)}
              className={`mt-2 bg-${theme}-button`}
            >
              <ButtonText className={`text-primary-800`}>Finish Workout</ButtonText>
            </Button>
            <Button
              variant="link"
              onPress={() => cancelWorkout()}
            >
              <ButtonText className="text-error-700">Cancel Workout</ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
