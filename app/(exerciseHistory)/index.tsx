import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/app/context/ThemeContext';
import useExerciseDB from '@/app/context/ExerciseDBContext';
import { useAuth } from '@/app/context/AuthProvider';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import AboutTab from './about';
import HistoryTab from './history';
import ChartsTab from './charts';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';
import { collection, getDocs, orderBy, query, limit, Timestamp } from 'firebase/firestore';
import { Entypo, FontAwesome5 } from '@expo/vector-icons';

type TabKey = 'about' | 'history' | 'charts';

export default function ExerciseHistoryScreen() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { fetchExercises } = useExerciseDB();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('about');
  const [metrics, setMetrics] = useState<Record<string, any> | null>(null);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [historyInstances, setHistoryInstances] = useState<any[]>([]);
  const [historyLastDate, setHistoryLastDate] = useState<Timestamp | null>(null);
  type ExerciseSet = { id: string; order: number; trackingData: { weight?: number | null; reps?: number | null; time?: number | null } };
  const [historySetsByInstanceId, setHistorySetsByInstanceId] = useState<Record<string, ExerciseSet[]>>({});
  const [historySetsLoading, setHistorySetsLoading] = useState<Record<string, boolean>>({});
  // Charts data (fetched once here so switching tabs doesn't refetch)
  type ChartsInstance = {
    sessionId: string;
    exerciseInSessionId: string;
    date: any;
    volume?: number;
    topWeight?: number;
    bestEst1RM?: number;
    completedRepCount?: number;
    topReps?: number;
    totalReps?: number;
    topTime?: number;
    totalTime?: number;
  };
  const [chartsLoading, setChartsLoading] = useState<boolean>(true);
  const [chartsInstances, setChartsInstances] = useState<ChartsInstance[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleConfirmDelete = async () => {
    if (!user?.uid || !exercise?.exerciseId) {
      setShowDeleteConfirm(false);
      return;
    }
    try {
      const ref = doc(FIREBASE_DB, `users/${user.uid}/exercises/${exercise.exerciseId}`);
      await updateDoc(ref, { isDeleted: true });
      if (fetchExercises) {
        await fetchExercises();
      }
      router.back();
    } catch (err) {
      console.warn('Failed to mark exercise deleted', err);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const exercise = useMemo(() => {
    try {
      if (typeof params.data === 'string') return JSON.parse(params.data);
      return {};
    } catch {
      return {} as any;
    }
  }, [params.data]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        subscription.remove();
      };
    }, [])
  );

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      if (!user?.uid || !exercise?.exerciseId) {
        if (!isMounted) return;
        setMetrics(null);
        setMetricsLoading(false);
        return;
      }
      setMetricsLoading(true);
      try {
        const ref = doc(FIREBASE_DB, `users/${user.uid}/exercises/${exercise.exerciseId}/metrics/allTimeMetrics`);
        const snap = await getDoc(ref);
        if (!isMounted) return;
        setMetrics(snap.exists() ? (snap.data() as Record<string, any>) : null);
      } catch {
        if (!isMounted) return;
        setMetrics(null);
      } finally {
        if (isMounted) setMetricsLoading(false);
      }
    };
    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, [user?.uid, exercise?.exerciseId]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialHistory = async () => {
      if (!user?.uid || !exercise?.exerciseId) {
        if (!isMounted) return;
        setHistoryInstances([]);
        setHistoryLastDate(null);
        setHistorySetsByInstanceId({});
        setHistorySetsLoading({});
        setHistoryLoading(false);
        return;
      }
      setHistoryLoading(true);
      try {
        const colRef = collection(FIREBASE_DB, `users/${user.uid}/exercises/${exercise.exerciseId}/instances`);
        const q = query(colRef, orderBy('date', 'desc'), limit(10));
        const snap = await getDocs(q);
        if (!isMounted) return;
        const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setHistoryInstances(rows);
        const last = rows.length ? rows[rows.length - 1] : null;
        setHistoryLastDate(last?.date ?? null);
      } catch {
        if (!isMounted) return;
        setHistoryInstances([]);
        setHistoryLastDate(null);
      } finally {
        if (isMounted) setHistoryLoading(false);
      }
    };
    fetchInitialHistory();
    return () => {
      isMounted = false;
    };
  }, [user?.uid, exercise?.exerciseId]);

  // Fetch all instances ascending for charts once
  useEffect(() => {
    let isMounted = true;
    const fetchChartsInstances = async () => {
      if (!user?.uid || !exercise?.exerciseId) {
        if (!isMounted) return;
        setChartsInstances([]);
        setChartsLoading(false);
        return;
      }
      setChartsLoading(true);
      try {
        const colRef = collection(FIREBASE_DB, `users/${user.uid}/exercises/${exercise.exerciseId}/instances`);
        const q = query(colRef, orderBy('date', 'asc'));
        const snap = await getDocs(q);
        if (!isMounted) return;
        const rows = snap.docs.map(d => d.data() as ChartsInstance);
        setChartsInstances(rows);
      } catch {
        if (!isMounted) return;
        setChartsInstances([]);
      } finally {
        if (isMounted) setChartsLoading(false);
      }
    };
    fetchChartsInstances();
    return () => {
      isMounted = false;
    };
  }, [user?.uid, exercise?.exerciseId]);

  const prefetchSetsForInstances = React.useCallback(
    async (instances: any[]) => {
      if (!user?.uid) return;
      const updates: Array<Promise<void>> = [];
      const newLoading: Record<string, boolean> = {};
      for (const inst of instances) {
        const id = inst?.id;
        if (!id) continue;
        if (historySetsByInstanceId[id] || historySetsLoading[id]) continue;
        newLoading[id] = true;
        updates.push(
          (async () => {
            try {
              const ref = doc(FIREBASE_DB, `users/${user.uid}/sessions/${inst.sessionId}/exercises/${inst.exerciseInSessionId}`);
              const snap = await getDoc(ref);
              const sets = (snap.exists() ? (snap.data() as any)?.sets : []) as ExerciseSet[];
              const sorted = Array.isArray(sets) ? [...sets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];
              setHistorySetsByInstanceId(prev => ({ ...prev, [id]: sorted }));
            } catch {
              setHistorySetsByInstanceId(prev => ({ ...prev, [id]: [] }));
            } finally {
              setHistorySetsLoading(prev => ({ ...prev, [id]: false }));
            }
          })()
        );
      }
      if (Object.keys(newLoading).length) {
        setHistorySetsLoading(prev => ({ ...prev, ...newLoading }));
      }
      await Promise.all(updates);
    },
    [FIREBASE_DB, user?.uid, historySetsByInstanceId, historySetsLoading]
  );

  // Prefetch sets after initial history load
  useEffect(() => {
    if (historyInstances.length) {
      prefetchSetsForInstances(historyInstances);
    }
  }, [historyInstances, prefetchSetsForInstances]);

  return (
    <>
      <SafeAreaView edges={['bottom','left','right']} className={`flex-1 bg-${theme}-background`} style={{ paddingTop: insets.top }}>
        {/* Header with back arrow, centered title, and trash */}
        <HStack className={`w-full py-4 px-2 bg-${theme}-background items-center`}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 20 }}
            className="w-24 pl-3 flex items-start"
          >
            <FontAwesome5 name="chevron-down" size={28} color="white" />
          </Pressable>

          <Box className="flex-1 items-center justify-center">
            <Heading size="lg" className="text-typography-800 font-semibold text-center">
              {`${exercise?.name} ${exercise?.category !== 'Other' ? `(${exercise?.category})` : ''}`}
            </Heading>
          </Box>

          <Pressable
            className="w-24 pr-3 flex items-end"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Entypo name="trash" size={24} color="rgba(220, 38, 38, 0.8)" />
          </Pressable>
        </HStack>

        {/* Custom Tabs */}
        <HStack className="w-full px-2 pb-2 items-center justify-center gap-2">
          {(['about', 'history', 'charts'] as TabKey[]).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={activeTab === key ? 'solid' : 'outline'}
              className={activeTab === key ? `bg-${theme}-light` : `border-outline-200`}
              onPress={() => setActiveTab(key)}
            >
              <ButtonText className={activeTab === key ? `text-${theme}-background` : `text-typography-800`}>
                {key === 'about' ? 'About' : key === 'history' ? 'History' : 'Charts'}
              </ButtonText>
            </Button>
          ))}
        </HStack>

        {/* Content */}
        <View className="flex-1">
          {activeTab === 'about' && <AboutTab exercise={exercise} metrics={metrics} loading={metricsLoading} />}
          {activeTab === 'history' && (
            <HistoryTab
              exercise={exercise}
              prefetched={{ instances: historyInstances, lastDate: historyLastDate }}
              providedSets={historySetsByInstanceId}
              providedSetsLoading={historySetsLoading}
              onInstancesLoaded={(more) => prefetchSetsForInstances(more)}
            />
          )}
          {activeTab === 'charts' && <ChartsTab exercise={exercise} instances={chartsInstances} loading={chartsLoading} />}
        </View>

      </SafeAreaView>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        useRNModal
        className="z-1000"
      >
        <ModalBackdrop onPress={() => setShowDeleteConfirm(false)} />
        <ModalContent
          size="sm"
          className={`bg-${theme}-background border-${theme}-steelGray px-5 py-4`}
        >
          <ModalHeader>
            <HStack className="flex-1" space="md">
              <Heading size="md" className="text-typography-800 font-semibold">
                Delete exercise?
              </Heading>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <Text className="text-typography-800">Deleting an exercise will remove it from the database, but it will still be visible in past workouts.</Text>
          </ModalBody>
          <ModalFooter className="flex-row justify-between items-center px-4">
            <Button variant="link" onPress={() => setShowDeleteConfirm(false)}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button action="negative" onPress={handleConfirmDelete}>
              <ButtonText>Confirm</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
