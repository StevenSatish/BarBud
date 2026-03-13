import { View, TextInput, Pressable, Image } from 'react-native';
import { useAuth } from '../context/AuthProvider';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBackdrop,
} from "@/components/ui/alert-dialog"
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useEffect, useState } from 'react';
import { useTheme, ThemeType } from '@/app/context/ThemeContext';
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { ChevronDownIcon } from "@/components/ui/icon";
import { SelectIcon } from "@/components/ui/select";
import { SafeAreaView } from 'react-native-safe-area-context';
import { httpsCallable } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FIREBASE_FUNCTIONS, FIREBASE_DB, FIREBASE_AUTH } from "@/FirebaseConfig";
import { doc, deleteField, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { HStack } from '@/components/ui/hstack';
import RankedProgressionModal, { type RankedProgressionItem } from '@/app/components/RankedProgressionModal';
import { RANKED_EXERCISES, getCutoffs, computeRank, computePercentile, getProgressForPR, RANK_ORDER, RANK_PERCENTILES, type Rank } from '@/app/lib/rankData';
import Feather from '@expo/vector-icons/Feather';

const BADGE_IMAGES: Record<Rank, any> = {
  iron: require('@/app/badges/ironBadge.png'),
  bronze: require('@/app/badges/bronzeBadge.png'),
  silver: require('@/app/badges/silverBadge.png'),
  gold: require('@/app/badges/goldBadge.png'),
  platinum: require('@/app/badges/platinumBadge.png'),
  diamond: require('@/app/badges/diamondBadge.png'),
  titanium: require('@/app/badges/titaniumBadge.png'),
  mythic: require('@/app/badges/mythicBadge.png'),
};

const themeOptions: ThemeType[] = ['blue', 'cyan', 'pink', 'green', 'orange', ];

const WEIGHT_CLASSES = [
  '114-', '115-129', '130-144', '145-159', '160-174',
  '175-189', '190-204', '205-219', '220-234', '235-249', '250+',
];

export default function Settings() {
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const handleClose = () => setShowAlertDialog(false);
  const { theme, setTheme, colors } = useTheme();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteInputError, setDeleteInputError] = useState(false);

  const { userProfile, refreshUserProfile } = useAuth();
  const optedIntoRanked = userProfile?.optedIntoRanked ?? false;
  const [rankedGender, setRankedGender] = useState('');
  const [rankedWeightClass, setRankedWeightClass] = useState('');

  const [showRankedModal, setShowRankedModal] = useState(false);
  const [progressionItems, setProgressionItems] = useState<RankedProgressionItem[]>([]);
  const [progressionIndex, setProgressionIndex] = useState(0);
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [rankedSaving, setRankedSaving] = useState(false);
  const [showRankedInfo, setShowRankedInfo] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setRankedGender(userProfile.gender);
      setRankedWeightClass(userProfile.weightClass);
    }
  }, [userProfile]);

  const fetchRankedProgressionItems = async (
    uid: string,
    gender: string,
    weightClass: string
  ): Promise<RankedProgressionItem[]> => {
    const items: RankedProgressionItem[] = [];
    for (const { id: exerciseId, label: exerciseName } of RANKED_EXERCISES) {
      const cutoffs = getCutoffs(exerciseId, gender, weightClass);
      if (!cutoffs) continue;

      const metricsRef = doc(FIREBASE_DB, 'users', uid, 'exercises', exerciseId, 'metrics', 'allTimeMetrics');
      const metricsSnap = await getDoc(metricsRef);
      const metrics = metricsSnap.exists() ? metricsSnap.data() : null;

      let allTimePR = metrics?.allTimePR != null ? Number(metrics.allTimePR) : 0;
      const maxTopWeight = metrics?.maxTopWeight != null ? Number(metrics.maxTopWeight) : 0;

      if (allTimePR <= 0 && maxTopWeight > 0) {
        allTimePR = maxTopWeight;
      }

      const rank: Rank | null = computeRank(allTimePR, cutoffs);
      const percentile = computePercentile(allTimePR, cutoffs);

      if (allTimePR > 0) {
        await setDoc(metricsRef, { allTimePR, prPercentile: percentile }, { merge: true });
        const exerciseRef = doc(FIREBASE_DB, 'users', uid, 'exercises', exerciseId);
        await setDoc(exerciseRef, { rank: rank ?? '' }, { merge: true });
      }

      const progressInfo = getProgressForPR(allTimePR, rank, cutoffs);
      items.push({
        exerciseId,
        exerciseName,
        allTimePR,
        rank,
        cutoffs,
        percentile,
        ...progressInfo,
      });
    }
    return items;
  };

  const openProgressionModals = async () => {
    const uid = FIREBASE_AUTH.currentUser?.uid;
    if (!uid || !rankedGender || !rankedWeightClass) return;
    const items = await fetchRankedProgressionItems(uid, rankedGender, rankedWeightClass);
    if (items.length === 0) return;
    setProgressionItems(items);
    setProgressionIndex(0);
    setShowProgressionModal(true);
  };

  const handleProgressionContinue = () => {
    if (progressionIndex < progressionItems.length - 1) {
      setProgressionIndex((i) => i + 1);
    } else {
      setShowProgressionModal(false);
      setProgressionItems([]);
      setProgressionIndex(0);
    }
  };

  const handleProgressionClose = () => {
    setShowProgressionModal(false);
    setProgressionItems([]);
    setProgressionIndex(0);
  };

  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      handleClose();
    } catch (error: any) {
      alert('Sign Out Failed: ' + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toLowerCase() !== "delete") {
      setDeleteInputError(true);
      return;
    }
  
    try {  
      const deleteFn = httpsCallable(FIREBASE_FUNCTIONS, "deleteMyAccount");
      await deleteFn();
  
      await AsyncStorage.multiRemove(["username"]);
      await signOut();
  
      setShowDeleteModal(false);
      setDeleteInput("");
      setDeleteInputError(false);
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete account.");
    }
  };

  return (
    <View className={`flex-1 justify-center items-center bg-${theme}-background`}>
      <Text className="text-white text-2xl font-bold mb-2">Settings Page</Text>
      
      <View className="w-64 mb-4">
        <Text className="text-white mb-2">Theme</Text>
        <Select
          selectedValue={theme.charAt(0).toUpperCase() + theme.slice(1)}
          onValueChange={(value) => setTheme(value as ThemeType)}
        >
          <SelectTrigger>
            <SelectInput placeholder="Select theme" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper>
                <SelectDragIndicator />
              </SelectDragIndicatorWrapper>
              {themeOptions.map((theme) => (
                <SelectItem 
                  key={theme}
                  label={theme.charAt(0).toUpperCase() + theme.slice(1)} 
                  value={theme} 
                />
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>
      </View>

      <View className="mb-4 flex-row items-center">
        <Button
          onPress={() => setShowRankedModal(true)}
          action="primary"
          size="lg"
        >
          <ButtonText>{optedIntoRanked ? 'Manage Ranked' : 'Opt Into Ranked?'}</ButtonText>
        </Button>
        <Pressable hitSlop={8} style={{ marginLeft: 8 }} onPress={() => setShowRankedInfo(true)}>
          <Feather name="info" size={20} color={colors.light} />
        </Pressable>
      </View>

      <Modal isOpen={showRankedInfo} onClose={() => setShowRankedInfo(false)} size="full">
        <ModalBackdrop onPress={() => setShowRankedInfo(false)} />
        <ModalContent className={`bg-${theme}-background border-0`} style={{flex: 1, maxHeight: '100%' }}>
          <SafeAreaView className="flex-1" edges={['top', 'left', 'right', 'bottom']}>
            <ModalHeader>
              <Heading className="text-typography-800 font-semibold text-center" size="2xl">
                Ranking System
              </Heading>
            </ModalHeader>
            <ModalBody scrollEnabled={true} className="flex-1 pb-6">
              <Text className="text-typography-700 text-lg mb-6">
                Ranks are exercise-specific and based on your One Rep Max, compared to lifters in your chosen gender and weight class.
              </Text>
              <Text className="text-typography-600 text-base mb-6 italic">
                These standards come from sites like StrengthLevel.com. Therefore, they reflect only 
                the lifters dedicated enough to log their numbers online, not the general population. 
              </Text>
              <VStack space="lg">
                {RANK_ORDER.map((rank) => (
                  <HStack key={rank} className="items-center gap-4">
                    <Image source={BADGE_IMAGES[rank]} style={{ width: 64, height: 64 }} resizeMode="contain" />
                    <VStack className="flex-1">
                      <Text className="text-typography-800 text-lg font-semibold capitalize">{rank}</Text>
                      <Text className="text-typography-600 text-base">
                        Stronger than ~{RANK_PERCENTILES[rank]}% of lifters in your division
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </ModalBody>
            <ModalFooter className="justify-center">
              <Button onPress={() => setShowRankedInfo(false)} className={`bg-${theme}-accent`}>
                <ButtonText className="text-typography-800">Got it</ButtonText>
              </Button>
            </ModalFooter>
          </SafeAreaView>
        </ModalContent>
      </Modal>

      <Button onPress={() => setShowAlertDialog(true)}>
        <ButtonText>Sign Out</ButtonText>
      </Button>
      <Button variant="link" action="negative" onPress={() => setShowDeleteModal(true)}>
        <ButtonText>Delete Account</ButtonText>
      </Button>
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalBackdrop onPress={() => setShowDeleteModal(false)} />
        <ModalContent size="md" className={`bg-${theme}-background border-${theme}-steelGray`}>
          <ModalHeader>
            <Heading className="text-typography-800 font-semibold text-center" size="lg">
              Are you sure? Your data will be erased
            </Heading>
          </ModalHeader>
          <ModalBody>
            <Box className="gap-3">
              <Text className="text-typography-800 mb-2">
                Type "delete" to confirm:
              </Text>
              <Box
                className={`w-full rounded border px-3 py-2 ${
                  deleteInputError ? 'border-error-700' : 'border-secondary-900'
                }`}
              >
                <TextInput
                  className="text-typography-800 w-full"
                  placeholder="Type 'delete' to confirm"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={deleteInput}
                  onChangeText={(text) => {
                    setDeleteInput(text);
                    if (deleteInputError && text.toLowerCase() === 'delete') {
                      setDeleteInputError(false);
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Box>
              {deleteInputError && (
                <Text className="text-error-700 text-sm">
                  Please type "delete" to confirm
                </Text>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              action="secondary"
              onPress={() => setShowDeleteModal(false)}
              size="sm"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              action="negative"
              onPress={handleDeleteAccount}
              size="sm"
            >
              <ButtonText>Confirm</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <AlertDialog isOpen={showAlertDialog} onClose={handleClose} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent className={`bg-${theme}-background border-${theme}-steelGray`}>
          <AlertDialogHeader>
            <Heading className="text-typography-950 font-semibold pb-3" size="md">
              Are you sure you want to sign out?
            </Heading>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <Button
              variant="outline"
              action="secondary"
              onPress={handleClose}
              size="sm"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button size="sm" onPress={handleSignOut}>
              <ButtonText>Sign Out</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Modal isOpen={showRankedModal} onClose={() => setShowRankedModal(false)}>
        <ModalBackdrop onPress={() => setShowRankedModal(false)} />
        <ModalContent size="md" className={`bg-${theme}-background border-${theme}-steelGray`}>
          <ModalHeader>
            <Heading className="text-typography-800 font-semibold" size="lg">
              {optedIntoRanked ? 'Ranked Settings' : 'Opt Into Ranked'}
            </Heading>
          </ModalHeader>
          <ModalBody>
            <VStack space="lg">
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Gender</FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={rankedGender}
                  onValueChange={(value: string) => setRankedGender(value)}
                >
                  <SelectTrigger className="flex-row justify-between items-center">
                    <SelectInput placeholder="Select gender" />
                    <SelectIcon className="mr-2" as={ChevronDownIcon} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      <SelectItem label="Male" value="male" />
                      <SelectItem label="Female" value="female" />
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </FormControl>

              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Weight Class (lbs)</FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={rankedWeightClass}
                  onValueChange={(value: string) => setRankedWeightClass(value)}
                >
                  <SelectTrigger className="flex-row justify-between items-center">
                    <SelectInput placeholder="Select weight class" />
                    <SelectIcon className="mr-2" as={ChevronDownIcon} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {WEIGHT_CLASSES.map((wc) => (
                        <SelectItem key={wc} label={wc} value={wc} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            {optedIntoRanked ? (
              <HStack className="flex-1 justify-between">
                <Button
                  variant="outline"
                  action="secondary"
                  onPress={() => setShowRankedModal(false)}
                  size="sm"
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <HStack space="sm">
                  <Button
                    action="primary"
                    variant="solid"
                    size="sm"
                    onPress={async () => {
                      const uid = FIREBASE_AUTH.currentUser?.uid;
                      if (!uid) return;
                      await updateDoc(doc(FIREBASE_DB, 'users', uid), {
                        optedIntoRanked: false,
                        gender: deleteField(),
                        weightClass: deleteField(),
                      });
                      await refreshUserProfile();
                      setRankedGender('');
                      setRankedWeightClass('');
                      setShowRankedModal(false);
                    }}
                  >
                    <ButtonText>Opt Out</ButtonText>
                  </Button>
                  <Button
                    size="sm"
                    onPress={async () => {
                      const uid = FIREBASE_AUTH.currentUser?.uid;
                      if (!uid || !rankedGender || !rankedWeightClass) return;
                      setRankedSaving(true);
                      try {
                        await setDoc(doc(FIREBASE_DB, 'users', uid), {
                          optedIntoRanked: true,
                          gender: rankedGender,
                          weightClass: rankedWeightClass,
                        }, { merge: true });
                        await openProgressionModals();
                        setShowRankedModal(false);
                        await refreshUserProfile();
                      } finally {
                        setRankedSaving(false);
                      }
                    }}
                    isDisabled={rankedSaving}
                  >
                    {rankedSaving && <ButtonSpinner />}
                    <ButtonText>{rankedSaving ? 'Loading...' : 'Update'}</ButtonText>
                  </Button>
                </HStack>
              </HStack>
            ) : (
              <HStack className="flex-1 justify-between">
                <Button
                  variant="outline"
                  action="secondary"
                  onPress={() => setShowRankedModal(false)}
                  size="sm"
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  size="sm"
                  onPress={async () => {
                    const uid = FIREBASE_AUTH.currentUser?.uid;
                    if (!uid || !rankedGender || !rankedWeightClass) return;
                    setRankedSaving(true);
                    try {
                      await setDoc(doc(FIREBASE_DB, 'users', uid), {
                        optedIntoRanked: true,
                        gender: rankedGender,
                        weightClass: rankedWeightClass,
                      }, { merge: true });
                      await openProgressionModals();
                      setShowRankedModal(false);
                      await refreshUserProfile();
                    } finally {
                      setRankedSaving(false);
                    }
                  }}
                  isDisabled={rankedSaving}
                >
                  {rankedSaving && <ButtonSpinner />}
                  <ButtonText>{rankedSaving ? 'Loading...' : 'Opt In'}</ButtonText>
                </Button>
              </HStack>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <RankedProgressionModal
        isOpen={showProgressionModal}
        onClose={handleProgressionClose}
        onContinue={handleProgressionContinue}
        theme={theme}
        item={progressionItems[progressionIndex] ?? null}
        currentIndex={progressionIndex}
        totalCount={progressionItems.length}
      />
    </View>
  );
}
