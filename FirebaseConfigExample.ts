import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { Platform } from 'react-native';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, browserSessionPersistence } from '@firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "--------------------------------",
  authDomain: "----------------------",
  projectId: "------------",
  storageBucket: "-----------------------------------",
  messagingSenderId: "------------",
  appId: "---------------------------------",
  measurementId: "----------"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
const persistence = Platform.OS === 'web'
           ? browserSessionPersistence
           : getReactNativePersistence(ReactNativeAsyncStorage);
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence
});
export const FIREBASE_DB = getFirestore(FIREBASE_APP);

isSupported().then(yes => yes ? getAnalytics(FIREBASE_APP) : null);