import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import WorkoutIndicator from '../components/workoutIndicator';
import { View } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';

export default function TabsLayout() {
  const { colors } = useTheme();

  console.log(colors)
  
  return (
    <View style={{ flex: 1}}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopWidth: 0,
            borderTopColor: colors.accent,
          },
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
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
