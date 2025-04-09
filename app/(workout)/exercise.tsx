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
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import {Pressable} from "react-native-gesture-handler"
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import FontAwesome from '@expo/vector-icons/FontAwesome'

function Exercise({ exercise }: any) {
  const { addSet, deleteSet } = useWorkout();
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

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
            style={({ pressed }) => [{ 
              width: 100, 
              height: '100%', 
              position: 'absolute', 
              right: 0, 
              justifyContent: 'center',
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
              backgroundColor: pressed ? '#dc2626' : 'transparent' 
            }]}
            onPress={() => deleteSet(exercise.exerciseId, setId)}
            android_ripple={{ color: '#dc2626' }}
          >
            <FontAwesome name="trash-o" size={24} color="white" />
          </Pressable>
        </Reanimated.View>
      );
    };
  }

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
          {exercise.sets.map((set: any, index: any) => {
            const swipeableKey = `${set.setId}-${exercise.sets.length}`;
            
            return (
              <React.Fragment key={set.setId}>
                <ReanimatedSwipeable 
                  key={swipeableKey}
                  renderRightActions={renderRightActions(set.setId)}
                  friction={1}
                  rightThreshold={100}
                  overshootRight={true}
                  containerStyle={{ overflow: 'hidden' }}
                >
                  <Box>
                    <ExerciseSet 
                      set={set}
                      index={index}
                      trackingMethods={exercise.trackingMethods}
                      exerciseId={exercise.exerciseId}
                    />
                    {index !== exercise.sets.length - 1 && (
                      <Divider />
                    )}
                  </Box>
                </ReanimatedSwipeable>
              </React.Fragment>
            );
          })}
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