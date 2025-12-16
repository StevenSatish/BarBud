import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-gesture-handler';
import { Link, useRootNavigationState } from 'expo-router';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Entypo from '@expo/vector-icons/Entypo';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useEditWorkout } from '../context/EditWorkoutContext';
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

import Exercise from './exercise';

export default function EditWorkoutScreen() {
  const { theme } = useTheme();
  const {
    workoutState,
    endWorkout,
    endWorkoutWarnings,
    cancelWorkout,
    finishReorderExercises,
    reorderExercises,
    isSaving,
    setStartTime,
    setEndTime,
  } = useEditWorkout();
  const navigationState = useRootNavigationState();

  const [showEndWorkoutAlert, setShowEndWorkoutAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const currentWorkout = workoutState.workout;

  const warnings = endWorkoutWarnings();
  React.useEffect(() => {
    if (!navigationState?.key) return;
  }, [navigationState?.key]);

  const handleConfirmFinish = async () => {
    setShowEndWorkoutAlert(false);
    await endWorkout();
  };

  const handleConfirmCancel = async () => {
    await cancelWorkout();
    setShowCancelAlert(false);
  };

  const startDate = useMemo(
    () => (currentWorkout ? new Date(currentWorkout.startTimeISO) : new Date()),
    [currentWorkout]
  );
  const endDate = useMemo(
    () =>
      currentWorkout?.endTimeISO
        ? new Date(currentWorkout.endTimeISO)
        : new Date(startDate.getTime() + 60 * 60 * 1000),
    [currentWorkout?.endTimeISO, startDate]
  );

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const ensureEndAfterStart = (candidate: Date) => {
    const s = startDate.getTime();
    return candidate.getTime() > s ? candidate : new Date(s + 60 * 1000);
  };

  if (!workoutState.isActive || !currentWorkout) {
    return (
      <SafeAreaView className={`bg-${theme}-background flex-1`}>
        <VStack className="flex-1 items-center justify-center px-6">
          <Heading size="xl" className="text-typography-800 mb-3">
            No session loaded
          </Heading>
        </VStack>
      </SafeAreaView>
    );
  }

  if (workoutState.isReorderingExercises && currentWorkout) {
    const renderItem = ({ item, drag }: RenderItemParams<typeof currentWorkout.exercises[number]>) => (
      <Pressable onLongPress={drag} onPressIn={drag} hitSlop={10}>
        <HStack className={`items-center justify-between rounded border border-outline-100 bg-${theme}-button px-3 py-3`}>
          <HStack className="items-center gap-3 flex-1">
            <Entypo name="menu" size={20} color="white" />
            <Text className="text-typography-800 text-base flex-1 mr-3">
              {item.name} {item.category ? `(${item.category})` : ''}
            </Text>
          </HStack>
        </HStack>
      </Pressable>
    );

    return (
      <SafeAreaView className={`bg-${theme}-background flex-1`}>
        <VStack space="lg" className="flex-1 px-4 py-4">
          <Heading size="xl" className="text-typography-800 text-center">
            Reorder Exercises
          </Heading>
          <DraggableFlatList
            data={currentWorkout.exercises}
            keyExtractor={(item) => item.instanceId}
            renderItem={renderItem}
            onDragEnd={({ data }) => reorderExercises(data.map((ex) => ex.instanceId))}
            activationDistance={0}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
          />
          <Button className={`bg-${theme}-accent`} onPress={finishReorderExercises}>
            <ButtonText className="text-typography-800">Done</ButtonText>
          </Button>
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
              <Heading size="lg" className="text-typography-800 font-semibold">
                Save Changes?
              </Heading>
            </AlertDialogHeader>
            <AlertDialogBody className="py-4">
              {warnings.length === 0 ? (
                <Text className="text-typography-700">You're about to save this session.</Text>
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
                <ButtonText>Save Session</ButtonText>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          isOpen={showCancelAlert}
          size="md"
          onClose={() => setShowCancelAlert(false)}
        >
          <AlertDialogBackdrop />
          <AlertDialogContent className={`bg-${theme}-background border-${theme}-steelGray`}>
            <AlertDialogHeader>
              <Heading size="lg" className="text-typography-800 font-semibold">
                Discard Changes?
              </Heading>
            </AlertDialogHeader>
            <AlertDialogBody className="py-4">
              <Text className="text-typography-700">
                Are you sure? Your edits will not be saved.
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter className="gap-3">
              <Button
                variant="outline"
                action="secondary"
                size="sm"
                onPress={() => setShowCancelAlert(false)}
              >
                <ButtonText>Go Back</ButtonText>
              </Button>
              <Button size="sm" className={`bg-${theme}-accent`} onPress={handleConfirmCancel}>
                <ButtonText className={`text-typography-800`}>Confirm</ButtonText>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <HStack className={`w-full py-4 px-2 bg-${theme}-background items-center justify-between`}>
          <Pressable
            onPress={cancelWorkout}
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
            <Heading size="lg" className="text-typography-800">Edit Session</Heading>
          </Box>

          <Box className={`w-24 flex items-end pr-2`}>
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
            <VStack className={`bg-${theme}-button rounded-lg p-3`} space="sm">
              <Text className="text-typography-700 text-xs uppercase tracking-wide">Session Time</Text>
              <HStack className="items-center justify-between">
                <Text className="text-typography-800 font-semibold">Start Time</Text>
                <Pressable
                  onPress={() => {
                    setShowStartPicker(true);
                    setShowEndPicker(false);
                  }}
                  hitSlop={8}
                >
                  <Text className="text-primary-500 font-semibold">{formatTime(startDate)}</Text>
                </Pressable>
              </HStack>
              <HStack className="items-center justify-between mt-2">
                <Text className="text-typography-800 font-semibold">End Time</Text>
                <Pressable
                  onPress={() => {
                    setShowEndPicker(true);
                    setShowStartPicker(false);
                  }}
                  hitSlop={8}
                >
                  <Text className="text-primary-500 font-semibold">{formatTime(endDate)}</Text>
                </Pressable>
              </HStack>
            </VStack>

            {(showStartPicker || showEndPicker) && (
              <VStack className="items-center justify-center py-4" space="md">
                {showStartPicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, date) => {
                      if (Platform.OS !== 'ios') setShowStartPicker(false);
                      if (date) {
                        const merged = new Date(startDate);
                        merged.setHours(date.getHours(), date.getMinutes(), 0, 0);
                        setStartTime(merged);
                      }
                    }}
                  />
                )}
                {showEndPicker && (
                  <DateTimePicker
                    value={endDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, date) => {
                      if (Platform.OS !== 'ios') setShowEndPicker(false);
                      if (date) {
                        const merged = new Date(startDate);
                        merged.setHours(date.getHours(), date.getMinutes(), 0, 0);
                        setEndTime(ensureEndAfterStart(merged));
                      }
                    }}
                  />
                )}
                <Button
                  size="sm"
                  className={`bg-${theme}-accent`}
                  onPress={() => {
                    setShowStartPicker(false);
                    setShowEndPicker(false);
                  }}
                >
                  <ButtonText className="text-typography-800">Save Time</ButtonText>
                </Button>
              </VStack>
            )}

              {currentWorkout.exercises.length > 0 &&
                currentWorkout.exercises.map((exercise) => (
                  <Exercise
                    key={exercise.instanceId}
                    exercise={exercise}
                  />
                ))}

            <Link href="/(editWorkout)/AddExersiceDatabaseProxy" asChild>
              <Button
                className={`mt-auto bg-${theme}-button`}
              >
                <ButtonText className={`text-primary-800`}>Add Exercise</ButtonText>
              </Button>
            </Link>

            <Button
              onPress={() => setShowEndWorkoutAlert(true)}
              className={`mt-2 bg-${theme}-button`}
              isDisabled={isSaving}
            >
              <ButtonText className={`text-primary-800`}>{isSaving ? 'Saving...' : 'Save Session'}</ButtonText>
            </Button>
            <Button
              variant="link"
              onPress={() => setShowCancelAlert(true)}
            >
              <ButtonText className="text-error-700">Discard Edits</ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
