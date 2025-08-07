export const CONSTANT = {
  score: {
    Single: 100,
    Double: 300,
    Triple: 500,
    Tetris: 800,
    TSpinZero: 400,
    TSpinSingle: 800,
    TSpinDouble: 1200,
    TSpinTriple: 1600,
    SoftDrop: 1,
    HardDrop: 2,
    Combo: 200,
  },
  attckLine: {
    Double: 1,
    Triple: 2,
    Tetris: 4,
    TSpinSingle: 2,
    TSpinDouble: 4,
    TSpinTriple: 6,
  },
  rule: {
    placingResetCnt: 15,
    placingDelayTick: 30,
  },
  levelGravityTick: [
    48, // index 0: dummy
    48, // level 1
    43, // level 2
    38, // level 3
    33, // level 4
    28, // level 5
    23, // level 6
    18, // level 7
    13, // level 8
    8, // level 9
    6, // level 10
    5, // level 11
    5, // level 12
    5, // level 13
    4, // level 14
    4, // level 15
    3, // level 16
    3, // level 17
    2, // level 18
    2, // level 19
    1, // level 20
  ],
  gfx: {
    instancedMeshReserve: 5000,
    url: {
      font3d:
        "https://cdn.jsdelivr.net/npm/three@0.178.0/examples/fonts/helvetiker_bold.typeface.json",
      tetriminoGlb: "/glb/basicBlock2.glb",
    },
    font3d: {
      size: 1,
      depth: 0.5,
    },
    color: {
      mesh: {
        Hint: "white",
        Garbage: "#4A4F5A",
        I: "#00FFFF",
        O: "#FFFF00",
        T: "#800080",
        J: "#0000FF",
        L: "#FFA500",
        S: "#00FF00",
        Z: "#FF0000",
        Case: "black",
        Cover: "#1a1a1a",
        EndCover: "#1a1a1a",
        Grid: "gray",
        GarbageQueue: "#F08080",
        GarbageReady: "#8B0000",
        Hold: "black",
        Next: "black",
      },
    },
    placeIdMap: {
      1: "I",
      2: "O",
      3: "T",
      4: "J",
      5: "L",
      6: "S",
      7: "Z",
      8: "Garbage",
    },
    blockLocation: {
      I: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ],
      O: [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      T: [
        [0, 0],
        [1, 0],
        [2, 0],
        [1, 1],
      ],
      J: [
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 0],
      ],
      L: [
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      S: [
        [0, 0],
        [1, 1],
        [1, 0],
        [2, 1],
      ],
      Z: [
        [2, 0],
        [1, 1],
        [1, 0],
        [0, 1],
      ],
    },
    boardCoord: {
      nickNameText: [
        {
          position: [5, -27, 0],
          scale: [2, 2, 2],
        },
      ],
      infoText: [
        {
          position: [-4, -18, 0],
          scale: [1, 1, 1],
        },
      ],
      Case: [
        // 아래
        {
          position: [4.5, -26 + 0.4, 0],
          scale: [10 + 0.4, 0.2, 1],
        },
        // 왼쪽
        {
          position: [10 - 0.4, -15.5, 0],
          scale: [0.2, 20, 1],
        },
        // 오른쪽
        {
          position: [-1 + 0.4, -15.5, 0],
          scale: [0.2, 20, 1],
        },
      ],
      Grid: [
        ...Array(9)
          .fill(null)
          .map((_, idx) => {
            return {
              position: [0.5 + idx, -15.5, -0.5],
              scale: [0.05, 20, 0.05],
            };
          }),
        ...Array(19)
          .fill(null)
          .map((_, idx) => {
            return {
              position: [4.5, -6.5 + -idx, -0.5],
              scale: [10, 0.05, 0.05],
            };
          }),
      ],
      Cover: [
        {
          position: [4.5, -15.5, -0.51],
          scale: [10, 20, 0.01],
        },
      ],
      EndCover: [
        {
          position: [4.5, -15.5, 0.71],
          scale: [10, 20, 0.01],
        },
      ],
      Next: [
        {
          position: [12, -5, 0],
          scale: [1, 1, 1],
        },
      ],
      Hold: [
        {
          position: [-6, -5, 0],
          scale: [1, 1, 1],
        },
      ],
    },
  },
};
