import { View } from 'react-native';
import { useAuth } from '../context/AuthProvider';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  AlertDialogBackdrop,
} from "@/components/ui/alert-dialog"
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useState } from 'react';

export default function Settings() {
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const handleClose = () => setShowAlertDialog(false);

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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Settings Page</Text>
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
