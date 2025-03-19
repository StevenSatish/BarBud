import { FIREBASE_AUTH } from '@/FirebaseConfig';
import React from 'react'
import { useState } from 'react';
import { Redirect } from 'expo-router';
import {SafeAreaView } from 'react-native';
import { Heading } from "@/components/ui/heading"
import {signInWithEmailAndPassword  } from "firebase/auth";
import {useAuth} from ".././auth/AuthProvider"
import { VStack } from '@/components/ui/vstack';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input"
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icon"
import { Button, ButtonText } from '@/components/ui/button'

export default function Login() {
    const [email, setEmail] = useState("")
    const [isInvalidEmail, setIsInvalidEmail] = useState(false);

    const [password, setPassword] = useState("");
    const [isInvalidPass, setIsInvalidPass] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const [loggingIn, setLoggingIn] = useState(true);
    const [loadingLogin, setLoading] = useState(false);

    const auth = FIREBASE_AUTH;
    const {user, loading} = useAuth();

    if (user) return <Redirect href="../(tabs)" />;

    const submitForm = () => {
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        
        if (!emailRegex.test(email)) {
            setIsInvalidEmail(true);
        } else{
            setIsInvalidEmail(false);
        }
        if (password.length < 8){
            setIsInvalidPass(true)
        } else {
            setIsInvalidPass(false);
        }
    };

    const signIn = async () => {
        setLoading(true)
        try{
            const response = await signInWithEmailAndPassword(auth, email, password);
            console.log(response);
        } catch (error: any){
            console.log(error);
            alert("Email/Password is incorrect")
        } finally {
            setLoading(false);
        }
    };

  return (
    <SafeAreaView className="bg-background-0 flex-1 items-center justify-center">
        <VStack className="w-full max-w-[300px] rounded-xl border border-background-700 bg-background-800 p-6 mx-4 space-y-4">
            <Heading size="xl" className="text-typography-50 font-bold">{loggingIn ? "Login" : "Register"}</Heading>
            <FormControl isInvalid={isInvalidEmail}>
                <FormControlLabel>
                    <FormControlLabelText className="text-typography-50 font-medium">Email</FormControlLabelText>
                </FormControlLabel>
                <Input className="my-1 bg-background-700 border-background-600" size={"md"}>
                    <InputField
                        className="text-typography-50"
                        placeholder="email"
                        placeholderTextColor="#666666"
                        value={email}
                        onChangeText={(text) => setEmail(text)}
                    />
                </Input>
                <FormControlError>
                    <FormControlErrorIcon as={AlertCircleIcon} />
                    <FormControlErrorText className="text-error-500">
                        Not a valid email address
                    </FormControlErrorText>
                </FormControlError>
            </FormControl>

            <FormControl isInvalid={isInvalidPass}>
                <FormControlLabel>
                    <FormControlLabelText className="text-typography-50 font-medium">Password</FormControlLabelText>
                </FormControlLabel>
                <Input className="my-1 bg-background-700 border-background-600" size={"md"}>
                    <InputField
                        className="text-typography-50"
                        placeholder="password"
                        placeholderTextColor="#666666"
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChangeText={(text) => setPassword(text)}
                    />
                    <InputSlot onPress={() => setShowPass(!showPass)}>
                        <InputIcon as={showPass ? EyeIcon : EyeOffIcon} className="text-typography-400" />
                    </InputSlot>
                </Input>
                <FormControlHelper>
                    <FormControlHelperText className="text-typography-400">
                        Must be at least 8 characters.
                    </FormControlHelperText>
                </FormControlHelper>
                <FormControlError>
                    <FormControlErrorIcon as={AlertCircleIcon} />
                    <FormControlErrorText className="text-error-500">
                        That's not 8 characters, bozo
                    </FormControlErrorText>
                </FormControlError>
            </FormControl>

            <Button 
                size="lg" 
                variant="solid" 
                action="primary"
                className="bg-primary-500 mt-4"
                onPress={signIn}
            >
                <ButtonText className="font-semibold">Sign In</ButtonText>
            </Button>
        </VStack>
    </SafeAreaView>
  );
}