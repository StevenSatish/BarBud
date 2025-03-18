import { View, Text, Button } from 'react-native';
import { useAuth } from '../auth/AuthProvider';

export default function Settings() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      alert('You have been successfully signed out.');
    } catch (error: any) {
      alert('Sign Out Failed' + error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Settings Page</Text>
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}
