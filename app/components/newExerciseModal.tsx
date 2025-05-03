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
import { ChevronDownIcon, CircleIcon, AlertCircleIcon, CheckIcon } from "@/components/ui/icon"
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

export default function NewExerciseModal({ isOpen, onClose }: any) {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [categoryError, setCategoryError] = useState(false);

  const [muscleGroup, setMuscleGroup] = useState<string | undefined>(undefined);
  const [muscleGroupError, setMuscleGroupError] = useState(false);

  const [exerciseName, setExerciseName] = useState('');
  const [exerciseNameError, setExerciseNameError] = useState(false);
  const [secondaryMuscleGroups, setSecondaryMuscleGroups] = useState<string[]>([]);
  const [showSecondaryMuscles, setShowSecondaryMuscles] = useState(false);

  const MUSCLE_GROUPS = [
    "Abs", "Back", "Biceps", "Chest", "Shoulders", "Quads", 
    "Forearms", "Calves", "Glutes", "Hamstrings", "Other"
  ];
  
  const CATEGORIES = [
    "Barbell", "Bodyweight", "Weighted", "Cable", "Machine", "Other"
  ];

  const handleAddExercise = () => {
    let hasErrors = false;
    
    if (!category) {
      setCategoryError(true);
      hasErrors = true;
    }
    if (!muscleGroup) {
      setMuscleGroupError(true);
      hasErrors = true;
    }
    if (!exerciseName) {
      setExerciseNameError(true);
      hasErrors = true;
    }

    if (!hasErrors) {
      onClose();
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

              <FormControl isRequired className="w-1/2" isInvalid={muscleGroupError}>
                <FormControlLabel>
                  <FormControlLabelText>Primary Muscle</FormControlLabelText>
                </FormControlLabel>
                <Select 
                  selectedValue={muscleGroup} 
                  onValueChange={(value: string) => setMuscleGroup(value)}
                >
                  <SelectTrigger>
                    <SelectInput placeholder="Select muscle" />
                    <SelectIcon className="mr-3" as={ChevronDownIcon} />
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
                    </SelectContent>
                  </SelectPortal>
                </Select>
                <FormControlHelper>
                  <FormControlHelperText>
                    Main muscle targeted
                  </FormControlHelperText>
                </FormControlHelper>
              </FormControl>
            </HStack>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Secondary Muscles (Optional)</FormControlLabelText>
              </FormControlLabel>
              <Pressable
                onPress={() => setShowSecondaryMuscles(true)}
                className="border rounded-lg p-3 bg-white"
              >
                <Text className={secondaryMuscleGroups.length === 0 ? "text-gray-400" : "text-gray-800"}>
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
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          {MUSCLE_GROUPS.filter(group => group !== muscleGroup).map((muscle) => (
            <ActionsheetItem 
              key={muscle} 
              onPress={() => toggleSecondaryMuscle(muscle)}
            >
              <HStack className="w-full justify-between items-center">
                <ActionsheetItemText>{muscle}</ActionsheetItemText>
                {secondaryMuscleGroups.includes(muscle) && <CheckIcon />}
              </HStack>
            </ActionsheetItem>
          ))}
          <ActionsheetItem onPress={() => setShowSecondaryMuscles(false)}>
            <ActionsheetItemText className="text-center font-bold">Done</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>
    </Modal>
  );
} 