import { View, SectionList, ActivityIndicator, KeyboardAvoidingView, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import useExerciseDB  from '../context/ExerciseDBContext';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Menu, MenuItemLabel, MenuItem } from '@/components/ui/menu';
import NewExerciseModal from '../components/newExerciseModal';
import { useTheme } from '@/app/context/ThemeContext';
import { router } from 'expo-router';
import { Divider } from '@/components/ui/divider';
import { Platform } from 'react-native';


// Static data arrays
const MUSCLE_GROUPS = [
  "Abs", "Back", "Biceps", "Chest", "Shoulders", "Quads", 
  "Forearms", "Calves", "Glutes", "Hamstrings", "Other"
];

const CATEGORIES = [
  "Barbell", "Dumbbell", "Bodyweight", "Weighted", "Cable", "Machine", "Other"
];

export default function HistoryDatabase() {
  const { theme } = useTheme();
  const { exerciseSections, loading } = useExerciseDB();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showNewExerciseModal, setShowNewExerciseModal] = useState(false);

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
  
  const formatLastPerformed = useCallback((value) => {
    if (!value) return null;
    let date = null;
    try {
      if (value && typeof value.toDate === 'function') {
        date = value.toDate();
      } else if (value && typeof value === 'object' && typeof value.seconds === 'number') {
        date = new Date(value.seconds * 1000);
      } else if (typeof value === 'number') {
        date = new Date(value);
      } else if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) date = parsed;
      }
    } catch {}
    if (!date) return null;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) return null;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 24) {
      const h = Math.max(1, hours);
      return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
    }
    const days = Math.floor(hours / 24);
    const d = Math.max(1, days);
    return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  }, []);

  const handleOpenExercise = useCallback((exercise) => {
    try {
      router.push({
        pathname: '/(exerciseHistory)',
        params: { exerciseId: exercise.id, data: JSON.stringify(exercise) },
      });
    } catch {}
  }, []);

  const keyExtractor = useCallback((item) => item.id, []);

  const ExerciseRow = React.memo(function ExerciseRow({ item, onPress, lastPerformedLabel }) {
    return (
      <Pressable onPress={() => onPress(item)}>
        <VStack space="xs" className="py-4 px-6 w-full">
          <Text className="text-xl font-bold text-typography-800">
            {item.name} ({item.category})
          </Text>
          <HStack space="md" className="justify-between w-full">
            <Text className="text-gray-400 text-base">
              {item.muscleGroup}
            </Text>
            {lastPerformedLabel ? (
              <HStack space="xs" className="items-center">
                <Entypo name="back-in-time" size={12} color="gray" />
                <Text className="text-gray-400 text-base">{lastPerformedLabel}</Text>
              </HStack>
            ) : null}
          </HStack>
        </VStack>
      </Pressable>
    );
  });

  const renderExerciseItem = useCallback(({ item }) => {
    const lastPerformedLabel = formatLastPerformed(item.lastPerformedAt);
    return (
      <ExerciseRow
        item={item}
        onPress={handleOpenExercise}
        lastPerformedLabel={lastPerformedLabel}
      />
    );
  }, [formatLastPerformed, theme, handleOpenExercise]);

  const renderSectionHeader = useCallback(({ section }) => (
    <View className={`py-2 px-2 bg-${theme}-background`}>
      <Text className="text-white font-bold">{section.title}</Text>
    </View>
  ), [theme]);

  const ItemSeparator = useCallback(() => (
    <Divider className={`bg-${theme}-lightGray`} orientation="horizontal" />
  ), [theme]);
  
  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center bg-${theme}-background`}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }
  
  return (
    <SafeAreaView className={`flex-1 bg-${theme}-background`} edges={['top', 'left', 'right']}>
      <NewExerciseModal 
        isOpen={showNewExerciseModal} 
        onClose={() => setShowNewExerciseModal(false)} 
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="w-full items-center justify-center px-4 py-3">
          <Text className="text-typography-800 text-2xl font-bold text-center">Exercise Database</Text>
        </View>
        <HStack className="w-full items-center justify-between px-4 my-2">
          <Input className="h-12 rounded-full bg-background-100 w-3/4 pr-2">
            <InputField 
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              keyboardType="ascii-capable"
              textContentType="oneTimeCode"
            />
            <InputSlot className="pr-4">
              <Ionicons name="search" size={20} color="white" />
            </InputSlot>
          </Input>
          <Button 
            className="rounded-full ml-2 px-3"
            onPress={() => setShowNewExerciseModal(true)}
          >
            <ButtonText>New</ButtonText>
            <Ionicons name="add" size={18} color="black"/>
          </Button>
        </HStack>
        <HStack className="w-full items-center justify-center gap-2 pb-1">
          <Menu
            placement="bottom"
            offset={0}
            trigger={({ ...triggerProps }) => {
              return (
                <Button {...triggerProps} className={`rounded-full ${selectedMuscleGroup ? `bg-${theme}-light` : 'bg-background-800'}`}>
                  <ButtonText className={`text-${theme}-background`}>{selectedMuscleGroup || "Any Muscle Group"}</ButtonText>
                </Button>
              )
            }}
          >
            {MUSCLE_GROUPS.map(group => (
              <MenuItem 
              key={group} 
              textValue={group} 
              onPress={() => handleMuscleGroupSelect(group)}
              className={`w-40 ${selectedMuscleGroup === group ? `bg-${theme}-accent` : ""}`}
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
                <Button {...triggerProps} className={`rounded-full ${selectedCategory ? `bg-${theme}-light` : 'bg-background-800'}`}>
                  <ButtonText >{selectedCategory || "Any Category"}</ButtonText>
                </Button>
              )
            }}
          >
            {CATEGORIES.map(category => (
              <MenuItem 
              key={category} 
              textValue={category} 
              onPress={() => handleCategorySelect(category)}
              className={selectedCategory === category ? `bg-${theme}-accent` : ""}
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
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={12}
          maxToRenderPerBatch={16}
          windowSize={8}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          contentContainerStyle={{ paddingVertical: 8 }}
          stickySectionHeadersEnabled={true}
          ItemSeparatorComponent={ItemSeparator}
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