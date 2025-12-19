// Global Jest setup for service tests
import { jest } from '@jest/globals';

// Route all firestore imports to the in-memory mock
jest.mock('firebase/firestore', () => require('./mockFirestore'));

// Prevent real Firebase initialization
jest.mock('@/FirebaseConfig', () => ({ FIREBASE_DB: {} as any }));

// Stub exercise refetch trigger
jest.mock('@/app/context/ExerciseDBContext', () => ({
  triggerExerciseRefetch: jest.fn(),
}));

// Deterministic UUIDs
jest.mock('expo-crypto', () => ({
  randomUUID: () => 'uuid-1',
}));
