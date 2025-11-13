import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
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
import { Text } from '@/components/ui/text';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';

type TabKey = 'about' | 'history' | 'charts';

export default function ExerciseHistoryScreen() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('about');
  const [metrics, setMetrics] = useState<Record<string, any> | null>(null);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);

  const exercise = useMemo(() => {
    try {
      if (typeof params.data === 'string') return JSON.parse(params.data);
      return {};
    } catch {
      return {} as any;
    }
  }, [params.data]);

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

  return (
      <SafeAreaView className={`flex-1 bg-${theme}-background`}>
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
          {activeTab === 'history' && <HistoryTab exercise={exercise} />}
          {activeTab === 'charts' && <ChartsTab exercise={exercise} />}
        </View>
      </SafeAreaView>
  );
}


