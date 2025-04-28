import { View } from 'react-native';
import ExerciseDatabase from '../components/exerciseDatabase';

export default function HistoryDatabase() {

  const handleExercisePress = (exercise) => {
    console.log("inspecting:", exercise);
  }

  return (
    <View className="flex-1 justify-center items-center bg-background-0">
      <ExerciseDatabase handleExercisePress={handleExercisePress} />
    </View>
  );
}