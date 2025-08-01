import { useFrame, useLoader, useThree } from "@react-three/fiber"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import * as THREE from 'three';
import {Text} from 'troika-three-text'
import { JsBoard } from "tetris-lib";
import type { Board, Tetrimino } from "tetris-lib/bindings";
import {format} from 'date-fns'

export type Transform = {
  position: [number, number, number],
  rotation: [number, number, number],
  scale: [number, number, number],
}

 export type BoardCreateInfo = {
  nickName: string,
}

export type BoardInfo = {
  nickName: string
}

export type InfoData = {
  level?: number,
  score?: number,
  time?: number,
  line?: number
}
export type OptTetrisController = {
  tetrisGameList: ()=>Partial<Record<string, TetrisGame>>,
  tetrisInfo: (boardId: string) => TetrisGame | undefined,
  boardCreate: (boardId: string, boardTransform: Transform, boardCreateInfo: BoardCreateInfo) => void,
  boardCreateBySlot: (boardId: string, boardCreateInfo: BoardCreateInfo) => void,
  boardDelete: (boardId: string) => void,
  boardReset: (boardId: string) => void,
  nextAdd: (boardId: string, block: Tetrimino) => void,
  spawnFromNext: (boardId: string, block: Tetrimino) => void,
  spawnFromHold: (boardId: string, block: Tetrimino, hold: Tetrimino) => void,
  step: (boardId: string) => void,
  moveRight: (boardId: string) => void,
  moveLeft: (boardId: string) => void,
  rotateRight: (boardId: string) => void,
  rotateLeft: (boardId: string) => void,
  hardDrop: (boardId: string) => void,
  placing: (boardId: string) => void,
  lineClear:(boardId: string) => void,
  holdFalling:(boardId: string, hold: Tetrimino | null) => void,
  removeFalling:(boardId: string) => void,
  scoreEffect: (boardId: string, kind: string)=>void,
  infoTextUpdate: (boardId: string, data: InfoData) => void,
  addEndCover: (boardId: string, text: string) => void
  removeEndCover: (boardId: string) => void
  timerOn: (boardId: string) => void,
  timerOff: (boardId: string) => void,
  timerReset: (boardId: string) => void,
  garbageQueueSet: (boardId: string, garbageQueue: GarbageQueue[]) => void,
  garbageAdd: (boardId: string, emptyx: number[]) => void,
  gameSync: (data: Record<string, GameSyncData>) => void
};
export type GameSyncData = {
  board: Board,
  garbageQueue: GarbageQueue[],
  hold: Tetrimino | null,
  level: number,
  next: Tetrimino[],
  score: number,
  line: number
}
export type GarbageQueue = {
  kind: "Queued" | "Ready",
  line: number
}
export type InstanceType = {
  id: string,
  transform: Transform
}
export type Block = "Cover" |"CoverLine"| "Case" | "E" | "H" | "GarbageQueue" | "GarbageReady" | "Garbage" |Tetrimino;
export const blockColorMapping = (block: Block) => {
  if (block === "Case") {
    return "black"
  } else if (block === "Cover") {
    return "#1a1a1a"
  } else if (block === "CoverLine") {
    return "white"
  } else if (block === "I") {
    return "#00FFFF"
  } else if (block === "O") {
    return "#FFFF00"
  } else if (block === "T") {
    return "#800080"
  } else if (block === "J") {
    return "#0000FF"
  } else if (block === "L") {
    return "#FFA500"
  } else if (block === "S") {
    return "#00FF00"
  } else if (block === "Z") {
    return "#FF0000"
  } else if (block === "H") {
    return "white"
  } else if (block === "GarbageQueue") {
    return "#F08080"
  } else if (block === "GarbageReady") {
    return "#8B0000"
  } else if (block === "Garbage") {
    return "gray"
  } else {
    return ""
  }
}

