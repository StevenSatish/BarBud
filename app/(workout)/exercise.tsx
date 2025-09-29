import React, { useState, Fragment, useMemo } from 'react';
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

import ExerciseSet from './exerciseSet';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '@/app/context/ThemeContext';

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
  };
};

function Exercise({ exercise }: Props) {
  const { theme } = useTheme();
  const { addSet, deleteSet, deleteExercise, workoutState } = useWorkout();
  const [showActionsheet, setShowActionsheet] = useState(false);

  const setsById = workoutState.workout?.setsById ?? {};

  // Build the sets for this exercise from setIds.
  // Also alias id -> setId to keep ExerciseSet working without changes.
  const mappedSets = useMemo(() => {
    const list = (exercise.setIds || []).map((id) => setsById[id]).filter(Boolean);
    return list.map((s) => ({ ...s, setId: s.id }));
  }, [exercise.setIds, setsById]);

  const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

  const handleClose = () => setShowActionsheet(false);
  const handleDeletion = () => {
    deleteExercise(exercise.instanceId);
    setShowActionsheet(false);
  };

  function renderRightActions(setId: string) {
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
  }

  return (
    <Box className={`w-full mb-2 bg-${theme}-background`}>
      <VStack space="md">
        <HStack className="justify-between items-center px-2">
          <Text size="xl" className="text-typography-900 font-bold">
            {`${exercise.name} ${exercise.category !== 'Other' ? `(${exercise.category})` : ''}`}
          </Text>
          <Entypo name="dots-three-horizontal" size={24} color="white" onPress={() => setShowActionsheet(true)} />
        </HStack>

        <HStack className="justify-between items-center px-1">
          <Box className="w-12 flex items-center justify-center">
            <Text className="text-typography-900 text-center">Set</Text>
          </Box>
          <Box className="w-16 flex items-center justify-center">
            <Text className="text-typography-900 text-center">Previous</Text>
          </Box>
          {exercise.trackingMethods.map((method) => (
            <Box key={method} className="w-16 flex items-center justify-center">
              <Text className="text-typography-900 text-center">{capitalize(method)}</Text>
            </Box>
          ))}
          <Box className="pr-2">
            <AntDesign name="check" size={24} color="white" />
          </Box>
        </HStack>

        <VStack>
          {mappedSets.map((set: any, index: number) => {
            // Keep keys stable using the new set.id
            const swipeableKey = `${set.id}-${mappedSets.length}`;
            return (
              <Fragment key={set.id}>
                <Swipeable
                  key={swipeableKey}
                  renderRightActions={renderRightActions(set.id)}
                  friction={1}
                  rightThreshold={100}
                  overshootRight={false}
                  containerStyle={{ overflow: 'hidden' }}
                >
                  <ExerciseSet
                    set={set} // has setId alias
                    index={index}
                    trackingMethods={exercise.trackingMethods}
                    exerciseId={exercise.instanceId}
                  />
                </Swipeable>
              </Fragment>
            );
          })}
        </VStack>

        <Button className={`bg-${theme}-button`} onPress={() => addSet(exercise.instanceId)}>
          <ButtonText className="text-typography-800">+ Add Set</ButtonText>
        </Button>
      </VStack>

      <Actionsheet isOpen={showActionsheet} onClose={handleClose}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
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
