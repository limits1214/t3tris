/** @jsxImportSource @emotion/react */

import { forwardRef, Suspense, useEffect,  useImperativeHandle,  useMemo,  useRef, useState } from 'react'
import {JsBoard} from 'tetris-lib'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Instance, Instances,  OrbitControls,  Text,  } from '@react-three/drei'
import { css } from '@emotion/react'
import {Perf} from 'r3f-perf'
import * as THREE from 'three'
import { Multiline } from '../../component/r3f/Multiline'
import { Flex } from '@radix-ui/themes'
import { CuboidCollider, InstancedRigidBodies, Physics, RapierRigidBody, type InstancedRigidBodyProps } from '@react-three/rapier'
const TestR3fPage = () => {
  
  return (
    <div css={css`height: 100vh;`}>
      <h1 css={css`position: absolute`}>TestR3fPage</h1>
      <Canvas camera={{position: [0, 0, 50]}}>
        <Perf/>
        <OrbitControls />

        <Suspense>
          <Physics >
            <MyTetrisBoard/>
            <CuboidCollider position={[5, -23, 0]} args={[120, 0.5, 120]} />
          </Physics>
        </Suspense>

        <directionalLight position={[-3 ,2, 10]} intensity={2} />
        <directionalLight position={[3 ,2, 10]} intensity={2} />
        <directionalLight position={[3 ,6, 10]} intensity={2} />
        <directionalLight position={[3 ,-6, 10]} intensity={2} />
      </Canvas>
    </div>
  )
}

export default TestR3fPage

type TimeController = {
  start: () => void;
  stop: () => void;
  reset: () => void;
};
const TetrisBoardCase = forwardRef(({isOver}:{isOver: boolean | null}, ref)=>{
  /* const [startTime, setStartTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false); */

  const startTime = useRef<number | null>(null);
  const isRunning = useRef(false);
  useImperativeHandle(ref, ()=>({
    start: () => {
      startTime.current = performance.now() / 1000;
      isRunning.current = true;
      /* setStartTime(performance.now() / 1000); */
      /* setIsRunning(true) */
    },
    stop: () => {
      /* setIsRunning(false) */
      isRunning.current = false;
    },
    reset: () => {
      /* setIsRunning(false)
      setStartTime(null) */
      isRunning.current = false;
      startTime.current = null;
      console.log('rest!!!')
      if(textRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ThreeText = textRef.current as any;
        ThreeText.text  = ''
      }
    }
  }));
  const textRef = useRef<THREE.Mesh>(null);
  useFrame(()=>{
    
    if (!isRunning.current || startTime.current == null || !textRef.current) return;

    const now = performance.now() / 1000;
    const elapsed = now - startTime.current;
   
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ThreeText = textRef.current as any;
     ThreeText.text  = elapsed.toFixed(2)
  })

  const [lines, setLines] = useState<[number, number, number][][]>();
  useEffect(() => {
    const x: [number, number, number][][] = Array.from({length: 9}, (_, i)=>[[i + 1, 0, -0.49], [i + 1, -20, -0.49]]);
    const y: [number, number, number][][] = Array.from({length: 19}, (_, i)=>[[0, i  - 19, -0.49], [10, i - 19, -0.49]]);
    const lines: [number, number, number][][] = [...x, ...y];
    setLines(lines)
  }, [])

  const rigidBodies = useRef<RapierRigidBody[]>(null);
  const instances = useMemo(() => {
    const instances: InstancedRigidBodyProps[] = [];

    /* for (let i = 0; i < COUNT; i++) {
      instances.push({
        key: "instance_" + Math.random(),
        position: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
        rotation: [Math.random(), Math.random(), Math.random()]
      });
    } */

      instances.push({
        key: "instance_" + Math.random(),
        position: [0 - 0.5, -9 - 0.5, 0],
        scale: [1, 21, 1]
      })
      instances.push({
        key: "instance_" + Math.random(),
        position: [11 - 0.5, -9 - 0.5, 0],
        scale: [1, 21, 1]
      })
      instances.push({
        key: "instance_" + Math.random(),
        position: [5,-20.5,0],
        scale: [12, 1, 1]
      })

    return instances;
  }, []);
  return <>
    <Text position={[-4, -1, 0]} color="black" scale={1}>Hold</Text>
    <Text position={[-6, -15, 0]} color="black" scale={1}>Time</Text>

    <Text ref={textRef} position={[-6, -16, 0]} color="black">00.00</Text>
    <Text position={[14, -1, 0]} color="black" scale={1}>Next</Text>
    

    {lines && <Multiline lines={lines} />}

{/*
    <Plane position={[5, -10, -0.5]} args={[10, 20]} >
      <meshBasicMaterial color={"gray"} />
    </Plane>
*/}

{/*
    <Text position={[5, 5, 0]} color={"black"}>isGameOver: {JSON.stringify(isGameOver)}</Text>
*/}

    {/* Case */}
    {isOver ? (
      <InstancedRigidBodies
        ref={rigidBodies}
        instances={instances}
        colliders="cuboid"
        gravityScale={1}
      >
        <instancedMesh args={[undefined, undefined, 3]} count={3} >
          <boxGeometry />
          <meshBasicMaterial color={"black"}/>
        </instancedMesh>
      </InstancedRigidBodies>
    ) : (
      <Instances>
        <boxGeometry/>
        <meshBasicMaterial color={"black"}/>
        <Instance position={[0 - 0.5, -9 - 0.5, 0]} scale={[1, 21, 1]} />
        <Instance position={[11 - 0.5, -9 - 0.5, 0]} scale={[1, 21, 1]} />
        <Instance position={[5,-20.5,0]} scale={[12, 1, 1]} />
      </Instances>
    )}
    

{/*
    
*/}
  </>
})

