import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/app/context/ThemeContext';
import { Calendar } from 'react-native-calendars';
import { FIREBASE_DB } from '@/FirebaseConfig';
import { useAuth } from '@/app/context/AuthProvider';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import SessionCard from '@/app/components/SessionCard';

export default function HistoryCalendarView() {
	type ExerciseCount = {
		exerciseId: string;
		nameSnap: string;
		completedSetCount: number;
	};

	type SessionSummary = {
		id: string;
		startAt: Date;
		endAt: Date;
		durationMin: number;
		totalCompletedSets: number;
		exerciseCounts: ExerciseCount[];
		dayKey: string; // YYYY-MM-DD
	};

	type DayKeyToSessions = Record<string, SessionSummary[]>;

	const monthCacheRef = useRef<Record<string, DayKeyToSessions>>({}); // key: YYYY-MM -> map of dayKey -> sessions
	const [currentMonthKey, setCurrentMonthKey] = useState<string>(() => formatMonthKey(new Date()));
	const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
	const [selectedDayKey, setSelectedDayKey] = useState<string | null>(() => formatDayKey(new Date()));
	const [loadedMonths, setLoadedMonths] = useState<Record<string, boolean>>({});

	const { colors, theme } = useTheme();
	const { user } = useAuth();

	const selectedDaySessions: SessionSummary[] = useMemo(() => {
		if (!selectedDayKey) return [];
		const monthKey = selectedDayKey.slice(0, 7);
		const monthMap = monthCacheRef.current[monthKey] || {};
		return monthMap[selectedDayKey] || [];
	}, [selectedDayKey, loadedMonths]);

	useEffect(() => {
		if (!user?.uid) return;
		// Load current month and prefetch neighbors
		(async () => {
			await ensureMonthLoaded(user.uid, currentMonthKey);
			updateMarkedDatesForMonth(currentMonthKey);
			prefetchAdjacentMonths(user.uid, currentMonthKey);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.uid, currentMonthKey]);

	function formatMonthKey(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		return `${y}-${m}`;
	}

	function formatDayKey(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	function getMonthRangeFromMonthKey(monthKey: string): { startDayKey: string; endDayKey: string } {
		const [yStr, mStr] = monthKey.split('-');
		const year = Number(yStr);
		const month = Number(mStr); // 1-12
		const last = new Date(year, month, 0).getDate(); // day 0 of next month
		const startDayKey = `${monthKey}-01`;
		const endDayKey = `${monthKey}-${String(last).padStart(2, '0')}`;
		return { startDayKey, endDayKey };
	}

	async function ensureMonthLoaded(uid: string, monthKey: string): Promise<void> {
		if (monthCacheRef.current[monthKey]) {
			setLoadedMonths(prev => (prev[monthKey] ? prev : { ...prev, [monthKey]: true }));
			return;
		}
		const { startDayKey, endDayKey } = getMonthRangeFromMonthKey(monthKey);

		const sessionsCol = collection(FIREBASE_DB, `users/${uid}/sessions`);
		const q = query(
			sessionsCol,
			where('dayKey', '>=', startDayKey),
			where('dayKey', '<=', endDayKey),
			orderBy('dayKey', 'asc')
		);

		const snap = await getDocs(q);
		const dayMap: DayKeyToSessions = {};

		snap.forEach(docSnap => {
			const data = docSnap.data() as any;
			// Firestore Timestamps -> JS Dates
			const startAt: Date = data.startAt?.toDate ? data.startAt.toDate() : new Date(data.startAt);
			const endAt: Date = data.endAt?.toDate ? data.endAt.toDate() : new Date(data.endAt);
			const item: SessionSummary = {
				id: docSnap.id,
				startAt,
				endAt,
				durationMin: Number(data.durationMin ?? 0),
				totalCompletedSets: Number(data.totalCompletedSets ?? 0),
				exerciseCounts: Array.isArray(data.exerciseCounts) ? data.exerciseCounts : [],
				dayKey: String(data.dayKey),
			};
			if (!dayMap[item.dayKey]) dayMap[item.dayKey] = [];
			dayMap[item.dayKey].push(item);
		});

		monthCacheRef.current[monthKey] = dayMap;
		setLoadedMonths(prev => ({ ...prev, [monthKey]: true }));
	}

	function updateMarkedDatesForMonth(monthKey: string): void {
		const dayMap = monthCacheRef.current[monthKey] || {};
		const next: Record<string, any> = {};
		Object.entries(dayMap).forEach(([dayKey, sessions]) => {
			const count = sessions.length;
			if (count <= 0) return;
			// Cap visible dots to avoid overflow; identical color dots convey multiplicity
			const dotCount = Math.min(count, 4);
			const dots = Array.from({ length: dotCount }).map((_, i) => ({
				key: `${dayKey}-s${i + 1}`,
				color: colors.accent,
				selectedDotColor: colors.light,
			}));
			next[dayKey] = { dots };
		});
		setMarkedDates(next);
	}

	function prefetchAdjacentMonths(uid: string, monthKey: string): void {
		const [yStr, mStr] = monthKey.split('-');
		const year = Number(yStr);
		const month = Number(mStr); // 1..12
		const prev = new Date(year, month - 2, 1); // JS Date month is 0-based
		const next = new Date(year, month, 1);
		const prevKey = formatMonthKey(prev);
		const nextKey = formatMonthKey(next);

		// Fire and forget
		ensureMonthLoaded(uid, prevKey).then(() => {
			// no-op
		}).catch(() => {});
		ensureMonthLoaded(uid, nextKey).then(() => {
			// no-op
		}).catch(() => {});
	}

	function handleMonthChange(m: { year: number; month: number }): void {
		const y = m.year;
		const key = `${y}-${String(m.month).padStart(2, '0')}`;
		setCurrentMonthKey(key);
		// Keep selected day visible month-coherent; clear if moved away
		if (selectedDayKey && !selectedDayKey.startsWith(key)) {
			setSelectedDayKey(null);
		}
	}

	function handleDayPress(d: { dateString: string }): void {
		setSelectedDayKey(d.dateString);
	}

	// Merge selection into marked dates (so the selected day is highlighted)
	const mergedMarkedDates = useMemo(() => {
		if (!selectedDayKey) return markedDates;
		return {
			...markedDates,
			[selectedDayKey]: {
				...(markedDates[selectedDayKey] || {}),
				selected: true,
				selectedColor: colors.accent,
				selectedTextColor: colors.background,
				selectedDotColor: colors.light,
			},
		};
	}, [markedDates, selectedDayKey, colors.accent, colors.background]);

	const isSelectedMonthLoaded = useMemo(() => {
		if (!selectedDayKey) return false;
		const mk = selectedDayKey.slice(0, 7);
		return !!loadedMonths[mk];
	}, [selectedDayKey, loadedMonths]);

	return (
		<ScrollView className={`bg-${theme}-background`}>
			<View className="pt-2 pb-2 px-3">
				<View className="bg-background-900 rounded-2xl">
				<Calendar
					style={{
						borderRadius: 12,
						width: '100%',
						alignSelf: 'stretch',
						marginHorizontal: 0,
						padding: 8,
					}}
					initialDate={selectedDayKey ?? undefined}
					markingType="multi-dot"
					markedDates={mergedMarkedDates}
					onMonthChange={handleMonthChange}
					onDayPress={handleDayPress}
					theme={{
						backgroundColor: colors.background,
						calendarBackground: colors.background,
						textSectionTitleColor: colors.steelGray,
						textSectionTitleDisabledColor: colors.steelGray,
						selectedDayBackgroundColor: colors.accent,
						selectedDayTextColor: colors.background,
						dayTextColor: colors.lightGray,
						textDisabledColor: colors.steelGray,
						todayTextColor: colors.accent,
					arrowColor: 'white',
					monthTextColor: 'white',
						dotColor: colors.accent,
						selectedDotColor: colors.light,

						textDayFontWeight: '500',
						textMonthFontWeight: '400',
						textDayHeaderFontWeight: '600',

						textDayFontSize: 16,
						textMonthFontSize: 18,
						textDayHeaderFontSize: 12,

						arrowStyle: {
							marginHorizontal: 6,
						},
					}}
				/>
				</View>

			{selectedDayKey && (
				<View className="mt-4">
					{!isSelectedMonthLoaded ? (
						<View className={`border border-outline-200 rounded-xl shadow-sm bg-${theme}-button p-3`}>
							<Text className={`text-${theme}-steelGray`}>Loading sessions...</Text>
						</View>
					) : selectedDaySessions.length === 0 ? (
						<View className={`border border-outline-200 rounded-xl shadow-sm bg-${theme}-button p-3`}>
							<Text className={`text-${theme}-steelGray`}>No sessions for this day.</Text>
						</View>
					) : (
						selectedDaySessions.map((s) => (
							<SessionCard key={s.id} session={s} />
						))
					)}
				</View>
			)}
			</View>
		</ScrollView>
	);

}


