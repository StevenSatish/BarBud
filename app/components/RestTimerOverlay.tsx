import React from 'react';
import { View } from 'react-native';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { Text } from '@/components/ui/text';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogBody,
  AlertDialogBackdrop,
} from '@/components/ui/alert-dialog';

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function RestTimerOverlay() {
  const { workoutState, restTotal, restRemaining, restComplete, dismissRestComplete } = useWorkout();
  const { theme, colors } = useTheme();

  const timerActive = restRemaining != null && restTotal != null && restRemaining > 0;
  const compact = !workoutState.isActive || workoutState.isMinimized;

  return (
    <>
      {/* "Rest complete!" alert — visible on any screen */}
      <AlertDialog isOpen={restComplete} size="sm" onClose={dismissRestComplete}>
        <AlertDialogBackdrop onPress={dismissRestComplete} />
        <AlertDialogContent className={`bg-${theme}-background border-${theme}-steelGray`}>
          <AlertDialogBody className="py-6">
            <Text size="xl" className="text-typography-800 font-semibold text-center">
              Rest complete!
            </Text>
          </AlertDialogBody>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress bar */}
      {timerActive && (
        compact ? (
          // Compact bar: above WorkoutIndicator + tab bar
          <View
            style={{
              position: 'absolute',
              bottom: 143,
              left: 0,
              right: 0,
              paddingBottom: 6,
              paddingTop: 6,
              backgroundColor: colors.background,
              zIndex: 999,
            }}
            pointerEvents="none"
          >
            <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
              {formatTime(restRemaining!)}
            </Text>
            <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 16, borderRadius: 3 }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.accent,
                  width: `${(restRemaining! / restTotal!) * 100}%`,
                }}
              />
            </View>
          </View>
        ) : (
          // Full-size bar: on workout screen
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: 40,
              paddingTop: 14,
              backgroundColor: colors.background,
              zIndex: 999,
            }}
            pointerEvents="none"
          >
            <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 30, lineHeight: 40, fontWeight: '600', marginBottom: 4 }}>
              {formatTime(restRemaining!)}
            </Text>
            <View style={{ height: 12, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 12, borderRadius: 6 }}>
              <View
                style={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.accent,
                  width: `${(restRemaining! / restTotal!) * 100}%`,
                }}
              />
            </View>
          </View>
        )
      )}
    </>
  );
}
