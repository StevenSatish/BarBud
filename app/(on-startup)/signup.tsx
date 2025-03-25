import { FIREBASE_AUTH } from '@/FirebaseConfig';
import React from 'react'
import { useState } from 'react';
import { Redirect } from 'expo-router';
import {KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { Heading } from "@/components/ui/heading"
import {createUserWithEmailAndPassword  } from "firebase/auth";
import {useAuth} from ".././auth/AuthProvider"
import { VStack } from '@/components/ui/vstack';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input"
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icon"
import { Button, ButtonText } from '@/components/ui/button';
import { Spinner } from "@/components/ui/spinner"

export default function Signup() {
    const [email, setEmail] = useState("")
    const [isInvalidEmail, setIsInvalidEmail] = useState(false);

    const [password, setPassword] = useState("");
    const [isInvalidPass, setIsInvalidPass] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const [confirmPass, setConfirmPass] = useState("");
    const [isInvalidConfirmPass, setIsInvalidConfirmPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const [loadingRegister, setLoading] = useState(false);

    const auth = FIREBASE_AUTH;
    const {user, loading} = useAuth();

    if (user) return <Redirect href="../(tabs)" />;

    const submitForm = () => {
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        
        if (password !== confirmPass) {
            setIsInvalidConfirmPass(true);
            return;
        }

        if (emailRegex.test(email) && password.length >= 8) {
            signUp();
            return;
        }
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
        setLoading(true)
        try{
            const response = await createUserWithEmailAndPassword(auth, email, password);
            console.log(response);
        } catch (error: any) {
            console.log(error);
            if (error.code === "auth/email-already-in-use") {
                alert("Email is already in use, try logging in!");
            } else {
                alert("Sign Up failed: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="bg-background-0 flex-1 items-center justify-center"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <VStack className="w-full max-w-[300px] rounded-xl bg-background-50 p-6 space-y-4">
                <Heading size="xl" className="text-typography-700 font-bold">Register</Heading>
                <FormControl isInvalid={isInvalidEmail}>
                    <FormControlLabel>
                        <FormControlLabelText className="text-typography-700 font-medium">Email</FormControlLabelText>
                    </FormControlLabel>
                    <Input className="my-1 border border-outline-300 bg-background-100" size={"md"}>
                        <InputField
                            className="text-typography-900"
                            placeholder="email"
                            placeholderTextColor="text-typography-700"
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
                        <FormControlLabelText className="text-typography-700 font-medium">Password</FormControlLabelText>
                    </FormControlLabel>
                    <Input className="my-1 border border-outline-300 bg-background-100" size={"md"}>
                        <InputField
                            className="text-typography-900"
                            placeholder="password"
                            placeholderTextColor="text-typography-700"
                            type={showPass ? "text" : "password"}
                            value={password}
                            onChangeText={(text) => setPassword(text)}
                        />
                        <InputSlot className="mr-2" onPress={() => setShowPass(!showPass)}>
                            <InputIcon as={showPass ? EyeIcon : EyeOffIcon} className="text-typography-400" />
                        </InputSlot>
                    </Input>
                    <FormControlHelper>
                        <FormControlHelperText className="text-typography-700">
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
                        <FormControlLabelText className="text-typography-700 font-medium">Confirm Password</FormControlLabelText>
                    </FormControlLabel>
                    <Input className="my-1 border border-outline-300 bg-background-100" size={"md"}>
                        <InputField
                            className="text-typography-900"
                            placeholder="confirm password"
                            placeholderTextColor="text-typography-700"
                            type={showConfirmPass ? "text" : "password"}
                            value={confirmPass}
                            onChangeText={(text) => setConfirmPass(text)}
                        />
                        <InputSlot className="mr-2" onPress={() => setShowConfirmPass(!showConfirmPass)}>
                            <InputIcon as={showConfirmPass ? EyeIcon : EyeOffIcon} className="text-typography-400" />
                        </InputSlot>
                    </Input>
                    <FormControlError>
                        <FormControlErrorIcon as={AlertCircleIcon} />
                        <FormControlErrorText>
                            Passwords must match
                        </FormControlErrorText>
                    </FormControlError>
                </FormControl>
                <Button 
                    size="lg" 
                    variant="solid" 
                    action="primary"
                    className="bg-background-700 mt-4"
                    onPress={submitForm}
                    disabled={loadingRegister}
                >
                    {loadingRegister ? (
                        <Spinner color="black" size="small" />
                    ) : (
                        <ButtonText className="text-typography-100 font-semibold">Sign Up</ButtonText>
                    )}
                </Button>
            </VStack>
        </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
</TouchableWithoutFeedback>
  );
}