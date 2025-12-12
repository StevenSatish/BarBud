import {
    Modal,
    ModalBackdrop,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
} from "@/components/ui/modal"
import { Button, ButtonText } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { RadioGroup, Radio, RadioIndicator, RadioIcon, RadioLabel } from '@/components/ui/radio'
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
} from "@/components/ui/select"
import { ChevronDownIcon, CircleIcon } from "@/components/ui/icon"
import { useRef, useState } from 'react'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { TextInput } from 'react-native'
import { Box } from '@/components/ui/box'
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from '@/components/ui/actionsheet'
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
} from "@/components/ui/form-control"
import useExerciseDB from '../context/ExerciseDBContext'
import { Alert } from '@/components/ui/alert'
import { useTheme } from '@/app/context/ThemeContext';

// Separate component for the exercise name input to prevent re-renders
const ExerciseNameInput = ({
  onChangeText,
  hasError,
  inputKey,
}: {
  onChangeText: (text: string) => void;
  hasError: boolean;
  inputKey: number;
}) => (
  <Box className="gap-2">
    <Text className="text-typography-800 font-semibold">Exercise Name</Text>
    <Box
      className={`w-full rounded border px-3 py-2 ${
        hasError ? 'border-error-700' : 'border-secondary-900'
      }`}
    >
      <TextInput
        key={inputKey}
        onChangeText={onChangeText}
        placeholder="Exercise Name"
        placeholderTextColor="rgba(255,255,255,0.6)"
        className="text-typography-800"
      />
    </Box>
  </Box>
);

