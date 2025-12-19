import { initializeApp, getApp, getApps } from 'firebase/app';
import { Platform } from 'react-native';
// @ts-ignore - package exports are typed but path alias trips TS here
import { initializeAuth, getReactNativePersistence, browserSessionPersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const extraConfig =
  (Constants.expoConfig as any)?.extra?.firebase ??
  (Constants.manifest as any)?.extra?.firebase ??
  {};

const firebaseConfig = {
  apiKey: extraConfig.apiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: extraConfig.authDomain ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: extraConfig.projectId ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: extraConfig.storageBucket ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: extraConfig.messagingSenderId ?? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: extraConfig.appId ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId: extraConfig.measurementId ?? process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
  

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  throw new Error(
    'Missing Firebase config. Provide EXPO_PUBLIC_FIREBASE_* envs or extra.firebase in app.config.js.'
  );
}

const FIREBASE_APP = getApps().length ? getApp() : initializeApp(firebaseConfig);

const persistence =
  Platform.OS === 'web'
    ? browserSessionPersistence
    : getReactNativePersistence(AsyncStorage);

export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, { persistence });
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
