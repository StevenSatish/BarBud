import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Box } from '@/components/ui/box';
import WorkoutIndicator from '../components/workoutIndicator';
import { View } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabsLayout() {
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1}}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.tab,
            borderTopWidth: 0,
            borderTopColor: colors.accent,
            paddingTop: 15,
            height: 100,
          },
          tabBarIconStyle: {
            marginBottom: 4, 
          },
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
        }}
      >
        <Tabs.Screen
          name="index"
          listeners={{
            focus: () => AsyncStorage.setItem('lastPage', 'index'),
            tabPress: () => AsyncStorage.setItem('lastPage', 'index'),
          }}
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar-sharp" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          listeners={{
            focus: () => AsyncStorage.setItem('lastPage', 'chat'),
            tabPress: () => AsyncStorage.setItem('lastPage', 'chat'),
          }}
          options={{
            title: 'Chat',
            tabBarIcon: ({ color }) => (
              <Ionicons name="chatbox-ellipses-sharp" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="startWorkout"
          listeners={{
            focus: () => AsyncStorage.setItem('lastPage', 'startWorkout'),
            tabPress: () => AsyncStorage.setItem('lastPage', 'startWorkout'),
          }}
          options={{
            title: 'Workout',
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-circle-sharp" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="historyDatabase"
          listeners={{
            focus: () => AsyncStorage.setItem('lastPage', 'historyDatabase'),
            tabPress: () => AsyncStorage.setItem('lastPage', 'historyDatabase'),
          }}
          options={{
            title: 'Exercises',
            tabBarIcon: ({ color }) => (
              <Ionicons name="barbell-sharp" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          listeners={{
            focus: () => AsyncStorage.setItem('lastPage', 'settings'),
            tabPress: () => AsyncStorage.setItem('lastPage', 'settings'),
          }}
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings-sharp" size={28} color={color} />
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
