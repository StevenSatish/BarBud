// app/context/ExerciseDBContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';
import { FIREBASE_AUTH } from '@/FirebaseConfig';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second
const EMPTY_STATE_REFETCH_DELAY_MS = 2000; // Wait before refetching on empty state
const MAX_EMPTY_STATE_RETRIES = 2; // Limit retries when exercises are unexpectedly empty

// Helper: delay for a given number of milliseconds
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Allow non-component code to trigger a refetch of exercises
let exerciseRefetcher: (() => Promise<void>) | null = null;
export const registerExerciseRefetcher = (fn: () => Promise<void>) => {
  exerciseRefetcher = fn;
};
export const triggerExerciseRefetch = async () => {
  if (exerciseRefetcher) {
    try {
      await exerciseRefetcher();
    } catch (error) {
      console.error('Error triggering exercise refetch:', error);
    }
  }
};

type ExerciseSectionType = {
  title: string;
  data: any[];
};

type ExerciseDBContextType = {
  exerciseSections: ExerciseSectionType[];
  loading: boolean;
  createExercise: (exerciseName: string, category: string, muscleGroup: string, secondaryMuscleGroups: string[], trackingMethods: string[]) => Promise<{ success: boolean; error?: string }>;
  fetchExercises: () => Promise<void>;
};

const ExerciseDBContext = createContext<ExerciseDBContextType | undefined>(undefined);

