import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/app/context/ThemeContext';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type InstanceDoc = {
  sessionId: string;
  exerciseInSessionId: string;
  date: any; // Firestore Timestamp
  // weight x reps
  volume?: number;
  topWeight?: number;
  bestEst1RM?: number;
  completedRepCount?: number;
  // reps
  topReps?: number;
  totalReps?: number;
  // time
  topTime?: number;
  totalTime?: number;
};

export default function ExerciseChartsTab({
  exercise,
  instances,
  loading,
}: {
  exercise?: any;
  instances: InstanceDoc[];
  loading: boolean;
}) {
  const { theme, colors } = useTheme();

  type GraphPoint = { value: number; date: Date };

  const toPoints = (field: keyof InstanceDoc): GraphPoint[] => {
    return instances
      .map((r) => {
        const v = r[field] as number | undefined;
        const ts = r.date;
        const date = ts?.toDate ? ts.toDate() : new Date(ts);
        return typeof v === 'number' && Number.isFinite(v) ? { value: v, date } : null;
      })
      .filter(Boolean) as GraphPoint[];
  };

  const hasWeight = useMemo(() => (exercise?.trackingMethods || []).includes('weight'), [exercise]);
  const hasReps = useMemo(() => (exercise?.trackingMethods || []).includes('reps'), [exercise]);
  const hasTime = useMemo(() => (exercise?.trackingMethods || []).includes('time'), [exercise]);

  const series = useMemo(() => {
    if (!instances.length) {
      return {
        topWeight: [] as GraphPoint[],
        bestEst1RM: [] as GraphPoint[],
        volume: [] as GraphPoint[],
        topReps: [] as GraphPoint[],
        totalReps: [] as GraphPoint[],
        topTime: [] as GraphPoint[],
        totalTime: [] as GraphPoint[],
      };
    }
    return {
      topWeight: toPoints('topWeight'),
      bestEst1RM: toPoints('bestEst1RM'),
      volume: toPoints('volume'),
      topReps: toPoints('topReps'),
      totalReps: toPoints('totalReps'),
      topTime: toPoints('topTime'),
      totalTime: toPoints('totalTime'),
    };
  }, [instances]);

  type ChartOption = { key: string; title: string; points: GraphPoint[]; color: string; unit: string };
  const chartOptions = useMemo<ChartOption[]>(() => {
    const opts: ChartOption[] = [];
    if (hasWeight && hasReps) {
      if (series.topWeight.length) opts.push({ key: 'topWeight', title: 'Top Weight', points: series.topWeight, color: colors.accent, unit: 'lbs' });
      if (series.bestEst1RM.length) opts.push({ key: 'bestEst1RM', title: 'Estimated 1RM', points: series.bestEst1RM, color: colors.light, unit: 'lbs' });
      if (series.volume.length) opts.push({ key: 'volume', title: 'Volume', points: series.volume, color: colors.steelGray, unit: 'lbs' });
    } else if (hasWeight && hasTime) {
      if (series.topWeight.length) opts.push({ key: 'topWeight', title: 'Top Weight', points: series.topWeight, color: colors.accent, unit: 'lbs' });
    } else if (hasReps && !hasWeight && !hasTime) {
      if (series.topReps.length) opts.push({ key: 'topReps', title: 'Best Set Reps', points: series.topReps, color: colors.accent, unit: 'reps' });
      if (series.totalReps.length) opts.push({ key: 'totalReps', title: 'Total Reps', points: series.totalReps, color: colors.light, unit: 'reps' });
    } else if (hasTime && !hasWeight && !hasReps) {
      if (series.topTime.length) opts.push({ key: 'topTime', title: 'Best Set Time', points: series.topTime, color: colors.accent, unit: 'seconds' });
      if (series.totalTime.length) opts.push({ key: 'totalTime', title: 'Total Time', points: series.totalTime, color: colors.light, unit: 'seconds' });
    }
    return opts;
  }, [hasWeight, hasReps, hasTime, series, colors]);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  useEffect(() => {
    if (chartOptions.length && !selectedKey) {
      setSelectedKey(chartOptions[0].key);
    } else if (!chartOptions.length) {
      setSelectedKey(null);
    }
  }, [chartOptions]);

  const selected = useMemo(() => chartOptions.find(o => o.key === selectedKey) || null, [chartOptions, selectedKey]);

  type TimeRangeKey = '3M' | '6M' | '1Y' | 'ALL';
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('ALL');
  const addMonths = (d: Date, m: number) => new Date(d.getFullYear(), d.getMonth() + m, 1);

  const visiblePoints = useMemo(() => {
    if (!selected) return [] as GraphPoint[];
    const points = selected.points;
    if (!points.length) return [];
    const endDate = points[points.length - 1]?.date ?? new Date();
    if (timeRange === 'ALL') return points;
    const months = timeRange === '3M' ? -3 : timeRange === '6M' ? -6 : -12;
    const startDate = addMonths(endDate, months);
    return points.filter(p => p.date >= startDate && p.date <= endDate);
  }, [selected, timeRange]);

  const chartData = useMemo(() => visiblePoints.map(p => ({ value: p.value })), [visiblePoints]);

  if (!exercise) {
    return (
      <View className={`flex-1 bg-${theme}-background p-4`}>
        <Text className="text-typography-900">No exercise selected.</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 bg-${theme}-background p-4`}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner />
        </View>
      ) : !chartOptions.length ? (
        <View className="flex-1 items-center justify-start pt-10">
          <Text size="xl" className="text-typography-700">No charts yet for this exercise.</Text>
        </View>
      ) : (
        <VStack className="gap-3">
          {!!selected && (
            <>
              <Heading size="lg" className="text-typography-900 mb-1 text-center">{selected.title}</Heading>
              <View>
                <LineChart
                  data={chartData}
                  thickness={3}
                  color={selected.color}
                  curved={false}
                  isAnimated={false}
                  hideDataPoints
                  hideRules
                  yAxisThickness={2}
                  xAxisThickness={2}
                  adjustToWidth
                  initialSpacing={0}
                  endSpacing={0}
                  spacing={chartData.length > 0 ? Math.max(8, Math.floor(300 / Math.max(1, chartData.length - 1))) : 40}
                />
              </View>
            </>
          )}

          {chartOptions.length > 1 && (
            <HStack className="items-center justify-center flex-wrap">
              {chartOptions.map(opt => {
                const active = selectedKey === opt.key;
                return (
                  <Button
                    key={opt.key}
                    size="sm"
                    variant={active ? 'solid' : 'outline'}
                    className={(active ? `bg-${theme}-light` : `border-outline-200`) + ' rounded-none'}
                    onPress={() => setSelectedKey(opt.key)}
                  >
                    <ButtonText className={active ? `text-${theme}-background` : `text-typography-900`}>
                      {opt.title}
                    </ButtonText>
                  </Button>
                );
              })}
            </HStack>
          )}

          <HStack className="items-center justify-center flex-wrap">
            {(['3M','6M','1Y','ALL'] as TimeRangeKey[]).map(range => {
              const active = timeRange === range;
              return (
                <Button
                  key={range}
                  size="sm"
                  variant={active ? 'solid' : 'outline'}
                  className={(active ? `bg-${theme}-light` : `border-outline-200`) + ' rounded-none'}
                  onPress={() => setTimeRange(range)}
                >
                  <ButtonText className={active ? `text-${theme}-background` : `text-typography-900`}>
                    {range}
                  </ButtonText>
                </Button>
              );
            })}
          </HStack>
        </VStack>
      )}
    </View>
  );
}


