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
import { Input, InputField } from '@/components/ui/input'
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
import { useState } from 'react'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
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

export default function NewExerciseModal({ isOpen, onClose }: any) {
  const { createExercise } = useExerciseDB();
  const [category, setCategory] = useState<string>('');
  const [categoryError, setCategoryError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [muscleGroup, setMuscleGroup] = useState<string>('');
  const [muscleGroupError, setMuscleGroupError] = useState(false);

  const [exerciseName, setExerciseName] = useState('');
  const [exerciseNameError, setExerciseNameError] = useState(false);

  const [secondaryMuscleGroups, setSecondaryMuscleGroups] = useState<string[]>([]);
  const [showSecondaryMuscles, setShowSecondaryMuscles] = useState(false);

  const [trackingMethods, setTrackingMethods] = useState<string[]>([]);
  const [showTrackingMethods, setShowTrackingMethods] = useState(false);
  const [trackingMethodsError, setTrackingMethodsError] = useState(false);

  const MUSCLE_GROUPS = [
    "Abs", "Back", "Biceps", "Chest", "Shoulders", "Quads", 
    "Forearms", "Calves", "Glutes", "Hamstrings", "Other"
  ];
  
  const CATEGORIES = [
    "Barbell", "Bodyweight", "Weighted", "Cable", "Machine", "Other"
  ];

  const TRACKING_METHODS = [
    "Reps", "Weight", "Time"
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
    if (trackingMethods.length === 0) {
      setTrackingMethodsError(true);
      hasErrors = true;
    } else {
      setTrackingMethodsError(false);
    }
    if (!exerciseName) {
      setExerciseNameError(true);
      hasErrors = true;
    } else {
      setExerciseNameError(false);
    }
    if (!hasErrors) {
      const result = await createExercise(exerciseName, category, muscleGroup, secondaryMuscleGroups, trackingMethods);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to create exercise");
      }
    }
  };

  const toggleTrackingMethod = (method: string) => {
    if (trackingMethods.includes(method)) {
      setTrackingMethods(trackingMethods.filter(m => m !== method));
    } else {
      setTrackingMethods([...trackingMethods, method]);
    }
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
      <ModalContent>
        <ModalHeader>
          <Text className="text-xl font-bold text-typography-900">Create New Exercise</Text>
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
            <FormControl isRequired isInvalid={exerciseNameError}>
              <FormControlLabel>
                <FormControlLabelText>Exercise Name</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField 
                  placeholder="Exercise Name"
                  value={exerciseName}
                  onChangeText={setExerciseName}
                />
              </Input>
            </FormControl>

            <HStack className="justify-between">
              <FormControl isRequired className="w-1/2" isInvalid={categoryError}>
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

                <FormControl isRequired isInvalid={trackingMethodsError}>
                  <FormControlLabel>
                    <FormControlLabelText>Tracking Methods</FormControlLabelText>
                  </FormControlLabel>
                  <Pressable
                    onPress={() => setShowTrackingMethods(true)}
                    className="border rounded-lg p-3 bg-background-0 border-background-300 flex-row justify-between items-center"
                  >
                    <Text className={trackingMethods.length === 0 ? "text-gray-400" : "text-white"}>
                      {trackingMethods.length > 0 
                        ? trackingMethods.join(', ')
                        : "Select tracking methods"}
                    </Text>
                    <ChevronDownIcon className="text-gray-400" />
                  </Pressable>
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
                className="border rounded-lg p-3 bg-background-0 border-background-300"
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
            onPress={onClose}
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

      <Actionsheet isOpen={showTrackingMethods} onClose={() => setShowTrackingMethods(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator/>
          </ActionsheetDragIndicatorWrapper>
          {TRACKING_METHODS.map((method) => (
            <ActionsheetItem key={method} 
            className={`${trackingMethods.includes(method) ? "bg-[#174161]" : ""} rounded-xs`}
            onPress={() => toggleTrackingMethod(method)}>
              <ActionsheetItemText size="md">{method}</ActionsheetItemText>
            </ActionsheetItem>
          ))}
          <ActionsheetItem onPress={() => setShowTrackingMethods(false)}>
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