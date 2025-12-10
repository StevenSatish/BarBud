import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp, collection, getDocs } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';

type Folder = { id: string; name: string };

export type TemplateExerciseSnapshot = {
  exerciseId: string;
  nameSnap: string;
  numSets: number;
};

export type Template = {
  id: string;
  templateName: string;
  lastPerformedAt?: Timestamp;
  exercises: TemplateExerciseSnapshot[];
};

type TemplateFoldersContextType = {
  folders: Folder[];
  foldersLoading: boolean;
  fetchFolders: () => Promise<Folder[]>;
  templatesByFolder: Record<string, Template[]>;
  templatesLoading: boolean;
  fetchTemplates: (targetFolders?: Folder[]) => Promise<void>;
};

const TemplateFoldersContext = createContext<TemplateFoldersContextType | undefined>(undefined);

export const TemplateFoldersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState<boolean>(true);
  const [templatesByFolder, setTemplatesByFolder] = useState<Record<string, Template[]>>({});
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(true);
  const STORAGE_KEY = 'templateFoldersCache';

  const ensureDefaultFolder = (list: Folder[]) => {
    const hasNone = list.some((f) => f.id === 'none');
    return hasNone ? list : [...list, { id: 'none', name: 'None' }];
  };

  const fetchFolders = async (): Promise<Folder[]> => {
    try {
      setFoldersLoading(true);
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) {
        setFolders([]);
        setTemplatesByFolder({});
        setTemplatesLoading(false);
        return [];
      }
      const foldersRef = collection(FIREBASE_DB, 'users', currentUser.uid!, 'folders');
      const snapshot = await getDocs(foldersRef);
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        name: String((d.data() as any)?.name ?? d.id),
      }));
      const normalized = ensureDefaultFolder(list);
      setFolders(normalized);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch {}
      return normalized;
    } catch (e) {
      console.error('Error fetching folders:', e);
      return folders;
    } finally {
      setFoldersLoading(false);
    }
  };

  const fetchTemplates = async (targetFolders?: Folder[]) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser?.uid) {
      setTemplatesByFolder({});
      setTemplatesLoading(false);
      return;
    }

    setTemplatesLoading(true);
    const foldersToUse = (targetFolders && targetFolders.length ? targetFolders : folders) ?? [];
    const foldersList = foldersToUse.length ? foldersToUse : ensureDefaultFolder([]);

    try {
      const templateEntries = await Promise.all(
        foldersList.map(async (folder) => {
          try {
            const templatesRef = collection(
              FIREBASE_DB,
              'users',
              currentUser.uid!,
              'folders',
              folder.id,
              'templates'
            );
            const snapshot = await getDocs(templatesRef);
            const templates = snapshot.docs.map((d) => {
              const data = d.data() as any;
              const exercisesArray: TemplateExerciseSnapshot[] = Array.isArray(data?.exercises)
                ? data.exercises.map((ex: any) => ({
                    exerciseId: String(ex?.exerciseId ?? ''),
                    nameSnap: String(ex?.nameSnap ?? ''),
                    numSets: Number.isFinite(Number(ex?.numSets)) ? Number(ex.numSets) : 0,
                  }))
                : [];
              return {
                id: d.id,
                templateName: String(data?.templateName ?? d.id),
                lastPerformedAt: data?.lastPerformedAt,
                exercises: exercisesArray,
              } as Template;
            });
            return [folder.id, templates] as const;
          } catch (err) {
            console.error(`Error fetching templates for folder ${folder.id}:`, err);
            return [folder.id, []] as const;
          }
        })
      );

      const map: Record<string, Template[]> = {};
      templateEntries.forEach(([folderId, list]) => {
        map[folderId] = list as Template[];
      });
      setTemplatesByFolder(map);
    } catch (e) {
      console.error('Error fetching templates:', e);
      setTemplatesByFolder({});
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged(async (user) => {
      if (user) {
        setTemplatesLoading(true);
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
        const latestFolders = await fetchFolders();
        await fetchTemplates(latestFolders);
      } else {
        setFolders([]);
        setTemplatesByFolder({});
        setFoldersLoading(false);
        setTemplatesLoading(false);
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
        templatesByFolder,
        templatesLoading,
        fetchTemplates,
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


