// app/context/ExerciseDBContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';
import { FIREBASE_AUTH } from '@/FirebaseConfig';

type ExerciseSectionType = {
  title: string;
  data: any[];
};

type ExerciseDBContextType = {
  exerciseSections: ExerciseSectionType[];
  loading: boolean;
  createExercise: (exerciseName: string, category: string, muscleGroup: string, secondaryMuscleGroups: string[], trackingMethods: string[]) => Promise<void>;
};

const ExerciseDBContext = createContext<ExerciseDBContextType | undefined>(undefined);

export const ExerciseDBProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [exerciseSections, setExerciseSections] = useState<ExerciseSectionType[]>([]);
  const [loading, setLoading] = useState(true);

  const createExercise = async (exerciseName: string, category: string, muscleGroup: string, secondaryMuscleGroups: string[], trackingMethods: string[]) => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user?.email) return;

    const exerciseId = `${exerciseName}-${category}`.toLowerCase().replace(/\s+/g, '-');
    
    const exerciseData = {
      name: exerciseName,
      category,
      'exercise-id': exerciseId,
      muscleGroup,
      secondaryMuscles: secondaryMuscleGroups,
      trackingMethods
    };

    try {
      await setDoc(doc(FIREBASE_DB, `users/${user.email}/exercises/${exerciseId}`), exerciseData);
      await fetchExercises(); // Refresh the exercises list
    } catch (error) {
      console.error('Error adding exercise:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) {
        console.log('No user is signed in');
        setLoading(false);
        return;
      }

      const exercisesRef = collection(FIREBASE_DB, 'users', currentUser.email!, 'exercises');
      const exercisesSnapshot = await getDocs(exercisesRef);
      
      const exercisesList = exercisesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const groupedExercises = exercisesList.reduce((acc: any, exercise: any) => {
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

  // Load exercises when the user is authenticated
  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged((user) => {
      if (user) {
        fetchExercises();
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