import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';

type Folder = { id: string; name: string };

type TemplateFoldersContextType = {
  folders: Folder[];
  foldersLoading: boolean;
  fetchFolders: () => Promise<void>;
};

const TemplateFoldersContext = createContext<TemplateFoldersContextType | undefined>(undefined);

export const TemplateFoldersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState<boolean>(true);
  const STORAGE_KEY = 'templateFoldersCache';

  const fetchFolders = async () => {
    try {
      setFoldersLoading(true);
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) {
        setFolders([]);
        return;
      }
      const foldersRef = collection(FIREBASE_DB, 'users', currentUser.uid!, 'folders');
      const snapshot = await getDocs(foldersRef);
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        name: String((d.data() as any)?.name ?? d.id),
      }));
      setFolders(list);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch {}
    } catch (e) {
      console.error('Error fetching folders:', e);
    } finally {
      setFoldersLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const cached = await AsyncStorage.getItem(STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              setFolders(parsed);
              setFoldersLoading(false);
            }
          }
        } catch {}
        fetchFolders();
      } else {
        setFolders([]);
        setFoldersLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <TemplateFoldersContext.Provider
      value={{
        folders,
        foldersLoading,
        fetchFolders,
      }}
    >
      {children}
    </TemplateFoldersContext.Provider>
  );
};

export default function useTemplateFolders() {
  const ctx = useContext(TemplateFoldersContext);
  if (ctx === undefined) {
    throw new Error('useTemplateFolders must be used within a TemplateFoldersProvider');
  }
  return ctx;
}


