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
import { CheckIcon } from "@/components/ui/icon"
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Input, InputField } from "@/components/ui/input"
import { useWorkout } from '../context/WorkoutContext'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import {Pressable} from "react-native-gesture-handler";  
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Alert } from 'react-native'


function ExerciseSet({ set, index, trackingMethods, exerciseId }: any) {
  const { updateSet, deleteSet } = useWorkout();

  const handleInputChange = (method: string, value: string) => {
    const newTrackingData = {
      ...set.trackingData,
      [method]: parseInt(value) || 0
    };
    updateSet(exerciseId, set.setId, newTrackingData);
  };

  

  function renderRightActions(progress: SharedValue<number>, drag: SharedValue<number>) {
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
          onPress={() => deleteSet(exerciseId, set.setId)}
          android_ripple={{ color: '#dc2626' }}
        >
          <FontAwesome name="trash-o" size={24} color="white" />
        </Pressable>
      </Reanimated.View>
    );
  }
  
    return (
      <ReanimatedSwipeable 
        renderRightActions={renderRightActions}
        friction={1}
        rightThreshold={100}
        overshootRight={true}
        containerStyle={{ overflow: 'hidden' }}
      >
        <HStack className="justify-between items-center py-3 bg-background-0">
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
      </ReanimatedSwipeable>
    )
  }

export default ExerciseSet