import React from 'react'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import {
    Checkbox,
    CheckboxIndicator,
    CheckboxIcon,
} from "@/components/ui/checkbox"
import { Button, ButtonIcon, ButtonText} from '@/components/ui/button'
import { CheckIcon, TrashIcon } from "@/components/ui/icon"
import { Input, InputField } from "@/components/ui/input"
import { useWorkout } from '../context/WorkoutContext'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';


function ExerciseSet({ set, index, trackingMethods, exerciseId }: any) {
  const { updateSet, deleteSet } = useWorkout();

  const handleInputChange = (method: string, value: string) => {
    const newTrackingData = {
      ...set.trackingData,
      [method]: parseInt(value) || 0
    };
    updateSet(exerciseId, set.setId, newTrackingData);
  };

  

  const renderRightActions = (
    progress: SharedValue<number>,
    dragX: SharedValue<number>,
  ) => {
    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: Math.min(progress.value * 2, 1),
      };
    });
    return (
      <Reanimated.View style={animatedStyle}>
        <Button onPress={() => deleteSet(exerciseId, set.setId)}>
          <ButtonText>Delete</ButtonText>
          <ButtonIcon as={TrashIcon} />
        </Button>
      </Reanimated.View>
    );
  };
  

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <HStack className="justify-between items-center py-3">
          <Box className="w-12 flex items-center justify-center">
            <Text size="lg" className="text-typography-900 text-center">{index + 1}</Text>
          </Box>
          <Box className="w-16 flex items-center justify-center">
            <Text size="lg" className="text-typography-900 text-center">-</Text>
          </Box>
          {trackingMethods.map((method: any) => (
            <Box key={method} className="w-16 flex items-center justify-center">
              <Input size="md" className="bg-background-100">
                <InputField
                  className="text-typography-900 text-center text-lg"
                  defaultValue={set.trackingData[method]?.toString()}
                  keyboardType="numeric"
                  onChangeText={(value) => handleInputChange(method, value)}
                />
              </Input>
            </Box>
          ))}
          <Box className="w-8 flex items-center justify-center">
            <Checkbox 
              size="lg"
              isInvalid={false}
              isDisabled={false}
              value="checked"
            >
              <CheckboxIndicator>
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
            </Checkbox>
          </Box>
        </HStack>
      </Swipeable>
    )
  }

export default ExerciseSet