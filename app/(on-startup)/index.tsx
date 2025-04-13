import React from 'react'
import { Box } from '@/components/ui/box'
import { VStack } from '@/components/ui/vstack'
import { Button, ButtonGroup, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { useRouter } from 'expo-router'
import {useAuth} from "../context/AuthProvider"
import { Redirect } from 'expo-router';


export default function index() {
  const router = useRouter();
  const {user, loading} = useAuth();
    if (user) return <Redirect href="../(tabs)" />;
  
  return (
    <Box className="bg-background-0 flex-1 items-center justify-center">
      <VStack className="items-center justify-center space-4">
        <Heading size="3xl" className="text-typography-700 font-bold">Welcome to BarBud!</Heading>
        <ButtonGroup flexDirection='row' space="md" className="mt-4">
          <Button 
            size="lg" 
            variant="solid" 
            action="primary"
            className="bg-primary-500"
            onPress={() => router.push('/login')}
          >
            <ButtonText className="font-semibold">Log in</ButtonText>
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="border-primary-500"
            onPress={() => router.push('/signup')}
          >
            <ButtonText className="text-primary-500 font-semibold">Sign up</ButtonText>
          </Button>
        </ButtonGroup>
      </VStack>
    </Box>
  );
}

