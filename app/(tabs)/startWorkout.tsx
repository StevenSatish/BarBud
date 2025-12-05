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
import React, { useRef, useState } from 'react';
import { TextInput } from 'react-native';


export default function StartWorkoutTab() {
  const { startWorkout } = useWorkout();
  const { theme, colors } = useTheme();
  const { folders, foldersLoading, fetchFolders } = useTemplateFolders();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFolderInvalid, setIsFolderInvalid] = useState(false);
  const [folderInputKey, setFolderInputKey] = useState(0);
  const folderDraftRef = useRef('');

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
      <Box className={`flex-1 justify-center items-center bg-${theme}-background`}>
        <Box className='absolute top-0 left-0 right-0 flex-row justify-between items-center p-4'>
          <Button variant='outline' action='secondary' size='sm' onPress={openTemplateSheet}>
            <Entypo name="plus" size={18} color={colors.light} />
            <ButtonText>Template</ButtonText>
          </Button>
          <Button variant='outline' action='secondary' size='sm' onPress={openFolderModal}>
            <Entypo name="plus" size={18} color={colors.light} />
            <Entypo name="folder" size={18} color={colors.light} />
            <ButtonText>Folder</ButtonText>
          </Button>
        </Box>

        <Button onPress={startWorkout} className={`bg-${theme}-accent`}>
          <ButtonText className='text-typography-800'>
            Start Workout
          </ButtonText>
        </Button>
      </Box>

      <Actionsheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        <ActionsheetBackdrop onPress={() => setIsSheetOpen(false)} />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetSectionHeaderText>
            Select a Folder
          </ActionsheetSectionHeaderText>

          {foldersLoading ? (
            <ActionsheetItem disabled>
              <ActionsheetItemText>Loading...</ActionsheetItemText>
            </ActionsheetItem>
          ) : (
            folders.map((f) => (
              <ActionsheetItem key={f.id} onPress={() => {}}>
                <ActionsheetItemText>{f.name}</ActionsheetItemText>
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
                className={`w-full rounded border px-3 py-2 ${
                  isFolderInvalid
                    ? 'border-error-700'
                    : 'border-primary-500'
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