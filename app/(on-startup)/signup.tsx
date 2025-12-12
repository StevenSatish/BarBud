import { FIREBASE_AUTH, FIREBASE_DB } from '@/FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react'
import { useState } from 'react';
import { Redirect } from 'expo-router';
import {KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { Heading } from "@/components/ui/heading"
import {createUserWithEmailAndPassword  } from "firebase/auth";
import {useAuth} from "../context/AuthProvider"
import useExerciseDB from "../context/ExerciseDBContext"
import { VStack } from '@/components/ui/vstack';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input"
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icon"
import { Button, ButtonText } from '@/components/ui/button';
import { Spinner } from "@/components/ui/spinner"
import { collection, doc, setDoc, getDocs, writeBatch, serverTimestamp, query, where } from 'firebase/firestore';

export default function Signup() {
    const [email, setEmail] = useState("")
    const [isInvalidEmail, setIsInvalidEmail] = useState(false);

    const [username, setUsername] = useState("");
    const [isInvalidUsername, setIsInvalidUsername] = useState(false);

    const [password, setPassword] = useState("");
    const [isInvalidPass, setIsInvalidPass] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const [confirmPass, setConfirmPass] = useState("");
    const [isInvalidConfirmPass, setIsInvalidConfirmPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const [loadingRegister, setLoading] = useState(false);

    const auth = FIREBASE_AUTH;
    const {user} = useAuth();
    const { fetchExercises } = useExerciseDB();

    if (user) return <Redirect href="/(tabs)" />;

    const submitForm = async () => {
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        let valid = true;
        if (password !== confirmPass) {
            setIsInvalidConfirmPass(true);
            valid = false;
        }
        if (!await checkUsername()) {
            setIsInvalidUsername(true);
            valid = false;
        }
        if (!emailRegex.test(email)) {
            setIsInvalidEmail(true);
            valid = false;
        }
        if (password.length < 8){
            setIsInvalidPass(true)
            valid = false;
        }
        if (valid) {
            signUp();
        }
    };

    const checkUsername = async () => {
        const usersRef = collection(FIREBASE_DB, 'users');
        const querySnapshot = await getDocs(query(usersRef, where('username', '==', username)));
        if (querySnapshot.size > 0) {
            return false;
        }
        return true;
    };

    const signUp = async () => {
        setLoading(true);
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            
            await setDoc(doc(FIREBASE_DB, 'users', response.user.uid), {
                email: email,
                createdAt: serverTimestamp(),
                username: username.trim()
            });

            // Create default "None" folder in template folders catalog
            await setDoc(
              doc(FIREBASE_DB, 'users', response.user.uid, 'folders', 'none'),
              { name: 'None' }
            );

      try {
        await AsyncStorage.setItem('username', username.trim());
      } catch {}
            
            // 3. Copy preset exercises to user's collection
            const presetExercisesRef = collection(FIREBASE_DB, 'presetExercises');
            const exercisesSnapshot = await getDocs(presetExercisesRef);
            
            // Use batch write for better performance
            const batch = writeBatch(FIREBASE_DB);
            
            exercisesSnapshot.forEach((exerciseDoc) => {
                const exerciseData = exerciseDoc.data();
                const userExerciseRef = doc(
                    FIREBASE_DB, 
                    'users', 
                    response.user.uid, 
                    'exercises', 
                    exerciseDoc.id
                );
                batch.set(userExerciseRef, exerciseData);
            });
            
            // Commit the batch, then refresh exercise cache
            await batch.commit();
            await fetchExercises();
                        
        } catch (error: any) {
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <VStack className="w-full max-w-[300px] rounded-xl bg-background-50 p-6 space-y-4 -mt-20">
                <Heading size="xl" className="text-typography-700 font-bold">Register</Heading>
                <FormControl isInvalid={isInvalidUsername}>
                    <FormControlLabel>
                        <FormControlLabelText className="text-typography-700 font-medium">Username</FormControlLabelText>
                    </FormControlLabel>
                    <Input className="my-1 border border-outline-300 bg-background-100" size={"md"}>
                        <InputField
                            className="text-typography-800"
                            placeholder="username"
                            placeholderTextColor="text-typography-700"
                            value={username}
                            onChangeText={(text) => setUsername(text)}
                        />
                    </Input>
                    <FormControlError>
                        <FormControlErrorIcon as={AlertCircleIcon} />
                        <FormControlErrorText className="text-error-500">
                            Sorry, username is not available
                        </FormControlErrorText>
                    </FormControlError>
                </FormControl>

                <FormControl isInvalid={isInvalidEmail}>
                    <FormControlLabel>
                        <FormControlLabelText className="text-typography-700 font-medium">Email</FormControlLabelText>
                    </FormControlLabel>
                    <Input className="my-1 border border-outline-300 bg-background-100" size={"md"}>
                        <InputField
                            className="text-typography-800"
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
                            className="text-typography-800"
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
                            className="text-typography-800"
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