import { useThree } from "@react-three/fiber"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import * as THREE from 'three';
import {Text} from 'troika-three-text'
import { JsBoard } from "tetris-lib";
import type { Tetrimino } from "tetris-lib/bindings";

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

export type OptTetrisController = {
  tetrisGameList: ()=>Partial<Record<string, TetrisGame>>,
  tetrisInfo: (boardId: string) => TetrisGame | undefined,
  boardCreate: (boardId: string, boardTransform: Transform, boardCreateInfo: BoardCreateInfo) => void,
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
  holdFalling:(boardId: string, hold: Tetrimino ) => void,
  removeFalling:(boardId: string) => void,
};
export type InstanceType = {
  id: string,
  transform: Transform
}
export type Block = "C" | "E" | "H" | Tetrimino;
export const blockColorMapping = (block: Block) => {
  if (block === "C") {
    return "black"
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
    return "gray"
  } else {
    return ""
  }
}
type TetrisGame = {
  board: JsBoard,
  boardTransform: Transform,
  createInfo: BoardCreateInfo,
  texts: Record<string, Text>
  next: Tetrimino[],
  hold: Tetrimino | null
}

export const OptTetris = forwardRef<OptTetrisController>((_, ref) => {
  const RESERVE = 1000;
  const geometry = new THREE.BoxGeometry();
  const instancedBlocksMeshes = useRef<Record<Block, THREE.InstancedMesh>>({
    C: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("C") }), RESERVE),
    E: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("E") }), RESERVE),
    I: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("I") }), RESERVE),
    O: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("O") }), RESERVE),
    T: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("T") }), RESERVE),
    J: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("J") }), RESERVE),
    L: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("L") }), RESERVE),
    S: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("S") }), RESERVE),
    Z: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("Z") }), RESERVE),
    H: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("H") }), RESERVE),
  });
  const instancedBlocks = useRef<Record<Block, InstanceType[]>>({
    C: [], E: [], I: [], O: [], T: [], J: [], L: [], S: [], Z: [], H: []
  });
  const tetrisGames = useRef<Partial<Record<string, TetrisGame>>>({});
  const { scene } = useThree()
  
  useEffect(() => {
    const keys: Block[] = ["C", "I", "O", "T", "J", "L", "S", "Z", "H"];
    const localRef = instancedBlocksMeshes.current; 
    for (const key of keys) {
      localRef[key].count = 0;
      localRef[key].frustumCulled = false;
      scene.add(localRef[key]);
    }
    return () => {
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
    };
  }, [scene]);

  const placedIdMap = (placedId: number) => {
    if (placedId === 0) return "I"
    else if (placedId === 1) return "O"
    else if (placedId === 2) return "T"
    else if (placedId === 3) return "J"
    else if (placedId === 4) return "L"
    else if (placedId === 5) return "S"
    else return "Z" // 6
  }

  const addText = (txt: string, transform: Transform) => {
    const text = new Text()
    text.text = `${txt}`
    text.fontSize = 1
    text.position.set(transform.position[0], transform.position[1] , transform.position[2])
    text.rotation.set(...transform.rotation);
    text.scale.set(...transform.scale);
    text.color = new THREE.Color('black')
    text.anchorX = 'center'
    text.anchorY = 'middle'

    text.sync(()=>{
      scene.add(text)
    })
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
      if (k === "C") continue;
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

    for (const [lineIdx, line] of board.getBoard().entries() ) {
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
      S: [[2,0], [1,1], [1,0],[0,1]],
      Z: [[0,0], [1,1], [1,0],[2,1]],
    }

    for (const [idx, next] of tetris.next.entries()) {
      dummy.position.set(12, -4 + (-idx * 3), 0);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      finalEuler.setFromQuaternion(finalQuat);
      dummy.getWorldScale(finalScale);

      for (const [dx, dy] of BlockLocation[next]) {
        blocks[next].push({
          id: `${boardId}_Block`,
          transform: {
            position: [finalPos.x + dx, finalPos.y + dy, finalPos.z],
            rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            scale: [finalScale.x, finalScale.y, finalScale.z]
          }
        });
      }

      
    }

    if (tetris.hold) {
      console.log('meshses hold!!', tetris.hold)
      dummy.position.set(-6, -4, 0);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      finalEuler.setFromQuaternion(finalQuat);
      dummy.getWorldScale(finalScale);

      for (const [dx, dy] of BlockLocation[tetris.hold]) {
        blocks[tetris.hold].push({
          id: `${boardId}_Block`,
          transform: {
            position: [finalPos.x + dx, finalPos.y + dy, finalPos.z],
            rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            scale: [finalScale.x, finalScale.y, finalScale.z]
          }
        });
      }
    }

    updateInstancedMeshes();
  }

  useImperativeHandle(ref, ()=>({
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
      tetris.board = new JsBoard(10, 23);
      tetris.hold = null;
      tetris.next = [];
      updateBoardInstancedMeshse(boardId);
    },
    boardCreate: (boardId, boardTransform, createInfo) => {
      tetrisGames.current[boardId] = {
        board: new JsBoard(10, 23),
        boardTransform,
        createInfo,
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

      dummy.position.set(5, -26, 0);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      finalEuler.setFromQuaternion(finalQuat);
      const text = addText(tetris.createInfo.nickName, {
        position: [finalPos.x, finalPos.y, finalPos.z],
        rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
        scale: [1,1,1],
      });
      tetris.texts = {
        ...tetris.texts,
        "nickName": text
      }

      dummy.position.set(-1, -12.5, 0);
      dummy.scale.set(1, 20, 1);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      dummy.getWorldScale(finalScale)
      finalEuler.setFromQuaternion(finalQuat);
      blocks.C.push({
        id: `${boardId}_Block`,
        transform: {
          position: [finalPos.x, finalPos.y, finalPos.z],
          rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
          scale: [finalScale.x, finalScale.y, finalScale.z]
        }
      });

      dummy.position.set(10, -12.5, 0);
      dummy.scale.set(1, 20, 1);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      dummy.getWorldScale(finalScale)
      finalEuler.setFromQuaternion(finalQuat);
      blocks.C.push({
        id: `${boardId}_Block`,
        transform: {
          position: [finalPos.x, finalPos.y, finalPos.z],
          rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
          scale: [finalScale.x, finalScale.y, finalScale.z]
        }
      });

      dummy.position.set(4.5, -23, 0);
      dummy.scale.set(12, 1, 1);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      dummy.getWorldScale(finalScale)
      finalEuler.setFromQuaternion(finalQuat);
      blocks.C.push({
        id: `${boardId}_Block`,
        transform: {
          position: [finalPos.x, finalPos.y, finalPos.z],
          rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
          scale: [finalScale.x, finalScale.y, finalScale.z]
        }
      });
      

      updateInstancedMeshes();
    },

    boardDelete: (boardId) => {
      const tetris = tetrisGames.current[boardId];
      if (!tetris) {
        console.log('tetris undefined');
        return;
      }

      for (const [_, v] of Object.entries(tetris.texts)) {
        removeText(v);
      }
      
      const blocks = instancedBlocks.current;

      for (const [k, block] of Object.entries(blocks)) {
        const newArr = block.filter(item => item.id !== `${boardId}_Block`);
        blocks[k as Block] = newArr
      }

      delete tetrisGames.current[boardId]

      updateInstancedMeshes()
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
  }));

  return null
})
