import React, { useEffect, useRef } from 'react';
import { Animated, Image } from 'react-native';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { type Rank } from '@/app/lib/rankData';

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

export type RankedProgressionItem = {
  exerciseId: string;
  exerciseName: string;
  allTimePR: number;
  rank: Rank | null;
  cutoffs: Record<Rank, number>;
  percentile: number;
  currentCutoff: number;
  nextCutoff: number | null;
  nextRank: Rank | null;
  progress: number;
};

type RankedProgressionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  theme: string;
  item: RankedProgressionItem | null;
  currentIndex: number;
  totalCount: number;
};

export default function RankedProgressionModal({
  isOpen,
  onClose,
  onContinue,
  theme,
  item,
  currentIndex,
  totalCount,
}: RankedProgressionModalProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const percentileOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isOpen || !item) return;
    progressAnim.setValue(0);
    percentileOpacity.setValue(0);
    Animated.timing(progressAnim, {
      toValue: item.progress,
      duration: 1200,
      useNativeDriver: false,
    }).start(() => {
      Animated.timing(percentileOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });
  }, [isOpen, item, currentIndex]);

  if (!item) return null;

  const badge = item.rank ? BADGE_IMAGES[item.rank] : UNRANKED_BADGE;
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
            {item.exerciseName}
          </Text>
          {totalCount > 1 && (
            <Text className="text-sm text-typography-600 text-center w-full mt-1">
              {currentIndex + 1} of {totalCount}
            </Text>
          )}
        </ModalHeader>
        <ModalBody>
          <VStack className="items-center">
            <Image source={badge} style={{ width: 200, height: 200 }} resizeMode="contain" />
            <Text size="2xl" bold className="text-typography-800 mt-2">
              {getRankLabel(item.rank)}
            </Text>
            <Text size="lg" className="text-typography-700 mt-1">
              All-Time PR: {item.allTimePR} lbs
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
                <Text size="sm" className="text-typography-600">
                  {item.currentCutoff} lbs
                </Text>
                <Text size="sm" className="text-typography-600">
                  {item.nextCutoff != null
                    ? `${item.nextCutoff} lbs (${getRankLabel(item.nextRank)})`
                    : 'Max Rank'}
                </Text>
              </HStack>
            </Box>
            <Animated.View style={{ opacity: percentileOpacity, marginTop: 16 }}>
              <Text size="md" className="text-typography-700 text-center" italic>
                Stronger than approximately {item.percentile}% of lifters in your division
              </Text>
            </Animated.View>
          </VStack>
        </ModalBody>
        <ModalFooter className="justify-center">
          <Button onPress={onContinue} className={`bg-${theme}-accent`}>
            <ButtonText className="text-typography-800">
              {currentIndex < totalCount - 1 ? 'Continue' : 'Done'}
            </ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
