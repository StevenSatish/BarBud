import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import {
  LineChart,
  Grid,
  XAxis,
  YAxis,
} from 'react-native-svg-charts';
import * as d3Scale from 'd3-scale';
import * as shape from 'd3-shape';
import { Circle, Line } from 'react-native-svg';
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

type GraphPoint = { value: number; date: Date };

type TimeRangeKey = '3M' | '6M' | '1Y' | 'ALL';

type ChartOption = {
  key: string;
  title: string;
  points: GraphPoint[];
  color: string;
  unit: string;
};

type XDomain = { xMin: number; xMax: number };

const ActivePoint = (props: any) => {
  const {
    y,
    data,
    hoveredIndex,
    color,
    width,
    height,
    contentInset,
    isPressing,
    xDomain, // NEW
  } = props;

  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const hasHoveredIndex =
    hoveredIndex != null &&
    hoveredIndex >= 0 &&
    hoveredIndex < data.length;

  if (!hasHoveredIndex) {
    return null;
  }

  const point = data[hoveredIndex] as { value: number; date: Date };

  // Compute time domain (prefer explicit xDomain when provided)
  const stamps = data.map(
    (p: { value: number; date: Date }) => p.date.getTime(),
  );
  const minTs = xDomain?.xMin ?? Math.min(...stamps);
  const maxTs = xDomain?.xMax ?? Math.max(...stamps);
  const tRange = maxTs - minTs || 1;

  const left = contentInset.left ?? 0;
  const right = contentInset.right ?? 0;
  const xMinPx = left;
  const xMaxPx = width - right;
  const xRange = xMaxPx - xMinPx || 1;

  // Dot x: snapped to the data point’s timestamp, mapped across full domain
  const t = point.date.getTime();
  const tRatio = (t - minTs) / tRange;
  const cx = xMinPx + tRatio * xRange;

  // Dot y: snapped to the data point’s value
  const cy = y(point.value);

  if (cx == null || cy == null || Number.isNaN(cy)) {
    return null;
  }

  return (
    <>
      {isPressing && (
        <Line
          x1={cx}
          x2={cx}
          y1={0}
          y2={height}
          stroke={color}
          strokeWidth={2}
        />
      )}

      <Circle
        cx={cx}
        cy={cy}
        r={4}
        stroke={color}
        strokeWidth={2}
        fill={color}
      />
    </>
  );
};

