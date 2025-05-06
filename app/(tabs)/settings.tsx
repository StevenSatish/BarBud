import { View } from 'react-native';
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
import { useTheme } from '@/app/context/ThemeContext';

export default function Settings() {
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const handleClose = () => setShowAlertDialog(false);
  const { theme } = useTheme();

  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      handleClose();
    } catch (error: any) {
      alert('Sign Out Failed: ' + error.message);
    }
  };

  return (
    <View className={`flex-1 justify-center items-center bg-${theme}-background`}>
      <Text className="text-white text-2xl font-bold mb-2">Settings Page</Text>
      <Button onPress={() => setShowAlertDialog(true)}>
        <ButtonText>Sign Out</ButtonText>
      </Button>
      <AlertDialog isOpen={showAlertDialog} onClose={handleClose} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading className="text-typography-950 font-semibold" size="md">
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
