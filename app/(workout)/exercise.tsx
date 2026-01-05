import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Pressable } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Feather from '@expo/vector-icons/Feather';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetBackdrop,
} from '@/components/ui/actionsheet';
import { Divider } from '@/components/ui/divider';
import ExerciseSet from './exerciseSet';
import { PreviousSetData, useWorkout } from '../context/WorkoutContext';
import { useTheme } from '@/app/context/ThemeContext';
import { router } from 'expo-router';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { Input, InputField, InputIcon } from '@/components/ui/input';
import { useAuth } from '@/app/context/AuthProvider';
import useExerciseDB from '@/app/context/ExerciseDBContext';
import { FIREBASE_DB } from '@/FirebaseConfig';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { EditIcon } from '@/components/ui/icon';

type Props = {
  exercise: {
    instanceId: string;
    exerciseId: string;
    name: string;
    category: string;
    muscleGroup: string;
    secondaryMuscles?: string[];
    trackingMethods: string[];
    setIds: string[];
    previousSets?: PreviousSetData[];
    notes?: string;
  };
};

function Exercise({ exercise }: Props) {
  const { theme } = useTheme();
  const {
    addSet,
    deleteSet,
    deleteExercise,
    workoutState,
    updateExerciseNotes,
    startReorderExercises,
  } = useWorkout();
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const noteDraftRef = useRef('');
  const [noteInputKey, setNoteInputKey] = useState(0);
  const { user } = useAuth();
  const { fetchExercises } = useExerciseDB();
  const [noteError, setNoteError] = useState(false);

  const setsById = workoutState.workout?.setsById ?? {};

  // Build the sets for this exercise from setIds.
  const mappedSets = useMemo(() => {
    return (exercise.setIds || []).map((id) => setsById[id]).filter(Boolean);
  }, [exercise.setIds, setsById]);

  const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

  const handleClose = () => setShowActionsheet(false);
  const handleDeletion = () => {
    deleteExercise(exercise.instanceId);
    setShowActionsheet(false);
  };

  const handleAddNote = async () => {
    const trimmed = noteDraftRef.current.trim();
    if (!trimmed || !user?.uid || !exercise.exerciseId) {
      setNoteError(true);
      return;
    }
    setNoteError(false);
    try {
      const ref = doc(FIREBASE_DB, `users/${user.uid}/exercises/${exercise.exerciseId}`);
      await updateDoc(ref, { notes: trimmed });
      updateExerciseNotes(exercise.instanceId, trimmed);
      if (fetchExercises) {
        fetchExercises(); // refresh catalog cache so future workouts see updated note
      }
      noteDraftRef.current = '';
      setNoteInputKey((k) => k + 1); // reset input
      setShowNoteModal(false);
    } catch (err) {
      console.warn('Failed to save exercise note', err);
    }
  };

  const handleDeleteNote = async () => {
    if (!user?.uid || !exercise?.exerciseId) return;
    try {
      const ref = doc(FIREBASE_DB, `users/${user.uid}/exercises/${exercise.exerciseId}`);
      await updateDoc(ref, { notes: deleteField() });
      updateExerciseNotes(exercise.instanceId, undefined);
      fetchExercises?.();
      setShowActionsheet(false);
    } catch (err) {
      console.warn('Failed to delete exercise note', err);
    }
  };

  const renderRightActions = useCallback((setId: string) => {
    return (drag: SharedValue<number>) => {
      const animatedStyle = useAnimatedStyle(() => {
        'worklet';
        const width = Math.max(-drag.value, 100);
        return {
          width,
          height: '100%',
          backgroundColor: '#ef4444',
        };
      });

      return (
        <Reanimated.View style={animatedStyle}>
          <Pressable
            style={({ pressed }) => [
              {
                width: 100,
                height: '100%',
                position: 'absolute',
                right: 0,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
                backgroundColor: pressed ? '#dc2626' : 'transparent',
              },
            ]}
            onPress={() => deleteSet(exercise.instanceId, setId)}
            android_ripple={{ color: '#dc2626' }}
          >
            <Feather name="trash-2" size={24} color="white" />
          </Pressable>
        </Reanimated.View>
      );
    };
  }, [deleteSet, exercise.instanceId]);

  return (
    <Box className={`w-full mb-2 bg-${theme}-background`}>
      <VStack space="md">
        <HStack className={`justify-between items-center px-2`}>
          <Text size="lg" className="text-typography-800 font-bold ">
            {`${exercise.name} ${exercise.category !== 'Other' ? `(${exercise.category})` : ''}`}
          </Text>
          <Feather name="more-horizontal" size={24} color="white" onPress={() => setShowActionsheet(true)} />
        </HStack>
        {exercise?.notes ? (
          <Box className="px-2">
            <Text size="lg" className="text-typography-700">{exercise.notes}</Text>
          </Box>
        ) : null}
        <Divider className={`bg-${theme}-button`} orientation="horizontal" />

        <HStack className="items-center">
          <Box className="flex-[0.75] items-center justify-center">
            <Text className="text-typography-800 text-center">Set</Text>
          </Box>
          <Box className="flex-[1] items-center justify-center">
            <Text className="text-typography-800 text-center">Previous</Text>
          </Box>
          {exercise.trackingMethods.map((method) => (
            <Box key={method} style={{ flex: 2 / exercise.trackingMethods.length }} className="items-center justify-center">
              <Text className="text-typography-800 text-center">{capitalize(method)}</Text>
            </Box>
          ))}
          <Box className="flex-[0.75] items-center justify-center">
            <Feather name="check" size={24} color="white" />
          </Box>
        </HStack>

        <VStack>
          {mappedSets.map((set: any, index: number) => (
            <Swipeable
              key={set.id}
              renderRightActions={renderRightActions(set.id)}
              friction={1}
              rightThreshold={100}
              overshootRight={false}
              containerStyle={{ overflow: 'hidden' }}
            >
              <ExerciseSet
                set={set}
                setId={set.id}
                index={index}
                instanceId={exercise.instanceId}
                trackingMethods={exercise.trackingMethods}
                previousSets={exercise?.previousSets}
                setIds={exercise.setIds}
              />
            </Swipeable>
          ))}
        </VStack>

        <Button className={`bg-${theme}-accent`} onPress={() => addSet(exercise.instanceId)}>
          <ButtonText className="text-typography-800">+ Add Set</ButtonText>
        </Button>
      </VStack>

      <Actionsheet isOpen={showActionsheet} onClose={handleClose}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetItem
            onPress={() => {
              setShowActionsheet(false);
              router.push({
                pathname: '/AddExersiceDatabase',
                params: { targetInstanceId: exercise.instanceId },
              });
            }}
          >
            <ActionsheetItemText className="text-lg justify-center text-typography-800">
              Replace Exercise
            </ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem
            onPress={() => {
              setShowActionsheet(false);
              setShowNoteModal(true);
            }}
          >
            <ActionsheetItemText className="text-lg justify-center text-typography-800">
              {exercise.notes ? 'Edit Exercise Note' : 'Add Exercise Note'}
            </ActionsheetItemText>
          </ActionsheetItem>
          {exercise.notes ? (
            <ActionsheetItem
              onPress={handleDeleteNote}
            >
              <ActionsheetItemText className="text-lg justify-center text-error-500">Delete Exercise Note</ActionsheetItemText>
            </ActionsheetItem>
          ) : null}
          <ActionsheetItem
            onPress={() => {
              setShowActionsheet(false);
              startReorderExercises();
            }}
          >
            <ActionsheetItemText className="text-lg justify-center text-typography-800">Reorder Exercises</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={handleDeletion}>
            <ActionsheetItemText className="text-lg justify-center text-error-500">Remove Exercise</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={handleClose}>
            <ActionsheetItemText className="text-lg justify-center text-typography-500">Cancel</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>

      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)}>
        <ModalBackdrop onPress={() => setShowNoteModal(false)} />
        <ModalContent className={`bg-${theme}-background border-${theme}-steelGray px-5 py-4`}>
          <ModalHeader>
            <Text className="text-typography-800 text-xl font-bold">Add Note</Text>
          </ModalHeader>
          <ModalBody>
            <Input isInvalid={noteError} >
              <InputIcon as={EditIcon} className="ml-2 text-typography-800"/>
              <InputField
                key={noteInputKey}
                placeholder={exercise.notes ?? 'Enter note'}
                placeholderTextColor="rgba(255,255,255,0.6)"
                onChangeText={(t) => {
                  noteDraftRef.current = t;
                }}
                multiline
                className="pt-3 pb-2"
              />
            </Input>
          </ModalBody>
          <ModalFooter className="flex-row justify-between items-center px-2">
            <Button variant="solid" className="bg-outline-200" onPress={() => setShowNoteModal(false)}>
              <ButtonText className="text-typography-800">Cancel</ButtonText>
            </Button>
            <Button onPress={handleAddNote}>
              <ButtonText>Add Note</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Exercise;
