//import { FIREBASE_AUTH } from '@/FirebaseConfig';
import React from 'react'
import { useState } from 'react';
import { Redirect } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, Button, KeyboardAvoidingView, SafeAreaView } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { Heading } from "@/components/ui/heading"
//import {createUserWithEmailAndPassword, signInWithEmailAndPassword  } from "firebase/auth";
//import {useAuth} from "./auth/AuthProvider"
import { VStack } from '@/components/ui/vstack';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input"
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icon"

export default function Index() {
    const [email, setEmail] = useState("")
    const [isInvalidEmail, setIsInvalidEmail] = useState(false);

    const [password, setPassword] = useState("");
    const [isInvalidPass, setIsInvalidPass] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const [confirmPass, setConfirmPass] = useState("");
    const [isInvalidConfirmPass, setIsInvalidConfirmPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const [loggingIn, setLoggingIn] = useState(true);
    const [loadingLogin, setLoading] = useState(false);

    //const auth = FIREBASE_AUTH;
    // const {user, loading} = useAuth();
    const user = null;

    if (user) return <Redirect href="/(tabs)" />;

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

    const signUp = async () => {
        // setLoading(true)
        // try{
        //     const response = await createUserWithEmailAndPassword(auth, email, password);
        //     console.log(response);
        // } catch (error: any) {
        //     console.log(error);
        //     alert("Sign up failed:" + error.message)
        // } finally {
        //     setLoading(false);
        // }
    };

    const signIn = async () => {
        // if (confirmPass !== password){
        //     alert("Passwords do not match!");
        //     return;
        // }
        // setLoading(true)
        // try{
        //     const response = await signInWithEmailAndPassword(auth, email, password);
        //     console.log(response);
        // } catch (error: any){
        //     console.log(error);
        //     alert("Email/Password is incorrect")
        // } finally {
        //     setLoading(false);
        // }
    };


  return (
    <SafeAreaView className="bg-background-0 flex-1 items-center justify-center">
        <VStack className="w-full max-w-[300px] rounded-md border border-background-700 bg-background-800 p-4 mx-4">
            <Heading className="text-typography-50">{loggingIn ? "Login" : "Register"}</Heading>
            <FormControl isInvalid={isInvalidEmail}>
                <FormControlLabel>
                    <FormControlLabelText className="text-typography-50">Email</FormControlLabelText>
                </FormControlLabel>
                <Input className="my-1 bg-background-700" size={"md"}>
                    <InputField
                        className="text-typography-50"
                        placeholder="email"
                        value={email}
                        onChangeText={(text) => setEmail(text)}
                    />
                </Input>
                <FormControlError>
                    <FormControlErrorIcon as={AlertCircleIcon} />
                    <FormControlErrorText>
                        Not a valid email address
                    </FormControlErrorText>
                </FormControlError>
            </FormControl>

            <FormControl isInvalid={isInvalidPass}>
                <FormControlLabel>
                    <FormControlLabelText className="text-typography-50">Password</FormControlLabelText>
                </FormControlLabel>
                <Input className="my-1 bg-background-700" size={"md"}>
                    <InputField
                        className="text-typography-50"
                        placeholder="password"
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChangeText={(text) => setPassword(text)}
                    />
                    <InputSlot onPress={() => setShowPass(!showPass)}>
                        <InputIcon as={showPass ? EyeIcon : EyeOffIcon} className="text-typography-50" />
                    </InputSlot>
                </Input>
                <FormControlHelper>
                    <FormControlHelperText className="text-typography-200">
                        Must be at least 8 characters.
                    </FormControlHelperText>
                </FormControlHelper>
                <FormControlError>
                    <FormControlErrorIcon as={AlertCircleIcon} />
                    <FormControlErrorText>
                        That's not 8 characters, bozo
                    </FormControlErrorText>
                </FormControlError>
            </FormControl>
            
            <FormControl isInvalid={isInvalidConfirmPass}>
                <FormControlLabel>
                    <FormControlLabelText className="text-typography-50">Confirm Password</FormControlLabelText>
                </FormControlLabel>
                <Input className="my-1 bg-background-700" size={"md"}>
                    <InputField
                        className="text-typography-50"
                        placeholder="confirm password"
                        type={showConfirmPass ? "text" : "password"}
                        value={confirmPass}
                        onChangeText={(text) => setConfirmPass(text)}
                    />
                    <InputSlot onPress={() => setShowConfirmPass(!showConfirmPass)}>
                        <InputIcon as={showConfirmPass ? EyeIcon : EyeOffIcon} className="text-typography-50" />
                    </InputSlot>
                </Input>
                <FormControlError>
                    <FormControlErrorIcon as={AlertCircleIcon} />
                    <FormControlErrorText>
                        Passwords do not match.
                    </FormControlErrorText>
                </FormControlError>
            </FormControl>
        </VStack>
    </SafeAreaView>
  );
}