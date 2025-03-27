import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Box } from '@/components/ui/box';
import { useWorkout } from '../context/WorkoutContext';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';

export default function WorkoutScreen() {
  const { minimizeWorkout, endWorkout } = useWorkout();

  return (
    <Box className="bg-background-0 flex-1">
      <HStack className="w-full py-4 px-4 bg-background-200 items-center justify-between">
        <Ionicons 
          onPress={minimizeWorkout} 
          name="chevron-down" 
          size={36} 
          className="text-typography-900"
        />
        <Text className="text-typography-900 font-bold text-lg">Workout</Text>
        <Box style={{ width: 36 }} />
      </HStack>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          padding: 16,
          flexGrow: 1, 
        }}
        >
        <VStack space="md" className="w-full">
          
          <Button onPress={endWorkout} className="mt-auto">
            <ButtonText>Finish Workout</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  // You can add styles here if needed
});