const MyTetrisBoard = () => {
  /* const board: BoardMsg = {
    board: [
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ],
    hold: null,
    next: [1,2,3,4,5],
    isCanHold: true,
    isGameOver: false,
  }; */

  const {wasmInitEnd, mockServerAction, board, createServerBoard, isGameOver} = useTetrisMockServer();
  
  useMockKeyboardActionSender(mockServerAction);

  const convertBoard = (board: number[][]  , next: number[]   , hold: number | null) => {
    const I: [number, number][] = [];
    const O: [number, number][] = [];
    const T: [number, number][] = [];
    const J: [number, number][] = [];
    const L: [number, number][] = [];
    const S: [number, number][] = [];
    const Z: [number, number][] = [];
    const H: [number, number][] = [];

    if (hold) {
      const refx = -5;
      const refy =  + 5;
      if (hold === tetriminoClientMap["I"]) {
        I.push([refx, refy]);
        I.push([refx+1, refy]);
        I.push([refx+2, refy]);
        I.push([refx+3, refy]);
      } else if (hold === tetriminoClientMap["O"]) {
        O.push([refx, refy]);
        O.push([refx+1, refy]);
        O.push([refx+1, refy + 1]);
        O.push([refx, refy + 1]);
      } else if (hold === tetriminoClientMap["T"]) {
        T.push([refx, refy]);
        T.push([refx+1, refy]);
        T.push([refx+2, refy]);
        T.push([refx+1, refy+1]);
      } else if (hold === tetriminoClientMap["J"]) {
        J.push([refx, refy ]);
        J.push([refx, refy + 1]);
        J.push([refx+1, refy + 1]);
        J.push([refx+2, refy + 1]);
      } else if (hold === tetriminoClientMap["L"]) {
        L.push([refx, refy + 1]);
        L.push([refx + 1, refy + 1]);
        L.push([refx + 2, refy + 1]);
        L.push([refx + 2, refy]);
      } else if (hold === tetriminoClientMap["S"]) {
        S.push([refx+2, refy]);
        S.push([refx+1, refy+1]);
        S.push([refx+1, refy]);
        S.push([refx, refy+1]);
      } else if (hold === tetriminoClientMap["Z"]) {
        Z.push([refx, refy]);
        Z.push([refx+1, refy+1]);
        Z.push([refx+1, refy]);
        Z.push([refx+2, refy+1]);
      }
    }

    for (const [idx, n] of next.entries() ) {
      const refx = 12;
      const refy = idx*3 + 5;
      
      if (n === tetriminoClientMap["I"]) {
        I.push([refx, refy]);
        I.push([refx+1, refy]);
        I.push([refx+2, refy]);
        I.push([refx+3, refy]);
      } else if (n === tetriminoClientMap["O"]) {
        O.push([refx, refy]);
        O.push([refx+1, refy]);
        O.push([refx+1, refy + 1]);
        O.push([refx, refy + 1]);
      } else if (n === tetriminoClientMap["T"]) {
        T.push([refx, refy]);
        T.push([refx+1, refy]);
        T.push([refx+2, refy]);
        T.push([refx+1, refy+1]);
      } else if (n === tetriminoClientMap["J"]) {
        J.push([refx, refy ]);
        J.push([refx, refy + 1]);
        J.push([refx+1, refy + 1]);
        J.push([refx+2, refy + 1]);
      } else if (n === tetriminoClientMap["L"]) {
        L.push([refx, refy + 1]);
        L.push([refx + 1, refy + 1]);
        L.push([refx + 2, refy + 1]);
        L.push([refx + 2, refy]);
      } else if (n === tetriminoClientMap["S"]) {
        S.push([refx+2, refy]);
        S.push([refx+1, refy+1]);
        S.push([refx+1, refy]);
        S.push([refx, refy+1]);
      } else if (n === tetriminoClientMap["Z"]) {
        Z.push([refx, refy]);
        Z.push([refx+1, refy+1]);
        Z.push([refx+1, refy]);
        Z.push([refx+2, refy+1]);
      }
    }

    for (const [lineIdx, line] of board.entries()) {
      for (const [tileIdx, tile] of line.entries()) {
        if (tile === tetriminoClientMap["E"]) {
          //
        } else if (tile === tetriminoClientMap["I"]) {
          I.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["O"]) {
          O.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["T"]) {
          T.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["J"]) {
          J.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["L"]) {
          L.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["S"]) {
          S.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["Z"]) {
          Z.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["H"]) {
          H.push([tileIdx, lineIdx]);
        }
      }
    }
    return {I, O, T, J, L, S, Z, H}
  }
const timerRef = useRef<TimeController>(null);
  useEffect(() => {
    if (isGameOver) {
      timerRef.current?.stop()
    } else {
      console.log('timer reset start')
      timerRef.current?.reset();
      timerRef.current?.start();
    }
  }, [isGameOver])

  return <>
    <TetrisBoardCase ref={timerRef} isOver={isGameOver} />
    {board &&
      <InstancedTetriminos tetriminos={convertBoard(board.board, board.next ,board.hold)} isOver={isGameOver} />
    }
    <Html transform position={[5,-25,0]} scale={[3,3,3]}>
      {wasmInitEnd && <>
        <Flex justify="center" css={css`margin-bottom: 30px;`}>
          <button onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.blur()
            createServerBoard()
            timerRef.current?.reset();
            timerRef.current?.start();
          }}>start</button>
        </Flex>
      </>}

      {!isGameOver && <>
        <Flex direction="row" >
          <Flex direction="column" >
            <Flex justify="center">
              <button css={css``} onClick={()=>mockServerAction("HardDrop")}>{'HardDrop'}</button>
              <button css={css``} onClick={()=>mockServerAction("SoftDrop")}>{'SoftDrop'}</button>
              <button css={css``} onClick={()=>mockServerAction("RotateRight")}>{'Rotate'}</button>
              <button css={css``} onClick={()=>mockServerAction("Hold")}>{'Hold'}</button>
            </Flex>
            <Flex justify="center">
              <button css={css``} onClick={()=>mockServerAction("MoveLeft")}>{'Left'}</button>
              <button css={css``} onClick={()=>mockServerAction("MoveRight")}>{'Right'}</button>
            </Flex>
          </Flex>
        </Flex>
      </>}
    </Html>
  </>;
}

