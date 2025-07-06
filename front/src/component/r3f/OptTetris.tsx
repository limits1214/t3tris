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
  boardList: ()=>Record<string, BoardCreateInfo>,
  boardInfo: (boardId: string) => BoardInfo | null,
  boardCreate: (boardId: string, boardTransform: Transform, boardCreateInfo: BoardCreateInfo) => void,
  boardDelete: (boardId: string) => void,
  boardReset: (boardId: string) => void,
  nextAdd: (boardId: string, block: Tetrimino) => void,
  spawnFromNext: (boardId: string, block: Tetrimino) => void,
  spawnFromHold: (boardId: string, block: Tetrimino) => void,
  step: (boardId: string) => void,
  moveRight: (boardId: string) => void,
  moveLeft: (boardId: string) => void,
  rotateRight: (boardId: string) => void,
  rotateLeft: (boardId: string) => void,
  hardDrop: (boardId: string) => void,
  placing: (boardId: string) => void,
  lineClear:(boardId: string) => void,
  holdFalling:(boardId: string, hold: Tetrimino) => void,
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
    return "#00FF00"
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
  const texts = useRef<Record<string, Text>>({});
  const boardCreateInfo = useRef<Record<string, BoardCreateInfo>>({});
  const boards = useRef<Record<string, JsBoard>>({});
  const boardTransforms = useRef<Record<string, Transform>>({});
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

  const addText = (txt: string, transform: Transform, id: string) => {
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
      texts.current[`${id}`] = text;
    })
  }

  const removeText = ( id: string) => {
    const text = texts.current[`${id}`];
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
    const board = boards.current[boardId];
    const blocks = instancedBlocks.current;
    const boardTransform = boardTransforms.current;

    for (const [k, block] of Object.entries(blocks)) {
      if (k === "C") continue;
      const newArr = block.filter(item => item.id !== `${boardId}_Block`);
      blocks[k as Block] = newArr
    }

    const group = new THREE.Group();
    group.position.set(...boardTransform[boardId].position);
    group.rotation.set(...boardTransform[boardId].rotation);
    group.scale.set(...boardTransform[boardId].scale);

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

    updateInstancedMeshes();
  }

  useImperativeHandle(ref, ()=>({
    boardList() {
        return boardCreateInfo.current;
    },
    boardInfo(boardId) {
      const board = boards.current[boardId];
      const createInfo = boardCreateInfo.current[boardId];
      if (!board) {
        return null;
      }

      return {
        nickName: createInfo.nickName
      }
    },
    boardReset(boardId) {
      delete boards.current[boardId];
      boards.current[boardId] = new JsBoard(10, 23);
      updateBoardInstancedMeshse(boardId);
    },
    boardCreate: (id, transform, boardInfo) => {
      boardCreateInfo.current[id] = boardInfo;
      boardTransforms.current[id] = transform;
      const blocks = instancedBlocks.current;
      console.log('boardCreate',blocks.C.length, id)

      const group = new THREE.Group();
      group.position.set(...transform.position);
      group.rotation.set(...transform.rotation);
      group.scale.set(...transform.scale);

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
      addText(boardInfo.nickName, {
        position: [finalPos.x, finalPos.y, finalPos.z],
        rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
        scale: [1,1,1],
      }, `${id}_NickName`)

      dummy.position.set(-1, -12.5, 0);
      dummy.scale.set(1, 20, 1);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      dummy.getWorldScale(finalScale)
      finalEuler.setFromQuaternion(finalQuat);
      blocks.C.push({
        id: `${id}_Block`,
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
        id: `${id}_Block`,
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
        id: `${id}_Block`,
        transform: {
          position: [finalPos.x, finalPos.y, finalPos.z],
          rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
          scale: [finalScale.x, finalScale.y, finalScale.z]
        }
      });
      boards.current[id] = new JsBoard(10, 23);
      

      updateInstancedMeshes();
    },

    boardDelete: (id) => {
      const blocks = instancedBlocks.current;
      
      removeText(`${id}_NickName`);

      for (const [k, block] of Object.entries(blocks)) {
        const newArr = block.filter(item => item.id !== `${id}_Block`);
        blocks[k as Block] = newArr
      }

      delete boards.current[id];
      delete boardTransforms.current[id];
      delete boardCreateInfo.current[id];

      updateInstancedMeshes()
    },
    spawnFromHold(boardId, block) {
        const board = boards.current[boardId];

        const plan = board.trySpawnFalling(block);
        board.applySpawnFalling(plan);

        updateBoardInstancedMeshse(boardId)
    },
    spawnFromNext(boardId, block) {
        const board = boards.current[boardId];

        const plan = board.trySpawnFalling(block);
        board.applySpawnFalling(plan);

        updateBoardInstancedMeshse(boardId)
    },
    nextAdd(boardId, block) {
        console.log('todo next add')
    },
    // spawnNext: (boardId, tetr) => {
    //   const board = boards.current[boardId];

    //   const plan = board.trySpawnFalling(tetr);
    //   board.applySpawnFalling(plan);

    //   updateBoardInstancedMeshse(boardId)
    // },
    step: (boardId) => {
      const board = boards.current[boardId];

      try {
        const plan = board.tryStep();
        board.applyStep(plan)
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
      const board = boards.current[boardId];

      const plan = board.tryMoveFalling("Right");
      board.applyMoveFalling(plan)

      updateBoardInstancedMeshse(boardId)
    },
    moveLeft(boardId) {
      const board = boards.current[boardId];

      const plan = board.tryMoveFalling("Left");
      board.applyMoveFalling(plan)

      updateBoardInstancedMeshse(boardId)
    },
    rotateRight(boardId) {
      const board = boards.current[boardId];

      const plan = board.tryRotateFalling("Right");
      board.applyRotateFalling(plan)

      updateBoardInstancedMeshse(boardId)
    },
    rotateLeft(boardId) {
      const board = boards.current[boardId];

      const plan = board.tryRotateFalling("Left");
      board.applyRotateFalling(plan)

      updateBoardInstancedMeshse(boardId)
    },
    hardDrop(boardId) {
      const board = boards.current[boardId];

     try {
        board.hardDrop();
      } catch (e) {
        console.log(e)
      }

      updateBoardInstancedMeshse(boardId)
    },
    lineClear(boardId) {
      const board = boards.current[boardId];

      const clear = board.tryLineClear();
        board.applyLineClear(clear)

      updateBoardInstancedMeshse(boardId)
    },
    holdFalling(boardId, tetr) {
           console.log('todo hold falling')
    },
    placing(boardId) {
      const board = boards.current[boardId];
        board.placeFalling();
        updateBoardInstancedMeshse(boardId)
    },
    removeFalling(boardId) {
        const board = boards.current[boardId];
        board.removeFallingBlocks();
        updateBoardInstancedMeshse(boardId);

    },
  }));

  return null
})
