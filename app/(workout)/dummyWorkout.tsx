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
        },
        completed: false
      },
      {
        setId: "bench-press-2",
        trackingData: {
          weight: 155,
          reps: 8
        },
        completed: false
      },
      {
        setId: "bench-press-3",
        trackingData: {
          weight: 155,
          reps: 8
          },
        completed: false
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
        },
        completed: false
      },
      {
        setId: "plank-2",
        trackingData: {
          time: 45
        },
        completed: false
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
        },
        completed: false
      },
      {
        setId: "pull-ups-2",
        trackingData: {
          reps: 6
        },
        completed: false
      },
      {
        setId: "pull-ups-3",
        trackingData: {
          reps: 5
        },
        completed: false
      }
    ]
  }
];

export default dummyData;