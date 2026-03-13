import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '@/FirebaseConfig';

export type UserProfile = {
  optedIntoRanked: boolean;
  gender: string;
  weightClass: string;
};

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  refreshUserProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}>({
  user: null,
  loading: true,
  userProfile: null,
  refreshUserProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchUserProfile = useCallback(async (uid: string) => {
    const snap = await getDoc(doc(FIREBASE_DB, 'users', uid));
    if (!snap.exists()) {
      return { optedIntoRanked: false, gender: '', weightClass: '' };
    }
    const data = snap.data();
    return {
      optedIntoRanked: data.optedIntoRanked === true,
      gender: data.gender ?? '',
      weightClass: data.weightClass ?? '',
    };
  }, []);

  const refreshUserProfile = useCallback(async () => {
    const uid = FIREBASE_AUTH.currentUser?.uid;
    if (!uid) {
      setUserProfile(null);
      return;
    }
    const profile = await fetchUserProfile(uid);
    setUserProfile(profile);
  }, [fetchUserProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }
      const profile = await fetchUserProfile(firebaseUser.uid);
      setUserProfile(profile);
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchUserProfile]);

  const signOut = async () => {
    setLoading(true);
    setUserProfile(null);
    try {
      await FIREBASE_AUTH.signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, userProfile, refreshUserProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;