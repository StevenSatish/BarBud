// app/(tabs)/exerciseDatabase.tsx
import { View, Text, SectionList, ActivityIndicator, RefreshControl, KeyboardAvoidingView } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExerciseDB } from '../context/ExerciseDBContext';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Menu, MenuItemLabel, MenuItem } from '@/components/ui/menu';

// Static data arrays
const MUSCLE_GROUPS = [
  "Abs", "Back", "Biceps", "Chest", "Shoulders", "Quads", 
  "Forearms", "Calves", "Glutes", "Hamstrings", "Other"
];

const CATEGORIES = [
  "Barbell", "Bodyweight", "Weighted", "Cable", "Machine", "Other"
];

export default function ExerciseDatabase() {
  const { exerciseSections, loading, refreshExercises } = useExerciseDB();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim() && !selectedMuscleGroup && !selectedCategory) {
      return exerciseSections;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // Filter each section
    return exerciseSections
      .map(section => {
        // Filter exercises in each section
        const filteredData = section.data.filter(exercise => {
          // Text search filter
          const matchesSearch = !query || 
            exercise.name.toLowerCase().includes(query) 
          
          // Muscle group filter
          const matchesMuscleGroup = !selectedMuscleGroup || 
            exercise.muscleGroup === selectedMuscleGroup;
          
          // Category filter
          const matchesCategory = !selectedCategory || 
            exercise.category === selectedCategory;
          
          return matchesSearch && matchesMuscleGroup && matchesCategory;
        });
        
        // Return section with filtered data
        return {
          ...section,
          data: filteredData
        };
      })
      // Remove empty sections
      .filter(section => section.data.length > 0);
  }, [exerciseSections, searchQuery, selectedMuscleGroup, selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshExercises();
    setRefreshing(false);
  };

  const handleMuscleGroupSelect = (value: string) => {
    setSelectedMuscleGroup(value === selectedMuscleGroup ? '' : value);
  };

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value === selectedCategory ? '' : value);
  };
  
  const renderExerciseItem = ({ item, index, section }: any) => (
    <VStack 
      space="xs" 
      className={`py-4 px-6 w-full ${index === section.data.length - 1 ? '' : 'border-b border-gray-200'}`}
    >
      <Text className="text-white text-xl font-bold">
        {item.name} ({item.category})
      </Text>
      <HStack space="md" className="justify-between w-full">
        <Text className="text-gray-400 text-base">
          {item.muscleGroup}
        </Text>
        <HStack space="xs" className="items-center">
          <Entypo name="back-in-time" size={12} color="gray" />
          <Text className="text-gray-400 text-base">
            {"x days ago"}
          </Text>
        </HStack>
      </HStack>
    </VStack>
  );
  
  const renderSectionHeader = ({ section }: any) => (
    <View className="py-2 px-6 bg-background-100">
      <Text className="text-white text-xl font-bold">
        {section.title}
      </Text>
    </View>
  );
  
  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-background-0">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-background-0" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <Input className="h-12 mx-4 my-2 rounded-full bg-background-100">
          <InputField 
            autoComplete="off"
            placeholder="Search" 
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <InputSlot className="pr-4">
            <Ionicons name="search" size={20} color="white" />
          </InputSlot>
        </Input>
        <HStack className="w-full items-center justify-center gap-5">
          <Menu
            placement="bottom"
            offset={0}
            trigger={({ ...triggerProps }) => {
              return (
                <Button {...triggerProps} className={`rounded-full ${selectedMuscleGroup ? 'bg-info-200' : 'bg-background-800'}`}>
                  <ButtonText>{selectedMuscleGroup || "Any Muscle Group"}</ButtonText>
                </Button>
              )
            }}
          >
            {MUSCLE_GROUPS.map(group => (
              <MenuItem 
              key={group} 
              textValue={group} 
              onPress={() => handleMuscleGroupSelect(group)}
              className={`w-40 ${selectedMuscleGroup === group ? "bg-info-200" : ""}`}
            >    
              <MenuItemLabel size="lg">{group}</MenuItemLabel>
              {selectedMuscleGroup === group && (
                <View style={{flexGrow: 1, alignItems: 'flex-end', paddingRight: 8}}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </MenuItem>
            ))}
          </Menu>
          <Menu
            placement="bottom"
            offset={0}
            trigger={({ ...triggerProps }) => {
              return (
                <Button {...triggerProps} className={`rounded-full ${selectedCategory ? 'bg-info-200' : 'bg-background-800'}`}>
                  <ButtonText>{selectedCategory || "Any Category"}</ButtonText>
                </Button>
              )
            }}
          >
            {CATEGORIES.map(category => (
              <MenuItem 
              key={category} 
              textValue={category} 
              onPress={() => handleCategorySelect(category)}
              className={selectedCategory === category ? "bg-info-200" : ""}
            >    
              <MenuItemLabel size="lg">{category}</MenuItemLabel>
              {selectedCategory === category && (
                <View style={{flexGrow: 1, alignItems: 'flex-end', paddingRight: 8}}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </MenuItem>
            ))}
          </Menu>
        </HStack>
        <SectionList
          sections={filteredSections}
          renderItem={renderExerciseItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          stickySectionHeadersEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-white text-lg">
                {exerciseSections.length > 0 
                  ? "No exercises match your search" 
                  : "No exercises found"}
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}