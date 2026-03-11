import { doc, writeBatch } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';

export const resetExerciseProgress = async (uid: string, exerciseId: string) => {
  const batch = writeBatch(FIREBASE_DB);
  const resetDate = new Date();

  const exerciseRef = doc(FIREBASE_DB, `users/${uid}/exercises/${exerciseId}`);
  batch.set(exerciseRef, { resetDate }, { merge: true });

  const lastRef = doc(FIREBASE_DB, `users/${uid}/exercises/${exerciseId}/metrics/lastSessionMetrics`);
  batch.set(lastRef, {}, { merge: false });

  const allTimeRef = doc(FIREBASE_DB, `users/${uid}/exercises/${exerciseId}/metrics/allTimeMetrics`);
  batch.set(allTimeRef, {}, { merge: false });

  await batch.commit();
};
