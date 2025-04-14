// app/(tabs)/exerciseDatabase.tsx
import { View, Text, SectionList, ActivityIndicator, RefreshControl, KeyboardAvoidingView } from 'react-native';
import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExerciseDB } from '../context/ExerciseDBContext';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ExerciseDatabase() {
  const { exerciseSections, loading, refreshExercises } = useExerciseDB();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return exerciseSections;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // Filter each section
    return exerciseSections
      .map(section => {
        // Filter exercises in each section
        const filteredData = section.data.filter(exercise => 
          exercise.name.toLowerCase().includes(query) || 
          exercise.muscleGroup.toLowerCase().includes(query) ||
          exercise.category.toLowerCase().includes(query)
        );
        
        // Return section with filtered data
        return {
          ...section,
          data: filteredData
        };
      })
      // Remove empty sections
      .filter(section => section.data.length > 0);
  }, [exerciseSections, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshExercises();
    setRefreshing(false);
  };
  
  const renderExerciseItem = ({ item, index, section }: any) => (
    <View className={`py-4 px-6 w-full ${index === section.data.length - 1 ? '' : 'border-b border-gray-200'}`}>
      <Text className="text-white text-xl font-bold">
        {item.name} ({item.category})
      </Text>
      <Text className="text-gray-400 text-base">
        {item.muscleGroup}
      </Text>
    </View>
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