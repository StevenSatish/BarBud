import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthProvider';
import { FIREBASE_DB } from '@/FirebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Spinner } from '@/components/ui/spinner';

type ExerciseProp = {
  exerciseId?: string;
  name?: string;
};

type InstanceDoc = {
  id: string;
  sessionId: string;
  exerciseInSessionId: string;
  date: Timestamp;
  // Optional aggregates we might show in header if present
  volume?: number;
  topWeight?: number;
  bestEst1RM?: number;
  completedSetCount?: number;
  completedRepCount?: number;
  topReps?: number;
  totalReps?: number;
  topTime?: number;
  totalTime?: number;
};

type SessionExerciseDoc = {
  exerciseId: string;
  order: number;
  est1rm?: number;
  sets: Array<{
    id: string;
    order: number;
    trackingData: {
      weight?: number | null;
      reps?: number | null;
      time?: number | null;
    };
  }>;
};

export default function ExerciseHistoryTab({ exercise }: { exercise?: ExerciseProp }) {
  const { theme } = useTheme();
  const { user } = useAuth();

  const pageSize = 10;
  const [instances, setInstances] = useState<InstanceDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [setsByInstanceId, setSetsByInstanceId] = useState<Record<string, SessionExerciseDoc['sets']>>({});
  const [setsLoading, setSetsLoading] = useState<Record<string, boolean>>({});

  const uid = user?.uid ?? '';
  const exerciseId = exercise?.exerciseId ?? '';

  const instancesColPath = useMemo(() => {
    if (!uid || !exerciseId) return null;
    return `users/${uid}/exercises/${exerciseId}/instances`;
  }, [uid, exerciseId]);

  const formatDate = (ts?: Timestamp) => {
    if (!ts) return '';
    const d = ts.toDate();
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const loadFirstPage = useCallback(async () => {
    if (!instancesColPath) {
      setInstances([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const colRef = collection(FIREBASE_DB, instancesColPath);
      const q = query(colRef, orderBy('date', 'desc'), limit(pageSize));
      const snap = await getDocs(q);

      const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as InstanceDoc[];
      setInstances(docs);
      lastDocRef.current = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
      setHasMore(snap.docs.length === pageSize);
    } catch (e) {
      setInstances([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [instancesColPath]);

  const loadNextPage = useCallback(async () => {
    if (!instancesColPath || !hasMore || loadingMore || !lastDocRef.current) return;
    setLoadingMore(true);
    try {
      const colRef = collection(FIREBASE_DB, instancesColPath);
      const q = query(colRef, orderBy('date', 'desc'), startAfter(lastDocRef.current), limit(pageSize));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as InstanceDoc[];
      setInstances(prev => [...prev, ...docs]);
      lastDocRef.current = snap.docs.length ? snap.docs[snap.docs.length - 1] : lastDocRef.current;
      setHasMore(snap.docs.length === pageSize);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [instancesColPath, hasMore, loadingMore]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const toggleExpand = useCallback(async (instance: InstanceDoc) => {
    const id = instance.id;
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    // Lazy fetch sets on first expand
    if (!setsByInstanceId[id] && !setsLoading[id]) {
      setSetsLoading(prev => ({ ...prev, [id]: true }));
      try {
        const exerciseRef = doc(
          FIREBASE_DB,
          `users/${uid}/sessions/${instance.sessionId}/exercises/${instance.exerciseInSessionId}`
        );
        const exerciseSnap = await getDoc(exerciseRef);
        if (exerciseSnap.exists()) {
          const data = exerciseSnap.data() as SessionExerciseDoc;
          const sets = Array.isArray(data.sets) ? data.sets : [];
          // ensure sorted by order asc
          sets.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setSetsByInstanceId(prev => ({ ...prev, [id]: sets }));
        } else {
          setSetsByInstanceId(prev => ({ ...prev, [id]: [] }));
        }
      } catch {
        setSetsByInstanceId(prev => ({ ...prev, [id]: [] }));
      } finally {
        setSetsLoading(prev => ({ ...prev, [id]: false }));
      }
    }
  }, [uid, setsByInstanceId, setsLoading]);

  const renderSetRow = (set: SessionExerciseDoc['sets'][number]) => {
    const w = set.trackingData?.weight;
    const r = set.trackingData?.reps;
    const t = set.trackingData?.time;

    let summary = '';
    if (w != null && r != null) summary = `${w} lbs x ${r} reps`;
    else if (w != null && t != null) summary = `${w} for ${t}s`;
    else if (r != null) summary = `${r} reps`;
    else if (t != null) summary = `${t} seconds`;

    return (
      <HStack key={set.id} className="w-full py-1 items-center justify-between">
        <Text className="text-typography-900">{`Set ${set.order}`}</Text>
        <Text className="text-typography-700">{summary || '-'}</Text>
      </HStack>
    );
  };

  const renderItem = ({ item }: { item: InstanceDoc }) => {
    const isOpen = !!expanded[item.id];
    const sets = setsByInstanceId[item.id];
    const isLoadingSets = !!setsLoading[item.id];

    return (
      <Pressable onPress={() => toggleExpand(item)}>
        <Box className={`w-full rounded-md mb-3 px-3 py-2 bg-${theme}-card`}>
          <VStack className="w-full gap-1">
            <HStack className="w-full items-center justify-between">
              <Text className="text-typography-900 font-semibold">{formatDate(item.date)}</Text>
              <Text className="text-typography-700">
                {typeof item.completedSetCount === 'number' ? `${item.completedSetCount} sets` : ''}
              </Text>
            </HStack>

            {isOpen ? (
              isLoadingSets ? (
                <HStack className="w-full py-2 items-center justify-center">
                  <Spinner />
                </HStack>
              ) : (
                <VStack className="w-full pt-2">{(sets ?? []).map(renderSetRow)}</VStack>
              )
            ) : null}
          </VStack>
        </Box>
      </Pressable>
    );
  };

  if (!uid || !exerciseId) {
    return (
      <View className={`flex-1 bg-${theme}-background p-4`}>
        <Text className="text-typography-900">No exercise selected.</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 bg-${theme}-background px-3 pt-2`}>
      {loading ? (
        <HStack className="w-full flex-1 items-center justify-center">
          <Spinner />
        </HStack>
      ) : (
        <FlatList
          data={instances}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore && !loadingMore) loadNextPage();
          }}
          ListFooterComponent={
            loadingMore ? (
              <HStack className="w-full py-3 items-center justify-center">
                <Spinner />
              </HStack>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}


