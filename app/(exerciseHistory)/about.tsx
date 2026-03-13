import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/app/context/ThemeContext';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Spinner } from '@/components/ui/spinner';
import { Box } from '@/components/ui/box';
import Ionicons from '@expo/vector-icons/Ionicons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import { RANKED_EXERCISE_IDS, getCutoffs, RANK_ORDER, type Rank } from '@/app/lib/rankData';
import getRankProgress from '@/app/lib/rankData';

const BADGE_IMAGES: Record<Rank, any> = {
  iron: require('@/app/badges/ironBadge.png'),
  bronze: require('@/app/badges/bronzeBadge.png'),
  silver: require('@/app/badges/silverBadge.png'),
  gold: require('@/app/badges/goldBadge.png'),
  platinum: require('@/app/badges/platinumBadge.png'),
  diamond: require('@/app/badges/diamondBadge.png'),
  titanium: require('@/app/badges/titaniumBadge.png'),
  mythic: require('@/app/badges/mythicBadge.png'),
};

type MetricsAllTime = Record<string, number | string | undefined>;

function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

export default function ExerciseAbout({ exercise, metrics, loading }: { exercise?: any; metrics: MetricsAllTime | null; loading: boolean }) {
  const { theme, colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const videoId = useMemo(() => extractYouTubeId(exercise?.videoLink), [exercise?.videoLink]);
  const videoWidth = screenWidth - 32;
  const videoHeight = Math.round(videoWidth * (9 / 16));
  const [playing, setPlaying] = useState(false);
  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') setPlaying(false);
  }, []);

  const [userProfile, setUserProfile] = useState<{ optedIntoRanked?: boolean; gender?: string; weightClass?: string } | null>(null);

  useEffect(() => {
    const uid = FIREBASE_AUTH.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(FIREBASE_DB, 'users', uid)).then((snap) => {
      if (snap.exists()) setUserProfile(snap.data());
    });
  }, []);

  const isRankedExercise = !!exercise?.exerciseId && RANKED_EXERCISE_IDS.has(exercise.exerciseId);
  const showRanked = isRankedExercise && userProfile?.optedIntoRanked === true;

  const rankInfo = useMemo(() => {
    if (!showRanked || !userProfile?.gender || !userProfile?.weightClass) return null;
    const cutoffs = getCutoffs(exercise.exerciseId, userProfile.gender, userProfile.weightClass);
    if (!cutoffs) return null;
    const allTimePR = metrics?.allTimePR != null ? Number(metrics.allTimePR) : 0;
    const rank = exercise?.rank as Rank | undefined;
    const hasRank = rank && RANK_ORDER.includes(rank);

    if (hasRank) {
      const progress = getRankProgress(rank, allTimePR, cutoffs);
      return { rank, allTimePR, badge: BADGE_IMAGES[rank], ...progress };
    }

    const firstRankCutoff = cutoffs[RANK_ORDER[0]];
    const progress = firstRankCutoff > 0 ? Math.min(Math.max(allTimePR / firstRankCutoff, 0), 1) : 0;
    return {
      rank: null as Rank | null,
      allTimePR,
      badge: null,
      currentCutoff: 0,
      nextCutoff: firstRankCutoff,
      nextRank: RANK_ORDER[0],
      progress,
    };
  }, [showRanked, exercise, userProfile, metrics]);

  const hasWeight = useMemo(() => (exercise?.trackingMethods || []).includes('weight'), [exercise]);
  const hasReps = useMemo(() => (exercise?.trackingMethods || []).includes('reps'), [exercise]);
  const hasTime = useMemo(() => (exercise?.trackingMethods || []).includes('time'), [exercise]);

  const { prRows, lifetimeRows } = useMemo(() => {
    const result = { prRows: [] as { label: string; value: number | string | undefined }[], lifetimeRows: [] as { label: string; value: number | string | undefined }[] };
    if (!metrics) return result;

    if (hasWeight && hasReps) {
      result.prRows = [
        { label: 'Best Set', value: `${metrics.maxTopWeight} lbs x ${metrics.maxTopRepsAtTopWeight }` },
      ];
      if (metrics.maxBestEst1RM != null) {
        result.prRows.push({ label: 'Estimated 1RM', value: `${metrics.maxBestEst1RM} lbs`});
      }
      result.lifetimeRows = [
        { label: 'Total Sets', value: metrics.totalSets },
        { label: 'Total Reps', value: metrics.totalReps },
        { label: 'Total Volume', value: `${metrics.totalVolumeAllTime} lbs` },
      ];
      return result;
    }

    if (hasWeight && hasTime) {
      result.prRows = [
        { label: 'Max Top Weight', value: metrics.maxTopWeight },
        { label: 'Best Time @ Top Weight', value: metrics.maxTopTimeAtTopWeight },
      ];
      result.lifetimeRows = [
        { label: 'Total Sets', value: metrics.totalSets },
        { label: 'Total Time', value: metrics.totalTime },
      ];
      return result;
    }

    if (hasReps && !hasWeight && !hasTime) {
      result.prRows = [
        { label: 'Max Top Reps', value: metrics.maxTopReps },
        { label: 'Best Total Reps (session)', value: metrics.maxTotalReps },
      ];
      result.lifetimeRows = [
        { label: 'Total Sets', value: metrics.totalSets },
        { label: 'Total Reps', value: metrics.totalReps },
      ];
      return result;
    }

    if (hasTime && !hasWeight && !hasReps) {
      result.prRows = [
        { label: 'Max Top Time', value: metrics.maxTopTime },
        { label: 'Best Total Time (session)', value: metrics.maxTotalTime },
      ];
      result.lifetimeRows = [
        { label: 'Total Sets', value: metrics.totalSets },
        { label: 'Total Time', value: metrics.totalTime },
      ];
      return result;
    }

    // Fallback: split numbers arbitrarily if unknown types
    const numericEntries = Object.entries(metrics).filter(([, v]) => typeof v === 'number') as [string, number][];
    result.prRows = numericEntries.slice(0, Math.ceil(numericEntries.length / 2)).map(([k, v]) => ({ label: k, value: v }));
    result.lifetimeRows = numericEntries.slice(Math.ceil(numericEntries.length / 2)).map(([k, v]) => ({ label: k, value: v }));
    return result;
  }, [metrics, hasWeight, hasReps, hasTime]);

  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center bg-${theme}-background`}>
        <Spinner />
      </View>
    );
  }

  const VideoEmbed = videoId ? (
    <View className="mt-5 mb-4">
      <Heading size="xl" className="mb-3 text-typography-800">
        Exercise Demo
      </Heading>
      <View style={{ borderRadius: 8, overflow: 'hidden' }}>
        <YoutubePlayer
          height={videoHeight}
          videoId={videoId}
          play={playing}
          onChangeState={onStateChange}
          webViewProps={{ allowsInlineMediaPlayback: true }}
        />
      </View>
    </View>
  ) : null;

  if (!metrics) {
    return (
      <ScrollView className={`flex-1 bg-${theme}-background`} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 24 }}>
        <Text size="xl" className="text-typography-700 text-center">No metrics yet for this exercise.</Text>
        {VideoEmbed}
      </ScrollView>
    );
  }

  return (
    <ScrollView className={`flex-1 bg-${theme}-background`} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      {rankInfo && (
        <VStack className="items-center mb-6">
          <Heading size="xl" className="text-typography-800 text-center mb-3">
            {exercise?.name} Rank
          </Heading>
          {rankInfo.badge && (
            <Image source={rankInfo.badge} style={{ width: 200, height: 200 }} resizeMode="contain" />
          )}
          <Text size="2xl" bold className="text-typography-800 mt-2">
            {rankInfo.rank ? rankInfo.rank.charAt(0).toUpperCase() + rankInfo.rank.slice(1) : 'Unranked'}
          </Text>
          <Text size="lg" className="text-typography-700 mt-1">
            All-Time PR: {rankInfo.allTimePR} lbs
          </Text>
          <Box className="w-full mt-3 px-4">
            <Box className="w-full h-3 rounded-full bg-outline-200 overflow-hidden">
              <Box
                className={`h-full rounded-full bg-${theme}-accent`}
                style={{ width: `${Math.round(rankInfo.progress * 100)}%` }}
              />
            </Box>
            <HStack className="justify-between mt-1">
              <Text size="sm" className="text-typography-600">
                {rankInfo.currentCutoff} lbs
              </Text>
              <Text size="sm" className="text-typography-600">
                {rankInfo.nextCutoff != null
                  ? `${rankInfo.nextCutoff} lbs (${rankInfo.nextRank!.charAt(0).toUpperCase() + rankInfo.nextRank!.slice(1)})`
                  : 'Max Rank'}
              </Text>
            </HStack>
          </Box>
        </VStack>
      )}

      <HStack className="items-center justify-between mb-3">
        <Heading size="xl" className="text-typography-800">
          Personal Records
        </Heading>
        <Ionicons name="trophy-sharp" size={18} color={colors.light} />
      </HStack>
      <VStack className="gap-3 mb-5">
        {prRows.map((row) => (
          <HStack key={row.label} className="items-center justify-between border-b border-outline-200 pb-2">
            <Text size="lg" className="text-typography-700">{row.label}</Text>
            <Text size="lg" className={`text-typography-800 font-semibold`}>{row.value ?? '-'}</Text>
          </HStack>
        ))}
      </VStack>

      <Heading size="xl" className="mb-3 text-typography-800">
        Lifetime Stats
      </Heading>
      <VStack className="gap-3">
        {lifetimeRows.map((row) => (
          <HStack key={row.label} className="items-center justify-between border-b border-outline-200 pb-2">
            <Text size="lg" className="text-typography-700">{row.label}</Text>
            <Text size="lg" className="text-typography-800 font-semibold">{row.value ?? '-'}</Text>
          </HStack>
        ))}
      </VStack>

      {VideoEmbed}
    </ScrollView>
  );
}
