
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';



function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  console.log("rendering app")
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="index" />
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  ); 
}

export default function RootLayout() {


  return (
    <GluestackUIProvider mode="dark">
      <AuthProvider children={
            <AppLayout />
          } />
      <StatusBar style="auto" />
    </GluestackUIProvider>
  );
}
