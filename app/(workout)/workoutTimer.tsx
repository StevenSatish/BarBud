import React from 'react';
import { Text } from '@/components/ui/text';

interface WorkoutTimerProps {
  elapsedSeconds: number;
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function WorkoutTimer({ elapsedSeconds }: WorkoutTimerProps) {
  return <Text size="3xl" className="text-typography-800">{formatTime(elapsedSeconds)}</Text>;
}
