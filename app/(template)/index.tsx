import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Pressable } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/app/context/ThemeContext';
import { Entypo, FontAwesome5 } from '@expo/vector-icons';
import { consumeTemplateSelection } from './selectionStore';
import { doc, setDoc } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import useTemplateFolders from '@/app/context/TemplateFoldersContext';

type TemplateExercise = {
  uiId: string; // unique per row for UI
  exerciseId?: string; // stable exercise identifier (can repeat)
  name: string;
  sets: string;
  category: string;
};

export default function TemplateEditor() {
  const { theme } = useTheme();
  const { folderName, folderId, templateId: templateIdParam, templateName: templateNameParam, exercises: exercisesParam } =
    useLocalSearchParams<{
      folderName?: string;
      folderId?: string;
      templateId?: string;
      templateName?: string;
      exercises?: string;
    }>();
  const { fetchFolders, fetchTemplates } = useTemplateFolders();
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);
  const prefilledRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const selected = consumeTemplateSelection();
      if (!selected) return;
      setExercises((prev) => {
        const mapped = selected.map((ex, idx) => ({
          uiId: `${ex.id ?? ex.name ?? 'ex'}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          exerciseId: ex.id,
          name: ex.name ?? 'Exercise',
          sets: "",
          category: ex.category ?? "",
        }));
        return [...prev, ...mapped];
      });
    }, [])
  );

  useEffect(() => {
    if (prefilledRef.current) return;
    if (!templateIdParam) return;
    const parsedExercises = (() => {
      if (typeof exercisesParam !== 'string') return [];
      try {
        const arr = JSON.parse(exercisesParam);
        if (!Array.isArray(arr)) return [];
        return arr.map((ex: any, idx: number) => ({
          uiId: `${ex?.exerciseId ?? 'ex'}-${idx}-${Math.random().toString(16).slice(2, 6)}`,
          exerciseId: ex?.exerciseId ?? '',
          name: ex?.name ?? 'Exercise',
          sets: String(ex?.numSets ?? ''),
          category: ex?.category ?? '',
        })) as TemplateExercise[];
      } catch {
        return [];
      }
    })();
    setTemplateName(templateNameParam ?? '');
    setExercises(parsedExercises);
    prefilledRef.current = true;
  }, [templateIdParam, templateNameParam, exercisesParam]);

  const handleSaveTemplate = async () => {
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      setNameError(true);
      return;
    }

    try {
      setSaving(true);
      const user = FIREBASE_AUTH.currentUser;
      if (!user?.uid) {
        console.error('Cannot save template: no authenticated user');
        return;
      }

      const safeFolderId = typeof folderId === 'string' && folderId.length ? folderId : 'none';
      const templateId =
        (typeof templateIdParam === 'string' && templateIdParam.length
          ? templateIdParam
          : trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')) || 'template';

      const mappedExercises = exercises.map((ex, idx) => {
        const num = parseInt(ex.sets, 10);
        const numSets = Number.isFinite(num) && num > 0 ? num : 1;
        const exerciseId =
          ex.exerciseId ||
          ex.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') ||
          `exercise-${idx}`;
        return {
          exerciseId,
          category: ex.category,
          name: ex.name,
          numSets,
        };
      });

      await setDoc(doc(FIREBASE_DB, 'users', user.uid, 'folders', safeFolderId, 'templates', templateId), {
        templateName: trimmedName,
        exercises: mappedExercises,
      });

      const latestFolders = await fetchFolders();
      await fetchTemplates(latestFolders);
      router.replace('/(tabs)/startWorkout');
    } catch (e) {
      console.error('Failed to save template', e);
    } finally {
      setSaving(false);
    }
  };

  const renderItem = useCallback(
    ({ item, drag}: RenderItemParams<TemplateExercise>) => (
      <HStack
        className={`items-center justify-between rounded border border-outline-100 bg-${theme}-button px-3 py-3`}
      >
        <HStack className="items-center gap-3 flex-1">
          <Pressable onLongPress={drag} onPressIn={drag} delayLongPress={120} hitSlop={10}>
            <Entypo name="menu" size={20} color="white" />
          </Pressable>
          <Text className="text-typography-800 text-base flex-1 mr-3">
            {item.name} {`(${item.category})`}
          </Text>
        </HStack>
        <HStack className="items-center gap-2">
          <Text className="text-typography-700">sets:</Text>
          <TextInput
            className="text-typography-800 border border-outline-200 rounded px-2 py-1 w-16 text-center"
            keyboardType="numeric"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={item.sets}
            onChangeText={(num) => {
              if (!/^\d*$/.test(num)) return;
              setExercises((prev) =>
                prev.map((ex) => (ex.uiId === item.uiId ? { ...ex, sets: num } : ex))
              );
            }}
          />
          <Pressable
            onPress={() => setExercises((prev) => prev.filter((ex) => ex.uiId !== item.uiId))}
            hitSlop={10}
            className="ml-2"
          >
            <Entypo name="trash" size={18} color="rgba(220, 38, 38, 0.8)" />
          </Pressable>
        </HStack>
      </HStack>
    ),
    [theme]
  );

  return (
    <SafeAreaView className={`flex-1 bg-${theme}-background`}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <VStack space="md" className="flex-1 px-4 py-4">
          <HStack className="items-center justify-between">
            <Pressable onPress={() => router.replace('/(tabs)/startWorkout'  )} className="w-12 items-start">
              <FontAwesome5 name="chevron-left" size={22} color="white" />
            </Pressable>
            <Box className="flex-1 items-center">
              <Text size="3xl" className="text-typography-800 text-center">
                {folderName && folderName !== 'None' ? `Folder: ${folderName}` : 'Template Editor'}
              </Text>
            </Box>
            <Box className="w-12" />
          </HStack>
          <Box className="w-full">
            <TextInput
              className={`text-typography-800 text-3xl border rounded py-2 border-${nameError ? 'error-700' : `${theme}-background`
                }`}
              placeholder="Template Name..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={templateName}
              onChangeText={(text) => {
                setTemplateName(text);
                if (nameError && text.trim()) setNameError(false);
              }}
            />
          </Box>

          {exercises.length > 0 && <DraggableFlatList
            scrollEnabled={exercises.length > 8}
            data={exercises}
            keyExtractor={(item: TemplateExercise) => item.uiId}
            renderItem={renderItem}
            onDragEnd={({ data }: { data: TemplateExercise[] }) => setExercises(data)}
            activationDistance={0}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
          />
          }
          <VStack space="sm" className="mt-2">
            <Button
              className={`bg-${theme}-button`}
              action="secondary"
              onPress={() =>
                router.push({
                  pathname: '/(template)/AddExersiceDatabaseProxy',
                  params: { mode: 'template', folderName: folderName ?? '', folderId: '' },
                })
              }
            >
              <ButtonText className="text-primary-800">Add Exercises</ButtonText>
            </Button>
            <Button className={`bg-${theme}-accent`} onPress={handleSaveTemplate} isDisabled={saving}>
              <ButtonText className="text-typography-800">Save Template</ButtonText>
            </Button>
            <Button
              variant="link" action="negative" onPress={() => router.replace('/(tabs)/startWorkout')}>
              <ButtonText className="text-error-700">Discard Template</ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}

