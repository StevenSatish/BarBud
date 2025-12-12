import React, { memo, useState } from 'react'
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
import { useWorkout } from '../context/WorkoutContext'
import { FormControl } from "@/components/ui/form-control"
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/app/context/ThemeContext';
import { Button, ButtonText } from '@/components/ui/button'

function ExerciseSetComponent({ set, setId, index, instanceId, trackingMethods, previousSets, setIds }: any) {
  const { updateSet, updateSetCompleted } = useWorkout();
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

    if (trackingData.weight !== undefined) newTrackingData.weight = Number(trackingData.weight) || null;
    if (trackingData.reps !== undefined) newTrackingData.reps = Number(trackingData.reps) || null;
    if (trackingData.time !== undefined) newTrackingData.time = Number(trackingData.time) || null;

    setSetInvalid({});
    updateSet(instanceId, setId, newTrackingData);
  };

  const handleInputChange = (method: string, value: string) => {
    const newTrackingData = {
      ...set.trackingData,
      [method]: parseInt(value) || null
    };
    updateSet(instanceId, setId, newTrackingData);
    
    // Check if any tracking method is now empty and unselect checkbox if so
    const hasEmptyTracking = trackingMethods.some((trackingMethod: string) => {
      const trackingValue = trackingMethod === method ? (parseInt(value) || null) : set.trackingData[trackingMethod];
      return !trackingValue;
    });
    
    // If any tracking method is empty and the set is currently completed, mark it as not completed
    if (hasEmptyTracking && set.completed) {
      updateSetCompleted(instanceId, setId, false);
    }
  };

  const getPlaceholder = (method: string) => {
    if (method === 'weight') return 'lbs';
    if (method === 'time') return 's';
    return 'reps';
  };

  const toggleCompleted = () => {
    if (!set.completed) {
      // Check if any tracking method is empty
      const newInvalidState: { [key: string]: boolean } = {};
      let hasInvalid = false;

      trackingMethods.forEach((method: string) => {
        if (!set.trackingData[method]) {
          newInvalidState[method] = true;
          hasInvalid = true;
        }
      });

      setSetInvalid(newInvalidState);

      if (hasInvalid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    updateSetCompleted(instanceId, setId, !set.completed);

    if (set.completed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <HStack className={`items-center py-3 ${set.completed ? `bg-${theme}-button` : `bg-${theme}-background`}`}>
      <Box className="flex-[0.75] items-center justify-center">
        <Text size="md" bold className={`text-typography-900 text-center text-${theme}-lightText`}>{index + 1}</Text>
      </Box>
      <Button variant="link" className="flex-[1] items-center justify-center" onPress={applyPreviousToSet}>
         <ButtonText size="md" className={`text-typography-900 text-center text-${theme}-lightText font-bold`}>
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
                className="text-typography-900 text-center text-lg"
                placeholder={getPlaceholder(method)}
                value={set.trackingData[method]?.toString() || ''}
                keyboardType="numeric"
                onChangeText={(value) => handleInputChange(method, value)}
                selectTextOnFocus={true}
                textAlign="center"
                />
            </Input>
          </FormControl>
        </Box>
      ))}
      <Box className="flex-[0.75] items-center justify-center">
        <Checkbox
          className="w-full items-center justify-center"
          size="lg"
          value="completed"
          isChecked={set.completed && !Object.values(setInvalid).some(invalid => invalid)}
          onChange={toggleCompleted}
        >
          <CheckboxIndicator>
            <CheckboxIcon as={CheckIcon} />
          </CheckboxIndicator>
        </Checkbox>
      </Box>
    </HStack>
  )
}

const ExerciseSet = memo(ExerciseSetComponent)
export default ExerciseSet
export { ExerciseSet }