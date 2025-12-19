import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useEditWorkout } from '@/app/context/EditWorkoutContext';

type ExerciseCount = {
	exerciseId: string;
	completedSetCount: number;
	name: string;
	category: string;
};

export type SessionLike = {
	id: string;
	startAt: Date;
	durationMin: number;
	exerciseCounts?: ExerciseCount[];
};

type SessionCardProps = {
	session: SessionLike;
};

export default function SessionCard({ session }: SessionCardProps) {
	const { theme } = useTheme();
	const { startEditing } = useEditWorkout();
	const headerLine = `${formatTime(session.startAt)}, ${formatLongDate(session.startAt)}`;
	return (
		<View className={`border border-outline-200 rounded-xl shadow-sm bg-${theme}-button p-3 mb-3`}>
			<HStack className="items-start justify-between">
				<View className="flex-1 pr-2">
					<Text className="text-typography-700">
						{headerLine}
					</Text>
				</View>
				<Pressable
					hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
					onPress={() => startEditing(session.id)}
				>
					<Entypo name="edit" size={18} color="white" />
				</Pressable>
			</HStack>
			<HStack className="items-center">
				<Ionicons name="time-outline" size={16} color={'white'} />
				<Text className="text-typography-700 ml-1">
					{formatDuration(session.durationMin)}
				</Text>
			</HStack>
			{Array.isArray(session.exerciseCounts) && session.exerciseCounts.length > 0 && (
				<>
					<Heading size="sm" className="text-typography-600">Exercises:</Heading>
					<View>
						{session.exerciseCounts.map((ex, idx) => (
							<Text key={`${ex.exerciseId}-${idx}`} className="text-typography-700">
								{`${ex.completedSetCount} x ${ex.name} (${ex.category})`}
							</Text>
						))}
					</View>
				</>
			)}
		</View>
	);
}

function formatTime(d: Date): string {
	try {
		return new Intl.DateTimeFormat(undefined, {
			hour: 'numeric',
			minute: '2-digit',
		}).format(d);
	} catch {
		const h = d.getHours();
		const m = String(d.getMinutes()).padStart(2, '0');
		return `${h}:${m}`;
	}
}

function formatLongDate(d: Date): string {
	try {
		return new Intl.DateTimeFormat(undefined, {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		}).format(d);
	} catch {
		const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const wd = weekdays[d.getDay()];
		const day = String(d.getDate()).padStart(2, '0');
		const mon = months[d.getMonth()];
		const yr = d.getFullYear();
		return `${wd}, ${day} ${mon} ${yr}`;
	}
}

function formatDuration(totalMinutes: number): string {
	if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0m';
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours <= 0) return `${minutes}m`;
	if (minutes <= 0) return `${hours}h`;
	return `${hours}h ${minutes}m`;
}