type InstancedTetriminosParam = {
  tetriminos: {
    I: [number, number][]
    O: [number, number][]
    T: [number, number][]
    S: [number, number][]
    Z: [number, number][]
    J: [number, number][]
    L: [number, number][]
    H: [number, number][]
  } | null,
  isOver: boolean | null
};
const InstancedTetriminos = ({tetriminos, isOver}: InstancedTetriminosParam, ) => {

  const rigidBodies = useRef<RapierRigidBody[]>(null);

  const objs = useMemo(() => {
    if (!tetriminos) return;
   
    

    /* for (let i = 0; i < COUNT; i++) {
      instances.push({
        key: "instance_" + Math.random(),
        position: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
        rotation: [Math.random(), Math.random(), Math.random()]
      });
    } */
     
    const entries = Object.entries(tetriminos);
    const obj: Record<string, {color: string, instances: InstancedRigidBodyProps[]}> = {};
    for (const [tet, pos] of entries) {
      

      let color;
      if (tet === "I") {
        color = "#00FFFF"
      } else if (tet === "O") {
        color = "#FFFF00"
      } else if (tet === "T") {
        color = "#800080"
      } else if (tet === "S") {
        color = "#00FF00"
      } else if (tet === "Z") {
        color = "#FF0000"
      } else if (tet === "J") {
        color = "#0000FF"
      } else if (tet === "L") {
        color = "#FFA500"
      } else if (tet === "H") {
        color = "gray"
      } else {
        color = ""
      }

      if (!obj[tet]) obj[tet] = {color, instances: []};
      /* const instances: InstancedRigidBodyProps[] = []; */
        /* const poses = pos.map((pos)=>(
          [pos[0] + 0.5, -pos[1] + 2.5, 0]
        )) */

      pos.forEach((pos)=>{
         obj[tet].instances.push({
          key: "instance_tet_" + Math.random(),
          position: [pos[0] + 0.5, -pos[1] + 2.5, 0]
        });
      })
      
    }
    



    return obj;
  }, [tetriminos]);
useEffect(() => {
  if (rigidBodies.current) {
    rigidBodies.current.forEach((body) => {
      body.applyImpulse({ x: 0, y: 110, z: 0 }, true);
    });
  }
}, [objs]);
  if (isOver) {
return <>
    {objs && Object.entries(objs).map(([tet, pos]) => {
      return <InstancedRigidBodies
                key={tet}
                instances={pos.instances}
                colliders="cuboid"
                gravityScale={4}
              >
                <instancedMesh args={[undefined, undefined, pos.instances.length]}  >
                  <boxGeometry />
                  <meshBasicMaterial color={pos.color} />
                </instancedMesh>
              </InstancedRigidBodies>
    })}
  </>
  } else {
return <>
    {tetriminos && Object.entries(tetriminos).map(([tet, pos]) => {
      let color;
      if (tet === "I") {
        color = "#00FFFF"
      } else if (tet === "O") {
        color = "#FFFF00"
      } else if (tet === "T") {
        color = "#800080"
      } else if (tet === "S") {
        color = "#00FF00"
      } else if (tet === "Z") {
        color = "#FF0000"
      } else if (tet === "J") {
        color = "#0000FF"
      } else if (tet === "L") {
        color = "#FFA500"
      } else if (tet === "H") {
        color = "gray"
      }
      return <Instances>
        <boxGeometry/>
        <meshBasicMaterial color={color}/>
        {pos.map((pos)=>(
          <Instance position={[pos[0] + 0.5, -pos[1] + 2.5, 0]} />
        ))}
      </Instances>
    })}
  </>
  }
  
  
}

