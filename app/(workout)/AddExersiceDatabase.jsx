import { View, Text, SectionList, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import useExerciseDB  from '../context/ExerciseDBContext';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { Menu, MenuItemLabel, MenuItem } from '@/components/ui/menu';
import { router } from 'expo-router';

// Static data arrays
const MUSCLE_GROUPS = [
  "Abs", "Back", "Biceps", "Chest", "Shoulders", "Quads", 
  "Forearms", "Calves", "Glutes", "Hamstrings", "Other"
];

const CATEGORIES = [
  "Barbell", "Bodyweight", "Weighted", "Cable", "Machine", "Other"
];

const ExerciseItem = React.memo(({ item, isSelected, onToggle }) => {
  return (
    <Pressable 
      onPress={onToggle}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <VStack 
        space="xs" 
        className={`py-4 px-6 w-full ${isSelected ? 'bg-info-200' : ''}`}
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
    </Pressable>
  );
});

export default function AddExerciseDatabase() {
  const { exerciseSections, loading} = useExerciseDB();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedExercises, setSelectedExercises] = useState({});

  const handleExerciseToggle = (exercise) => {
    setSelectedExercises(prev => {
      const newSelected = {...prev};
      if (newSelected[exercise.id]) {
        delete newSelected[exercise.id];
      } else {
        newSelected[exercise.id] = exercise;
      }
      return newSelected;
    });
  };

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


  const handleMuscleGroupSelect = (value) => {
    setSelectedMuscleGroup(value === selectedMuscleGroup ? '' : value);
  };

  const handleCategorySelect = (value) => {
    setSelectedCategory(value === selectedCategory ? '' : value);
  };
  
  const renderExerciseItem = ({ item, index, section }) => {
    const isSelected = Boolean(selectedExercises[item.id]);
    
    return (
      <ExerciseItem 
        item={item} 
        index={index}
        section={section}
        isSelected={isSelected}
        onToggle={() => handleExerciseToggle(item)}
      />
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View className="py-2 px-6 bg-background-100">
      <Text className="text-white text-xl font-bold">
        {section.title}
      </Text>
    </View>
  );
  
  const handleAddExercises = () => {
    // Process selected exercises here
    router.back();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-0">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-background-0">
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
    </View>
  );
}