type TetrisGame = {
  board: JsBoard,
  boardTransform: Transform,
  createInfo: BoardCreateInfo,
  texts: Record<string, Text>,
  infoTextData: InfoData,
  isTimerOn: boolean,
  lastUpdatedTime: number,
  next: Tetrimino[],
  hold: Tetrimino | null
}
import {FontLoader} from 'three/addons/loaders/FontLoader.js'
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js'
import { useGLTF } from "@react-three/drei";
export const OptTetris = forwardRef<OptTetrisController>((_, ref) => {
  const typefaceUrl ='https://cdn.jsdelivr.net/npm/three@0.178.0/examples/fonts/helvetiker_bold.typeface.json';
  const font = useLoader(FontLoader, typefaceUrl);

  const instanced3dTextMeshes = useRef<Record<string, THREE.InstancedMesh>>({
    Next: new THREE.InstancedMesh(undefined, undefined, 200),
    Hold: new THREE.InstancedMesh(undefined, undefined, 200),
  });
  const instanced3dText =  useRef<Record<string, InstanceType[]>>({
    Next: [], Hold: []
  });
  const { nodes } = useGLTF('/glb/basicBlock2.glb');
  const blockBasicGeometry = (nodes.Cube as THREE.Mesh).geometry;
  // blockBasicGeometry.scale(0.5, 0.5, 0.5);
  // blockBasicGeometry.scale(0.5, 0.5, 0.5)
  const RESERVE = 5000;
  const geometry = new THREE.BoxGeometry();
  const lineGeometry = new THREE.PlaneGeometry();
  
  const instancedBlocksMeshes = useRef<Record<Block, THREE.InstancedMesh>>({
    Cover: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("Cover"), transparent: true, opacity: 0.7, }), RESERVE),
    CoverLine: new THREE.InstancedMesh(lineGeometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("CoverLine")}), RESERVE),
    Case: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("Case") }), RESERVE),
    E: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("E") }), RESERVE),
    GarbageQueue:new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("GarbageQueue") }), RESERVE),
    GarbageReady:new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("GarbageReady") }), RESERVE),
    Garbage:new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("Garbage") }), RESERVE),
    I: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("I") }), RESERVE),
    O: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("O") }), RESERVE),
    T: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("T") }), RESERVE),
    J: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("J") }), RESERVE),
    L: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("L") }), RESERVE),
    S: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("S") }), RESERVE),
    Z: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("Z") }), RESERVE),
    H: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("H"), transparent: true, opacity: 0.5,  }), RESERVE),
  });
  instancedBlocksMeshes.current.H.renderOrder = 999;
  const instancedBlocks = useRef<Record<Block, InstanceType[]>>({
    Cover: [], CoverLine:[], Case: [], E: [],
    GarbageQueue: [],GarbageReady:[],Garbage:[],
    I: [], O: [], T: [], J: [], L: [], S: [], Z: [], H: []
  });
  const tetrisGames = useRef<Partial<Record<string, TetrisGame>>>({});
  const { scene } = useThree()


  // const lastUpdateRef = useRef(0);

  useFrame((_state, delta)=>{
    // info text update
    // console.log(clock.getDelta())
    // console.log(delta)

    for (const [boardId, tetris] of Object.entries(tetrisGames.current)) {
      if (tetris) {
        if (tetris.isTimerOn) {
          if (tetris.infoTextData.time !== undefined) {
            tetris.infoTextData.time += delta;

            const sinceLastUpdate = tetris.infoTextData.time - tetris.lastUpdatedTime;
            if (sinceLastUpdate >= 0.05) {
              tetris.lastUpdatedTime = tetris.infoTextData.time;
              infoTextDiffUpdate(boardId);
            }
          }
        }
      }
    }
  })
  const infoTextMake = ({
      level,
      score,
      time,
      line,
    }: {
        level?: number;
        score?: number;
        time?: number;
        line?: number;
      }) => {
      const parts: string[] = [];

      if (level !== undefined) parts.push(`level:\n${level}`);
      if (line !== undefined) parts.push(`line:\n${line}`);
      if (score !== undefined) parts.push(`score:\n${score}`);
      if (time !== undefined) {
        parts.push(`time:\n${format(new Date(time * 1000), 'mm:ss:SS')}`);
    }

    return parts.join('\n');
  };

  const infoTextDiffUpdate = (boardId: string) => {
    const tetris = tetrisGames.current[boardId]
    if (tetris) {
      const beforeText = tetris.texts.infoText.text;
      const nowText = infoTextMake({
        level: tetris.infoTextData.level,
        score: tetris.infoTextData.score,
        time: tetris.infoTextData.time,
        line: tetris.infoTextData.line,
      })
      if (beforeText !== nowText) {
        tetris.texts.infoText.text = nowText
      }
    }
  }

  const generateBoardTransformSlot = (cnt: number): {transform: Transform, boardId: string | null}[] => {
    const boardWidth = 26;
    const boardSpacing = 0; // 여유 간격
    const effectiveWidth = boardWidth + boardSpacing;
    const boardsPerRing = (r: number) => Math.floor((2 * Math.PI * r) / effectiveWidth);
    const getBoardPosition = (index: number) => {
      // let ring = 0;
      let radius = 60;
      let boardIndex = index;
      // let offset = 0;

      // 몇 번째 링(ring)에 들어가야 하는지 계산
      while (true) {
        const capacity = boardsPerRing(radius);
        if (boardIndex < capacity) break;
        boardIndex -= capacity;
        radius += 60;
        // ring += 1;
        // offset += capacity;
      }
      const angleStep = (2 * Math.PI) / boardsPerRing(radius);
      const angle = boardIndex * angleStep;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const rotation = -angle - Math.PI / 2 ;
      return { x, y, rotation };
    };
    return Array(cnt).fill(null).map((_,idx)=>{
      const pos = getBoardPosition(idx);
      return {
        transform: {
          position: [pos.x, 0, pos.y],
          rotation: [0, pos.rotation, 0,],
          scale: [1, 1, 1,]
        },
        boardId: null
      }
    })
  }
  const boardTrasnfromSlot = useRef(generateBoardTransformSlot(100))

  const generateBoardTransformSlot2 = (cnt: number): {transform: Transform, boardId: string | null}[] => {
    const cols = 9; // 가로 개수
    const rows = 11; // 세로 개수
    const boardWidth = 26;
    const boardSpacing = 0;
    const boardStride = boardWidth + boardSpacing;
    const defulatXSpacing = 60;

    const getBoardPosition = (index: number) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const x = defulatXSpacing + col * boardStride;
      const y = row * boardStride;

      return { x, y, rotation: 0 };
    };

    return Array(cnt).fill(null).map((_, idx) => {
      const pos = getBoardPosition(idx);

      return {
        transform: {
          position: [pos.x, -pos.y, 0],
          rotation: [0, pos.rotation, 0],
          scale: [1, 1, 1]
        },
        boardId: null
      };
    });
  };
  
  useEffect(() => {
    const keys: Block[] = ["Cover", "CoverLine", "Case", "I", "O", "T", "J", "L", "S", "Z", "H", "Garbage", "GarbageQueue", "GarbageReady"];
    const localRef = instancedBlocksMeshes.current; 
    for (const key of keys) {
      localRef[key].count = 0;
      localRef[key].frustumCulled = false;
      scene.add(localRef[key]);
    }
    const localRefTetrisGames = tetrisGames.current;
    return () => {
      console.log('del effect opt ')
      for (const key of keys) {
        const mesh = localRef[key]; 
        if (!mesh) continue;
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }

      for (const [k] of Object.entries(localRefTetrisGames)) {
        optTetrisController.boardDelete(k);
      }
    };
  }, [scene]);


  useEffect(() => {
    const nextInstanced = instanced3dTextMeshes.current.Next;
    const nextGeometry = new TextGeometry('Next', {
      font: font,
      size: 1,
      depth: 0.5,
    })
    nextInstanced.geometry = nextGeometry;
    nextInstanced.material = new THREE.MeshBasicMaterial({color: 'black'});
    nextInstanced.count = 0;
    nextInstanced.frustumCulled = false;
    scene.add(nextInstanced);


    const holdInstanced = instanced3dTextMeshes.current.Hold;
    const holdGeometry = new TextGeometry('Hold', {
      font: font,
      size: 1,
      depth: 0.5,
    })
    holdInstanced.geometry = holdGeometry;
    holdInstanced.material = new THREE.MeshBasicMaterial({color: 'black'});
    holdInstanced.count = 0;
    holdInstanced.frustumCulled = false;
    scene.add(holdInstanced);
    return () => {
      scene.remove(nextInstanced);
      nextInstanced.geometry.dispose();
      if (Array.isArray(nextInstanced.material)) {
        nextInstanced.material.forEach((m) => m.dispose());
      } else {
        nextInstanced.material.dispose();
      }


      scene.remove(holdInstanced);
      holdInstanced.geometry.dispose();
      if (Array.isArray(holdInstanced.material)) {
        holdInstanced.material.forEach((m) => m.dispose());
      } else {
        holdInstanced.material.dispose();
      }
    }
  }, [font, scene])

  const placedIdMap = (placedId: number) => {
    if (placedId === 1) return "I"
    else if (placedId === 2) return "O"
    else if (placedId === 3) return "T"
    else if (placedId === 4) return "J"
    else if (placedId === 5) return "L"
    else if (placedId === 6) return "S"
    else if (placedId === 7) return "Z" 
    else return "Garbage"
  }

  const textMat = new THREE.MeshBasicMaterial({color: 'black', side: THREE.DoubleSide});
  const addText = (txt: string, transform: Transform) => {
    const text = new Text()
    text.text = `${txt}`
    // text.font = typefaceUrl
    text.fontSize = 1
    text.position.set(transform.position[0], transform.position[1] , transform.position[2])
    text.rotation.set(...transform.rotation);
    text.scale.set(...transform.scale);
    
    text.anchorX = 'center'
    text.anchorY = 'middle'
    text.material = textMat
    

    // text.sync(()=>{
    //   console.log('[board]synced', txt)
    //   scene.add(text)
    // })

    scene.add(text)
    text.sync()

    return text;
  }

  const removeText = (text: Text) => {
    // const text = texts.current[`${id}`];
    scene.remove(text);
    text.geometry.dispose();
    if (Array.isArray(text.material)) {
      text.material.forEach(m=>m.dispose());
    } else {
      text.material.dispose();
    }
  }

  const updateInstanced3dMeshes = () => {
    const dummy = new THREE.Object3D();
    for (const [idx, val] of instanced3dText.current.Next.entries() ) {
      dummy.position.set(...val.transform.position);
      dummy.rotation.set(...val.transform.rotation);
      dummy.scale.set(...val.transform.scale);
      dummy.updateMatrix();
      instanced3dTextMeshes.current.Next.setMatrixAt(idx, dummy.matrix);
    }
    instanced3dTextMeshes.current.Next.count = instanced3dText.current.Next.length;
    instanced3dTextMeshes.current.Next.instanceMatrix.needsUpdate = true;


    for (const [idx, val] of instanced3dText.current.Hold.entries() ) {
      dummy.position.set(...val.transform.position);
      dummy.rotation.set(...val.transform.rotation);
      dummy.scale.set(...val.transform.scale);
      dummy.updateMatrix();
      instanced3dTextMeshes.current.Hold.setMatrixAt(idx, dummy.matrix);
    }
    instanced3dTextMeshes.current.Hold.count = instanced3dText.current.Hold.length;
    instanced3dTextMeshes.current.Hold.instanceMatrix.needsUpdate = true;
  }

  const updateInstancedMeshes = () => {
    const dummy = new THREE.Object3D();
    for (const [a, block] of Object.entries(instancedBlocks.current) ) {
        const key = a as Block;
       for (let idx = 0; idx < block.length; idx ++) {
          dummy.position.set(...block[idx].transform.position);
          dummy.rotation.set(...block[idx].transform.rotation);
          dummy.scale.set(...block[idx].transform.scale);
          dummy.updateMatrix();
          instancedBlocksMeshes.current[key].setMatrixAt(idx, dummy.matrix);
        }
        instancedBlocksMeshes.current[key].count = block.length;
        instancedBlocksMeshes.current[key].instanceMatrix.needsUpdate = true;
    }
  }

  const updateBoardInstancedMeshse = (boardId: string) => {
    const tetris = tetrisGames.current[boardId];
    if (!tetris) {
      console.log('tetris undefined');
      return;
    }

    const board = tetris.board;
    const blocks = instancedBlocks.current;
    const boardTransform = tetris.boardTransform;

    for (const [k, block] of Object.entries(blocks)) {
      if (k === "Case" || k === "Cover" || k === "CoverLine"
        || k === "GarbageQueue" ||k === "GarbageReady" 
      ) continue;
      const newArr = block.filter(item => item.id !== `${boardId}_Block`);
      blocks[k as Block] = newArr
    }

    const group = new THREE.Group();
    group.position.set(...boardTransform.position);
    group.rotation.set(...boardTransform.rotation);
    group.scale.set(...boardTransform.scale);

    const dummy = new THREE.Object3D();
    group.add(dummy)

    const finalPos = new THREE.Vector3();
    const finalQuat = new THREE.Quaternion();
    const finalEuler = new THREE.Euler();
    const finalScale = new THREE.Vector3();

    showFallingHint(boardId)

    for (const [lineIdx, line] of (board.getBoard() as Board).entries() ) {
      for (const [tileIdx, tile] of line.entries()) {
        if (tile === "Empty") {
          //
        } else if ("Falling" in tile) {
          dummy.position.set(tileIdx, -lineIdx, 0);
          dummy.getWorldPosition(finalPos);
          dummy.getWorldQuaternion(finalQuat);
          finalEuler.setFromQuaternion(finalQuat);
          dummy.getWorldScale(finalScale);

          const kind = tile["Falling"].kind;
          blocks[kind].push({
            id: `${boardId}_Block`,
            transform: {
              position: [finalPos.x, finalPos.y, finalPos.z],
              rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
              scale: [finalScale.x, finalScale.y, finalScale.z]
            }
          })
        } else if ("Placed" in tile) {
          dummy.position.set(tileIdx, -lineIdx, 0);
          dummy.getWorldPosition(finalPos);
          dummy.getWorldQuaternion(finalQuat);
          finalEuler.setFromQuaternion(finalQuat);
          dummy.getWorldScale(finalScale);

          const tetr = placedIdMap(tile.Placed as number);
          blocks[tetr].push({
            id: `${boardId}_Block`,
              transform: {
                position: [finalPos.x, finalPos.y, finalPos.z],
                rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
                scale: [finalScale.x, finalScale.y, finalScale.z]
              }
          })
        } else if ("Hint" in tile) {
          dummy.position.set(tileIdx, -lineIdx, 0);
          dummy.getWorldPosition(finalPos);
          dummy.getWorldQuaternion(finalQuat);
          finalEuler.setFromQuaternion(finalQuat);
          dummy.getWorldScale(finalScale);

          blocks.H.push({
            id: `${boardId}_Block`,
            transform: {
              position: [finalPos.x, finalPos.y, finalPos.z],
              rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
              scale: [finalScale.x, finalScale.y, finalScale.z]
            }
          })
        } else {
          //
        }
      }
    }

    const BlockLocation = {
      I: [[0,0], [1,0], [2,0],[3,0]],
      O: [[0,0], [1,0], [1,1],[0,1]],
      T: [[0,0], [1,0], [2,0],[1,1]],
      J: [[0,1], [1,1], [2,1],[2,0]],
      L: [[0,0], [0,1], [1,1],[2,1]],
      S: [[0,0], [1,1], [1,0],[2,1]],
      Z: [[2,0], [1,1], [1,0],[0,1]],
    }

    for (const [idx, next] of tetris.next.entries()) {
      for (const [dx, dy] of BlockLocation[next]) {
        dummy.position.set(12 + dx, -7 + (-idx * 3) + dy, 0);
        dummy.getWorldPosition(finalPos);
        dummy.getWorldQuaternion(finalQuat);
        finalEuler.setFromQuaternion(finalQuat);
        dummy.getWorldScale(finalScale);
        blocks[next].push({
          id: `${boardId}_Block`,
          transform: {
            position: [finalPos.x , finalPos.y , finalPos.z],
            rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            scale: [finalScale.x, finalScale.y, finalScale.z]
          }
        });
      }
    }
    
    if (tetris.hold) {
      for (const [dx, dy] of BlockLocation[tetris.hold]) {
        dummy.position.set(-6  + dx, -7 + dy, 0);
        dummy.getWorldPosition(finalPos);
        dummy.getWorldQuaternion(finalQuat);
        finalEuler.setFromQuaternion(finalQuat);
        dummy.getWorldScale(finalScale);
        blocks[tetris.hold].push({
          id: `${boardId}_Block`,
          transform: {
            position: [finalPos.x, finalPos.y, finalPos.z],
            rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            scale: [finalScale.x, finalScale.y, finalScale.z]
          }
        });
      }
    }

    updateInstancedMeshes();
  }


  const showFallingHint = (boardId: string) => {
    const tetris = tetrisGames.current[boardId];
    if (!tetris) {
      console.log('tetris undefined');
      return;
    }
    tetris.board.removeFallingHint();
    tetris.board.showFallingHint();
  }

  const optTetrisController: OptTetrisController = {
    tetrisGameList() {
        return tetrisGames.current
    },
    tetrisInfo(boardId) {
      return tetrisGames.current[boardId]
    },
    boardReset(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      tetris.board = new JsBoard(10, 26);
      tetris.hold = null;
      tetris.next = [];
      tetris.isTimerOn = false;
      tetris.infoTextData = {
        level: 1,
        score: 0,
        time: 0,
        line: 0,
      };
      updateBoardInstancedMeshse(boardId);

      const txt = "level:\n1\nscore:\n0";
      tetris.texts.infoText.text = txt;

      this.removeEndCover(boardId)

      this.timerReset(boardId)
      this.timerOn(boardId);
    },
    boardCreateBySlot(boardId, boardCreateInfo) {
      let myTransform;
      for (const slot of boardTrasnfromSlot.current) {
        if (slot.boardId === null) {
          myTransform = slot.transform;
          slot.boardId = boardId;
          break;
        }
      }
      if (myTransform) {
        this.boardCreate(boardId, myTransform, boardCreateInfo);
      }
    },
    boardCreate: (boardId, boardTransform, createInfo) => {
      console.log('[boardCreate]')
      tetrisGames.current[boardId] = {
        board: new JsBoard(10, 26),
        boardTransform,
        createInfo,
        isTimerOn: false,
        infoTextData: {
          level: 1,
          score: 0,
          time: 0,
          line: 0,
        },
        lastUpdatedTime: 0,
        texts: {},
        hold: null,
        next: []
      }
      const tetris = tetrisGames.current[boardId];
      const blocks = instancedBlocks.current;

      const group = new THREE.Group();
      group.position.set(...tetris.boardTransform.position);
      group.rotation.set(...tetris.boardTransform.rotation);
      group.scale.set(...tetris.boardTransform.scale);

      const dummy = new THREE.Object3D();
      group.add(dummy)

      const finalPos = new THREE.Vector3();
      const finalQuat = new THREE.Quaternion();
      const finalEuler = new THREE.Euler();
      const finalScale = new THREE.Vector3();

      dummy.position.set(5, -28, 0);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      finalEuler.setFromQuaternion(finalQuat);
      dummy.getWorldScale(finalScale);
      const nickNameText = addText(tetris.createInfo.nickName, {
        position: [finalPos.x, finalPos.y, finalPos.z],
        rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
        scale: [finalScale.x * 2, finalScale.y * 2, finalScale.z * 2],
      });

      dummy.position.set(-4, -18, 0);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      finalEuler.setFromQuaternion(finalQuat);
      const txt = "level:\n1\nscore:\n0\ntime:\n00:00:00";
      const infoText = addText(txt, {
        position: [finalPos.x, finalPos.y, finalPos.z],
        rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
        scale: [finalScale.x , finalScale.y, finalScale.z],
      });


  //     let startTime = null;
  // let running = true;
  //     function formatTime(ms) {
  //   const totalSeconds = Math.floor(ms / 1000);
  //   const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  //   const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  //   const hundredths = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  //   return `${minutes}:${seconds}:${hundredths}`;
  // }

  // function updateTimer(timestamp) {
  //   if (!startTime) startTime = timestamp;
  //   const elapsed = timestamp - startTime;
  //   // timerDisplay.textContent = formatTime(elapsed);
  //   const txt = "level:\n1\nscore:\n0\ntime:\n";
  //   infoText.text = txt + formatTime(elapsed)
  //   if (running) requestAnimationFrame(updateTimer);
  // }

  // requestAnimationFrame(updateTimer);

      //  // info bg
      // dummy.position.set(-4 , -15, -0.1);
      // dummy.scale.set(5, 11, 0.01);
      // dummy.getWorldPosition(finalPos);
      // dummy.getWorldQuaternion(finalQuat);
      // dummy.getWorldScale(finalScale)
      // finalEuler.setFromQuaternion(finalQuat);
      // blocks.Cover.push({
      //   id: `${boardId}_Block`,
      //   transform: {
      //     position: [finalPos.x, finalPos.y, finalPos.z],
      //     rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
      //     scale: [finalScale.x, finalScale.y, finalScale.z]
      //   }
      // });
      
      tetris.texts = {
        ...tetris.texts,
        "nickName": nickNameText,
        "infoText": infoText,
      }

      dummy.position.set(-1 + 0.4, -15.5, 0);
      dummy.scale.set(0.2, 20, 1);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      dummy.getWorldScale(finalScale)
      finalEuler.setFromQuaternion(finalQuat);
      blocks.Case.push({
        id: `${boardId}_Block`,
        transform: {
          position: [finalPos.x, finalPos.y, finalPos.z],
          rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
          scale: [finalScale.x, finalScale.y, finalScale.z]
        }
      });

      dummy.position.set(10 - 0.4, -15.5, 0);
      dummy.scale.set(0.2, 20, 1);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      dummy.getWorldScale(finalScale)
      finalEuler.setFromQuaternion(finalQuat);
      blocks.Case.push({
        id: `${boardId}_Block`,
        transform: {
          position: [finalPos.x, finalPos.y, finalPos.z],
          rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
          scale: [finalScale.x, finalScale.y, finalScale.z]
        }
      });

      dummy.position.set(4.5, -26 + 0.4, 0);
      dummy.scale.set(10 +0.4, 0.2, 1);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      dummy.getWorldScale(finalScale)
      finalEuler.setFromQuaternion(finalQuat);
      blocks.Case.push({
        id: `${boardId}_Block`,
        transform: {
          position: [finalPos.x, finalPos.y, finalPos.z],
          rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
          scale: [finalScale.x, finalScale.y, finalScale.z]
        }
      });

      for (const [idx] of Array(19).fill(null).entries()) {
        dummy.position.set(4.5, -6.5 + -idx, -0.5);
        dummy.scale.set(10, 0.05, 0.05);
        dummy.getWorldPosition(finalPos);
        dummy.getWorldQuaternion(finalQuat);
        dummy.getWorldScale(finalScale)
        finalEuler.setFromQuaternion(finalQuat);
        blocks.CoverLine.push({
          id: `${boardId}_Block`,
          transform: {
            position: [finalPos.x, finalPos.y, finalPos.z],
            rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            scale: [finalScale.x, finalScale.y, finalScale.z]
          }
        });
      }

      for (const [idx] of Array(9).fill(null).entries()) {
        dummy.position.set(0.5 + idx, -15.5, -0.5);
        dummy.scale.set(0.05, 20, 0.05);
        dummy.getWorldPosition(finalPos);
        dummy.getWorldQuaternion(finalQuat);
        dummy.getWorldScale(finalScale)
        finalEuler.setFromQuaternion(finalQuat);
        blocks.CoverLine.push({
          id: `${boardId}_Block`,
          transform: {
            position: [finalPos.x, finalPos.y, finalPos.z],
            rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            scale: [finalScale.x, finalScale.y, finalScale.z]
          }
        });
      }

      dummy.position.set(4.5 , -15.5, -0.51);
      dummy.scale.set(10, 20, 0.01);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      dummy.getWorldScale(finalScale)
      finalEuler.setFromQuaternion(finalQuat);
      blocks.Cover.push({
        id: `${boardId}_Block`,
        transform: {
          position: [finalPos.x, finalPos.y, finalPos.z],
          rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
          scale: [finalScale.x, finalScale.y, finalScale.z]
        }
      });
      

      updateInstancedMeshes();


      dummy.position.set(12, -5, 0);
      dummy.scale.set(1, 1, 1);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      dummy.getWorldScale(finalScale)
      finalEuler.setFromQuaternion(finalQuat);
      instanced3dText.current.Next.push({
        id: `${boardId}_Next`,
        transform: {
          position: [finalPos.x, finalPos.y, finalPos.z],
          rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
          scale: [finalScale.x, finalScale.y, finalScale.z]
        }
      })


      dummy.position.set(-6, -5, 0);
      dummy.scale.set(1, 1, 1);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      dummy.getWorldScale(finalScale)
      finalEuler.setFromQuaternion(finalQuat);
      instanced3dText.current.Hold.push({
        id: `${boardId}_Hold`,
        transform: {
          position: [finalPos.x, finalPos.y, finalPos.z],
          rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
          scale: [finalScale.x, finalScale.y, finalScale.z]
        }
      })

      updateInstanced3dMeshes();
    },

    boardDelete: (boardId: string) => {
      console.log('[boardDelete]')
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

      for (const [s, v] of Object.entries(tetris.texts)) {
        console.log('[boardDelete] removeText', s)
        removeText(v);
      }
      
      const blocks = instancedBlocks.current;

      for (const [k, block] of Object.entries(blocks)) {
        const newArr = block.filter(item => item.id !== `${boardId}_Block`);
        blocks[k as Block] = newArr
      }
      const newArr = blocks.Cover.filter(item => item.id !== `${boardId}_Block_EndCover`);
      blocks.Cover = newArr;

      delete tetrisGames.current[boardId]

      updateInstancedMeshes()


      instanced3dText.current.Next = instanced3dText.current.Next.filter(item => item.id != `${boardId}_Next`);
      instanced3dText.current.Hold = instanced3dText.current.Hold.filter(item => item.id != `${boardId}_Hold`);
      updateInstanced3dMeshes();

      boardTrasnfromSlot.current.forEach(item=>{
        if (item.boardId === boardId) {
          item.boardId = null
        }
      })
    },
    spawnFromHold(boardId, block, hold) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
    
      const plan = tetris.board.trySpawnFalling(block);
      tetris.board.applySpawnFalling(plan);
      
      tetris.hold = hold;

      updateBoardInstancedMeshse(boardId)
    },
    spawnFromNext(boardId, block) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

      const plan = tetris.board.trySpawnFalling(block);
      tetris.board.applySpawnFalling(plan);

      tetris.next.shift();

      updateBoardInstancedMeshse(boardId)
    },
    nextAdd(boardId, block) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      tetris.next.push(block)
    },
    step: (boardId) => {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

      try {
        const plan = tetris.board.tryStep();
        tetris.board.applyStep(plan)
      } catch (e) {
        if (e instanceof Error) {
          console.error(e.message); // OK
        } else {
          console.error('Unknown error', e);
        }
        // const isStepError = (err: unknown): err is StepError => {
        //   return (
        //     err === "OutOfBounds" ||
        //     err === "InvalidShape" ||
        //     (typeof err === "object" && err != null && 'Blocked' in err)
        //   )
        // }

        // if (isStepError(e)) {
        //   if (e === "OutOfBounds") {
        //     fallingPlacing();
        //   } else if (e === "InvalidShape") {
        //     console.error(e)
        //   } else if ("Blocked" in e) {
        //     fallingPlacing();
        //   }
        // }
      }

      updateBoardInstancedMeshse(boardId)
    },
    moveRight(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

      const plan = tetris.board.tryMoveFalling("Right");
      tetris.board.applyMoveFalling(plan)

      updateBoardInstancedMeshse(boardId)
    },
    moveLeft(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

      const plan = tetris.board.tryMoveFalling("Left");
      tetris.board.applyMoveFalling(plan)

      updateBoardInstancedMeshse(boardId)
    },
    rotateRight(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

      const plan = tetris.board.tryRotateFalling("Right");
      tetris.board.applyRotateFalling(plan)

      updateBoardInstancedMeshse(boardId)
    },
    rotateLeft(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

      const plan = tetris.board.tryRotateFalling("Left");
      tetris.board.applyRotateFalling(plan)

      updateBoardInstancedMeshse(boardId)
    },
    hardDrop(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

     try {
        tetris.board.hardDrop();
      } catch (e) {
        console.log(e)
      }

      updateBoardInstancedMeshse(boardId)
    },
    lineClear(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

      const clear = tetris.board.tryLineClear();
      tetris.board.applyLineClear(clear)

      updateBoardInstancedMeshse(boardId)
    },
    holdFalling(boardId, tetr) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      tetris.hold = tetr
      updateBoardInstancedMeshse(boardId)
    },
    placing(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      tetris.board.placeFalling();
      updateBoardInstancedMeshse(boardId)
    },
    removeFalling(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      tetris.board.removeFallingBlocks();
      updateBoardInstancedMeshse(boardId);
    },
    scoreEffect(boardId, kind) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      const group = new THREE.Group();
      group.position.set(...tetris.boardTransform.position);
      group.rotation.set(...tetris.boardTransform.rotation);
      group.scale.set(...tetris.boardTransform.scale);

      const dummy = new THREE.Object3D();
      group.add(dummy)

      const finalPos = new THREE.Vector3();
      const finalQuat = new THREE.Quaternion();
      const finalEuler = new THREE.Euler();
      const finalScale = new THREE.Vector3();


      dummy.position.set(-4, -10, 0);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      finalEuler.setFromQuaternion(finalQuat);
      dummy.getWorldScale(finalScale);
      const txt = `${kind}`;
      const scoreEffectText = addText(txt, {
        position: [finalPos.x, finalPos.y, finalPos.z],
        rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
        scale: [finalScale.x,finalScale.y,finalScale.z],
      });

      setTimeout(()=>{
        removeText(scoreEffectText)
      }, 1500)
    },
    infoTextUpdate(boardId, data) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      if (data.level) {
        tetris.infoTextData.level = data.level;
      }
      if (data.score) {
        tetris.infoTextData.score = data.score;
      }
      if (data.time) {
        tetris.infoTextData.time = data.time;
      }
      if (data.line) {
        tetris.infoTextData.line = data.line;
      }
      infoTextDiffUpdate(boardId);
    },
    addEndCover(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

      const blocks = instancedBlocks.current;

      const group = new THREE.Group();
      group.position.set(...tetris.boardTransform.position);
      group.rotation.set(...tetris.boardTransform.rotation);
      group.scale.set(...tetris.boardTransform.scale);

      const dummy = new THREE.Object3D();
      group.add(dummy)

      const finalPos = new THREE.Vector3();
      const finalQuat = new THREE.Quaternion();
      const finalEuler = new THREE.Euler();
      const finalScale = new THREE.Vector3();

      dummy.position.set(4.5 , -15.5, 0.71);
      dummy.scale.set(10, 20, 0.01);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      dummy.getWorldScale(finalScale)
      finalEuler.setFromQuaternion(finalQuat);
      blocks.Cover.push({
        id: `${boardId}_Block_EndCover`,
        transform: {
          position: [finalPos.x, finalPos.y, finalPos.z],
          rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
          scale: [finalScale.x, finalScale.y, finalScale.z]
        }
      });

      updateInstancedMeshes();
    },
    removeEndCover(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

      const blocks = instancedBlocks.current;
      const newArr = blocks.Cover.filter(item => item.id !== `${boardId}_Block_EndCover`)
      blocks.Cover = newArr;

      updateInstancedMeshes();
    },

    timerOn(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      tetris.isTimerOn = true;
    },
    timerOff(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      tetris.isTimerOn = false;
    },
    timerReset(boardId) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      tetris.lastUpdatedTime = 0;
      tetris.infoTextData.time = 0;

      tetris.isTimerOn = false;

      infoTextDiffUpdate(boardId)
    },
    garbageQueueSet(boardId, garbageQueue) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      
      const blocks = instancedBlocks.current;

      blocks.GarbageQueue = blocks.GarbageQueue.filter(item => item.id !== `${boardId}_Block`);
      blocks.GarbageReady = blocks.GarbageReady.filter(item => item.id !== `${boardId}_Block`);

      const group = new THREE.Group();
      group.position.set(...tetris.boardTransform.position);
      group.rotation.set(...tetris.boardTransform.rotation);
      group.scale.set(...tetris.boardTransform.scale);

      const dummy = new THREE.Object3D();
      group.add(dummy)

      const finalPos = new THREE.Vector3();
      const finalQuat = new THREE.Quaternion();
      const finalEuler = new THREE.Euler();
      const finalScale = new THREE.Vector3();

      const yBase = -26;
      let y = 0;
      for (const gq of garbageQueue) {
        
        for (let i = 0; i < gq.line; i++) {
          y += 1;
          dummy.position.set(-1.0, yBase + y, 0);
          dummy.scale.set(0.5, 1, 1);

          dummy.getWorldPosition(finalPos);
          dummy.getWorldQuaternion(finalQuat);
          finalEuler.setFromQuaternion(finalQuat);
          dummy.getWorldScale(finalScale);
          if (gq.kind === "Queued") {
            blocks.GarbageQueue.push({
              id: `${boardId}_Block`,
              transform: {
                position: [finalPos.x, finalPos.y, finalPos.z],
                rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
                scale: [finalScale.x, finalScale.y, finalScale.z]
              }
            });
          } else if (gq.kind === "Ready") {
            blocks.GarbageReady.push({
              id: `${boardId}_Block`,
              transform: {
                position: [finalPos.x, finalPos.y, finalPos.z],
                rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
                scale: [finalScale.x, finalScale.y, finalScale.z]
              }
            });
          }
        }
        
        
      }
      
      updateInstancedMeshes()
    },
    garbageAdd(boardId, emptyx) {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }
      for (const x of emptyx) {
        tetris.board.pushGarbageLine(x);
      }
      updateBoardInstancedMeshse(boardId)
    },

    gameSync(data) {
        for(const [boardId, syncData] of Object.entries(data)) {
          const tetris = tetrisGames.current[boardId];
          if (!tetris) {
            console.log('[gameSync] tetris undefined');
            return;
          }
          // boardSet
          for (const [lineIdx, line] of syncData.board.entries()) {
            for (const [tileIdx, tile] of line.entries()) {
              tetris.board.setLocation(tileIdx, lineIdx, tile)
            }
          }
          // gq set
          this.garbageQueueSet(boardId, syncData.garbageQueue)

          // hold set
          this.holdFalling(boardId, syncData.hold)
          
          // next set
          // syncData.next
          tetris.next = [];
          for (const next of syncData.next) {
            this.nextAdd(boardId, next)
          }

          // level set
          // score set
          this.infoTextUpdate(boardId, {
            level: syncData.level,
            score: syncData.score
          })

          // TODO: game over cover

          updateBoardInstancedMeshse(boardId)
        }
    },
  };

  useImperativeHandle(ref, ()=>optTetrisController);

  return null
})
