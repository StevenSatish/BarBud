import { collection, doc, setDoc } from "firebase/firestore";
import { FIREBASE_DB } from '../FirebaseConfig';

const presetExercises = [
  // Chest Exercises
  {
    exerciseId: "bench-press-barbell",
    name: "Bench Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    category: "barbell"
  },
  {
    exerciseId: "bench-press-dumbbell",
    name: "Bench Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    category: "dumbbell"
  },
  {
    exerciseId: "decline-bench-press-barbell",
    name: "Decline Bench Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    category: "barbell"
  },
  {
    exerciseId: "decline-bench-press-dumbbell",
    name: "Decline Bench Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    category: "dumbbell"
  },
  {
    exerciseId: "incline-bench-press-barbell",
    name: "Incline Bench Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    category: "barbell"
  },
  {
    exerciseId: "incline-bench-press-dumbbell",
    name: "Incline Bench Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    category: "dumbbell"
  },
  {
    exerciseId: "chest-press-machine",
    name: "Chest Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    category: "machine"
  },
  {
    exerciseId: "incline-chest-press-machine",
    name: "Incline Chest Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    category: "machine"
  },
  
  // Push-ups and variations
  {
    exerciseId: "push-ups-bodyweight",
    name: "Push Ups",
    trackingMethods: ["reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Shoulders", "Triceps"],
    category: "bodyweight"
  },
  {
    exerciseId: "push-ups-weighted",
    name: "Push Ups",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Shoulders", "Triceps"],
    category: "weighted"
  },
  
  // Chest flys
  {
    exerciseId: "chest-fly-machine",
    name: "Chest Fly",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Shoulders"],
    category: "machine"
  },
  {
    exerciseId: "chest-fly-cable",
    name: "Chest Fly",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Shoulders"],
    category: "cable"
  },
  {
    exerciseId: "high-to-low-fly-cable",
    name: "High To Low Fly",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Shoulders"],
    category: "cable"
  },
  {
    exerciseId: "low-to-high-fly-cable",
    name: "Low to High Fly",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Shoulders"],
    category: "cable"
  },
  {
    exerciseId: "chest-fly-dumbbell",
    name: "Chest Fly",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Shoulders"],
    category: "dumbbell"
  },
  {
    exerciseId: "chest-crossover-cable",
    name: "Chest Crossover",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Shoulders"],
    category: "cable"
  },
  
  // Dips
  {
    exerciseId: "dip-bodyweight",
    name: "Dip",
    trackingMethods: ["reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders"],
    category: "bodyweight"
  },
  {
    exerciseId: "dip-weighted",
    name: "Dip",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders"],
    category: "weighted"
  },
  {
    exerciseId: "assisted-dip-machine",
    name: "Assisted Dip",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders"],
    category: "machine"
  },
  {
    exerciseId: "pullover-dumbbell",
    name: "Pullover",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Back", "Triceps"],
    category: "dumbbell"
  },
  
  // Core exercises
  {
    exerciseId: "crunch-bodyweight",
    name: "Crunch",
    trackingMethods: ["reps"],
    muscleGroup: "Abs",
    secondaryMuscles: [],
    category: "bodyweight"
  },
  {
    exerciseId: "crunch-weighted",
    name: "Crunch",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Abs",
    secondaryMuscles: [],
    category: "weighted"
  },
  {
    exerciseId: "crunch-cable",
    name: "Crunch",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Abs",
    secondaryMuscles: [],
    category: "cable"
  },
  {
    exerciseId: "plank-bodyweight",
    name: "Plank",
    trackingMethods: ["time"],
    muscleGroup: "Abs",
    secondaryMuscles: ["Shoulders"],
    category: "bodyweight"
  },
  {
    exerciseId: "mountain-climber-bodyweight",
    name: "Mountain Climber",
    trackingMethods: ["reps", "time"],
    muscleGroup: "Abs",
    secondaryMuscles: ["Shoulders", "Quads"],
    category: "bodyweight"
  },
  {
    exerciseId: "sit-up-bodyweight",
    name: "Sit Up",
    trackingMethods: ["reps"],
    muscleGroup: "Abs",
    secondaryMuscles: [],
    category: "bodyweight"
  },
  {
    exerciseId: "russian-twist-bodyweight",
    name: "Russian Twist",
    trackingMethods: ["reps"],
    muscleGroup: "Abs",
    secondaryMuscles: [],
    category: "bodyweight"
  },
  {
    exerciseId: "leg-raises-bodyweight",
    name: "Leg Raises",
    trackingMethods: ["reps"],
    muscleGroup: "Abs",
    secondaryMuscles: [],
    category: "bodyweight"
  },
  
  // Hip exercises
  {
    exerciseId: "hip-abduction-machine",
    name: "Hip Abduction",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Glutes",
    secondaryMuscles: [],
    category: "machine"
  },
  {
    exerciseId: "hip-adduction-machine",
    name: "Hip Adduction",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: [],
    category: "machine"
  },
  
  // Biceps exercises
  {
    exerciseId: "bicep-curl-dumbbell",
    name: "Bicep Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Biceps",
    secondaryMuscles: ["Forearms"],
    category: "dumbbell"
  },
  {
    exerciseId: "bicep-curl-barbell",
    name: "Bicep Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Biceps",
    secondaryMuscles: ["Forearms"],
    category: "barbell"
  },
  {
    exerciseId: "hammer-curl-dumbbell",
    name: "Hammer Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Biceps",
    secondaryMuscles: ["Forearms"],
    category: "dumbbell"
  },
  {
    exerciseId: "incline-curl-dumbbell",
    name: "Incline Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Biceps",
    secondaryMuscles: ["Forearms"],
    category: "dumbbell"
  },
  {
    exerciseId: "bicep-curl-cable",
    name: "Bicep Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Biceps",
    secondaryMuscles: ["Forearms"],
    category: "cable"
  },
  {
    exerciseId: "bayesian-curl-cable",
    name: "Bayesian Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Biceps",
    secondaryMuscles: ["Forearms"],
    category: "cable"
  },
  {
    exerciseId: "concentration-curl-dumbbell",
    name: "Concentration Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Biceps",
    secondaryMuscles: [],
    category: "dumbbell"
  },
  {
    exerciseId: "preacher-curl-barbell",
    name: "Preacher Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Biceps",
    secondaryMuscles: [],
    category: "barbell"
  },
  {
    exerciseId: "preacher-curl-dumbbell",
    name: "Preacher Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Biceps",
    secondaryMuscles: [],
    category: "dumbbell"
  },
  {
    exerciseId: "bicep-curl-machine",
    name: "Bicep Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Biceps",
    secondaryMuscles: [],
    category: "machine"
  },
  {
    exerciseId: "drag-curl-barbell",
    name: "Drag Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Biceps",
    secondaryMuscles: ["Forearms"],
    category: "barbell"
  },
  
  // Calf exercises
  {
    exerciseId: "seated-calf-raise-machine",
    name: "Seated Calf Raise",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Calves",
    secondaryMuscles: [],
    category: "machine"
  },
  {
    exerciseId: "standing-calf-raise-machine",
    name: "Standing Calf Raise",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Calves",
    secondaryMuscles: [],
    category: "machine"
  },
  {
    exerciseId: "calf-raise-dumbbell",
    name: "Calf Raise",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Calves",
    secondaryMuscles: [],
    category: "dumbbell"
  },
  {
    exerciseId: "leg-press-calf-raise-machine",
    name: "Leg Press Calf Raise",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Calves",
    secondaryMuscles: [],
    category: "machine"
  },
  {
    exerciseId: "donkey-calf-raise-machine",
    name: "Donkey Calf Raise",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Calves",
    secondaryMuscles: [],
    category: "machine"
  },
  
  // Forearm exercises
  {
    exerciseId: "wrist-curl-barbell",
    name: "Wrist Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Forearms",
    secondaryMuscles: [],
    category: "barbell"
  },
  {
    exerciseId: "reverse-wrist-curl-barbell",
    name: "Reverse Wrist Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Forearms",
    secondaryMuscles: [],
    category: "barbell"
  },
  {
    exerciseId: "reverse-grip-curl-barbell",
    name: "Reverse Grip Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Forearms",
    secondaryMuscles: ["Biceps"],
    category: "barbell"
  },
  {
    exerciseId: "wrist-curl-dumbbell",
    name: "Wrist Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Forearms",
    secondaryMuscles: [],
    category: "dumbbell"
  },
  {
    exerciseId: "dead-hang-bodyweight",
    name: "Dead Hang",
    trackingMethods: ["time"],
    muscleGroup: "Forearms",
    secondaryMuscles: ["Back", "Shoulders"],
    category: "bodyweight"
  },
  
  // Back exercises
  {
    exerciseId: "hyperextension-bodyweight",
    name: "Hyperextension",
    trackingMethods: ["reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    category: "bodyweight"
  },
  
  // Glute exercises
  {
    exerciseId: "hip-thrust-barbell",
    name: "Hip Thrust",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Glutes",
    secondaryMuscles: ["Hamstrings"],
    category: "barbell"
  },
  {
    exerciseId: "hip-thrust-machine",
    name: "Hip Thrust",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Glutes",
    secondaryMuscles: ["Hamstrings"],
    category: "machine"
  },
  {
    exerciseId: "good-morning-barbell",
    name: "Good Morning",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Hamstrings",
    secondaryMuscles: ["Glutes", "Back"],
    category: "barbell"
  },
  {
    exerciseId: "glute-bridge-barbell",
    name: "Glute Bridge",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Glutes",
    secondaryMuscles: ["Hamstrings"],
    category: "barbell"
  },
  {
    exerciseId: "glute-kickback-cable",
    name: "Glute Kickback",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Glutes",
    secondaryMuscles: ["Hamstrings"],
    category: "cable"
  },
  
  // Hamstring exercises
  {
    exerciseId: "stiff-leg-deadlift-barbell",
    name: "Stiff Leg Deadlift",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Hamstrings",
    secondaryMuscles: ["Glutes", "Back"],
    category: "barbell"
  },
  {
    exerciseId: "stiff-leg-deadlift-dumbbell",
    name: "Stiff Leg Deadlift",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Hamstrings",
    secondaryMuscles: ["Glutes", "Back"],
    category: "dumbbell"
  },
  {
    exerciseId: "deadlift-barbell",
    name: "Deadlift",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Hamstrings", "Glutes", "Quads"],
    category: "barbell"
  },
  {
    exerciseId: "leg-curl-machine",
    name: "Leg Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Hamstrings",
    secondaryMuscles: [],
    category: "machine"
  },
  {
    exerciseId: "lying-leg-curl-machine",
    name: "Lying Leg Curl",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Hamstrings",
    secondaryMuscles: [],
    category: "machine"
  },
  {
    exerciseId: "romanian-deadlift-barbell",
    name: "Romanian Deadlift",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Hamstrings",
    secondaryMuscles: ["Glutes", "Back"],
    category: "barbell"
  },
  {
    exerciseId: "romanian-deadlift-dumbbell",
    name: "Romanian Deadlift",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Hamstrings",
    secondaryMuscles: ["Glutes", "Back"],
    category: "dumbbell"
  },
  
  // Quad exercises
  {
    exerciseId: "goblet-squat-dumbbell",
    name: "Goblet Squat",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    category: "dumbbell"
  },
  {
    exerciseId: "squat-barbell",
    name: "Squat",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    category: "barbell"
  },
  {
    exerciseId: "lunge-barbell",
    name: "Lunge",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    category: "barbell"
  },
  {
    exerciseId: "lunge-dumbbell",
    name: "Lunge",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    category: "dumbbell"
  },
  {
    exerciseId: "leg-press-machine",
    name: "Leg Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    category: "machine"
  },
  {
    exerciseId: "leg-extension-machine",
    name: "Leg Extension",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: [],
    category: "machine"
  },
  {
    exerciseId: "step-up-dumbbell",
    name: "Step Up",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: ["Glutes"],
    category: "dumbbell"
  },
  {
    exerciseId: "bulgarian-split-squat-dumbbell",
    name: "Bulgarian Split Squat",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    category: "dumbbell"
  },
  {
    exerciseId: "front-squat-barbell",
    name: "Front Squat",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: ["Glutes"],
    category: "barbell"
  },
  {
    exerciseId: "hack-squat-machine",
    name: "Hack Squat",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    category: "machine"
  },
  {
    exerciseId: "squat-machine",
    name: "Squat",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    category: "machine"
  },
  
  // Tricep exercises
  {
    exerciseId: "tricep-extension-cable",
    name: "Tricep Extension",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    category: "cable"
  },
  {
    exerciseId: "tricep-extension-machine",
    name: "Tricep Extension",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    category: "machine"
  },
  {
    exerciseId: "overhead-tricep-extension-dumbbell",
    name: "Overhead Tricep Extension",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    category: "dumbbell"
  },
  {
    exerciseId: "skullcrusher-barbell",
    name: "Skullcrusher",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    category: "barbell"
  },
  {
    exerciseId: "skullcrusher-dumbbell",
    name: "Skullcrusher",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    category: "dumbbell"
  },
  {
    exerciseId: "close-grip-bench-press-barbell",
    name: "Close Grip Bench Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Triceps",
    secondaryMuscles: ["Chest", "Shoulders"],
    category: "barbell"
  },
  {
    exerciseId: "smith-bench-press-machine",
    name: "Smith Bench Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders"],
    category: "machine"
  },
  {
    exerciseId: "tricep-kickback-machine",
    name: "Tricep Kickback",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    category: "machine"
  },
  {
    exerciseId: "tricep-kickback-cable",
    name: "Tricep Kickback",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    category: "cable"
  },
  {
    exerciseId: "overhead-tricep-extension-cable",
    name: "Overhead Tricep Extension",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    category: "cable"
  },
  {
    exerciseId: "diamond-pushup-bodyweight",
    name: "Diamond Pushup",
    trackingMethods: ["reps"],
    muscleGroup: "Triceps",
    secondaryMuscles: ["Chest", "Shoulders"],
    category: "bodyweight"
  },
  
  // Back exercises
  {
    exerciseId: "lat-pulldown-machine",
    name: "Lat Pulldown",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "machine"
  },
  {
    exerciseId: "lat-pullover-cable",
    name: "Lat Pullover",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Triceps", "Chest"],
    category: "cable"
  },
  {
    exerciseId: "pull-up-bodyweight",
    name: "Pull Up",
    trackingMethods: ["reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "bodyweight"
  },
  {
    exerciseId: "pull-up-weighted",
    name: "Pull Up",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "weighted"
  },
  {
    exerciseId: "assisted-pull-up-machine",
    name: "Assisted Pull Up",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "machine"
  },
  {
    exerciseId: "row-dumbbell",
    name: "Row",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "dumbbell"
  },
  {
    exerciseId: "bent-over-row-barbell",
    name: "Bent Over Row",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "barbell"
  },
  {
    exerciseId: "seated-row-cable",
    name: "Seated Row",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "cable"
  },
  {
    exerciseId: "t-bar-row-machine",
    name: "T Bar Row",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "machine"
  },
  {
    exerciseId: "seated-row-machine",
    name: "Seated Row",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "machine"
  },
  {
    exerciseId: "smith-bent-over-row-machine",
    name: "Smith Bent Over Row",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "machine"
  },
  {
    exerciseId: "pendlay-row-barbell",
    name: "Pendlay Row",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "barbell"
  },
  {
    exerciseId: "meadows-row-barbell",
    name: "Meadows Row",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps"],
    category: "barbell"
  },
  
  // Shoulder exercises
  {
    exerciseId: "face-pull-cable",
    name: "Face Pull",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Back"],
    category: "cable"
  },
  {
    exerciseId: "reverse-fly-machine",
    name: "Reverse Fly",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Back"],
    category: "machine"
  },
  {
    exerciseId: "reverse-fly-cable",
    name: "Reverse Fly",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Back"],
    category: "cable"
  },
  {
    exerciseId: "shrug-dumbbell",
    name: "Shrug",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: [],
    category: "dumbbell"
  },
  {
    exerciseId: "shrug-barbell",
    name: "Shrug",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: [],
    category: "barbell"
  },
  {
    exerciseId: "upright-row-barbell",
    name: "Upright Row",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: [],
    category: "barbell"
  },
  {
    exerciseId: "shrug-cable",
    name: "Shrug",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: [],
    category: "cable"
  },
  {
    exerciseId: "lateral-raise-cable",
    name: "Lateral Raise",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: [],
    category: "cable"
  },
  {
    exerciseId: "lateral-raise-dumbbell",
    name: "Lateral Raise",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: [],
    category: "dumbbell"
  },
  {
    exerciseId: "shoulder-press-barbell",
    name: "Shoulder Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Triceps"],
    category: "barbell"
  },
  {
    exerciseId: "shoulder-press-dumbbell",
    name: "Shoulder Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Triceps"],
    category: "dumbbell"
  },
  {
    exerciseId: "shoulder-press-machine",
    name: "Shoulder Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Triceps"],
    category: "machine"
  },
  {
    exerciseId: "reverse-fly-dumbbell",
    name: "Reverse Fly",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Back"],
    category: "dumbbell"
  },
  {
    exerciseId: "arnold-press-dumbbell",
    name: "Arnold Press",
    trackingMethods: ["weight", "reps"],
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Triceps"],
    category: "dumbbell"
  }
];

// Function to populate Firestore with preset exercises
export const populatePresetExercises = async () => {
  try {
    const presetExercisesCollection = collection(FIREBASE_DB, "presetExercises");
    
    // Add each exercise to Firestore
    const promises = presetExercises.map(exercise => 
      setDoc(doc(presetExercisesCollection, exercise.exerciseId), exercise)
    );
    
    await Promise.all(promises);
    console.log("Successfully added preset exercises to Firestore!");
    
  } catch (error) {
    console.error("Error adding preset exercises: ", error);
  }
};

export default populatePresetExercises;