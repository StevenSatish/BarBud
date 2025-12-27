import React, { memo, useState } from 'react'
import { Pressable } from 'react-native'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
} from "@/components/ui/checkbox"
import { CheckIcon } from "@/components/ui/icon"
import { Input, InputField } from "@/components/ui/input"
import { useEditWorkout } from '../context/EditWorkoutContext'
import { FormControl } from "@/components/ui/form-control"
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/app/context/ThemeContext';
import { Button, ButtonText } from '@/components/ui/button'

function ExerciseSetComponent({ set, setId, index, instanceId, trackingMethods, previousSets, setIds }: any) {
  const { updateSet, updateSetCompleted } = useEditWorkout();
  const [setInvalid, setSetInvalid] = useState<{ [key: string]: boolean }>({});
  const { theme } = useTheme();

  const applyPreviousToSet = () => {
    if (!previousSets) return;
    const currentSetIndex = setIds.findIndex((id: string) => id === setId);
    if (currentSetIndex === -1) return;
    const previousSet = previousSets[currentSetIndex];
    if (!previousSet || !previousSet.trackingData) return;

    const { trackingData } = previousSet;
    const newTrackingData: any = {
      ...set.trackingData,
    };

    if (trackingData.weight !== undefined) newTrackingData.weight = trackingData.weight || null;
    if (trackingData.reps !== undefined) newTrackingData.reps = trackingData.reps || null;
    if (trackingData.time !== undefined) newTrackingData.time = trackingData.time || null;

    setSetInvalid({});
    updateSet(instanceId, setId, newTrackingData);
    updateSetCompleted(instanceId, setId, false);
  };

  const handleInputChange = (method: string, value: string) => {
    updateSetCompleted(instanceId, setId, false);
    
    const newTrackingData = {
      ...set.trackingData,
      [method]: value || null
    };
    updateSet(instanceId, setId, newTrackingData);

    // Clear invalid state for this field if it was previously invalid
    if (setInvalid[method]) {
      setSetInvalid((prev) => {
        const newInvalid = { ...prev };
        delete newInvalid[method];
        return newInvalid;
      });
    }
  };

  const getPlaceholder = (method: string) => {
    if (method === 'weight') return 'lbs';
    if (method === 'time') return 's';
    return 'reps';
  };

  const toggleCompleted = () => {
    if (set.completed) {
      updateSetCompleted(instanceId, setId, false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Check if any tracking method is empty
      const newInvalidState: { [key: string]: boolean } = {};
      let hasInvalid = false;

      trackingMethods.forEach((method: string) => {
        const value = set.trackingData[method];
        // Check if value is null, undefined, empty string, or just whitespace
        // Note: 0 is a valid value, so we explicitly check for null/undefined/empty strings
        const isEmpty = value === null ||
          value === undefined ||
          (typeof value === 'string' && value.trim() === '');

        if (isEmpty) {
          newInvalidState[method] = true;
          hasInvalid = true;
        }
      });

      setSetInvalid(newInvalidState);

      if (hasInvalid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        updateSetCompleted(instanceId, setId, false);
        return;
      } else {
        updateSetCompleted(instanceId, setId, true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  return (
    <HStack className={`items-center py-3 ${set.completed ? `bg-${theme}-button` : `bg-${theme}-background`}`}>
      <Box className="flex-[0.75] items-center justify-center">
        <Text size="md" bold className={`text-typography-800 text-center text-${theme}-lightText`}>{index + 1}</Text>
      </Box>
      <Button variant="link" className="flex-[1] items-center justify-center" onPress={applyPreviousToSet}>
        <ButtonText size="md" className={`text-typography-800 text-center text-${theme}-lightText font-bold`}>
          {(() => {
            // Get previous session data for this set position (not order)
            if (!previousSets) return '-';

            // Find the current set's position in the exercise's setIds array
            const currentSetIndex = setIds.findIndex((id: string) => id === setId);
            if (currentSetIndex === -1) return '-';

            // Get previous data by position (0-based index)
            const previousSet = previousSets[currentSetIndex];
            if (!previousSet) return '-';

            const { trackingData } = previousSet;
            const parts = [];

            if (trackingData.weight && trackingData.reps) {
              parts.push(`${trackingData.weight} x ${trackingData.reps}`);
            } else if (trackingData.weight && trackingData.time) {
              parts.push(`${trackingData.weight} x ${trackingData.time}s`);
            } else if (trackingData.reps) {
              parts.push(`${trackingData.reps}`);
            } else if (trackingData.time) {
              parts.push(`${trackingData.time}s`);
            }

            return parts.length > 0 ? parts.join(', ') : '-';
          })()}
        </ButtonText>
      </Button>
      {trackingMethods.map((method: any) => (
        <Box key={method} style={{ flex: 2 / trackingMethods.length }} className="items-center justify-center">
          <FormControl className="w-full max-w-[90px]" isInvalid={setInvalid[method]}>
            <Input className="mx-2" variant="outline" size="md">
              <InputField
                className="text-typography-800 text-center text-lg"
                placeholder={getPlaceholder(method)}
                value={set.trackingData[method]?.toString() || ''}
                keyboardType="decimal-pad"
                onChangeText={(value) => handleInputChange(method, value)}
                selectTextOnFocus={true}
                textAlign="center"
              />
            </Input>
          </FormControl>
        </Box>
      ))}
      <Box className="flex-[0.75] items-center justify-center">
        <Pressable
          onPress={toggleCompleted}
          hitSlop={10}
          className="items-center justify-center"
        >
          <Checkbox
            className="items-center justify-center"
            size="lg"
            value="completed"
            isChecked={set.completed}
            pointerEvents="none"
          >
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
          </Checkbox>
        </Pressable>
      </Box>
    </HStack>
  )
}

const ExerciseSet = memo(ExerciseSetComponent)
export default ExerciseSet
export { ExerciseSet }
