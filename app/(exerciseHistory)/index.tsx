import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthProvider';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import AboutTab from './about';
import HistoryTab from './history';
import ChartsTab from './charts';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';
import { collection, getDocs, orderBy, query, limit, Timestamp } from 'firebase/firestore';

type TabKey = 'about' | 'history' | 'charts';

export default function ExerciseHistoryScreen() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();
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
      <SafeAreaView edges={['bottom','left','right']} className={`flex-1 bg-${theme}-background`} style={{ paddingTop: insets.top }}>
        {/* Header with back arrow and title */}
        <HStack className={`w-full py-4 px-2 bg-${theme}-background items-center justify-between`}>
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

          <Box className="flex-1 flex items-center justify-center">
            <Heading size="lg" className="text-typography-900 font-semibold text-center">
              {`${exercise?.name} ${exercise?.category !== 'Other' ? `(${exercise?.category})` : ''}`}
            </Heading>
          </Box>

          <Box className="w-24" />
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
              <ButtonText className={activeTab === key ? `text-${theme}-background` : `text-typography-900`}>
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
  );
}
