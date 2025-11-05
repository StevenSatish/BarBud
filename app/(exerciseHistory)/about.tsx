import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/app/context/ThemeContext';

export default function ExerciseAbout({ exercise }: { exercise?: any }) {
  const { theme } = useTheme();
  return (
    <View >
      <Text>rfdsfsd</Text>
    </View>
  );
}


