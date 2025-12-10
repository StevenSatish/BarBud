import { Box } from '@/components/ui/box';
import { useWorkout } from '../context/WorkoutContext';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/app/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Entypo } from '@expo/vector-icons';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetSectionHeaderText,
} from '@/components/ui/actionsheet';
import useTemplateFolders from '@/app/context/TemplateFoldersContext';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { doc, setDoc } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import TemplateCard from '@/app/components/templateCard';


export default function StartWorkoutTab() {
  const { startWorkout } = useWorkout();
  const { theme, colors } = useTheme();
  const { folders, foldersLoading, fetchFolders, templatesByFolder, templatesLoading } = useTemplateFolders();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFolderInvalid, setIsFolderInvalid] = useState(false);
  const [folderInputKey, setFolderInputKey] = useState(0);
  const folderDraftRef = useRef('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const orderedFolders = useMemo(() => {
    const nonNone = folders.filter((f) => f.id !== 'none');
    const none = folders.filter((f) => f.id === 'none');
    return [...nonNone, ...none];
  }, [folders]);

  const openTemplateSheet = async () => {
    setIsSheetOpen(true);
    if (folders.length === 0) {
      fetchFolders();
    }
  };

  const handleCreateFolder = async () => {
    const trimmed = folderDraftRef.current.trim();
    if (!trimmed) {
      setIsFolderInvalid(true);
      return;
    }
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user?.uid) {
        console.error('Cannot create folder: no authenticated user');
        return;
      }
      const folderId = trimmed.toLowerCase().replace(/\s+/g, '-');
      const ref = doc(FIREBASE_DB, 'users', user.uid, 'folders', folderId);
      await setDoc(ref, { name: trimmed });
      setIsFolderModalOpen(false);
      setIsFolderInvalid(false);
      folderDraftRef.current = '';
      setFolderInputKey((k) => k + 1);
      fetchFolders();
    } catch (e) {
      console.error('Failed to create folder', e);
    }
  };

  const openFolderModal = () => {
    setIsFolderInvalid(false);
    setIsFolderModalOpen(true);
  };

  const closeFolderModal = () => {
    setIsFolderModalOpen(false);
  };

  return (
    <SafeAreaView className={`flex-1 bg-${theme}-background`}>
      <Box className={`flex-1 bg-${theme}-background`}>
        <Box className='px-4 py-4 gap-3'>
          <Box className='w-full flex-row justify-between items-center'>
            <Button className={`bg-${theme}-button`} action='secondary' size='xl' onPress={openTemplateSheet}>
              <Entypo name="plus" size={18} color={colors.light} />
              <ButtonText>Template</ButtonText>
              <Entypo name="list" size={18} color={colors.light} />
            </Button>
            <Button className={`bg-${theme}-button w-1/2`} action='secondary' size='xl' onPress={openFolderModal}>
              <Entypo name="plus" size={18} color={colors.light} />
              <ButtonText>Folder</ButtonText>
              <Entypo name="folder" size={18} color={colors.light} />
            </Button>
          </Box>
          <Box className='items-center mt-1 mb-1'>
            <Button onPress={startWorkout} className={`bg-${theme}-accent`}>
              <ButtonText className='text-typography-800'>
                Start Empty Workout
              </ButtonText>
            </Button>
          </Box>
        </Box>

        <ScrollView
          className='flex-1'
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingBottom: 16,
            gap: 12,
          }}
        >
          <Box className='flex-1'>
            {orderedFolders.map((f) => {
              const isOpen = openFolders[f.id];
              const templates = templatesByFolder[f.id] ?? [];
              const isNone = f.id === 'none' || f.name === 'None';

              if (isNone) {
                return (
                  <Box key={f.id} className='gap-2 mb-2'>
                    {templates.map((t) => <TemplateCard key={t.id} template={t} />)}
                  </Box>
                );
              }

              return (
                <Box key={f.id} className='mb-2'>
                  <Pressable
                    onPress={() =>
                      setOpenFolders((prev) => ({
                        ...prev,
                        [f.id]: !prev[f.id],
                      }))
                    }
                  >
                    <HStack
                      className={`items-center justify-between rounded border border-outline-100 bg-${theme}-button px-3 py-3`}
                    >
                      <HStack className='items-center gap-2'>
                        <Entypo
                          name={isOpen ? 'chevron-down' : 'chevron-right'}
                          size={18}
                          color={colors.light}
                        />
                        <Entypo name="folder" size={18} color={colors.light} />
                        <Text className='text-typography-900 text-lg'>{f.name}</Text>
                      </HStack>
                      <Entypo name="dots-three-horizontal" size={18} color="white"/>
                    </HStack>
                  </Pressable>
                  {isOpen ? (
                    <Box className='pl-8 pr-2 py-2 gap-2'>
                      {templates.length ? (
                        templates.map((t) => <TemplateCard key={t.id} template={t} />)
                      ) : (
                        <Text className='text-typography-700'>No templates in this folder.</Text>
                      )}
                    </Box>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        </ScrollView>
      </Box>

      <Actionsheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        <ActionsheetBackdrop onPress={() => setIsSheetOpen(false)} />
        <ActionsheetContent className={`bg-${theme}-background`}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetSectionHeaderText size='lg' className='text-typography-900'>
            Select a Folder
          </ActionsheetSectionHeaderText>

          {foldersLoading ? (
            <ActionsheetItem disabled>
              <ActionsheetItemText>Loading...</ActionsheetItemText>
            </ActionsheetItem>
          ) : (
            orderedFolders.map((f) => (
              <ActionsheetItem
                key={f.id}
                onPress={() => {
                  setIsSheetOpen(false);
                  router.replace({
                    pathname: '/(template)',
                    params: { folderId: f.id, folderName: f.name },
                  });
                }}
              >
                {f.id !== `none` ? <Entypo name="folder" size={18} color={colors.light} /> : null}
                <ActionsheetItemText size='lg' className='text-typography-900'>{f.name}</ActionsheetItemText>
              </ActionsheetItem>
            ))
          )}
        </ActionsheetContent>
      </Actionsheet>

      <Modal isOpen={isFolderModalOpen} onClose={closeFolderModal}>
        <ModalBackdrop onPress={closeFolderModal} />
        <ModalContent size="sm" className={`bg-${theme}-background border-${theme}-steelGray`}>
          <ModalHeader>
            <HStack className='flex-1' space='md'>
              <Text size='2xl' className='text-typography-900'>Create New Folder</Text>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <Box className='gap-3'>
              <Box
                className={`w-full rounded border px-3 py-2 ${isFolderInvalid
                  ? 'border-error-700'
                  : 'border-secondary-900'
                  }`}
              >
                <TextInput
                  key={folderInputKey}
                  className='text-typography-900'
                  placeholder="Folder name"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  onChangeText={(t) => {
                    folderDraftRef.current = t;
                  }}
                />
              </Box>
            </Box>
          </ModalBody>
          <ModalFooter className='flex-row justify-between items-center px-4'>
            <Button
              variant='link'
              action='negative'
              onPress={() => {
                closeFolderModal();
                setIsFolderInvalid(false);
                folderDraftRef.current = '';
                setFolderInputKey((k) => k + 1);
              }}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button onPress={handleCreateFolder}>
              <ButtonText>OK</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </SafeAreaView>
  );
}