const AxisLines = (props: any) => {
  const { colors } = useTheme();
  const { width, height, contentInset } = props;
  const { left = 0, right = 0, top = 0, bottom = 0 } = contentInset || {};

  const xMinPx = left;
  const xMaxPx = width - right;
  const yMaxPx = top;
  const yMinPx = height - bottom;

  return (
    <>
      {/* Y-axis line (left) */}
      <Line
        x1={xMinPx}
        x2={xMinPx}
        y1={yMaxPx}
        y2={yMinPx}
        stroke={colors.lightGray}
        strokeWidth={1}
      />
      {/* X-axis line (bottom) */}
      <Line
        x1={xMinPx}
        x2={xMaxPx}
        y1={yMinPx}
        y2={yMinPx}
        stroke={colors.lightGray}
        strokeWidth={1}
      />
    </>
  );
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

  const toPoints = (field: keyof InstanceDoc): GraphPoint[] => {
    return (
      instances
        .map((r) => {
          const v = r[field] as number | undefined;
          const ts = r.date;
          const date: Date = ts?.toDate ? ts.toDate() : new Date(ts);
          return typeof v === 'number' && Number.isFinite(v)
            ? { value: v, date }
            : null;
        })
        .filter(Boolean) as GraphPoint[]
    );
  };

  const hasWeight = useMemo(
    () => (exercise?.trackingMethods || []).includes('weight'),
    [exercise],
  );
  const hasReps = useMemo(
    () => (exercise?.trackingMethods || []).includes('reps'),
    [exercise],
  );
  const hasTime = useMemo(
    () => (exercise?.trackingMethods || []).includes('time'),
    [exercise],
  );

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

  const chartOptions = useMemo<ChartOption[]>(() => {
    const opts: ChartOption[] = [];
    if (hasWeight && hasReps) {
      if (series.topWeight.length)
        opts.push({
          key: 'topWeight',
          title: 'Top Weight',
          points: series.topWeight,
          color: colors.accent,
          unit: 'lbs',
        });
      if (series.bestEst1RM.length)
        opts.push({
          key: 'bestEst1RM',
          title: 'Estimated 1RM',
          points: series.bestEst1RM,
          color: colors.light,
          unit: 'lbs',
        });
      if (series.volume.length)
        opts.push({
          key: 'volume',
          title: 'Volume',
          points: series.volume,
          color: colors.accent,
          unit: 'lbs',
        });
    } else if (hasWeight && hasTime) {
      if (series.topWeight.length)
        opts.push({
          key: 'topWeight',
          title: 'Top Weight',
          points: series.topWeight,
          color: colors.accent,
          unit: 'lbs',
        });
    } else if (hasReps && !hasWeight && !hasTime) {
      if (series.topReps.length)
        opts.push({
          key: 'topReps',
          title: 'Best Set Reps',
          points: series.topReps,
          color: colors.accent,
          unit: 'reps',
        });
      if (series.totalReps.length)
        opts.push({
          key: 'totalReps',
          title: 'Total Reps',
          points: series.totalReps,
          color: colors.light,
          unit: 'reps',
        });
    } else if (hasTime && !hasWeight && !hasReps) {
      if (series.topTime.length)
        opts.push({
          key: 'topTime',
          title: 'Best Set Time',
          points: series.topTime,
          color: colors.accent,
          unit: 'seconds',
        });
      if (series.totalTime.length)
        opts.push({
          key: 'totalTime',
          title: 'Total Time',
          points: series.totalTime,
          color: colors.light,
          unit: 'seconds',
        });
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
  }, [chartOptions, selectedKey]);

  const selected = useMemo(
    () => chartOptions.find((o) => o.key === selectedKey) || null,
    [chartOptions, selectedKey],
  );

  const [timeRange, setTimeRange] = useState<TimeRangeKey>('3M');

  const addMonths = (d: Date, m: number) =>
    new Date(d.getFullYear(), d.getMonth() + m, d.getDate());

  // --- X domain for current selection/time range (in timestamps) --- // NEW
  const xDomain: XDomain | null = useMemo(() => {
    if (!selected) return null;
    const all = [...selected.points].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    if (!all.length) return null;

    if (timeRange === 'ALL') {
      return {
        xMin: all[0].date.getTime(),
        xMax: all[all.length - 1].date.getTime(),
      };
    }

    const now = new Date();
    const monthsBack =
      timeRange === '3M' ? -3 : timeRange === '6M' ? -6 : -12;
    const start = addMonths(now, monthsBack);

    return {
      xMin: start.getTime(),
      xMax: now.getTime(),
    };
  }, [selected, timeRange]);

  // Points actually visible for plotting (clipped to domain) --- // UPDATED
  const visiblePoints = useMemo(() => {
    if (!selected || !xDomain) return [] as GraphPoint[];
    const { xMin, xMax } = xDomain;
    return selected.points
      .filter((p) => {
        const t = p.date.getTime();
        return t >= xMin && t <= xMax;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [selected, xDomain]);

  const chartData: GraphPoint[] = useMemo(
    () => visiblePoints,
    [visiblePoints],
  );

  // Y bounds unchanged
  const yBounds = useMemo(() => {
    if (!chartData.length) {
      return { yMin: 0, yMax: 0 };
    }
    const values = chartData.map((p) => p.value);
    const yMin = Math.min(...values);
    const yMax = Math.max(...values);
    return { yMin, yMax };
  }, [chartData]);

  const { yMin, yMax } = yBounds;

  // XAxis data: pad with domain edges so axis always spans full window --- // NEW
  const xAxisData: GraphPoint[] = useMemo(() => {
    if (!xDomain) return chartData;
    const start = new Date(xDomain.xMin);
    const end = new Date(xDomain.xMax);
    // We don't care about `value` for XAxis; any number works
    const firstVal = chartData[0]?.value ?? 0;
    const lastVal = chartData[chartData.length - 1]?.value ?? 0;
    const padded: GraphPoint[] = [
      { value: firstVal, date: start },
      ...chartData,
      { value: lastVal, date: end },
    ];
    return padded;
  }, [chartData, xDomain]);

  // Interaction state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [isPressing, setIsPressing] = useState(false);

  useEffect(() => {
    if (!chartData.length) {
      setHoveredIndex(null);
      setHoverX(null);
    } else if (hoveredIndex != null && hoveredIndex >= chartData.length) {
      setHoveredIndex(chartData.length - 1);
    }
  }, [chartData.length, hoveredIndex]);

  const hoveredPoint = useMemo(() => {
    if (hoveredIndex == null || !chartData.length) return null;
    return chartData[hoveredIndex];
  }, [hoveredIndex, chartData]);

  const contentInset = { top: 20, bottom: 20, left: 10, right: 10 };

  // timeStats for scrubbing = full domain, not just data extent --- // UPDATED
  const timeStats = useMemo(() => {
    if (!xDomain) return null;
    return {
      min: xDomain.xMin,
      max: xDomain.xMax,
    };
  }, [xDomain]);

  const onChartLayout = (e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  };

  // Scrubbing
  const panResponder = useMemo(() => {
    const handleMove = (evt: any) => {
      if (
        !timeStats ||
        !chartData.length ||
        chartWidth <= contentInset.left + contentInset.right
      ) {
        return;
      }
      const { locationX } = evt.nativeEvent;
      const xMin = contentInset.left;
      const xMax = chartWidth - contentInset.right;
      const clampedX = Math.max(xMin, Math.min(locationX, xMax));

      setHoverX(clampedX);

      const tMin = timeStats.min;
      const tMax = timeStats.max;
      const xRange = xMax - xMin || 1;
      const tRange = tMax - tMin || 1;

      const ratio = (clampedX - xMin) / xRange;
      const ts = tMin + ratio * tRange;

      let bestIndex = 0;
      let bestDist = Infinity;
      chartData.forEach((p, idx) => {
        const dist = Math.abs(p.date.getTime() - ts);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = idx;
        }
      });
      setHoveredIndex(bestIndex);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsPressing(true);
        handleMove(evt);
      },
      onPanResponderMove: handleMove,
      onPanResponderRelease: () => {
        setIsPressing(false);
      },
      onPanResponderTerminate: () => {
        setIsPressing(false);
      },
      onPanResponderTerminationRequest: () => true,
    });
  }, [chartData, chartWidth, timeStats, contentInset]);

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
          <Text size="xl" className="text-typography-700">
            No charts yet for this exercise.
          </Text>
        </View>
      ) : (
        <VStack className="gap-3">
          {!!selected && (
            <>
              <Heading
                size="lg"
                className="text-typography-900 text-center"
              >
                {selected.title}
              </Heading>

              {hoveredPoint ? (
                <HStack className="items-baseline">
                  <Text size="3xl" bold className="text-typography-800">
                    {hoveredPoint.value.toFixed(1)}
                  </Text>
                  <Text size="lg" className="text-typography-800">
                    {selected.unit}:{' '}
                    {hoveredPoint.date.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </HStack>
              ) : (
                <Text className="text-typography-500 text-center">
                  Drag on the chart to see past sessions
                </Text>
              )}

              <View style={{ height: 260 }} onLayout={onChartLayout}>
                {chartData.length > 0 && xDomain ? (
                  <View style={{ flex: 1, flexDirection: 'row' }}>
                    {/* Y-axis labels */}
                    <YAxis
                      data={chartData}
                      yAccessor={({ item }) => item.value}
                      contentInset={contentInset}
                      numberOfTicks={4}
                      min={yMin}
                      max={yMax}
                      svg={{
                        fill: 'white',
                        fontSize: 14,
                      }}
                    />

                    {/* Chart + X-axis */}
                    <View style={{ flex: 1 }}>
                      <LineChart
                        style={{ flex: 1 }}
                        data={chartData}
                        xAccessor={({ item }) => item.date.getTime()}
                        yAccessor={({ item }) => item.value}
                        xScale={d3Scale.scaleTime}
                        xMin={xDomain.xMin}   // NEW: enforce full time window
                        xMax={xDomain.xMax}
                        yMin={yMin}
                        yMax={yMax}
                        svg={{
                          stroke: selected.color,
                          strokeWidth: 3,
                        }}
                        contentInset={contentInset}
                        curve={shape.curveLinear}
                      >
                        <Grid />
                        <AxisLines contentInset={contentInset} />
                        <ActivePoint
                          isPressing={isPressing}
                          hoveredIndex={hoveredIndex}
                          hoverX={hoverX}
                          color={selected.color}
                          contentInset={contentInset}
                          xDomain={xDomain}
                        />
                      </LineChart>

                      {/* Overlay for scrubbing */}
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 40,
                        }}
                        pointerEvents="box-only"
                        {...panResponder.panHandlers}
                      />

                      {/* X-axis spans full domain via padded data */}
                      <XAxis
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                        data={xAxisData}
                        xAccessor={({ item }) => item.date.getTime()}
                        scale={d3Scale.scaleTime}
                        numberOfTicks={4}
                        contentInset={{
                          left: contentInset.left,
                          right: contentInset.right,
                        }}
                        svg={{
                          fontSize: 13,
                          fill: 'white',
                        }}
                        formatLabel={(value) => {
                          const d = new Date(value);
                          return d.toLocaleString('default', {
                            month: 'short',
                          });
                        }}
                      />
                    </View>
                  </View>
                ) : (
                  <View className="items-center justify-center py-10">
                    <Text className="text-typography-700">
                      No data in this time range.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {chartOptions.length > 1 && (
            <HStack className="items-center justify-center flex-wrap">
              {chartOptions.map((opt) => {
                const active = selectedKey === opt.key;
                return (
                  <Button
                    key={opt.key}
                    size="sm"
                    variant={active ? 'solid' : 'outline'}
                    className={
                      (active ? `bg-${theme}-light` : `border-outline-200`) +
                      ' rounded-none'
                    }
                    onPress={() => setSelectedKey(opt.key)}
                  >
                    <ButtonText
                      className={
                        active
                          ? `text-${theme}-background`
                          : `text-typography-900`
                      }
                    >
                      {opt.title}
                    </ButtonText>
                  </Button>
                );
              })}
            </HStack>
          )}

          <HStack className="items-center justify-center flex-wrap">
            {(['3M', '6M', '1Y', 'ALL'] as TimeRangeKey[]).map((range) => {
              const active = timeRange === range;
              return (
                <Button
                  key={range}
                  size="sm"
                  variant={active ? 'solid' : 'outline'}
                  className={
                    (active ? `bg-${theme}-light` : `border-outline-200`) +
                    ' rounded-none'
                  }
                  onPress={() => setTimeRange(range)}
                >
                  <ButtonText
                    className={
                      active
                        ? `text-${theme}-background`
                        : `text-typography-900`
                    }
                  >
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
