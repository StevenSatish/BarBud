// app/context/ExerciseDBContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';
import { FIREBASE_AUTH } from '@/FirebaseConfig';

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
      await fetchExercises();
      return { success: true };
    } catch (error) {
      console.error('Error adding exercise:', error);
      // Revert optimistic update on error
      await fetchExercises();
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
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };
  // Make fetchExercises available outside of React via triggerExerciseRefetch
  registerExerciseRefetcher(fetchExercises);

  // Load exercises when the user is authenticated. Always fetch fresh data.
  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged((user) => {
      if (user) {
        fetchExercises();
      } else {
        setExerciseSections([]);
        setLoading(false);
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