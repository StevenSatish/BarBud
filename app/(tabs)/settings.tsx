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
import { useTheme, ThemeType } from '@/app/context/ThemeContext';
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDownIcon } from "@/components/ui/icon";

const themeOptions: ThemeType[] = ['blue', 'cyan', 'pink', 'green', 'gold'];

export default function Settings() {
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const handleClose = () => setShowAlertDialog(false);
  const { theme, setTheme } = useTheme();

  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      handleClose();
    } catch (error: any) {
      alert('Sign Out Failed: ' + error.message);
    }
  };

  const upperCaseTheme = theme.slice(0, 1).toUpperCase() + theme.slice(1);

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
            <SelectIcon>
              <ChevronDownIcon color="white" />
            </SelectIcon>
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