export const ExerciseDBProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [exerciseSections, setExerciseSections] = useState<ExerciseSectionType[]>([]);
  const [loading, setLoading] = useState(true);
  const emptyStateRetryCount = useRef(0);
  const isRefetchingDueToEmpty = useRef(false);

  const createExercise = async (exerciseName: string, category: string, muscleGroup: string, secondaryMuscleGroups: string[], trackingMethods: string[]) => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user?.uid) return { success: false, error: "No user logged in" };

    // Trim whitespace from text fields
    const trimmedExerciseName = exerciseName.trim().charAt(0).toUpperCase() + exerciseName.trim().slice(1);
    const trimmedCategory = category.trim();
    const trimmedMuscleGroup = muscleGroup.trim();
    const trimmedSecondaryMuscleGroups = secondaryMuscleGroups.map(group => group.trim()).filter(group => group.length > 0);

    const exerciseId = `${trimmedExerciseName}-${trimmedCategory}`.toLowerCase().replace(/\s+/g, '-');
    
    // Check if exercise already exists
    const exerciseRef = doc(FIREBASE_DB, `users/${user.uid}/exercises/${exerciseId}`);
    const exerciseDoc = await getDoc(exerciseRef);
    
    if (exerciseDoc.exists()) {
      return { success: false, error: "An exercise with this name and category already exists" };
    }
    
    const trackingMethodsArray = trackingMethods.map(method => {
      // Map single tracking method to array of individual tracking methods
      switch (method.toLowerCase()) {
        case 'weight x reps':
          return ['weight', 'reps'];
        case 'weight x time':
          return ['weight', 'time'];
        case 'reps':
          return ['reps'];
        case 'time':
          return ['time'];
        default:
          return [method.toLowerCase()];
      }
    }).flat();

    const exerciseData = {
      name: trimmedExerciseName,
      category: trimmedCategory,
      exerciseId,
      muscleGroup: trimmedMuscleGroup,
      secondaryMuscles: trimmedSecondaryMuscleGroups,
      trackingMethods: trackingMethodsArray,
      notes: '',
      isDeleted: false,
    };

    try {
      await setDoc(exerciseRef, exerciseData);
      
      // Optimistically add the exercise to state immediately
      const newExercise = {
        id: exerciseId,
        ...exerciseData,
      };
      
      setExerciseSections(prevSections => {
        const firstLetter = trimmedExerciseName.charAt(0).toUpperCase();
        const existingSectionIndex = prevSections.findIndex(s => s.title === firstLetter);
        
        if (existingSectionIndex >= 0) {
          // Add to existing section
          const updatedSections = [...prevSections];
          const updatedData = [...updatedSections[existingSectionIndex].data, newExercise]
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
          updatedSections[existingSectionIndex] = {
            ...updatedSections[existingSectionIndex],
            data: updatedData,
          };
          return updatedSections;
        } else {
          // Create new section
          const newSection = {
            title: firstLetter,
            data: [newExercise],
          };
          return [...prevSections, newSection].sort((a, b) => a.title.localeCompare(b.title));
        }
      });
      
      // Then fetch to ensure consistency with database
      await fetchExercises(0);
      return { success: true };
    } catch (error) {
      console.error('Error adding exercise:', error);
      // Revert optimistic update on error
      await fetchExercises(0);
      return { success: false, error: "Failed to create exercise" };
    }
  };

  const fetchExercises = useCallback(async (retryCount = 0): Promise<void> => {
    try {
      setLoading(true);
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) {
        // No user - ensure we clear exercises and stop loading
        setExerciseSections([]);
        setLoading(false);
        return;
      }

      const exercisesRef = collection(FIREBASE_DB, 'users', currentUser.uid!, 'exercises');
      const exercisesSnapshot = await getDocs(exercisesRef);
      
      const exercisesList = exercisesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Exclude soft-deleted exercises and exercises without valid names
      const activeExercises = exercisesList.filter((exercise: any) => {
        // Skip deleted exercises
        if (exercise.isDeleted) return false;
        // Skip exercises without a valid name (prevents crash)
        if (!exercise.name || typeof exercise.name !== 'string' || exercise.name.trim() === '') {
          console.warn('Exercise missing valid name:', exercise.id);
          return false;
        }
        return true;
      });
      
      const groupedExercises = activeExercises.reduce((acc: any, exercise: any) => {
        const firstLetter = exercise.name.charAt(0).toUpperCase();
        
        if (!acc[firstLetter]) {
          acc[firstLetter] = [];
        }
        
        acc[firstLetter].push(exercise);
        return acc;
      }, {});
      
      const sections = Object.keys(groupedExercises)
        .sort()
        .map(letter => ({
          title: letter,
          data: groupedExercises[letter].sort((a: any, b: any) => 
            a.name.localeCompare(b.name)
          )
        }));
      
      setExerciseSections(sections);
      setLoading(false);
      // Reset empty state retry counter on successful fetch with data
      if (sections.length > 0) {
        emptyStateRetryCount.current = 0;
      }
    } catch (error) {
      console.error(`Error fetching exercises (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
      
      // Retry with exponential backoff if we haven't exceeded max retries
      if (retryCount < MAX_RETRIES) {
        const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.log(`Retrying in ${delayMs}ms...`);
        await delay(delayMs);
        return fetchExercises(retryCount + 1);
      }
      
      // All retries exhausted - keep existing data if we have any
      console.error('All retry attempts failed. Keeping existing exercise data.');
      setLoading(false);
    }
  }, []);
  // Make fetchExercises available outside of React via triggerExerciseRefetch
  // Wrap to ensure we always call with retryCount = 0
  useEffect(() => {
    registerExerciseRefetcher(() => fetchExercises(0));
  }, [fetchExercises]);

  // Load exercises when the user is authenticated. Always fetch fresh data.
  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged((user) => {
      if (user) {
        // Reset retry counter on fresh auth
        emptyStateRetryCount.current = 0;
        fetchExercises(0);
      } else {
        setExerciseSections([]);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [fetchExercises]);

  // Auto-refetch when exercises are unexpectedly empty
  // This catches edge cases where exercises disappear due to race conditions or errors
  useEffect(() => {
    // Skip if loading, no user, already refetching, or we've hit the retry limit
    if (loading) return;
    if (!FIREBASE_AUTH.currentUser) return;
    if (exerciseSections.length > 0) return;
    if (isRefetchingDueToEmpty.current) return;
    if (emptyStateRetryCount.current >= MAX_EMPTY_STATE_RETRIES) {
      console.warn('Exercise database appears to be empty after multiple refetch attempts');
      return;
    }

    // Exercises are empty when they shouldn't be - schedule a refetch
    console.log(`Exercises unexpectedly empty, scheduling refetch (attempt ${emptyStateRetryCount.current + 1}/${MAX_EMPTY_STATE_RETRIES})`);
    isRefetchingDueToEmpty.current = true;
    emptyStateRetryCount.current += 1;

    const timeoutId = setTimeout(() => {
      fetchExercises(0).finally(() => {
        isRefetchingDueToEmpty.current = false;
      });
    }, EMPTY_STATE_REFETCH_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
      isRefetchingDueToEmpty.current = false;
    };
  }, [exerciseSections, loading, fetchExercises]);

  // Memoize the public fetchExercises to always start with retryCount = 0
  const publicFetchExercises = useCallback(() => fetchExercises(0), [fetchExercises]);

  return (
    <ExerciseDBContext.Provider
      value={{
        exerciseSections,
        loading,
        createExercise,
        fetchExercises: publicFetchExercises,
      }}
    >
      {children}
    </ExerciseDBContext.Provider>
  );
};

export default function useExerciseDB() {
  const context = useContext(ExerciseDBContext);
  if (context === undefined) {
    throw new Error('useExerciseDB must be used within an ExerciseDBProvider');
  }
  return context;
};