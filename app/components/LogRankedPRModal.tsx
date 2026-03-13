import React, { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
} from '@/components/ui/select';
import { ChevronDownIcon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import { getCutoffs, computeRank, computePercentile, getProgressForPR, RANK_ORDER, type Rank } from '@/app/lib/rankData';

export type PRResultData = {
  exerciseName: string;
  allTimePR: number;
  oldRank: Rank | null;
  newRank: Rank | null;
  rankChanged: boolean;
  oldProgress: number;
  newProgress: number;
  cutoffs: Record<Rank, number>;
  percentile: number;
};

const RANKED_EXERCISES: { id: string; label: string }[] = [
  { id: 'bench-press-barbell', label: 'Bench Press (Barbell)' },
  { id: 'bench-press-dumbbell', label: 'Bench Press (Dumbbell)' },
  { id: 'bent-over-row-barbell', label: 'Bent Over Row (Barbell)' },
  { id: 'bicep-curl-barbell', label: 'Bicep Curl (Barbell)' },
  { id: 'deadlift-barbell', label: 'Deadlift (Barbell)' },
  { id: 'hip-thrust-barbell', label: 'Hip Thrust (Barbell)' },
  { id: 'incline-bench-press-barbell', label: 'Incline Bench Press (Barbell)' },
  { id: 'lat-pulldown-machine', label: 'Lat Pulldown (Machine)' },
  { id: 'romanian-deadlift-barbell', label: 'Romanian Deadlift (Barbell)' },
  { id: 'shoulder-press-barbell', label: 'Shoulder Press (Barbell)' },
  { id: 'shoulder-press-dumbbell', label: 'Shoulder Press (Dumbbell)' },
  { id: 'squat-barbell', label: 'Squat (Barbell)' },
];

type LogRankedPRModalProps = {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  userGender: string;
  userWeightClass: string;
  onSuccess: (result: PRResultData) => void;
};

export default function LogRankedPRModal({
  isOpen,
  onClose,
  theme,
  userGender,
  userWeightClass,
  onSuccess,
}: LogRankedPRModalProps) {
  const [prExercise, setPRExercise] = useState('');
  const prValueRef = useRef('');
  const [prValueInputKey, setPRValueInputKey] = useState(0);
  const [prExerciseInvalid, setPRExerciseInvalid] = useState(false);
  const [prValueInvalid, setPRValueInvalid] = useState(false);
  const [prSubmitting, setPRSubmitting] = useState(false);

  const handleLogPR = async () => {
    let hasError = false;
    if (!prExercise) {
      setPRExerciseInvalid(true);
      hasError = true;
    }
    const trimmed = prValueRef.current.trim();
    if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) <= 0) {
      setPRValueInvalid(true);
      hasError = true;
    }
    if (hasError) return;

    const uid = FIREBASE_AUTH.currentUser?.uid;
    if (!uid) return;

    setPRSubmitting(true);
    try {
      const newPR = Number(trimmed);
      const cutoffs = getCutoffs(prExercise, userGender, userWeightClass);

      const exerciseRef = doc(FIREBASE_DB, 'users', uid, 'exercises', prExercise);
      const exerciseSnap = await getDoc(exerciseRef);
      const oldRankStr = exerciseSnap.exists() ? exerciseSnap.data()?.rank : null;
      const oldRank: Rank | null = oldRankStr && RANK_ORDER.includes(oldRankStr) ? oldRankStr : null;

      const metricsRef = doc(FIREBASE_DB, 'users', uid, 'exercises', prExercise, 'metrics', 'allTimeMetrics');
      const oldMetricsSnap = await getDoc(metricsRef);
      const oldPR = oldMetricsSnap.exists() ? (oldMetricsSnap.data()?.allTimePR ?? 0) : 0;

      const newRank = cutoffs ? computeRank(newPR, cutoffs) : oldRank;

      const percentile = cutoffs ? computePercentile(newPR, cutoffs) : 0;
      await setDoc(metricsRef, { allTimePR: newPR, prPercentile: percentile }, { merge: true });
      if (newRank !== oldRank) {
        await setDoc(exerciseRef, { rank: newRank ?? '' }, { merge: true });
      }

      onClose();
      setPRExercise('');
      prValueRef.current = '';
      setPRValueInputKey((k) => k + 1);
      setPRExerciseInvalid(false);
      setPRValueInvalid(false);

      if (cutoffs) {
        const oldProgressInfo = getProgressForPR(oldPR, oldRank, cutoffs);
        const newProgressInfo = getProgressForPR(newPR, newRank, cutoffs);
        const exerciseName = RANKED_EXERCISES.find((e) => e.id === prExercise)?.label ?? prExercise;
        const rankChanged = oldRank !== newRank;

        onSuccess({
          exerciseName,
          allTimePR: newPR,
          oldRank,
          newRank,
          rankChanged,
          oldProgress: oldProgressInfo.progress,
          newProgress: newProgressInfo.progress,
          cutoffs,
          percentile,
        });
      }
    } catch (e) {
      console.error('Failed to log PR', e);
    } finally {
      setPRSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setPRExercise('');
    prValueRef.current = '';
    setPRValueInputKey((k) => k + 1);
    setPRExerciseInvalid(false);
    setPRValueInvalid(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalBackdrop onPress={handleClose} />
      <ModalContent size="md" className={`bg-${theme}-background border-${theme}-steelGray`}>
        <ModalHeader>
          <Text className='text-xl font-bold text-typography-800'>Log Ranked PR</Text>
        </ModalHeader>
        <ModalBody>
          <VStack space="lg">
            <FormControl isInvalid={prExerciseInvalid}>
              <FormControlLabel>
                <FormControlLabelText>Exercise</FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={prExercise}
                onValueChange={(value: string) => {
                  setPRExercise(value);
                  if (prExerciseInvalid) setPRExerciseInvalid(false);
                }}
              >
                <SelectTrigger className="flex-row justify-between items-center">
                  <SelectInput placeholder="Select exercise" />
                  <SelectIcon className="mr-2" as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {RANKED_EXERCISES.map((ex) => (
                      <SelectItem key={ex.id} label={ex.label} value={ex.id} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </FormControl>

            <FormControl isInvalid={prValueInvalid}>
              <FormControlLabel>
                <FormControlLabelText>Weight (lbs)</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="md">
                <InputField
                  key={prValueInputKey}
                  className="text-typography-800"
                  placeholder="lbs"
                  keyboardType="decimal-pad"
                  onChangeText={(value) => {
                    prValueRef.current = value;
                    if (prValueInvalid) setPRValueInvalid(false);
                  }}
                  selectTextOnFocus={true}
                />
              </Input>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter className='flex-row justify-between items-center px-4'>
          <Button variant="outline" action="secondary" size="sm" onPress={handleClose}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button size="sm" onPress={handleLogPR} isDisabled={prSubmitting}>
            <ButtonText>{prSubmitting ? 'Logging...' : 'Log PR!'}</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
