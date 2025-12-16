import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthProvider';
import { FIREBASE_DB } from '@/FirebaseConfig';
import { collection, getDocs, orderBy, query, startAfter, limit as fsLimit } from 'firebase/firestore';
import SessionCard from '@/app/components/SessionCard';

type ExerciseCount = {
	exerciseId: string;
	completedSetCount: number;
	name: string;
	category: string;
};

type SessionSummary = {
	id: string;
	startAt: Date;
	endAt: Date;
	durationMin: number;
	totalCompletedSets: number;
	exerciseCounts: ExerciseCount[];
	dayKey: string;
};

const PAGE_SIZE = 20;

export default function HistoryListView() {
	const { colors, theme } = useTheme();
	const { user } = useAuth();

	const [sessions, setSessions] = useState<SessionSummary[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const lastDocRef = useRef<any>(null);
	const [hasMore, setHasMore] = useState<boolean>(true);

	const loadFirstPage = useCallback(async () => {
		if (!user?.uid) return;
		setLoading(true);
		try {
			const col = collection(FIREBASE_DB, `users/${user.uid}/sessions`);
			const q = query(col, orderBy('startAt', 'desc'), fsLimit(PAGE_SIZE));
			const snap = await getDocs(q);
			const items: SessionSummary[] = [];
			snap.forEach(docSnap => {
				const data = docSnap.data() as any;
				const startAt: Date = data.startAt?.toDate ? data.startAt.toDate() : new Date(data.startAt);
				const endAt: Date = data.endAt?.toDate ? data.endAt.toDate() : new Date(data.endAt);
				items.push({
					id: docSnap.id,
					startAt,
					endAt,
					durationMin: Number(data.durationMin ?? 0),
					totalCompletedSets: Number(data.totalCompletedSets ?? 0),
					exerciseCounts: Array.isArray(data.exerciseCounts) ? data.exerciseCounts : [],
					dayKey: String(data.dayKey ?? ''),
				});
			});
			lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
			setHasMore(snap.docs.length === PAGE_SIZE);
			setSessions(items);
		} finally {
			setLoading(false);
		}
	}, [user?.uid]);

	const loadNextPage = useCallback(async () => {
		if (!user?.uid || !hasMore || !lastDocRef.current || loading) return;
		setLoading(true);
		try {
			const col = collection(FIREBASE_DB, `users/${user.uid}/sessions`);
			const q = query(col, orderBy('startAt', 'desc'), startAfter(lastDocRef.current), fsLimit(PAGE_SIZE));
			const snap = await getDocs(q);
			const items: SessionSummary[] = [];
			snap.forEach(docSnap => {
				const data = docSnap.data() as any;
				const startAt: Date = data.startAt?.toDate ? data.startAt.toDate() : new Date(data.startAt);
				const endAt: Date = data.endAt?.toDate ? data.endAt.toDate() : new Date(data.endAt);
				items.push({
					id: docSnap.id,
					startAt,
					endAt,
					durationMin: Number(data.durationMin ?? 0),
					totalCompletedSets: Number(data.totalCompletedSets ?? 0),
					exerciseCounts: Array.isArray(data.exerciseCounts) ? data.exerciseCounts : [],
					dayKey: String(data.dayKey ?? ''),
				});
			});
			lastDocRef.current = snap.docs[snap.docs.length - 1] ?? lastDocRef.current;
			setHasMore(snap.docs.length === PAGE_SIZE);
			if (items.length > 0) setSessions(prev => [...prev, ...items]);
		} finally {
			setLoading(false);
		}
	}, [user?.uid, hasMore, loading]);

	const onRefresh = useCallback(async () => {
		if (!user?.uid) return;
		setRefreshing(true);
		lastDocRef.current = null;
		try {
			await loadFirstPage();
		} finally {
			setRefreshing(false);
		}
	}, [user?.uid, loadFirstPage]);

	useEffect(() => {
		loadFirstPage();
	}, [loadFirstPage]);

	const renderItem = useCallback(({ item }: { item: SessionSummary }) => {
		return <SessionCard session={item} />;
	}, []);

	const listEmpty = useMemo(() => {
		if (loading) return null;
		return (
			<View className="p-6 items-center">
				<Text className="text-typography-700">No sessions yet.</Text>
			</View>
		);
	}, [loading]);

	return (
		<View className={`flex-1 bg-${theme}-background px-3 pt-2`}>
			<FlatList
				data={sessions}
				keyExtractor={(s) => s.id}
				renderItem={renderItem}
				showsVerticalScrollIndicator={false}
				onEndReachedThreshold={0.4}
				onEndReached={loadNextPage}
				ListFooterComponent={loading ? (
					<View className="py-3">
						<ActivityIndicator color={colors.light} />
					</View>
				) : null}
				refreshing={refreshing}
				onRefresh={onRefresh}
				ListEmptyComponent={listEmpty}
			/>
		</View>
	);
}




