import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/app/context/ThemeContext';
import { useWorkout } from '@/app/context/WorkoutContext';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { FIREBASE_AUTH, FIREBASE_DB } from '@/FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

type ProgressionItem = { label: string; change: string; kind: 'allTime' | 'lastSession'; exerciseId: string };
type ProgressionsResult = { title: string; items: ProgressionItem[] };

export default function ProgressionsScreen() {
  const { theme } = useTheme();
  const { cancelWorkout } = useWorkout();
  const params = useLocalSearchParams();
  const [usernameFromDb, setUsernameFromDb] = useState<string>('');
  const data = useMemo(() => {
    try {
      const raw = typeof params.data === 'string' ? params.data : Array.isArray(params.data) ? params.data[0] : undefined;
      if (!raw) return { title: 'Progressions', items: [] } as ProgressionsResult;
      const parsed = JSON.parse(raw) as ProgressionsResult;
      return parsed;
    } catch {
      return { title: 'Progressions', items: [] } as ProgressionsResult;
    }
  }, [params.data]);

  useEffect(() => {
    const uid = FIREBASE_AUTH.currentUser?.uid;
    if (!uid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(FIREBASE_DB, 'users', uid));
        if (snap.exists()) {
          const name = (snap.data() as any)?.username;
          if (typeof name === 'string' && name.trim()) setUsernameFromDb(name.trim());
        }
      } catch (_) {
        // ignore
      }
    })();
  }, []);

  const allTimeItems = useMemo(
    () => (data.items || []).filter(i => i.kind === 'allTime'),
    [data.items]
  );
  const lastSessionItems = useMemo(
    () => (data.items || [])
      .filter(i => i.kind === 'lastSession')
      .filter(i => !data.items.some(ai => ai.kind === 'allTime' && ai.exerciseId === i.exerciseId)),
    [data.items]
  );

  return (
    <SafeAreaView className={`bg-${theme}-background flex-1`}>
      <VStack className="flex-1 px-4 py-6" space="lg">

        <Heading size="xl" className="text-typography-900 font-semibold mb-2">
          {`Congratulations${usernameFromDb ? ` ${usernameFromDb}!` : '!'}`}
        </Heading>

        <Heading size="xl" className="text-typography-900 font-semibold mb-2">
          {data.title}
        </Heading>

        {/* All-Time PRs first, preserving workout order */}
        {allTimeItems.length > 0 && (
          <VStack space="sm">
            <Heading size="md" className="text-typography-800">All-Time PRs</Heading>
            {allTimeItems.map((it, idx) => (
              <Box key={`all_${idx}`} className="bg-background-0 border-outline-200 rounded-md p-4">
                <HStack className="items-center justify-between">
                  <Text className="text-typography-800">{it.label}</Text>
                  <Text className="text-typography-900 font-semibold">{it.change}</Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}

        {/* Last-Session PRs next, only those without an all-time PR for same exercise */}
        {lastSessionItems.length > 0 && (
          <VStack space="sm">
            <Heading size="md" className="text-typography-800">Since Last Session</Heading>
            {lastSessionItems.map((it, idx) => (
              <Box key={`last_${idx}`} className="bg-background-0 border-outline-200 rounded-md p-4">
                <HStack className="items-center justify-between">
                  <Text className="text-typography-800">{it.label}</Text>
                  <Text className="text-typography-900 font-semibold">{it.change}</Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}

        <Box className="mt-auto">
          <Button size="md" action="primary" onPress={() => cancelWorkout()}>
            <ButtonText>Continue</ButtonText>
          </Button>
        </Box>
      </VStack>
    </SafeAreaView>
  );
}


