import { View, TextInput } from 'react-native';
import { useAuth } from '../context/AuthProvider';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBackdrop,
} from "@/components/ui/alert-dialog"
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useEffect, useState } from 'react';
import { useTheme, ThemeType } from '@/app/context/ThemeContext';
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { ChevronDownIcon } from "@/components/ui/icon";
import { SelectIcon } from "@/components/ui/select";
import { httpsCallable } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FIREBASE_FUNCTIONS, FIREBASE_DB, FIREBASE_AUTH } from "@/FirebaseConfig";
import { doc, deleteField, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { HStack } from '@/components/ui/hstack';

const themeOptions: ThemeType[] = ['blue', 'cyan', 'pink', 'green', 'orange', ];

const WEIGHT_CLASSES = [
  '114-', '115-129', '130-144', '145-159', '160-174',
  '175-189', '190-204', '205-219', '220-234', '235-249', '250+',
];

export default function Settings() {
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const handleClose = () => setShowAlertDialog(false);
  const { theme, setTheme } = useTheme();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteInputError, setDeleteInputError] = useState(false);

  const [optedIntoRanked, setOptedIntoRanked] = useState(false);
  const [showRankedModal, setShowRankedModal] = useState(false);
  const [rankedGender, setRankedGender] = useState('');
  const [rankedWeightClass, setRankedWeightClass] = useState('');

  useEffect(() => {
    const uid = FIREBASE_AUTH.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(FIREBASE_DB, 'users', uid)).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.optedIntoRanked === true) {
        setOptedIntoRanked(true);
        if (data.gender) setRankedGender(data.gender);
        if (data.weightClass) setRankedWeightClass(data.weightClass);
      }
    });
  }, []);

  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      handleClose();
    } catch (error: any) {
      alert('Sign Out Failed: ' + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toLowerCase() !== "delete") {
      setDeleteInputError(true);
      return;
    }
  
    try {  
      const deleteFn = httpsCallable(FIREBASE_FUNCTIONS, "deleteMyAccount");
      await deleteFn();
  
      await AsyncStorage.multiRemove(["username"]);
      await signOut();
  
      setShowDeleteModal(false);
      setDeleteInput("");
      setDeleteInputError(false);
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete account.");
    }
  };

  return (
    <View className={`flex-1 justify-center items-center bg-${theme}-background`}>
      <Text className="text-white text-2xl font-bold mb-2">Settings Page</Text>
      
      <View className="w-64 mb-4">
        <Text className="text-white mb-2">Theme</Text>
        <Select
          selectedValue={theme.charAt(0).toUpperCase() + theme.slice(1)}
          onValueChange={(value) => setTheme(value as ThemeType)}
        >
          <SelectTrigger>
            <SelectInput placeholder="Select theme" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper>
                <SelectDragIndicator />
              </SelectDragIndicatorWrapper>
              {themeOptions.map((theme) => (
                <SelectItem 
                  key={theme}
                  label={theme.charAt(0).toUpperCase() + theme.slice(1)} 
                  value={theme} 
                />
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>
      </View>

      <View className="w-64 mb-4">
        <Button
          onPress={() => setShowRankedModal(true)}
          action="primary"
          size="lg"
        >
          <ButtonText>{optedIntoRanked ? 'Manage Ranked' : 'Opt Into Ranked?'}</ButtonText>
        </Button>
      </View>

      <Button onPress={() => setShowAlertDialog(true)}>
        <ButtonText>Sign Out</ButtonText>
      </Button>
      <Button variant="link" action="negative" onPress={() => setShowDeleteModal(true)}>
        <ButtonText>Delete Account</ButtonText>
      </Button>
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalBackdrop onPress={() => setShowDeleteModal(false)} />
        <ModalContent size="md" className={`bg-${theme}-background border-${theme}-steelGray`}>
          <ModalHeader>
            <Heading className="text-typography-800 font-semibold text-center" size="lg">
              Are you sure? Your data will be erased
            </Heading>
          </ModalHeader>
          <ModalBody>
            <Box className="gap-3">
              <Text className="text-typography-800 mb-2">
                Type "delete" to confirm:
              </Text>
              <Box
                className={`w-full rounded border px-3 py-2 ${
                  deleteInputError ? 'border-error-700' : 'border-secondary-900'
                }`}
              >
                <TextInput
                  className="text-typography-800 w-full"
                  placeholder="Type 'delete' to confirm"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={deleteInput}
                  onChangeText={(text) => {
                    setDeleteInput(text);
                    if (deleteInputError && text.toLowerCase() === 'delete') {
                      setDeleteInputError(false);
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Box>
              {deleteInputError && (
                <Text className="text-error-700 text-sm">
                  Please type "delete" to confirm
                </Text>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              action="secondary"
              onPress={() => setShowDeleteModal(false)}
              size="sm"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              action="negative"
              onPress={handleDeleteAccount}
              size="sm"
            >
              <ButtonText>Confirm</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <AlertDialog isOpen={showAlertDialog} onClose={handleClose} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent className={`bg-${theme}-background border-${theme}-steelGray`}>
          <AlertDialogHeader>
            <Heading className="text-typography-950 font-semibold pb-3" size="md">
              Are you sure you want to sign out?
            </Heading>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <Button
              variant="outline"
              action="secondary"
              onPress={handleClose}
              size="sm"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button size="sm" onPress={handleSignOut}>
              <ButtonText>Sign Out</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Modal isOpen={showRankedModal} onClose={() => setShowRankedModal(false)}>
        <ModalBackdrop onPress={() => setShowRankedModal(false)} />
        <ModalContent size="md" className={`bg-${theme}-background border-${theme}-steelGray`}>
          <ModalHeader>
            <Heading className="text-typography-800 font-semibold" size="lg">
              {optedIntoRanked ? 'Ranked Settings' : 'Opt Into Ranked'}
            </Heading>
          </ModalHeader>
          <ModalBody>
            <VStack space="lg">
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Gender</FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={rankedGender}
                  onValueChange={(value: string) => setRankedGender(value)}
                >
                  <SelectTrigger className="flex-row justify-between items-center">
                    <SelectInput placeholder="Select gender" />
                    <SelectIcon className="mr-2" as={ChevronDownIcon} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      <SelectItem label="Male" value="male" />
                      <SelectItem label="Female" value="female" />
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </FormControl>

              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Weight Class (lbs)</FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={rankedWeightClass}
                  onValueChange={(value: string) => setRankedWeightClass(value)}
                >
                  <SelectTrigger className="flex-row justify-between items-center">
                    <SelectInput placeholder="Select weight class" />
                    <SelectIcon className="mr-2" as={ChevronDownIcon} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {WEIGHT_CLASSES.map((wc) => (
                        <SelectItem key={wc} label={wc} value={wc} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            {optedIntoRanked ? (
              <HStack className="flex-1 justify-between">
                <Button
                  variant="outline"
                  action="secondary"
                  onPress={() => setShowRankedModal(false)}
                  size="sm"
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <HStack space="sm">
                  <Button
                    action="primary"
                    variant="solid"
                    size="sm"
                    onPress={async () => {
                      const uid = FIREBASE_AUTH.currentUser?.uid;
                      if (!uid) return;
                      await updateDoc(doc(FIREBASE_DB, 'users', uid), {
                        optedIntoRanked: false,
                        gender: deleteField(),
                        weightClass: deleteField(),
                      });
                      setOptedIntoRanked(false);
                      setRankedGender('');
                      setRankedWeightClass('');
                      setShowRankedModal(false);
                    }}
                  >
                    <ButtonText>Opt Out</ButtonText>
                  </Button>
                  <Button
                    size="sm"
                    onPress={async () => {
                      const uid = FIREBASE_AUTH.currentUser?.uid;
                      if (!uid || !rankedGender || !rankedWeightClass) return;
                      await setDoc(doc(FIREBASE_DB, 'users', uid), {
                        optedIntoRanked: true,
                        gender: rankedGender,
                        weightClass: rankedWeightClass,
                      }, { merge: true });
                      setShowRankedModal(false);
                    }}
                  >
                    <ButtonText>Update</ButtonText>
                  </Button>
                </HStack>
              </HStack>
            ) : (
              <HStack className="flex-1 justify-between">
                <Button
                  variant="outline"
                  action="secondary"
                  onPress={() => setShowRankedModal(false)}
                  size="sm"
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  size="sm"
                  onPress={async () => {
                    const uid = FIREBASE_AUTH.currentUser?.uid;
                    if (!uid || !rankedGender || !rankedWeightClass) return;
                    await setDoc(doc(FIREBASE_DB, 'users', uid), {
                      optedIntoRanked: true,
                      gender: rankedGender,
                      weightClass: rankedWeightClass,
                    }, { merge: true });
                    setOptedIntoRanked(true);
                    setShowRankedModal(false);
                  }}
                >
                  <ButtonText>Opt In</ButtonText>
                </Button>
              </HStack>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </View>
  );
}