type tetr =  "I" | "O" | "T" | "J" | "L" | "S" | "Z";
const tetriminoClientMap = { E: 0, I: 1, O: 2, T: 3, J: 4, L: 5, S: 6, Z: 7, H: 8 }
type BoardMsg = {board: number[][], next: number[], hold: number | null, isCanHold: boolean} | null
const useTetrisMockServer = () => {
  const [wasmInitEnd, setWasmInitEnd] = useState(false);
  const [board, setBoard] = useState<BoardMsg>(null);

  const jsBoard = useRef<JsBoard | null>(null);
  const next = useRef<tetr[] | null>(null);
  const hold = useRef<tetr | null>(null);
  const isCanHold = useRef<boolean | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean | null>(null);

  const tetriminos = ["I", "O", "T", "J", "L", "S", "Z"] ;

  const randPickTetrimino = () => {
    return tetriminos[Math.floor(Math.random() * tetriminos.length)] as  "I" | "O" | "T" | "J" | "L" | "S" | "Z";
  }

  useEffect(() => {
    (async ()=>{
      /* await init(); */
      setWasmInitEnd(true);
    })()
  }, [])

  useEffect(() => {
    let i: number;
    if (!isGameOver) {
      i = setInterval(() => {
        stepping();
      }, 500)
    }
    return () => {
      if (!isGameOver) {
        clearInterval(i)
      }
    }
  }, [isGameOver])

  const spawnNext = () => {
    if (jsBoard.current == null) return; 
    if (next.current == null) return;

    next.current.push(randPickTetrimino())
    const newTetr = next.current.shift();
    
    try {
      const block = jsBoard.current.trySpawnFalling(newTetr);
      jsBoard.current.applySpawnFalling(block);
    } catch (e) {
      console.error('spawn error: ',e);
    }
  }

  const createServerBoard = () => {
    jsBoard.current = new JsBoard(10, 23);
    next.current = [];
    for (let i = 0; i < 5; i++) {
      next.current?.push(randPickTetrimino());
    }
    isCanHold.current = true;
    setIsGameOver(false)
    hold.current = null;

    spawnNext();

    convertServerBoardToClientBoard();
  }


  const stepping = () => {
    if (jsBoard.current == null) return; 
    try {
      const step = jsBoard.current.tryStep();
      jsBoard.current.applyStep(step)
      convertServerBoardToClientBoard();
    } catch (e) {
     const err = e as "OutOfBounds" | object;
      if (err === "OutOfBounds") {
        fallingPlacing();
      } else if ("Blocked" in err) {
        fallingPlacing();
      } else {
        console.error(e)
      }
    }
  }

  const fallingPlacing = () => {
    if (jsBoard.current == null) return;
    jsBoard.current.placeFalling();

    if (jsBoard.current.hasPlacedAbove(3)) {
      setIsGameOver(true)
      convertServerBoardToClientBoard();
      return;
    }

    const clear = jsBoard.current.tryLineClear();
    jsBoard.current.applyLineClear(clear)

    spawnNext();
    isCanHold.current = true;
    convertServerBoardToClientBoard();
  }

  const hint = () => {
    jsBoard.current?.removeFallingHint();
    jsBoard.current?.showFallingHint();
  }

  const holding = () => {
    if (!jsBoard.current) return;
    if (!isCanHold.current) return;
    isCanHold.current = false;
    if (hold.current) {
      const savedHold = hold.current;
      const fallings = jsBoard.current.getFallingBlocks();
      hold.current = fallings[0].falling.kind;
      for (const a of fallings) {
        jsBoard.current.setLocation(a.location.x, a.location.y, "Empty")
      }
      const spawn = jsBoard.current.trySpawnFalling(savedHold);
      jsBoard.current.applySpawnFalling(spawn);

      convertServerBoardToClientBoard();
    } else {
      const fallings = jsBoard.current.getFallingBlocks();
      if (fallings.length) {
        hold.current = fallings[0].falling.kind;
        for (const a of fallings) {
          jsBoard.current.setLocation(a.location.x, a.location.y, "Empty")
        }
        
        spawnNext();
      }
      convertServerBoardToClientBoard();
    }
  }

  const convertServerBoardToClientBoard = () => {
    // E I O T J L S Z H
    // next
    // hint
    if (jsBoard.current == null) {return;}
    if (next.current == null) {return;}
    if (isCanHold.current == null) {return;}

    hint();

    const board = jsBoard.current.getBoard();
    const convertedBoard = board.map(line=>line.map(tile=>{
        if (tile === "Empty") {
          return tetriminoClientMap["E"];
        } else if ("Falling" in tile) {
          if (tile.Falling.kind === "I") {
            return tetriminoClientMap["I"];
          } else if (tile.Falling.kind === "O") {
            return tetriminoClientMap["O"];
          } else if (tile.Falling.kind === "T") {
            return tetriminoClientMap["T"];
          } else if (tile.Falling.kind === "J") {
            return tetriminoClientMap["J"];
          } else if (tile.Falling.kind === "L") {
            return tetriminoClientMap["L"];
          } else if (tile.Falling.kind === "S") {
            return tetriminoClientMap["S"];
          } else   {
            //(tile.Falling.kind === "Z")
            return tetriminoClientMap["Z"];
          }
        } else if ("Placed" in tile) {
          if (tile.Placed === 0) {
            return tetriminoClientMap["I"];
          } else if (tile.Placed === 1) {
            return tetriminoClientMap["O"];
          } else if (tile.Placed === 2) {
            return tetriminoClientMap["T"];
          } else if (tile.Placed === 3) {
            return tetriminoClientMap["J"];
          } else if (tile.Placed === 4) {
            return tetriminoClientMap["L"];
          } else if (tile.Placed === 5) {
            return tetriminoClientMap["S"];
          } else  {
            //(tile.Placed === 6)
            return tetriminoClientMap["Z"];
          }
        } else if ("Hint" in tile) {
        return tetriminoClientMap["H"];
        } else {
          return 9
        }
      }))

      setBoard({
        hold: hold.current ? tetriminoClientMap[hold.current ] : null,
        next: next.current ? next.current.map((s)=>tetriminoClientMap[s]) : [] ,
        isCanHold: isCanHold.current,
        board: convertedBoard
      })
  }

  const mockServerAction = (action: string) => {
    if(!jsBoard.current) return;
    if(isGameOver) return;
    console.log(action)
    if (action === "MoveLeft") {
      const plan = jsBoard.current.tryMoveFalling("Left");
      jsBoard.current.applyMoveFalling(plan)
      convertServerBoardToClientBoard();
    } else if (action === "MoveRight") {
      const plan = jsBoard.current.tryMoveFalling("Right");
      jsBoard.current.applyMoveFalling(plan)
      convertServerBoardToClientBoard();
    } else if (action === "RotateRight") {
      const plan = jsBoard.current.tryRotateFalling("Right");
      jsBoard.current.applyRotateFalling(plan)
      convertServerBoardToClientBoard();
    } else if (action === "RotateLeft") {
      const plan = jsBoard.current.tryRotateFalling("Left");
      jsBoard.current.applyRotateFalling(plan)
      convertServerBoardToClientBoard();
    } else if (action === "HardDrop") {
      try {
        jsBoard.current.hardDrop();
      } catch (e) {
        console.log(e)
      }
      stepping();
    } else if (action === "SoftDrop") {
      stepping();
    } else if (action === "Hold") {
      holding();
    } else if (action === "Restart") {
      //
    }
  }

  return {
    wasmInitEnd,
    board,
    isGameOver,
    mockServerAction,
    createServerBoard
  }
}

const useMockKeyboardActionSender = (mockServerAction: (action: string)=>void) => {
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'a':
        case 'ArrowLeft':
          mockServerAction("MoveLeft")
          break;
        case 'd':
        case 'ArrowRight':
          mockServerAction("MoveRight")
          break;
        case 'w':
        case 'ArrowUp':
          mockServerAction("RotateRight")
          break;
        case 's':
        case 'ArrowDown':
          mockServerAction("SoftDrop")
          break;
        case 'Shift':
          mockServerAction("Hold")
          break;
        case ' ':
          mockServerAction("HardDrop")
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
    }
  }, [mockServerAction])
  
  return null;
}












