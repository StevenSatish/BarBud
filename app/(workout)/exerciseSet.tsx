import React from 'react'
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
import { TouchableOpacity } from 'react-native'
import * as Haptics from 'expo-haptics'

function ExerciseSet({ set, index, trackingMethods, exerciseId }: any) {
  const { updateSet, updateSetCompleted } = useWorkout();

  const handleInputChange = (method: string, value: string) => {
    const newTrackingData = {
      ...set.trackingData,
      [method]: parseInt(value) || null
    };
    updateSet(exerciseId, set.setId, newTrackingData);
  };

  const toggleCompleted = () => {
    updateSetCompleted(exerciseId, set.setId, !set.completed);

    if (set.completed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <HStack className={`justify-between items-center py-3 ${set.completed ? 'bg-success-100' : 'bg-background-0'}`}>
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
      <TouchableOpacity 
        onPress={toggleCompleted}
        style={{ paddingHorizontal: 8, paddingVertical: 8 }}
        activeOpacity={0.7}
      >
        <Checkbox 
          size="lg"
          value="completed"
          isChecked={set.completed}
          onChange={toggleCompleted}
        >
          <CheckboxIndicator>
            <CheckboxIcon as={CheckIcon} />
          </CheckboxIndicator>
        </Checkbox>
      </TouchableOpacity>
    </HStack>
  )
}

export default ExerciseSet