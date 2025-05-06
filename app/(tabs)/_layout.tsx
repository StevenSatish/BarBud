import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import WorkoutIndicator from '../components/workoutIndicator';
import { View } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';

export default function TabsLayout() {
  const { theme } = useTheme();
  return (
    <View className={`flex-1 bg-${theme}-background`}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: 'rgb(var(--color-blue-background))',
            borderTopWidth: 1,
            borderTopColor: '#222222',
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar-sharp" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="startWorkout"
          options={{
            title: 'Workout',
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-circle-sharp" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="historyDatabase"
          options={{
            title: 'Exercises',
            tabBarIcon: ({ color }) => (
              <Ionicons name="barbell-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
      
      <Box 
        style={{
          position: 'absolute',
          bottom: 33,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <WorkoutIndicator />
      </Box>
    </View>
  );
}
