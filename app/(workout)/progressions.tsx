import React, { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Confetti from 'react-native-confetti';
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@/app/context/ThemeContext";
import { useWorkout } from "@/app/context/WorkoutContext";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView } from "@/components/ui/scroll-view";

function formatOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"] as const;
  const v = n % 100;
  return `${n}${(s as any)[(v - 20) % 10] || (s as any)[v] || s[0]}`;
}

type ProgressionItem = {
  exerciseName: string;
  changeType: string;
  changeSpec: string;
  change: string;
  kind: "allTime" | "lastSession";
  exerciseId: string;
};
type ProgressionsResult = {
  title: string;
  items: ProgressionItem[];
  workoutsCompletedBefore?: number;
};

export default function ProgressionsScreen() {
  const confettiRef = useRef<any>(null);
  const { theme, colors } = useTheme();
  const { cancelWorkout } = useWorkout();
  const params = useLocalSearchParams();
  const [usernameFromDb, setUsernameFromDb] = useState<string>("");
  const data = useMemo(() => {
    try {
      const raw =
        typeof params.data === "string"
          ? params.data
          : Array.isArray(params.data)
            ? params.data[0]
            : undefined;
      if (!raw)
        return { title: "Progressions", items: [] } as ProgressionsResult;
      const parsed = JSON.parse(raw) as ProgressionsResult;
      return parsed;
    } catch {
      return { title: "Progressions", items: [] } as ProgressionsResult;
    }
  }, [params.data]);

  useEffect(() => {
    (async () => {
      try {
        const name = await AsyncStorage.getItem("username");
        if (typeof name === "string" && name.trim())
          setUsernameFromDb(name.trim());
      } catch { }
    })();
  }, []);

  const allTimeItems = useMemo(
    () => (data.items || []).filter((i) => i.kind === "allTime"),
    [data.items]
  );
  const allTimeGroups = useMemo(() => {
    const groups: {
      exerciseId: string;
      exerciseName: string;
      items: ProgressionItem[];
    }[] = [];
    const seenIndexByExerciseId = new Map<string, number>();
    for (const it of allTimeItems) {
      const existingIdx = seenIndexByExerciseId.get(it.exerciseId);
      if (existingIdx === undefined) {
        seenIndexByExerciseId.set(it.exerciseId, groups.length);
        groups.push({
          exerciseId: it.exerciseId,
          exerciseName: it.exerciseName,
          items: [it],
        });
      } else {
        groups[existingIdx].items.push(it);
      }
    }
    return groups;
  }, [allTimeItems]);
  const lastSessionItems = useMemo(
    () =>
      (data.items || [])
        .filter((i) => i.kind === "lastSession")
        .filter(
          (i) =>
            !data.items.some(
              (ai) => ai.kind === "allTime" && ai.exerciseId === i.exerciseId
            )
        ),
    [data.items]
  );

  useEffect(() => {
    const ref = confettiRef.current;
    try { ref?.startConfetti?.(); } catch { }
    return () => { try { ref?.stopConfetti?.(); } catch { } };
  }, []);

  return (
    <SafeAreaView className={`bg-${theme}-background flex-1`}>
      <Confetti
        ref={(r: any) => (confettiRef.current = r)}
        untilStopped={false}
        duration={2000}
        colors={[colors.accent, colors.light, colors.lightGray]}
        size={1}
        bsize={1}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 }}>
        <VStack space="lg">
          <Heading size="xl" className="text-typography-800 font-semibold mb-2">
            {`Congratulations${usernameFromDb ? ` ${usernameFromDb}!` : "!"}`}
          </Heading>
          {typeof data.workoutsCompletedBefore === "number" && (
            <Text size="lg" className="text-typography-800 mb-2">
              {`You've completed your ${formatOrdinal(
                (data.workoutsCompletedBefore ?? 0) + 1
              )} workout!`}
            </Text>
          )}

          <Heading size="xl" className="text-typography-800 font-semibold mb-2">
            Workout Progressions
          </Heading>

          {/* All-Time PRs first, preserving workout order */}
          {allTimeGroups.length > 0 && (
            <VStack space="sm">
              <Heading size="md" className="text-typography-800">
                All-Time PRs
              </Heading>
              {allTimeGroups.map((group, idx) => (
                <Box
                  key={`all_${group.exerciseId}_${idx}`}
                  className={`border-outline-200 bg-${theme}-button rounded-md p-4`}
                >
                  <VStack>
                    <Text className="text-typography-800">
                      {group.exerciseName}
                    </Text>
                    {group.items.map((it, j) => (
                      <Text
                        key={`all_item_${group.exerciseId}_${j}`}
                        className="text-typography-800"
                      >
                        {"-       "}
                        {it.changeType} {it.changeSpec}{" "}
                        <Text className={`text-${theme}-light font-semibold`}>
                          {it.change}
                        </Text>
                      </Text>
                    ))}
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}

          {/* Last-Session PRs next, only those without an all-time PR for same exercise */}
          {lastSessionItems.length > 0 && (
            <VStack space="sm">
              <Heading size="md" className="text-typography-800">
                Since Last Session
              </Heading>
              {lastSessionItems.map((it, idx) => (
                <Box
                  key={`last_${idx}`}
                  className={`border-outline-200 bg-${theme}-button rounded-md p-4`}
                >
                  <VStack>
                    <Text className="text-typography-800">{it.exerciseName}</Text>
                    <Text className="text-typography-800">
                      {"-       "}
                      {it.changeType} {it.changeSpec}{" "}
                      <Text className={`text-${theme}-light font-semibold`}>
                        {it.change}
                      </Text>
                    </Text>
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}

          <Box className="mt-4">
            <Button size="md" action="primary" onPress={() => cancelWorkout()}>
              <ButtonText>Continue</ButtonText>
            </Button>
          </Box>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
