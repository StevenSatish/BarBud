import React, { useState, Fragment, useMemo, useCallback } from 'react';
import { Pressable } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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
  };
};

function Exercise({ exercise }: Props) {
  const { theme } = useTheme();
  const { addSet, deleteSet, deleteExercise, workoutState } = useWorkout();
  const [showActionsheet, setShowActionsheet] = useState(false);

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
            <FontAwesome name="trash-o" size={24} color="white" />
          </Pressable>
        </Reanimated.View>
      );
    };
  }, [deleteSet, exercise.instanceId]);

  return (
    <Box className={`w-full mb-2 bg-${theme}-background`}>
      <VStack space="md">
        <HStack className={`justify-between items-center px-2`}>
          <Text size="lg" className="text-typography-900 font-bold ">
            {`${exercise.name} ${exercise.category !== 'Other' ? `(${exercise.category})` : ''}`}
          </Text>
          <Entypo name="dots-three-horizontal" size={24} color="white" onPress={() => setShowActionsheet(true)} />
        </HStack>
        <Divider className={`bg-${theme}-button`} orientation="horizontal" />

        <HStack className="items-center">
          <Box className="flex-[0.75] items-center justify-center">
            <Text className="text-typography-900 text-center">Set</Text>
          </Box>
          <Box className="flex-[1] items-center justify-center">
            <Text className="text-typography-900 text-center">Previous</Text>
          </Box>
          {exercise.trackingMethods.map((method) => (
            <Box key={method} style={{ flex: 2 / exercise.trackingMethods.length }} className="items-center justify-center">
              <Text className="text-typography-900 text-center">{capitalize(method)}</Text>
            </Box>
          ))}
          <Box className="flex-[0.75] items-center justify-center">
            <AntDesign name="check" size={24} color="white" />
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
            <ActionsheetItemText className="text-lg justify-center text-typography-500">
              Replace Exercise
            </ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={handleDeletion}>
            <ActionsheetItemText className="text-lg justify-center text-error-500">Remove Exercise</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={handleClose}>
            <ActionsheetItemText className="text-lg justify-center text-typography-500">Cancel</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>
    </Box>
  );
}

export default Exercise;
