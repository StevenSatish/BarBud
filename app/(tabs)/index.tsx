import { View, Text } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';

export default function History() {
  const { theme } = useTheme();
  return (
    <View className={`flex-1 justify-center items-center bg-${theme}-background`} >
      <Text className="text-white text-2xl font-bold">History</Text>
    </View>
  );
}