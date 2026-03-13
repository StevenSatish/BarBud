import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/app/context/ThemeContext';
import { useEditWorkout } from '@/app/context/EditWorkoutContext';
import { useAuth } from '@/app/context/AuthProvider';
import { deleteSession } from '@/app/services/workoutEditDatabase';

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
	dayKey?: string;
};

type SessionCardProps = {
	session: SessionLike;
	onDeleted?: (sessionId: string, dayKey?: string) => void;
};

export default function SessionCard({ session, onDeleted }: SessionCardProps) {
	const { theme } = useTheme();
	const { user } = useAuth();
	const { startEditing } = useEditWorkout();
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const headerLine = `${formatTime(session.startAt)}, ${formatLongDate(session.startAt)}`;

	const handleConfirmDelete = async () => {
		if (!user?.uid) {
			setShowDeleteConfirm(false);
			return;
		}
		setIsDeleting(true);
		try {
			await deleteSession(user.uid, session.id);
			onDeleted?.(session.id, session.dayKey ?? formatDayKey(session.startAt));
		} catch (err) {
			console.warn('Failed to delete session', err);
		} finally {
			setIsDeleting(false);
			setShowDeleteConfirm(false);
		}
	};

	return (
		<>
		<View className={`border border-outline-200 rounded-xl shadow-sm bg-${theme}-button p-3 mb-3`}>
			<HStack className="items-start justify-between">
				<View className="flex-1 pr-2">
					<Text className="text-typography-700">
						{headerLine}
					</Text>
				</View>
				<HStack className="items-center" space="sm">
					<Pressable
						hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
						onPress={() => startEditing(session.id)}
					>
						<Feather name="edit-2" size={18} color="white" />
					</Pressable>
					<Pressable
						hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
						onPress={() => setShowDeleteConfirm(true)}
					>
						<Feather name="trash" size={18} color="rgba(220, 38, 38, 0.8)" />
					</Pressable>
				</HStack>
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

		<Modal
			isOpen={showDeleteConfirm}
			onClose={() => setShowDeleteConfirm(false)}
			useRNModal
			className="z-1000"
		>
			<ModalBackdrop onPress={() => setShowDeleteConfirm(false)} />
			<ModalContent
				size="sm"
				className={`bg-${theme}-background border-${theme}-steelGray px-5 py-4`}
			>
				<ModalHeader>
					<HStack className="flex-1" space="md">
						<Heading size="md" className="text-typography-800 font-semibold">
							Delete session?
						</Heading>
					</HStack>
				</ModalHeader>
				<ModalBody>
					<Text className="text-typography-800">
						This will permanently remove this workout session and all its sets.
					</Text>
				</ModalBody>
				<ModalFooter className="flex-row justify-between items-center px-4">
					<Button variant="link" onPress={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
						<ButtonText>Cancel</ButtonText>
					</Button>
					<Button action="negative" onPress={handleConfirmDelete} disabled={isDeleting}>
						<ButtonText>{isDeleting ? 'Deleting…' : 'Confirm'}</ButtonText>
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	</>
	);
}

function formatDayKey(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
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


