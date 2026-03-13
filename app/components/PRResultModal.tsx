import React, { useEffect, useRef, useState } from 'react';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Animated, Image } from 'react-native';
import { Asset } from 'expo-asset';
import { RANK_ORDER, type Rank } from '@/app/lib/rankData';
import type { PRResultData } from '@/app/components/LogRankedPRModal';

const UNRANKED_BADGE = require('@/app/badges/unrankedBadge.png');
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

function getRankLabel(rank: Rank | null): string {
  return rank ? rank.charAt(0).toUpperCase() + rank.slice(1) : 'Unranked';
}

function getBarLabels(rank: Rank | null, cutoffs: Record<Rank, number>): { left: string; right: string } {
  if (!rank) {
    const first = RANK_ORDER[0];
    return { left: '0 lbs', right: `${cutoffs[first]} lbs (${getRankLabel(first)})` };
  }
  const idx = RANK_ORDER.indexOf(rank);
  const left = `${cutoffs[rank]} lbs`;
  if (idx >= RANK_ORDER.length - 1) {
    return { left, right: 'Max Rank' };
  }
  const next = RANK_ORDER[idx + 1];
  return { left, right: `${cutoffs[next]} lbs (${getRankLabel(next)})` };
}

function getIntermediateRanks(oldRank: Rank | null, newRank: Rank | null): Rank[] {
  if (!newRank) return [];
  const oldIdx = oldRank ? RANK_ORDER.indexOf(oldRank) : -1;
  const newIdx = RANK_ORDER.indexOf(newRank);
  const ranks: Rank[] = [];
  for (let i = oldIdx + 1; i <= newIdx; i++) {
    ranks.push(RANK_ORDER[i]);
  }
  return ranks;
}

export default function PRResultModal({
  isOpen,
  result,
  theme,
  onClose,
}: {
  isOpen: boolean;
  result: PRResultData | null;
  theme: string;
  onClose: () => void;
}) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const oldBadgeX = useRef(new Animated.Value(0)).current;
  const newBadgeX = useRef(new Animated.Value(300)).current;
  const newBadgeOpacity = useRef(new Animated.Value(0)).current;
  const percentileOpacity = useRef(new Animated.Value(0)).current;
  const [displayRank, setDisplayRank] = useState<Rank | null>(null);
  const [incomingRank, setIncomingRank] = useState<Rank | null>(null);
  const [barLabels, setBarLabels] = useState({ left: '', right: '' });

  useEffect(() => {
    if (!isOpen || !result) return;

    const { oldRank, newRank, cutoffs, oldProgress, newProgress, rankChanged } = result;

    const runAnimation = async () => {
      await Asset.loadAsync([
        UNRANKED_BADGE,
        ...Object.values(BADGE_IMAGES),
      ]);
    };

    const init = async () => {
      await runAnimation();

      progressAnim.setValue(oldProgress);
      oldBadgeX.setValue(0);
      newBadgeX.setValue(300);
      newBadgeOpacity.setValue(0);
      percentileOpacity.setValue(0);
      setDisplayRank(oldRank);
      setIncomingRank(null);
      setBarLabels(getBarLabels(oldRank, cutoffs));

      const fadeInPercentile = Animated.timing(percentileOpacity, {
        toValue: 1, duration: 600, useNativeDriver: true,
      });

      if (!rankChanged) {
        setTimeout(() => {
          Animated.timing(progressAnim, {
            toValue: newProgress, duration: 1200, useNativeDriver: false,
          }).start(() => fadeInPercentile.start());
        }, 500);
        return;
      }

      const steps = getIntermediateRanks(oldRank, newRank);

      const animateStep = (stepIdx: number) => {
        if (stepIdx >= steps.length) {
          Animated.timing(progressAnim, {
            toValue: newProgress, duration: 800, useNativeDriver: false,
          }).start(() => fadeInPercentile.start());
          return;
        }

        const targetRank = steps[stepIdx];

        Animated.timing(progressAnim, {
          toValue: 1, duration: 700, useNativeDriver: false,
        }).start(() => {
          setIncomingRank(targetRank);
          oldBadgeX.setValue(0);
          newBadgeX.setValue(300);
          newBadgeOpacity.setValue(0);

          Animated.parallel([
            Animated.timing(oldBadgeX, { toValue: -300, duration: 400, useNativeDriver: true }),
            Animated.timing(newBadgeX, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.timing(newBadgeOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          ]).start(() => {
            setDisplayRank(targetRank);
            setBarLabels(getBarLabels(targetRank, cutoffs));
            setIncomingRank(null);
            oldBadgeX.setValue(-300);
            newBadgeX.setValue(0);
            newBadgeOpacity.setValue(1);
            progressAnim.setValue(0);
            setTimeout(() => animateStep(stepIdx + 1), 250);
          });
        });
      };

      setTimeout(() => animateStep(0), 500);
    };

    init();
  }, [isOpen, result]);

  if (!result) return null;

  const currentBadge = displayRank ? BADGE_IMAGES[displayRank] : UNRANKED_BADGE;
  const incomingBadge = incomingRank ? BADGE_IMAGES[incomingRank] : currentBadge;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop onPress={onClose} />
      <ModalContent size="md" className={`bg-${theme}-background border-${theme}-steelGray`}>
        <ModalHeader>
          <Text className="text-xl font-bold text-typography-800 text-center w-full">
            {result.exerciseName}
          </Text>
        </ModalHeader>
        <ModalBody>
          <VStack className="items-center">
            <Box style={{ height: 240, width: '100%', overflow: 'hidden' }} className="items-center justify-center">
              <Box style={{ width: 100, height: 100 }} className="items-center justify-center">
                <Animated.View style={{ position: 'absolute', transform: [{ translateX: oldBadgeX }] }}>
                  <Image source={currentBadge} style={{ width: 200, height: 200 }} resizeMode="contain" />
                </Animated.View>
                <Animated.View style={{ position: 'absolute', transform: [{ translateX: newBadgeX }], opacity: newBadgeOpacity }}>
                  <Image source={incomingBadge} style={{ width: 200, height: 200 }} resizeMode="contain" />
                </Animated.View>
              </Box>
            </Box>
            <Text size="2xl" bold className="text-typography-800">
              {getRankLabel(displayRank)}
            </Text>
            <Text size="lg" className="text-typography-700 mt-1">
              PR: {result.allTimePR} lbs
            </Text>
            <Box className="w-full mt-4 px-2">
              <Box className="w-full h-3 rounded-full bg-outline-200 overflow-hidden">
                <Animated.View
                  style={{
                    height: '100%',
                    borderRadius: 999,
                    width: progressWidth,
                  }}
                  className={`bg-${theme}-accent`}
                />
              </Box>
              <HStack className="justify-between mt-1">
                <Text size="sm" className="text-typography-600">{barLabels.left}</Text>
                <Text size="sm" className="text-typography-600">{barLabels.right}</Text>
              </HStack>
            </Box>
            <Animated.View style={{ opacity: percentileOpacity, marginTop: 16 }}>
              <Text size="md" className="text-typography-700 text-center" italic>
                Stronger than approximately {result.percentile}% of lifters in your division
              </Text>
            </Animated.View>
          </VStack>
        </ModalBody>
        <ModalFooter className="justify-center">
          <Button onPress={onClose} className={`bg-${theme}-accent`}>
            <ButtonText className="text-typography-800">Congrats!</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
