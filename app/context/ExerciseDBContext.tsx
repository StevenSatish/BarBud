// app/context/ExerciseDBContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';
import { FIREBASE_AUTH } from '@/FirebaseConfig';

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
  const STORAGE_KEY = 'exerciseSectionsCache';

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
    
    const exerciseData = {
      name: trimmedExerciseName,
      category: trimmedCategory,
      exerciseId,
      muscleGroup: trimmedMuscleGroup,
      secondaryMuscles: trimmedSecondaryMuscleGroups,
      trackingMethods: trackingMethods.map(method => {
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
      }).flat()
    };

    try {
      await setDoc(exerciseRef, exerciseData);
      await fetchExercises(); // Refresh the exercises list
      return { success: true };
    } catch (error) {
      console.error('Error adding exercise:', error);
      return { success: false, error: "Failed to create exercise" };
    }
  };

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const exercisesRef = collection(FIREBASE_DB, 'users', currentUser.uid!, 'exercises');
      const exercisesSnapshot = await getDocs(exercisesRef);
      
      const exercisesList = exercisesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Exclude soft-deleted exercises
      const activeExercises = exercisesList.filter((exercise: any) => !exercise.isDeleted);
      
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
      // Persist cache
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
      } catch {}
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load exercises when the user is authenticated. Show cached immediately (SWR).
  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged((user) => {
      if (user) {
        (async () => {
          try {
            const cached = await AsyncStorage.getItem(STORAGE_KEY);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) {
                setExerciseSections(parsed);
                setLoading(false);
              }
            }
          } catch {}
          // Revalidate in background
          fetchExercises();
        })();
      } else {
        setExerciseSections([]);
      }
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <ExerciseDBContext.Provider
      value={{
        exerciseSections,
        loading,
        createExercise,
        fetchExercises,
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