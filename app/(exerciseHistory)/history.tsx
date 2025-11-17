import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthProvider';
import { FIREBASE_DB } from '@/FirebaseConfig';
import {
  collection,
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

type Prefetched = {
  instances?: InstanceDoc[];
  lastDate?: Timestamp | null;
};

export default function ExerciseHistoryTab({
  exercise,
  prefetched,
  providedSets,
  providedSetsLoading,
  onInstancesLoaded,
}: {
  exercise?: ExerciseProp;
  prefetched?: Prefetched;
  providedSets?: Record<string, SessionExerciseDoc['sets']>;
  providedSetsLoading?: Record<string, boolean>;
  onInstancesLoaded?: (instances: InstanceDoc[]) => void;
}) {
  const { theme } = useTheme();
  const { user } = useAuth();

  const pageSize = 10;
  const [instances, setInstances] = useState<InstanceDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastDateValue, setLastDateValue] = useState<Timestamp | null>(null);

  const setsByInstanceId = providedSets ?? {};
  const setsLoading = providedSetsLoading ?? {};

  const uid = user?.uid ?? '';
  const exerciseId = exercise?.exerciseId ?? '';

  const instancesColPath = useMemo(() => {
    if (!uid || !exerciseId) return null;
    return `users/${uid}/exercises/${exerciseId}/instances`;
  }, [uid, exerciseId]);

  const formatDate = (ts?: Timestamp) => {
    if (!ts) return '';
    const d = ts.toDate();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const day = d.toLocaleDateString(undefined, { weekday: 'long' });
    const date = d.toLocaleDateString();
    return `${time}, ${day}, ${date}`;
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
      setLastDateValue(docs.length ? docs[docs.length - 1]!.date : null);
      setHasMore(snap.docs.length === pageSize);
    } catch (e) {
      setInstances([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [instancesColPath]);

  const loadNextPage = useCallback(async () => {
    if (!instancesColPath || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const colRef = collection(FIREBASE_DB, instancesColPath);
      const order = orderBy('date', 'desc');
      const cursor =
        lastDocRef.current != null
          ? startAfter(lastDocRef.current)
          : lastDateValue != null
          ? startAfter(lastDateValue)
          : undefined;
      const base = [colRef, order] as const;
      // @ts-expect-error - spread conditional cursor for query
      const q = query(...(cursor ? [...base, cursor, limit(pageSize)] : [...base, limit(pageSize)]));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as InstanceDoc[];
      setInstances(prev => [...prev, ...docs]);
      lastDocRef.current = snap.docs.length ? snap.docs[snap.docs.length - 1] : lastDocRef.current;
      if (docs.length) setLastDateValue(docs[docs.length - 1]!.date);
      setHasMore(snap.docs.length === pageSize);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [instancesColPath, hasMore, loadingMore, lastDateValue]);

  useEffect(() => {
    // If prefetched provided, hydrate state and skip initial fetch
    if (prefetched?.instances && prefetched.instances.length > 0) {
      setInstances(prefetched.instances);
      setHasMore(true);
      setLoading(false);
      setLastDateValue(prefetched.lastDate ?? null);
      if (onInstancesLoaded) onInstancesLoaded(prefetched.instances as InstanceDoc[]);
      return;
    }
    loadFirstPage();
  }, [loadFirstPage, prefetched?.instances, prefetched?.lastDate, onInstancesLoaded]);

  const renderSetRow = (set: SessionExerciseDoc['sets'][number]) => {
    const w = set.trackingData?.weight;
    const r = set.trackingData?.reps;
    const t = set.trackingData?.time;

    let summary = '';
    if (w != null && r != null) summary = `${w}lbs x ${r}`;
    else if (w != null && t != null) summary = `${w}lbs for ${t}s`;
    else if (r != null) summary = `${r} reps`;
    else if (t != null) summary = `${t} seconds`;

    return (
      <HStack key={set.id} className="w-full py-1 items-center">
        <Text size="lg" bold className="text-typography-900 w-6 text-right">{`${set.order}:`}</Text>
        <Text size="lg" className="text-typography-900 ml-3">{summary || '-'}</Text>
      </HStack>
    );
  };

  const renderItem = ({ item }: { item: InstanceDoc }) => {
    const sets = setsByInstanceId[item.id];
    const isLoadingSets = !!setsLoading[item.id];

    return (
      <Box className={`w-full rounded-md mb-3 px-3 py-2 bg-${theme}-button`}>
        <VStack className="w-full gap-1">
          <Text className="text-typography-900 font-semibold">{formatDate(item.date)}</Text>

          {isLoadingSets ? (
            <HStack className="w-full py-2 items-center justify-center">
              <Spinner />
            </HStack>
          ) : (
            <VStack className="w-full pt-2">
              <Text size="lg" bold className="text-typography-700 mb-1">Sets</Text>
              <VStack className="w-full">{(sets ?? []).map(renderSetRow)}</VStack>
            </VStack>
          )}
        </VStack>
      </Box>
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
          onMomentumScrollEnd={() => {
            // notify parent to ensure sets for current batch
            if (onInstancesLoaded) onInstancesLoaded(instances);
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


