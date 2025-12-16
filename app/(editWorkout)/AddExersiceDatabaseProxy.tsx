// @ts-ignore: JS module without TS typings
import AddExerciseDatabase from '../(workout)/AddExersiceDatabase';
const AddExerciseDatabaseAny: any = AddExerciseDatabase;

export default function AddExerciseDatabaseProxy() {
  return <AddExerciseDatabaseAny modeOverride="edit" />;
}
