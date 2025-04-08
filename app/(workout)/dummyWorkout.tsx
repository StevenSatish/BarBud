const dummyData = [
  {
    exerciseId: "bench-press",
    name: "Bench Press",
    trackingMethods: ["weight", "reps"],
    sets: [
      {
        setId: "bench-press-1",
        trackingData: {
          weight: 135,
          reps: 10
        }
      },
      {
        setId: "bench-press-2",
        trackingData: {
          weight: 155,
          reps: 8
        }
      },
      {
        setId: "bench-press-3",
        trackingData: {
          weight: 155,
          reps: 8
        }
      }
    ]
  },
  {
    exerciseId: "plank",
    name: "Plank",
    trackingMethods: ["time"],
    sets: [
      {
        setId: "plank-1",
        trackingData: {
          time: 60 
        }
      },
      {
        setId: "plank-2",
        trackingData: {
          time: 45
        }
      }
    ]
  },
  {
    exerciseId: "pull-ups",
    name: "Pull Ups",
    trackingMethods: ["reps"],
    sets: [
      {
        setId: "pull-ups-1",
        trackingData: {
          reps: 8
        }
      },
      {
        setId: "pull-ups-2",
        trackingData: {
          reps: 6
        }
      },
      {
        setId: "pull-ups-3",
        trackingData: {
          reps: 5
        }
      }
    ]
  }
];

export default dummyData;