import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/app/context/ThemeContext';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import HistoryCalendarView from '@/app/components/HistoryCalendarView';
import HistoryListView from '@/app/components/HistoryListView';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function History() {
	const { theme } = useTheme();
	const [mode, setMode] = useState<'calendar' | 'list'>('calendar');

	useEffect(() => {
		AsyncStorage.removeItem('lastPage');
	}, []);

	const isCalendar = mode === 'calendar';

	return (
		<SafeAreaView className={`flex-1 bg-${theme}-background`}>
			{/* Header */}
			<View className="w-full flex-row items-center justify-between px-4 py-3">
				<Text className="text-typography-900 text-2xl font-bold">Workout History</Text>
				<View className="flex-row items-center border border-outline-200 rounded-md overflow-hidden">
					<Pressable
						onPress={() => setMode('calendar')}
						className={(isCalendar ? `bg-${theme}-accent` : '') + ' w-12 h-12 items-center justify-center'}
						hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
					>
						<FontAwesome5 name="calendar-alt" size={18} color={isCalendar ? 'white' : 'gray'} />
					</Pressable>
					<View className="w-px h-12 bg-outline-200" />
					<Pressable
						onPress={() => setMode('list')}
						className={(!isCalendar ? `bg-${theme}-accent` : '') + ' w-12 h-12 items-center justify-center'}
						hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
					>
						<FontAwesome5 name="list" size={18} color={!isCalendar ? 'white' : 'gray'} />
					</Pressable>
				</View>
			</View>

			{/* Content */}
			<View className="flex-1">
				{isCalendar ? <HistoryCalendarView /> : <HistoryListView />}
			</View>
		</SafeAreaView>
	);
}