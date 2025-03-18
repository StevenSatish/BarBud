import {SafeAreaView, Text} from 'react-native';
import { HStack } from '@/components/ui/hstack';

export default function HomeScreen() {
  return (
    <SafeAreaView>
      <HStack className='flex-1 justify-between'>
        <Text className='text-2xl font-bold'> Home </Text>
        <Text className='text-2xl font-bold'> Test </Text>
      </HStack>
    </SafeAreaView>
  );
}
