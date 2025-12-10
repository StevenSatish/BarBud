import React, { useMemo } from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/app/context/ThemeContext';
import type { Template } from '@/app/context/TemplateFoldersContext';
import { Entypo } from '@expo/vector-icons';
import { HStack } from '@/components/ui/hstack';
import { Menu, MenuItem, MenuItemLabel } from '@/components/ui/menu';
import { Pressable, TextInput } from 'react-native';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { useState, useRef } from 'react';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import useTemplateFolders from '@/app/context/TemplateFoldersContext';

type TemplateCardProps = {
  template: Template;
  folderId: string;
};

export default function TemplateCard({ template, folderId }: TemplateCardProps) {
  const { theme } = useTheme();
  const { fetchTemplates } = useTemplateFolders();
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameInvalid, setRenameInvalid] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const renameDraftRef = useRef(template.templateName ?? '');
  const [renameInputKey, setRenameInputKey] = useState(0);
  const lastPerformedLabel = useMemo(
    () => (template.lastPerformedAt ? formatRelativeTime(template.lastPerformedAt) : null),
    [template.lastPerformedAt]
  );
  const exercisesLine = useMemo(() => {
    const names = template.exercises?.map((ex) => ex.nameSnap).filter(Boolean) ?? [];
    return names.join(', ');
  }, [template.exercises]);

  const resetRenameInput = () => {
    renameDraftRef.current = '';
    setRenameInputKey((k) => k + 1);
    setRenameInvalid(false);
  };

  const openRenameModal = () => {
    renameDraftRef.current = template.templateName ?? '';
    setRenameInputKey((k) => k + 1);
    setRenameInvalid(false);
    setRenameModalOpen(true);
  };

  const closeRenameModal = () => {
    if (renaming) return;
    setRenameModalOpen(false);
    resetRenameInput();
  };

  const handleConfirmRename = async () => {
    if (renaming) return;
    const trimmed = renameDraftRef.current.trim();
    if (!trimmed) {
      setRenameInvalid(true);
      return;
    }
    setRenameModalOpen(false);
    setRenaming(true);
    setRenameInvalid(false);
    const newId = slugify(trimmed);
    const oldId = template.id;
    resetRenameInput();
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user?.uid) {
        console.error('Cannot rename template: no authenticated user');
        return;
      }

      if (newId === oldId) {
        await setDoc(
          doc(FIREBASE_DB, 'users', user.uid, 'folders', folderId, 'templates', oldId),
          { templateName: trimmed },
          { merge: true }
        );
      } else {
        const newTemplateData: any = {
          templateName: trimmed,
          exercises: template.exercises ?? [],
        };
        if (template.lastPerformedAt) {
          newTemplateData.lastPerformedAt = template.lastPerformedAt;
        }
        await setDoc(
          doc(FIREBASE_DB, 'users', user.uid, 'folders', folderId, 'templates', newId),
          newTemplateData
        );
        await deleteDoc(doc(FIREBASE_DB, 'users', user.uid, 'folders', folderId, 'templates', oldId));
      }

      await fetchTemplates();
    } catch (e) {
      console.error('Failed to rename template', e);
    } finally {
      setRenaming(false);
    }
  };

  return (
    <Box className={`rounded border border-outline-200 bg-${theme}-background px-3 py-3`}>
      <HStack className='items-center justify-between'>
        <Text className='text-typography-900 text-lg font-semibold'>{template.templateName}</Text>
        <Menu
          className={`bg-${theme}-button`}
          placement="bottom left"
          offset={4}
          trigger={({ ...triggerProps }) => (
            <Pressable hitSlop={10} {...triggerProps}>
              <Entypo name="dots-three-horizontal" size={18} color="white" />
            </Pressable>
          )}
        >
          <MenuItem textValue="Rename" onPress={openRenameModal}>
            <MenuItemLabel size="lg">Rename</MenuItemLabel>
          </MenuItem>
          <MenuItem textValue="Edit">
            <MenuItemLabel size="lg">Edit</MenuItemLabel>
          </MenuItem>
          <MenuItem textValue="Move">
            <MenuItemLabel size="lg">Move to Folder</MenuItemLabel>
          </MenuItem>
          <MenuItem textValue="Delete">
            <MenuItemLabel size="lg" className='text-error-700'>Delete</MenuItemLabel>
          </MenuItem>
        </Menu>
      </HStack>

      <Box className='mt-2'>
        {exercisesLine ? (
          <Text className='text-typography-800'>{exercisesLine}</Text>
        ) : (
          <Text className='text-typography-700'>No exercises listed.</Text>
        )}
      </Box>

      {lastPerformedLabel ? <Text className='text-typography-700 mt-3'>{lastPerformedLabel}</Text> : null}

      <Modal isOpen={renameModalOpen} onClose={() => { if (!renaming) setRenameModalOpen(false); }}>
        <ModalBackdrop onPress={() => { if (!renaming) setRenameModalOpen(false); }} />
        <ModalContent size="sm" className={`bg-${theme}-background border-${theme}-steelGray`}>
          <ModalHeader>
            <HStack className='flex-1' space='md'>
              <Text size='2xl' className='text-typography-900'>Rename Template</Text>
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
                  className='text-typography-900'
                  placeholder="Template name"
                  placeholderTextColor="rgba(255,255,255,0.6)"
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
              onPress={closeRenameModal}
              isDisabled={renaming}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button onPress={handleConfirmRename} isDisabled={renaming}>
              <ButtonText>{renaming ? 'Renaming...' : 'OK'}</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function formatRelativeTime(ts?: Template['lastPerformedAt']) {
  if (!ts) return 'Never performed';
  let date: Date | null = null;
  try {
    // @ts-expect-error Timestamp from Firestore
    date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) date = null;
  } catch {
    date = null;
  }
  if (!date) return 'Never performed';

  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return 'Just now';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Less than 1 hour ago';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
}

