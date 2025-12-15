import { View, SectionList, ActivityIndicator, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import React, { useState, useMemo, useCallback } from 'react';
import useExerciseDB  from '../context/ExerciseDBContext';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Menu, MenuItemLabel, MenuItem } from '@/components/ui/menu';
import { router, useLocalSearchParams } from 'expo-router';
import { setTemplateSelection } from '../(template)/selectionStore';
import { useWorkout } from '../context/WorkoutContext';
import NewExerciseModal from '../components/newExerciseModal';
import { useTheme } from '@/app/context/ThemeContext';
import { Divider } from '@/components/ui/divider';

// Static data arrays
const MUSCLE_GROUPS = [
  "Abs", "Back", "Biceps", "Chest", "Shoulders", "Quads", 
  "Forearms", "Calves", "Glutes", "Hamstrings", "Other"
];

const CATEGORIES = [
  "Barbell", "Bodyweight", "Weighted", "Cable", "Machine", "Other"
];

const ExerciseItem = React.memo(({ item, isSelected, onToggle }) => {
  const { theme } = useTheme();
  const formatLastPerformed = (value) => {
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
  };
  const lastPerformedLabel = formatLastPerformed(item.lastPerformedAt);
  return (
    <TouchableOpacity 
      onPress={onToggle}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <VStack 
        space="xs"
        className={`${isSelected ? `bg-${theme}-button` : ""} py-4 px-6 w-full`}
      >
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
              <Text className="text-gray-400 text-base">
                {lastPerformedLabel}
              </Text>
            </HStack>
          ) : null}
        </HStack>
      </VStack>
    </TouchableOpacity>
  );
}, (prev, next) => prev.isSelected === next.isSelected && prev.item.id === next.item.id);

export default function AddExerciseDatabase() {
  const { theme } = useTheme();
  const { exerciseSections, loading} = useExerciseDB();
  const { addExercises, replaceExerciseWith } = useWorkout();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedExercises, setSelectedExercises] = useState({});
  const [showNewExerciseModal, setShowNewExerciseModal] = useState(false);
  const { targetInstanceId, mode, folderName = '', folderId = '' } = useLocalSearchParams();

  const handleExerciseToggle = useCallback((exercise) => {
    setSelectedExercises(prev => {
      const newSelected = { ...prev };
      if (newSelected[exercise.id]) {
        delete newSelected[exercise.id];
      } else {
        newSelected[exercise.id] = exercise;
      }
      return newSelected;
    });
  }, []);

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
  
  const keyExtractor = useCallback((item) => item.id, []);

  const renderExerciseItem = useCallback(({ item, index, section }) => {
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
  }, [selectedExercises, handleExerciseToggle]);

  const renderSectionHeader = useCallback(({ section }) => (
    <>
    <View className={`py-2 px-2`}>
      <Text className="text-white font-bold">
        {section.title}
      </Text>
    </View>
    </>
  ), []);

  const ItemSeparator = useCallback(() => (
    <Divider className={`bg-${theme}-accent`} orientation="horizontal" />
  ), [theme]);
  
  const handleAddExercises = () => {
    const chosen = Object.values(selectedExercises);
    if (chosen.length === 0) return;

    const normalized = chosen.map((ex) => ({
      exerciseId: ex.exerciseId ?? ex.id,
      name: ex.name,
      category: ex.category,
      muscleGroup: ex.muscleGroup,
      secondaryMuscles: ex.secondaryMuscles ?? [],
      trackingMethods: ex.trackingMethods ?? [],
      notes: ex.notes,
    }));

    // Template mode: return selection to template editor
    if (mode === 'template') {
      setTemplateSelection(
        chosen.map((ex) => ({
          id: ex.id,
          name: ex.name,
          category: ex.category,
        }))
      );
      router.back();
      return;
    }

    // Workout mode (existing behavior)
    if (targetInstanceId) {
      replaceExerciseWith(String(targetInstanceId), normalized);
      router.back();
      return;
    }
    addExercises(normalized);
    router.back();
  };

  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center bg-${theme}-background`}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }
  
  return (
    <View className={`flex-1 bg-${theme}-background`}>
      <NewExerciseModal 
        isOpen={showNewExerciseModal} 
        onClose={() => setShowNewExerciseModal(false)} 
      />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <HStack className="w-full items-center justify-between px-4 my-2">
          <Input className="h-12 rounded-full bg-background-100 w-3/4">
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
          {(() => {
            const selectedCount = Object.keys(selectedExercises).length;
            const isAddEnabled = selectedCount > 0;
            return (
              <Button
                onPress={isAddEnabled ? handleAddExercises : undefined}
                disabled={!isAddEnabled}
                isDisabled={!isAddEnabled}
                accessibilityState={{ disabled: !isAddEnabled }}
                variant="link"
                action="default"
              >
                <ButtonText className={isAddEnabled ? `text-${theme}-light` : `text-${theme}-lightGray`}>
                  {targetInstanceId ? 'Replace' : 'Add'} ({selectedCount})
                </ButtonText>
              </Button>
            );
          })()}
        </HStack>
        <HStack className="w-full items-center justify-center gap-2 pb-1">
          <Menu
            zIndex={1000}
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
            zIndex={1000}
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
          <Button 
            className="rounded-full w-15"
            onPress={() => setShowNewExerciseModal(true)}
          >
            <ButtonText>New</ButtonText>
            <Ionicons name="add" size={20} color="black"/>
          </Button>
        </HStack>
        <SectionList
          sections={filteredSections}
          renderItem={renderExerciseItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          extraData={selectedExercises}
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
    </View>
  );
}