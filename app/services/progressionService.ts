import { WorkoutData, ExerciseEntity, SetEntity, estimate1RM } from './workoutDatabase';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';

export type ProgressionItem = {
    exerciseName: string;
    changeType: 'Top Set' | 'Total' | 'New Estimated';
    changeSpec: 'Weight' | 'Reps' | 'Time' | 'Volume' | '1RM:';
    change: string;
    kind: 'allTime' | 'lastSession';
    exerciseId: string;
    category: 'standard' | 'est1RM';
};

export type ProgressionsResult = {
	title: string;
	items: ProgressionItem[];
	workoutsCompletedBefore?: number;
};

export default async function calculateProgressionsForWorkout(
	uid: string,
	ws: WorkoutData
): Promise<ProgressionsResult> {
	const items: ProgressionItem[] = [];

	const formatIncrease = (prev: number, next: number): string => {
		if (!Number.isFinite(prev) || prev <= 0) return `${next}lbs`;
		const pct = ((next - prev) / prev) * 100;
		return pct > 0 ? `+${pct.toFixed(1)}%` : '+0%';
	};

	for (const ex of ws.exercises as ExerciseEntity[]) {
		// Gather completed sets for this exercise
		const completedSets = (ex.setIds || [])
			.map((id: string) => ws.setsById[id])
			.filter((s: any) => s && (s as SetEntity).completed) as SetEntity[];
		if (!completedSets.length) continue;

		const hasWeight = ex.trackingMethods.includes('weight');
		const hasReps = ex.trackingMethods.includes('reps');
		const hasTime = ex.trackingMethods.includes('time');

		// Compute this session metrics (mirrors write functions)
		let lastTopWeight = 0;
		let lastTopRepsAtTopWeight = 0;
		let lastVolume = 0;
		let lastTopTimeAtTopWeight = 0;
		let lastTopReps = 0;
		let lastTotalReps = 0;
		let lastTopTime = 0;
		let lastTotalTime = 0;
		let lastBestEst1RM = 0;

		if (hasWeight && hasReps) {
			completedSets.forEach((s) => {
				const w = (s.trackingData.weight ?? 0) as number;
				const r = (s.trackingData.reps ?? 0) as number;
				if (!Number.isFinite(w) || !Number.isFinite(r) || r <= 0) return;
				if (w > lastTopWeight) {
					lastTopWeight = w;
					lastTopRepsAtTopWeight = r;
				} else if (w === lastTopWeight) {
					lastTopRepsAtTopWeight = Math.max(lastTopRepsAtTopWeight, r);
				}
				lastVolume += w * r;
				const est = estimate1RM(w, r);
				if (est && est > lastBestEst1RM) lastBestEst1RM = est;
			});
		} else if (hasWeight && hasTime) {
			completedSets.forEach((s) => {
				const w = (s.trackingData.weight ?? 0) as number;
				const t = (s.trackingData.time ?? 0) as number;
				if (!Number.isFinite(w) || !Number.isFinite(t) || t <= 0) return;
				if (w > lastTopWeight) {
					lastTopWeight = w;
					lastTopTimeAtTopWeight = t;
				} else if (w === lastTopWeight) {
					lastTopTimeAtTopWeight = Math.max(lastTopTimeAtTopWeight, t);
				}
			});
		} else if (hasReps) {
			completedSets.forEach((s) => {
				const r = (s.trackingData.reps ?? 0) as number;
				if (!Number.isFinite(r) || r <= 0) return;
				lastTopReps = Math.max(lastTopReps, r);
				lastTotalReps += r;
			});
		} else if (hasTime) {
			completedSets.forEach((s) => {
				const t = (s.trackingData.time ?? 0) as number;
				if (!Number.isFinite(t) || t <= 0) return;
				lastTopTime = Math.max(lastTopTime, t);
				lastTotalTime += t;
			});
		}

		// Fetch previous metrics docs
		const lastRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/lastSessionMetrics`);
		const allTimeRef = doc(FIREBASE_DB, `users/${uid}/exercises/${ex.exerciseId}/metrics/allTimeMetrics`);
		const [lastSnap, allTimeSnap] = await Promise.all([getDoc(lastRef), getDoc(allTimeRef)]);
		const prevLast = (lastSnap.exists() ? lastSnap.data() : {}) as any;
		const prevAll = (allTimeSnap.exists() ? allTimeSnap.data() : {}) as any;

		// Determine prioritized PR per exercise
		let chosen: ProgressionItem | null = null;

		const prevAllTopWeight = prevAll.maxTopWeight ?? 0;
		const prevLastTopWeight = prevLast.lastTopWeight ?? 0;

		if (hasWeight && hasReps) {
			// AllTime priorities
            if (!chosen && Number.isFinite(lastTopWeight) && lastTopWeight > prevAllTopWeight) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Weight',
                    change: formatIncrease(prevAllTopWeight, lastTopWeight),
                    kind: 'allTime',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
            }
			if (
				!chosen &&
				lastTopWeight === prevAllTopWeight &&
				Number.isFinite(lastTopRepsAtTopWeight) &&
				lastTopRepsAtTopWeight > (prevAll.maxTopRepsAtTopWeight ?? 0)
			) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Reps',
                    change: formatIncrease(prevAll.maxTopRepsAtTopWeight ?? 0, lastTopRepsAtTopWeight),
                    kind: 'allTime',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			// lastSession priorities
			if (!chosen && Number.isFinite(lastTopWeight) && lastTopWeight > prevLastTopWeight) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Weight',
                    change: formatIncrease(prevLastTopWeight, lastTopWeight),
                    kind: 'lastSession',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			// Only consider Top Set Reps if top weight is unchanged from last session
			if (
				!chosen &&
				lastTopWeight === prevLastTopWeight &&
				Number.isFinite(lastTopRepsAtTopWeight) &&
				lastTopRepsAtTopWeight > (prevLast.lastTopRepsAtTopWeight ?? 0)
			) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Reps',
                    change: formatIncrease(prevLast.lastTopRepsAtTopWeight ?? 0, lastTopRepsAtTopWeight),
                    kind: 'lastSession',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			if (!chosen && Number.isFinite(lastVolume) && lastVolume > (prevLast.lastVolume ?? 0)) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Total',
                    changeSpec: 'Volume',
                    change: formatIncrease(prevLast.lastVolume ?? 0, lastVolume),
                    kind: 'lastSession',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}

			// Independent Estimated 1RM PRs (do not affect chosen)
			if (Number.isFinite(lastBestEst1RM) && lastBestEst1RM > (prevAll.maxBestEst1RM ?? 0)) {
				items.push({
                    exerciseName: ex.name,
                    changeType: 'New Estimated',
                    changeSpec: '1RM:',
					change: `${lastBestEst1RM}lbs`,
					kind: 'allTime',
					exerciseId: ex.exerciseId,
					category: 'est1RM',
				});
			}
		} else if (hasWeight && hasTime) {
			// AllTime priorities
			if (!chosen && Number.isFinite(lastTopWeight) && lastTopWeight > prevAllTopWeight) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Weight',
                    change: formatIncrease(prevAllTopWeight, lastTopWeight),
                    kind: 'allTime',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			if (
				!chosen &&
				lastTopWeight === prevAllTopWeight &&
				Number.isFinite(lastTopTimeAtTopWeight) &&
				lastTopTimeAtTopWeight > (prevAll.maxTopTimeAtTopWeight ?? 0)
			) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Time',
                    change: formatIncrease(prevAll.maxTopTimeAtTopWeight ?? 0, lastTopTimeAtTopWeight),
                    kind: 'allTime',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			// lastSession priorities
			if (!chosen && Number.isFinite(lastTopWeight) && lastTopWeight > prevLastTopWeight) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Weight',
                    change: formatIncrease(prevLastTopWeight, lastTopWeight),
                    kind: 'lastSession',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			// Only consider Top Set Time if top weight is unchanged from last session
			if (
				!chosen &&
				lastTopWeight === prevLastTopWeight &&
				Number.isFinite(lastTopTimeAtTopWeight) &&
				lastTopTimeAtTopWeight > (prevLast.lastTopTimeAtTopWeight ?? 0)
			) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Time',
                    change: formatIncrease(prevLast.lastTopTimeAtTopWeight ?? 0, lastTopTimeAtTopWeight),
                    kind: 'lastSession',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
		} else if (hasReps) {
			// AllTime priorities
			if (!chosen && Number.isFinite(lastTopReps) && lastTopReps > (prevAll.maxTopReps ?? 0)) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Reps',
                    change: formatIncrease(prevAll.maxTopReps ?? 0, lastTopReps),
                    kind: 'allTime',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			// AllTime lowest priority: maxTotalReps
			if (!chosen && Number.isFinite(lastTotalReps) && lastTotalReps > (prevAll.maxTotalReps ?? 0)) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Total',
                    changeSpec: 'Reps',
                    change: formatIncrease(prevAll.maxTotalReps ?? 0, lastTotalReps),
                    kind: 'allTime',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			// lastSession priorities
			if (!chosen && Number.isFinite(lastTopReps) && lastTopReps > (prevLast.lastTopReps ?? 0)) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Reps',
                    change: formatIncrease(prevLast.lastTopReps ?? 0, lastTopReps),
                    kind: 'lastSession',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			if (!chosen && Number.isFinite(lastTotalReps) && lastTotalReps > (prevLast.lastTotalReps ?? 0)) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Total',
                    changeSpec: 'Reps',
                    change: formatIncrease(prevLast.lastTotalReps ?? 0, lastTotalReps),
                    kind: 'lastSession',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
		} else if (hasTime) {
			// AllTime priorities
			if (!chosen && Number.isFinite(lastTopTime) && lastTopTime > (prevAll.maxTopTime ?? 0)) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Time',
                    change: formatIncrease(prevAll.maxTopTime ?? 0, lastTopTime),
                    kind: 'allTime',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			// AllTime lowest priority: maxTotalTime
			if (!chosen && Number.isFinite(lastTotalTime) && lastTotalTime > (prevAll.maxTotalTime ?? 0)) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Total',
                    changeSpec: 'Time',
                    change: formatIncrease(prevAll.maxTotalTime ?? 0, lastTotalTime),
                    kind: 'allTime',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			// lastSession priorities
			if (!chosen && Number.isFinite(lastTopTime) && lastTopTime > (prevLast.lastTopTime ?? 0)) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Top Set',
                    changeSpec: 'Time',
                    change: formatIncrease(prevLast.lastTopTime ?? 0, lastTopTime),
                    kind: 'lastSession',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
			// LastSession lowest priority: lastTotalTime
			if (!chosen && Number.isFinite(lastTotalTime) && lastTotalTime > (prevLast.lastTotalTime ?? 0)) {
                chosen = {
                    exerciseName: ex.name,
                    changeType: 'Total',
                    changeSpec: 'Time',
                    change: formatIncrease(prevLast.lastTotalTime ?? 0, lastTotalTime),
                    kind: 'lastSession',
                    exerciseId: ex.exerciseId,
                    category: 'standard',
                };
			}
		}

		if (chosen) items.push(chosen);
	}

	// Split title still single, UI will group All-Time first, preserving order per kind
	return {
		title: 'Workout Progressions',
		items,
	};
}


