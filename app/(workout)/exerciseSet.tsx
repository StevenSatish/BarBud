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

function ExerciseSet({ set, index, trackingMethods, exerciseId }: any) {
  const { updateSet, updateSetCompleted } = useWorkout();

  const handleInputChange = (method: string, value: string) => {
    const newTrackingData = {
      ...set.trackingData,
      [method]: parseInt(value) || null
    };
    updateSet(exerciseId, set.setId, newTrackingData);
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
      <Box className="w-8 flex items-center justify-center">
        <Checkbox 
          size="lg"
          value="completed"
          isChecked={set.completed}
          onChange={() => {updateSetCompleted(exerciseId, set.setId, !set.completed)}}
        >
          <CheckboxIndicator>
            <CheckboxIcon as={CheckIcon} />
          </CheckboxIndicator>
        </Checkbox>
      </Box>
    </HStack>
  )
}

export default ExerciseSet