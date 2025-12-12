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
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper, ActionsheetItem, ActionsheetItemText, ActionsheetSectionHeaderText } from '@/components/ui/actionsheet';
import { useState, useRef } from 'react';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import useTemplateFolders from '@/app/context/TemplateFoldersContext';
import { useWorkout } from '@/app/context/WorkoutContext';
import useExerciseDB from '@/app/context/ExerciseDBContext';
import { router } from 'expo-router';

type TemplateCardProps = {
  template: Template;
  folderId: string;
  folderName?: string;
};

export default function TemplateCard({ template, folderId, folderName }: TemplateCardProps) {
  const { theme } = useTheme();
  const { fetchTemplates, folders, fetchFolders, foldersLoading } = useTemplateFolders();
  const { exerciseSections } = useExerciseDB();
  const { startWorkoutFromTemplate } = useWorkout();
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameInvalid, setRenameInvalid] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moveSheetOpen, setMoveSheetOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const renameDraftRef = useRef(template.templateName ?? '');
  const [renameInputKey, setRenameInputKey] = useState(0);
  const lastPerformedLabel = useMemo(
    () => (template.lastPerformedAt ? formatRelativeTime(template.lastPerformedAt) : null),
    [template.lastPerformedAt]
  );
  const exercisesLine = useMemo(() => {
    const names = template.exercises?.map((ex) => `${ex.name} (${ex.category})`).filter(Boolean) ?? [];
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

  const openDeleteModal = () => {
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    setDeleting(true);
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user?.uid) {
        console.error('Cannot delete template: no authenticated user');
        return;
      }
      await deleteDoc(doc(FIREBASE_DB, 'users', user.uid, 'folders', folderId, 'templates', template.id));
      await fetchTemplates();
    } catch (e) {
      console.error('Failed to delete template', e);
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenMoveSheet = async () => {
    setMoveSheetOpen(true);
    if (!folders.length) {
      await fetchFolders();
    }
  };

  const handleMoveTemplate = async (targetFolderId: string) => {
    if (moving) return;
    if (!targetFolderId || targetFolderId === folderId) {
      setMoveSheetOpen(false);
      return;
    }
    setMoveSheetOpen(false);
    setMoving(true);
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user?.uid) {
        console.error('Cannot move template: no authenticated user');
        return;
      }
      const payload: any = {
        templateName: template.templateName,
        exercises: template.exercises ?? [],
      };
      if (template.lastPerformedAt) payload.lastPerformedAt = template.lastPerformedAt;

      await setDoc(
        doc(FIREBASE_DB, 'users', user.uid, 'folders', targetFolderId, 'templates', template.id),
        payload
      );
      await deleteDoc(doc(FIREBASE_DB, 'users', user.uid, 'folders', folderId, 'templates', template.id));
      await fetchTemplates();
    } catch (e) {
      console.error('Failed to move template', e);
    } finally {
      setMoving(false);
    }
  };

  const handleStartWorkout = async () => {
    try {
      setViewModalOpen(false);
      const templateExercises = template.exercises ?? [];
      const exerciseMap = exerciseSections.reduce<Record<string, any>>((acc, section) => {
        section.data.forEach((ex: any) => {
          if (ex.id) acc[ex.id] = ex;
        });
        return acc;
      }, {}); 

      const payload = templateExercises.map((ex, idx) => {
        const exerciseId =
          ex.exerciseId ||
          ex.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') ||
          `exercise-${idx}`;
        const meta = exerciseMap[exerciseId];
        return {
          exerciseId,
          name: meta?.name ?? ex.name,
          category: meta?.category ?? ex.category ?? '',
          muscleGroup: meta?.muscleGroup ?? '',
          secondaryMuscles: meta?.secondaryMuscles ?? [],
          trackingMethods: Array.isArray(meta?.trackingMethods) ? meta.trackingMethods : [],
          numSets: ex.numSets,
          templateMeta: { folderId, templateId: template.id },
        };
      });

      await startWorkoutFromTemplate(payload);
    } catch (e) {
      console.error('Failed to start workout from template', e);
    }
  };

  return (
    <Pressable
      onPress={() => setViewModalOpen(true)}
      hitSlop={6}
      className={`rounded border border-outline-200 bg-${theme}-background px-3 py-3`}
    >
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
          <MenuItem
            textValue="Edit"
            onPress={() => {
              const params: Record<string, string> = {
                templateId: template.id,
                templateName: template.templateName ?? '',
                folderId,
                folderName: folderName ?? '',
                exercises: JSON.stringify(template.exercises ?? []),
              };
              router.replace({ pathname: '/(template)', params });
            }}
          >
            <MenuItemLabel size="lg">Edit</MenuItemLabel>
          </MenuItem>
          <MenuItem textValue="Move" onPress={handleOpenMoveSheet}>
            <MenuItemLabel size="lg">{folderId === 'none' ? 'Move to Folder' : 'Move to New Folder'}</MenuItemLabel>
          </MenuItem>
          <MenuItem textValue="Delete" onPress={openDeleteModal}>
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
      {lastPerformedLabel ? (
        <HStack className="items-center space-x-1 mt-1">
          <Entypo name="back-in-time" size={12} color="gray" />
          <Text className='ml-1 text-gray-400 text-base'>{lastPerformedLabel}</Text>
        </HStack>
      ) : null}

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
                className={`w-full rounded border px-3 py-2 ${renameInvalid ? 'border-error-700' : 'border-secondary-900'
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

      <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal}>
        <ModalBackdrop onPress={closeDeleteModal} />
        <ModalContent size="sm" className={`bg-${theme}-background border-${theme}-steelGray`}>
          <ModalHeader>
            <HStack className='flex-1' space='md'>
              <Text size='2xl' className='text-typography-900'>Delete Template</Text>
            </HStack>
          </ModalHeader>
          <ModalBody>
          </ModalBody>
          <ModalFooter className='flex-row justify-between items-center px-4'>
            <Button
              variant='link'
              onPress={closeDeleteModal}
              isDisabled={deleting}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              variant='link'
              action='negative'
              onPress={handleConfirmDelete}
              isDisabled={deleting}
            >
              <ButtonText>{deleting ? 'Deleting...' : 'Yes, delete'}</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Actionsheet isOpen={moveSheetOpen} onClose={() => setMoveSheetOpen(false)}>
        <ActionsheetBackdrop onPress={() => setMoveSheetOpen(false)} />
        <ActionsheetContent className={`bg-${theme}-background`}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetSectionHeaderText size='lg' className='text-typography-900'>
            Move to Folder
          </ActionsheetSectionHeaderText>

          {foldersLoading && !folders.length ? (
            <ActionsheetItem disabled>
              <ActionsheetItemText>Loading...</ActionsheetItemText>
            </ActionsheetItem>
          ) : (
            (() => {
              const otherFolders = folders.filter((f) => f.id !== folderId && f.id !== 'none');
              const noneFolder = folders.find((f) => f.id === 'none');
              const ordered = noneFolder ? [...otherFolders, noneFolder] : otherFolders;
              return ordered.map((f) => (
                <ActionsheetItem
                  key={f.id}
                  disabled={moving}
                  onPress={() => handleMoveTemplate(f.id)}
                >
                  {f.id !== 'none' ? <Entypo name="folder" size={18} color="white" /> : null}
                  <ActionsheetItemText size='lg' className='text-typography-900'>
                    {f.name}
                  </ActionsheetItemText>
                </ActionsheetItem>
              ));
            })()
          )}
        </ActionsheetContent>
      </Actionsheet>

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        <ModalBackdrop onPress={() => setViewModalOpen(false)} />
        <ModalContent size="md" className={`bg-${theme}-background border-${theme}-steelGray`}>
          <ModalHeader>
            <HStack className='flex-1' space='md'>
              <Text bold size='3xl' className='text-typography-900'>{template.templateName}</Text>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <Box className='gap-3'>
              {
                lastPerformedLabel && (<Text className='text-typography-700'>
                  Last Performed: {lastPerformedLabel}
                </Text>)
              }
              <Box className='gap-1'>
                {template.exercises?.length
                  ? template.exercises.map((ex, idx) => (
                    <Text key={`${template.id}-${ex.exerciseId ?? 'ex'}-${idx}`}>
                      {ex.numSets} x {ex.name} ({ex.category})
                    </Text>
                  ))
                  : <Text className='text-typography-700'>No exercises</Text>}
              </Box>
            </Box>
          </ModalBody>
          <ModalFooter className='flex-row justify-center items-center px-4'>
            <Button className={`bg-${theme}-accent rounded-full`} onPress={handleStartWorkout}>
              <ButtonText className='text-typography-900'>Start Workout</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Pressable>
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

