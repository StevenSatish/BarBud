import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/app/context/ThemeContext';

export default function ExerciseChartsTab({ exercise }: { exercise?: any }) {
  const { theme } = useTheme();
  return (
    <View className={`flex-1 bg-${theme}-background p-4`}>
      <Text className="text-typography-900 text-lg">Charts Tab</Text>
    </View>
  );
}