export default function NewExerciseModal({ isOpen, onClose }: any) {
  const { createExercise } = useExerciseDB();
  const [category, setCategory] = useState<string>('');
  const [categoryError, setCategoryError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  const [muscleGroup, setMuscleGroup] = useState<string>('');
  const [muscleGroupError, setMuscleGroupError] = useState(false);

  const [exerciseNameError, setExerciseNameError] = useState(false);
  const exerciseNameDraftRef = useRef('');
  const [exerciseNameInputKey, setExerciseNameInputKey] = useState(0);

  const [secondaryMuscleGroups, setSecondaryMuscleGroups] = useState<string[]>([]);
  const [showSecondaryMuscles, setShowSecondaryMuscles] = useState(false);

  const [trackingMethod, setTrackingMethod] = useState<string>('');
  const [trackingMethodError, setTrackingMethodError] = useState(false);

  const MUSCLE_GROUPS = [
    "Abs", "Back", "Biceps", "Chest", "Shoulders", "Quads", 
    "Forearms", "Calves", "Glutes", "Hamstrings", "Other"
  ];
  
  const CATEGORIES = [
    "Barbell", "Bodyweight", "Weighted", "Cable", "Machine", "Other"
  ];

  const TRACKING_METHODS = [
    "Weight x Reps", "Weight x Time", "Reps", "Time"
  ];

  const handleAddExercise = async () => {
    let hasErrors = false;
    
    if (!category) {
      setCategoryError(true);
      hasErrors = true;
    } else {
      setCategoryError(false);
    }
    if (!muscleGroup) {
      setMuscleGroupError(true);
      hasErrors = true;
    } else {
      setMuscleGroupError(false);
    }
    if (!trackingMethod) {
      setTrackingMethodError(true);
      hasErrors = true;
    } else {
      setTrackingMethodError(false);
    }
    const trimmedName = exerciseNameDraftRef.current.trim();
    if (!trimmedName) {
      setExerciseNameError(true);
      hasErrors = true;
    } else {
      setExerciseNameError(false);
    }
    if (!hasErrors) {
      const result = await createExercise(trimmedName, category, muscleGroup, secondaryMuscleGroups, [trackingMethod]);
      if (result.success) {
        exerciseNameDraftRef.current = '';
        setExerciseNameInputKey((k) => k + 1);
        onClose();
      } else {
        setError(result.error || "Failed to create exercise");
      }
    }
  };

  const handleCancel = () => {
    setMuscleGroup('');
    setMuscleGroupError(false);
    setExerciseNameError(false);
    setExerciseNameInputKey((k) => k + 1);
    exerciseNameDraftRef.current = '';
    setSecondaryMuscleGroups([]);
    setTrackingMethod('');
    setTrackingMethodError(false);
    setCategory('');
    setCategoryError(false);
    onClose();
  };


  const toggleSecondaryMuscle = (muscle: string) => {
    if (secondaryMuscleGroups.includes(muscle)) {
      setSecondaryMuscleGroups(secondaryMuscleGroups.filter(m => m !== muscle));
    } else {
      setSecondaryMuscleGroups([...secondaryMuscleGroups, muscle]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent className={`bg-${theme}-background border-${theme}-lightGray`}>
        <ModalHeader>
          <Text className="text-xl font-bold text-typography-800">Create New Exercise</Text>
          <ModalCloseButton onPress={onClose}>
            <Text className="text-typography-500">✕</Text>
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack space="lg">
            {error && (
              <Alert variant="solid" className="mb-4 bg-red-500">
                <Text className="text-white">{error}</Text>
              </Alert>
            )}
            <ExerciseNameInput
              onChangeText={(t) => {
                exerciseNameDraftRef.current = t;
              }}
              hasError={exerciseNameError}
              inputKey={exerciseNameInputKey}
            />

            <HStack className="justify-between">
              <FormControl isRequired isInvalid={categoryError} className="w-1/2">
                <FormControlLabel>
                  <FormControlLabelText>Category</FormControlLabelText>
                </FormControlLabel>
                <RadioGroup value={category} onChange={setCategory}>
                  <VStack space="sm">
                    {CATEGORIES.map((cat) => (
                      <Radio key={cat} size="md" value={cat}>
                        <RadioIndicator>
                          <RadioIcon as={CircleIcon} />
                        </RadioIndicator>
                        <RadioLabel>{cat}</RadioLabel>
                      </Radio>
                    ))}
                  </VStack>
                </RadioGroup>
                <FormControlHelper>
                  <FormControlHelperText>
                    Select Exercise Type
                  </FormControlHelperText>
                </FormControlHelper>
              </FormControl>

              <VStack className="w-1/2" space="md">
                <FormControl isRequired isInvalid={muscleGroupError}>
                  <FormControlLabel>
                    <FormControlLabelText>Primary Muscle</FormControlLabelText>
                  </FormControlLabel>
                  <Select 
                    selectedValue={muscleGroup} 
                    onValueChange={(value: string) => setMuscleGroup(value)}

                  >
                    <SelectTrigger className="flex-row justify-between items-center">
                      <SelectInput placeholder="Select muscle" />
                      <SelectIcon className="mr-2" as={ChevronDownIcon} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        {MUSCLE_GROUPS.map((group) => (
                          <SelectItem key={group} label={group} value={group} />
                        ))}
                        <SelectItem label="" value="" />
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                  <FormControlHelper>
                    <FormControlHelperText>
                      Main muscle targeted
                    </FormControlHelperText>
                  </FormControlHelper>
                </FormControl>

                <FormControl isRequired isInvalid={trackingMethodError}>
                  <FormControlLabel>
                    <FormControlLabelText>Tracking Method</FormControlLabelText>
                  </FormControlLabel>
                  <Select 
                    selectedValue={trackingMethod} 
                    onValueChange={(value: string) => setTrackingMethod(value)}
                  >
                    <SelectTrigger className="flex-row justify-between items-center">
                      <SelectInput placeholder="Select method" />
                      <SelectIcon className="mr-2" as={ChevronDownIcon} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        {TRACKING_METHODS.map((method) => (
                          <SelectItem key={method} label={method} value={method} />
                        ))}
                        <SelectItem label="" value="" />
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                  <FormControlHelper>
                    <FormControlHelperText>
                      How this exercise will be tracked
                    </FormControlHelperText>
                  </FormControlHelper>
                </FormControl>
              </VStack>
            </HStack>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Secondary Muscles (Optional)</FormControlLabelText>
              </FormControlLabel>
              <Pressable
                onPress={() => setShowSecondaryMuscles(true)}
                className={`border rounded-lg p-3 border-background-300 flex-row justify-between items-center`}
              >
                <Text className={secondaryMuscleGroups.length === 0 ? "text-gray-400" : "text-white"}>
                  {secondaryMuscleGroups.length > 0 
                    ? secondaryMuscleGroups.join(', ')
                    : "Select secondary muscles"}
                </Text>
              </Pressable>
              <FormControlHelper>
                <FormControlHelperText>
                  Other muscles worked by this exercise
                </FormControlHelperText>
              </FormControlHelper>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="outline" 
            action="secondary"
            onPress={handleCancel}
            className="mr-3"
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button 
            action="primary" 
            onPress={handleAddExercise}
          >
            <ButtonText>Add</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>

      <Actionsheet isOpen={showSecondaryMuscles} onClose={() => setShowSecondaryMuscles(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator/>
          </ActionsheetDragIndicatorWrapper>
          {MUSCLE_GROUPS.filter(group => group !== muscleGroup).map((muscle) => (
            <ActionsheetItem 
              key={muscle} 
              onPress={() => toggleSecondaryMuscle(muscle)}
              className={`${secondaryMuscleGroups.includes(muscle) ? "bg-[#174161]" : ""} rounded-xs`}
            >
              <HStack className="w-full justify-between items-center">
                <ActionsheetItemText size="md" className={secondaryMuscleGroups.includes(muscle) ? "text-white" : ""}>{muscle}</ActionsheetItemText>
              </HStack>
            </ActionsheetItem>
          ))}
          <ActionsheetItem onPress={() => setShowSecondaryMuscles(false)}>
            <ActionsheetItemText size="md" className="text-center font-bold">Done</ActionsheetItemText>
          </ActionsheetItem>
          {/* blank item to add space */}
          <ActionsheetItem>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>

    </Modal>
  );
} 