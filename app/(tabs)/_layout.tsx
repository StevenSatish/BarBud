import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';

export default function TabsLayout() {
  return (
    <Box className='flex-1'>
      <Tabs screenOptions={{
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopWidth: 2,
          borderTopColor: '#222222',
        },
        headerShown: false,  
      }}>
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
          name="exerciseDatabase"
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
    </Box>
  );
}
