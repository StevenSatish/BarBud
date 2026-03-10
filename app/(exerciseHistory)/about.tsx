import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/app/context/ThemeContext';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Spinner } from '@/components/ui/spinner';
import Ionicons from '@expo/vector-icons/Ionicons';
import YoutubePlayer from 'react-native-youtube-iframe';

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
