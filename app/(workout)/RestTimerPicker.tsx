import React, { useRef, useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/app/context/ThemeContext';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import Feather from '@expo/vector-icons/Feather';

const STORAGE_KEY = 'rest_timer_intervals';
const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const TIME_VALUES: number[] = [];
for (let s = 10; s <= 600; s += 10) TIME_VALUES.push(s);
const DEFAULT_INDEX = 0;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onStart: (seconds: number) => void;
};

export default function RestTimerPicker({ isOpen, onClose, onStart }: Props) {
  const { theme, colors } = useTheme();
  const [screen, setScreen] = useState<'list' | 'create'>('list');
  const [savedIntervals, setSavedIntervals] = useState<number[]>([]);

  // Scroll picker refs
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = useRef(DEFAULT_INDEX);

  // Load saved intervals when modal opens
  useEffect(() => {
    if (!isOpen) {
      setScreen('list');
      return;
    }
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setSavedIntervals(parsed.sort((a: number, b: number) => a - b));
          }
        }
      } catch {}
    })();
  }, [isOpen]);

  const saveIntervals = useCallback(async (intervals: number[]) => {
    const sorted = [...intervals].sort((a, b) => a - b);
    setSavedIntervals(sorted);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    } catch {}
  }, []);

  const handleDeleteInterval = useCallback((seconds: number) => {
    const next = savedIntervals.filter((s) => s !== seconds);
    saveIntervals(next);
  }, [savedIntervals, saveIntervals]);

  const handleSelectInterval = useCallback((seconds: number) => {
    onStart(seconds);
  }, [onStart]);

  // Scroll picker handlers
  const handlePickerLayout = useCallback(() => {
    selectedIndex.current = DEFAULT_INDEX;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: DEFAULT_INDEX * ITEM_HEIGHT, animated: false });
    }, 50);
  }, []);

  const onMomentumScrollEnd = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    selectedIndex.current = Math.max(0, Math.min(idx, TIME_VALUES.length - 1));
  }, []);

  const handleCreateAndStart = useCallback(() => {
    const seconds = TIME_VALUES[selectedIndex.current] ?? 180;
    const next = savedIntervals.includes(seconds) ? savedIntervals : [...savedIntervals, seconds];
    saveIntervals(next);
    onStart(seconds);
  }, [savedIntervals, saveIntervals, onStart]);

  // --- Screen 1: Saved intervals list ---
  if (screen === 'list') {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalBackdrop onPress={onClose} />
        <ModalContent size="sm" className={`bg-${theme}-background border-${theme}-steelGray`}>
          <ModalHeader>
            <Heading size="lg" className="text-typography-800">Rest Timer</Heading>
          </ModalHeader>
          <ModalBody>
            {savedIntervals.length > 0 ? (
              <View style={{ gap: 6 }}>
                {savedIntervals.map((seconds) => (
                  <Pressable
                    key={seconds}
                    onPress={() => handleSelectInterval(seconds)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
                  >
                    <Text size="xl" className="text-typography-800 font-semibold">{formatTime(seconds)}</Text>
                    <Pressable
                      onPress={() => handleDeleteInterval(seconds)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="trash-2" size={16} color="rgba(220, 38, 38, 0.7)" />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text className="text-typography-700 text-center py-4">No saved intervals yet.</Text>
            )}
          </ModalBody>
          <ModalFooter className="flex-row justify-between items-center px-4">
            <Button variant="link" onPress={onClose}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button className={`bg-${theme}-accent`} onPress={() => setScreen('create')}>
              <ButtonText className="text-typography-800">New Interval</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // --- Screen 2: Scroll-wheel picker ---
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop onPress={onClose} />
      <ModalContent size="sm" className={`bg-${theme}-background border-${theme}-steelGray`}>
        <ModalHeader>
          <Heading size="lg" className="text-typography-800">New Interval</Heading>
        </ModalHeader>
        <ModalBody>
          <View style={{ height: PICKER_HEIGHT, overflow: 'hidden' }}>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: ITEM_HEIGHT * 2,
                left: 0,
                right: 0,
                height: ITEM_HEIGHT,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: colors.accent,
                zIndex: 1,
              }}
            />
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={onMomentumScrollEnd}
              onLayout={handlePickerLayout}
              nestedScrollEnabled
            >
              <View style={{ height: ITEM_HEIGHT * 2 }} />
              {TIME_VALUES.map((val) => (
                <View key={val} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                  <Text size="2xl" className="text-typography-800 font-semibold">{formatTime(val)}</Text>
                </View>
              ))}
              <View style={{ height: ITEM_HEIGHT * 2 }} />
            </ScrollView>
          </View>
        </ModalBody>
        <ModalFooter className="flex-row justify-between items-center px-4">
          <Button variant="link" onPress={() => setScreen('list')}>
            <ButtonText>Back</ButtonText>
          </Button>
          <Button className={`bg-${theme}-accent`} onPress={handleCreateAndStart}>
            <ButtonText className="text-typography-800">Create & Start</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
