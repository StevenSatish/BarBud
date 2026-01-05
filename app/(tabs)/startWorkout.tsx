import { Box } from '@/components/ui/box';
import { useWorkout } from '../context/WorkoutContext';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/app/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
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
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import TemplateCard from '@/app/components/templateCard';
import { Menu, MenuItem, MenuItemLabel } from '@/components/ui/menu';

export default function StartWorkoutTab() {
  const { startWorkout } = useWorkout();
  const { theme, colors } = useTheme();
  const { folders, foldersLoading, fetchFolders, templatesByFolder, fetchTemplates } = useTemplateFolders();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFolderInvalid, setIsFolderInvalid] = useState(false);
  const [folderInputKey, setFolderInputKey] = useState(0);
  const folderDraftRef = useRef('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<{ id: string; name: string } | null>(null);
  const renameDraftRef = useRef('');
  const [renameInputKey, setRenameInputKey] = useState(0);
  const [renameInvalid, setRenameInvalid] = useState(false);
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

  const handleOpenDeleteModal = (folder: { id: string; name: string }) => {
    setFolderToDelete(folder);
    setDeleteModalOpen(true);
  };

  const handleOpenRenameModal = (folder: { id: string; name: string }) => {
    setFolderToRename(folder);
    renameDraftRef.current = folder.name ?? '';
    setRenameInputKey((k) => k + 1);
    setRenameInvalid(false);
    setRenameModalOpen(true);
  };

  const handleRenameFolder = async () => {
    if (!folderToRename) return;
    if (folderToRename.id === 'none') {
      setRenameModalOpen(false);
      return;
    }
    const trimmed = renameDraftRef.current.trim();
    if (!trimmed) {
      setRenameInvalid(true);
      return;
    }
    setRenameModalOpen(false);
    setFolderToRename(null);
    setRenameInvalid(false);
    const newId = trimmed.toLowerCase().replace(/\s+/g, '-');
    const oldId = folderToRename.id;
    renameDraftRef.current = '';
    setRenameInputKey((k) => k + 1);
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user?.uid) {
        console.error('Cannot rename folder: no authenticated user');
        return;
      }

      if (newId === oldId) {
        await setDoc(
          doc(FIREBASE_DB, 'users', user.uid, 'folders', oldId),
          { name: trimmed },
          { merge: true }
        );
      } else {
        // create/update new folder doc
        await setDoc(doc(FIREBASE_DB, 'users', user.uid, 'folders', newId), { name: trimmed }, { merge: true });

        // copy templates to new folder
        const oldTemplatesRef = collection(FIREBASE_DB, 'users', user.uid, 'folders', oldId, 'templates');
        const oldTemplatesSnap = await getDocs(oldTemplatesRef);
        const copyPromises = oldTemplatesSnap.docs.map((d) =>
          setDoc(doc(FIREBASE_DB, 'users', user.uid, 'folders', newId, 'templates', d.id), d.data())
        );
        await Promise.all(copyPromises);

        // delete old templates and folder
        const deletePromises = oldTemplatesSnap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        await deleteDoc(doc(FIREBASE_DB, 'users', user.uid, 'folders', oldId));

        // keep open state for renamed folder
        setOpenFolders((prev) => {
          const wasOpen = !!prev[oldId];
          const next = { ...prev };
          delete next[oldId];
          if (wasOpen) next[newId] = true;
          return next;
        });
      }

      const latestFolders = await fetchFolders();
      await fetchTemplates(latestFolders);
    } catch (e) {
      console.error('Failed to rename folder', e);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    const { id } = folderToDelete;
    if (id === 'none') {
      setDeleteModalOpen(false);
      setFolderToDelete(null);
      return;
    }
    try {
      setDeletingFolder(true);
      const user = FIREBASE_AUTH.currentUser;
      if (!user?.uid) {
        console.error('Cannot delete folder: no authenticated user');
        return;
      }

      const templatesRef = collection(FIREBASE_DB, 'users', user.uid, 'folders', id, 'templates');
      const templatesSnap = await getDocs(templatesRef);
      const deletions = templatesSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletions);

      await deleteDoc(doc(FIREBASE_DB, 'users', user.uid, 'folders', id));

      const latestFolders = await fetchFolders();
      await fetchTemplates(latestFolders);
      setOpenFolders((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (e) {
      console.error('Failed to delete folder', e);
    } finally {
      setDeletingFolder(false);
      setDeleteModalOpen(false);
      setFolderToDelete(null);
    }
  };

  return (
    <SafeAreaView className={`flex-1 bg-${theme}-background`}>
      <Box className={`flex-1 bg-${theme}-background`}>
        <Box className='px-4 pt-3 pb-2 gap-3'>
          <Box className='w-full flex-row items-center gap-2'>
            <Button className={`bg-${theme}-button flex-1`} action='secondary' size='xl' onPress={openTemplateSheet}>
              <ButtonText size='md'>Create Template</ButtonText>
              <Feather name="list" size={18} color={colors.light} />
            </Button>
            <Button className={`bg-${theme}-button flex-1`} action='secondary' size='xl' onPress={openFolderModal}>
              <ButtonText size='md'>Create Folder</ButtonText>
              <Feather name="folder-plus" size={18} color={colors.light} />
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
            paddingHorizontal: 14,
            paddingBottom: 18,
            paddingTop: 6,
            gap: 10,
          }}
        >
          <Box className='flex-1'>
            {orderedFolders.map((f) => {
              const isOpen = openFolders[f.id];
              const templates = templatesByFolder[f.id] ?? [];
              const isNone = f.id === 'none' || f.name === 'None';

              if (isNone) {
                return (
                  <Box key={f.id} className='gap-2 mb-3 pt-1'>
                    {templates.map((t) => <TemplateCard key={t.id} template={t} folderId={f.id} folderName={f.name} />)}
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
                      className='items-center justify-between px-1 py-2'
                    >
                      <HStack className='items-center gap-2'>
                        <Feather
                          name={isOpen ? 'chevron-down' : 'chevron-right'}
                          size={16}
                          color="rgba(255,255,255,0.65)"
                        />
                        <Feather name="folder" size={24} color="rgba(255,255,255,0.65)" />
                        <Text size="2xl" bold className='text-typography-800'>{f.name}</Text>
                      </HStack>
                      <Menu
                        className={`bg-${theme}-background`}
                        placement="bottom left"
                        offset={4}
                        trigger={({ ...triggerProps }) => (
                          <Pressable hitSlop={10} {...triggerProps}>
                            <Feather name="more-horizontal" size={18} color="white" />
                          </Pressable>
                        )}
                      >
                        <MenuItem textValue="Rename" onPress={() => handleOpenRenameModal(f)}>
                          <MenuItemLabel size="lg">Rename</MenuItemLabel>
                        </MenuItem>
                        <MenuItem textValue="Delete" onPress={() => handleOpenDeleteModal(f)}>
                          <MenuItemLabel size="lg" className={`text-error-700`}>Delete</MenuItemLabel>
                        </MenuItem>
                      </Menu>
                    </HStack>
                  </Pressable>
                  <Box className='border-b border-outline-100 opacity-50' />
                  {isOpen ? (
                    <Box className='pl-10 pr-0 pt-2 pb-3 gap-2'>
                      {templates.length ? (
                        templates.map((t) => <TemplateCard key={t.id} template={t} folderId={f.id} folderName={f.name} />)
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
          <ActionsheetSectionHeaderText size='lg' className='text-typography-800'>
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
                {f.id !== `none` ? <Feather name="folder" size={18} color={colors.light} /> : null}
                <ActionsheetItemText size='lg' className='text-typography-800'>{f.name}</ActionsheetItemText>
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
              <Text size='2xl' className='text-typography-800'>Create New Folder</Text>
            </HStack>
          </ModalHeader>
          <ModalBody scrollEnabled={false}>
            <Box className='gap-3'>
              <Box
                className={`w-full rounded border px-3 py-2 ${isFolderInvalid
                  ? 'border-error-700'
                  : 'border-secondary-900'
                  }`}
              >
                <TextInput
                  key={folderInputKey}
                  className='text-typography-800 w-full'
                  placeholder="Folder name"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline={false}
                  autoCorrect={false}
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

      <Modal isOpen={renameModalOpen} onClose={() => { if (!deletingFolder) setRenameModalOpen(false); }}>
        <ModalBackdrop onPress={() => { if (!deletingFolder) setRenameModalOpen(false); }} />
        <ModalContent size="sm" className={`bg-${theme}-background border-${theme}-steelGray`}>
          <ModalHeader>
            <HStack className='flex-1' space='md'>
              <Text size='2xl' className='text-typography-800'>Rename Folder</Text>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <Box className='gap-3'>
              <Box
                className={`w-full rounded border px-3 py-2 ${
                  renameInvalid ? 'border-error-700' : 'border-secondary-900'
                }`}
              >
                  <TextInput
                    key={renameInputKey}
                    className='text-typography-800 w-full'
                    placeholder="Folder name"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    multiline={false}
                    scrollEnabled={false}
                    autoCapitalize="none"
                    autoCorrect={false}
                    defaultValue={renameDraftRef.current}
                    onChangeText={(t) => {
                      renameDraftRef.current = t;
                      if (renameInvalid && t.trim()) setRenameInvalid(false);
                    }}
                  />
              </Box>
            </Box>
          </ModalBody>
          <ModalFooter className='flex-row justify-between items-center px-4'>
            <Button
              variant='link'
              onPress={() => {
                if (deletingFolder) return;
                setRenameModalOpen(false);
                setFolderToRename(null);
                renameDraftRef.current = '';
                setRenameInputKey((k) => k + 1);
                setRenameInvalid(false);
              }}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button onPress={handleRenameFolder} isDisabled={deletingFolder}>
              <ButtonText>OK</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => { if (!deletingFolder) setDeleteModalOpen(false); }}>
        <ModalBackdrop onPress={() => { if (!deletingFolder) setDeleteModalOpen(false); }} />
        <ModalContent size="sm" className={`bg-${theme}-background border-${theme}-steelGray`}>
          <ModalHeader>
            <HStack className='flex-1' space='md'>
              <Text size='2xl' className='text-typography-800'>Delete Folder</Text>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <Text className='text-typography-800'>
              Are you sure? This will delete all templates inside of the folder.
            </Text>
          </ModalBody>
          <ModalFooter className='flex-row justify-between items-center px-4'>
            <Button
              variant='link'
              onPress={() => {
                if (deletingFolder) return;
                setDeleteModalOpen(false);
                setFolderToDelete(null);
              }}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              variant='link'
              action='negative'
              isDisabled={deletingFolder}
              onPress={handleDeleteFolder}
            >
              <ButtonText>{deletingFolder ? 'Deleting...' : 'Yes, delete'}</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </SafeAreaView>
  );
}