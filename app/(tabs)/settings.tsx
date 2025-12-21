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
import { useState } from 'react';
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
import { httpsCallable } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {FIREBASE_FUNCTIONS } from "@/FirebaseConfig";

const themeOptions: ThemeType[] = ['blue', 'cyan', 'pink', 'green', 'orange', ];

export default function Settings() {
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const handleClose = () => setShowAlertDialog(false);
  const { theme, setTheme } = useTheme();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteInputError, setDeleteInputError] = useState(false);

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
  
      await AsyncStorage.multiRemove(["username"]); // add any other keys you store
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
    </View>
  );
}
