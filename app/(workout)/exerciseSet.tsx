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

function ExerciseSetComponent({ set, setId, index, trackingMethods, exerciseId }: any) {
  const { updateSet, updateSetCompleted } = useWorkout();
  const [setInvalid, setSetInvalid] = useState<{ [key: string]: boolean }>({});
  const { theme } = useTheme();

  const handleInputChange = (method: string, value: string) => {
    const newTrackingData = {
      ...set.trackingData,
      [method]: parseInt(value) || null
    };
    updateSet(exerciseId, setId, newTrackingData);
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

    updateSetCompleted(exerciseId, setId, !set.completed);

    if (set.completed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <HStack className={`items-center py-3 ${set.completed ? `bg-${theme}-button` : `bg-${theme}-background`}`}>
      <Box className="flex-[0.75] items-center justify-center">
        <Text size="lg" className="text-typography-900 text-center">{index + 1}</Text>
      </Box>
      <Box className="flex-[1] items-center justify-center">
        <Text size="lg" className="text-typography-900 text-center">-</Text>
      </Box>
      {trackingMethods.map((method: any) => (
        <Box key={method} style={{ flex: 2 / trackingMethods.length }} className="items-center justify-center">
          <FormControl className="w-full max-w-[90px]" isInvalid={setInvalid[method]}>
            <Input className="mx-2" variant="outline" size="md">
              <InputField
                className="text-typography-900 text-center text-lg"
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