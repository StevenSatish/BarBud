import { View, Text, Button, Alert } from 'react-native';
import { useAuth } from '../auth/AuthProvider';

export default function Settings() {
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Yes, Sign Out", 
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              alert('Sign Out Failed' + error.message);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Settings Page</Text>
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}
