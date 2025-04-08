import React from 'react'
import { Box } from '@/components/ui/box'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import ExerciseSet from './exerciseSet'
import { Button, ButtonText } from '@/components/ui/button'
import { Divider } from "@/components/ui/divider"
import { useWorkout } from '../context/WorkoutContext'

function Exercise({ exercise }: any) {
  const { addSet } = useWorkout();
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <Box className="w-full bg-background-0 mb-2">
      <VStack space="md">
        <HStack className="justify-between items-center">
          <Text size="xl" className="text-typography-900 font-bold">{exercise.name}</Text>
          <Entypo name="dots-three-horizontal" size={24} color="white" />
        </HStack>
        <HStack className="justify-between items-center">
          <Box className="w-12 flex items-center justify-center">
            <Text className="text-typography-900 text-center">Set</Text>
          </Box>
          <Box className="w-16 flex items-center justify-center">
            <Text className="text-typography-900 text-center">Previous</Text>
          </Box>
          {exercise.trackingMethods.map((method: any) => (
            <Box key={method} className="w-16 flex items-center justify-center">
              <Text className="text-typography-900 text-center">{capitalize(method)}</Text>
            </Box>
          ))}
          <Box className="w-8 flex items-center justify-center">
            <AntDesign name="check" size={24} color="white" />
          </Box>
        </HStack>
        <VStack space="sm">
          {exercise.sets.map((set: any, index: any) => (
            <React.Fragment key={set.setId}>
              <ExerciseSet 
                set={set}
                index={index}
                trackingMethods={exercise.trackingMethods}
                exerciseId={exercise.exerciseId}
              />
              {index !== exercise.sets.length - 1 && (
                <Divider />
              )}
            </React.Fragment>
          ))}
        </VStack>
        <Button 
          className='bg-background-200'
          onPress={() => addSet(exercise.exerciseId)}
        >
          <ButtonText className='text-typography-800'>+ Add Set</ButtonText>
        </Button>
      </VStack>
      
    </Box>
  )
}

export default Exercise;