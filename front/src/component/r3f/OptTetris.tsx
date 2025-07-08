import { useLoader, useThree } from "@react-three/fiber"
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
  holdFalling:(boardId: string, hold: Tetrimino ) => void,
  removeFalling:(boardId: string) => void,
};
export type InstanceType = {
  id: string,
  transform: Transform
}
export type Block = "Cover" |"CoverLine"| "Case" | "E" | "H" | Tetrimino;
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
  const { nodes } = useGLTF('/public/glb/basicBlock.glb');
  const blockBasicGeometry = nodes.Cube.geometry;
  // blockBasicGeometry.scale(0.5, 0.5, 0.5);
  // blockBasicGeometry.scale(0.5, 0.5, 0.5)
  const RESERVE = 5000;
  const geometry = new THREE.BoxGeometry();
  
  const instancedBlocksMeshes = useRef<Record<Block, THREE.InstancedMesh>>({
    Cover: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("Cover"), transparent: true, opacity: 0.7}), RESERVE),
    CoverLine: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("CoverLine")}), RESERVE),
    Case: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("Case") }), RESERVE),
    E: new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: blockColorMapping("E") }), RESERVE),
    I: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("I") }), RESERVE),
    O: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("O") }), RESERVE),
    T: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("T") }), RESERVE),
    J: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("J") }), RESERVE),
    L: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("L") }), RESERVE),
    S: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("S") }), RESERVE),
    Z: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("Z") }), RESERVE),
    H: new THREE.InstancedMesh(blockBasicGeometry, new THREE.MeshLambertMaterial({ color: blockColorMapping("H") }), RESERVE),
  });
  const instancedBlocks = useRef<Record<Block, InstanceType[]>>({
    Cover: [], CoverLine:[], Case: [], E: [], I: [], O: [], T: [], J: [], L: [], S: [], Z: [], H: []
  });
  const tetrisGames = useRef<Partial<Record<string, TetrisGame>>>({});
  const { scene } = useThree()
  const generateBoardTransformSlot = (cnt: number): {transform: Transform, boardId: string | null}[] => {
    const boardWidth = 26;
    const boardSpacing = 0; // 여유 간격
    const effectiveWidth = boardWidth + boardSpacing;
    const boardsPerRing = (r: number) => Math.floor((2 * Math.PI * r) / effectiveWidth);
    const getBoardPosition = (index: number) => {
      let ring = 0;
      let radius = 60;
      let boardIndex = index;
      let offset = 0;

      // 몇 번째 링(ring)에 들어가야 하는지 계산
      while (true) {
        const capacity = boardsPerRing(radius);
        if (boardIndex < capacity) break;
        boardIndex -= capacity;
        radius += 60;
        ring += 1;
        offset += capacity;
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
  
  useEffect(() => {
    const keys: Block[] = ["Cover", "CoverLine", "Case", "I", "O", "T", "J", "L", "S", "Z", "H"];
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

      for (const [k, v] of Object.entries(localRefTetrisGames)) {
        boardDelete(k)
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
    if (placedId === 0) return "I"
    else if (placedId === 1) return "O"
    else if (placedId === 2) return "T"
    else if (placedId === 3) return "J"
    else if (placedId === 4) return "L"
    else if (placedId === 5) return "S"
    else return "Z" // 6
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
      if (k === "Case" || k === "Cover" || k === "CoverLine") continue;
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
      for (const [dx, dy] of BlockLocation[next]) {
        dummy.position.set(12 + dx, -4 + (-idx * 3) + dy, 0);
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
        dummy.position.set(-6  + dx, -4 + dy, 0);
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

  const boardDelete = (boardId: string) => {
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


    instanced3dText.current.Next = instanced3dText.current.Next.filter(item => item.id != `${boardId}_Next`);
    instanced3dText.current.Hold = instanced3dText.current.Hold.filter(item => item.id != `${boardId}_Hold`);
    updateInstanced3dMeshes();

    boardTrasnfromSlot.current.forEach(item=>{
      if (item.boardId === boardId) {
        item.boardId = null
      }
    })
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

      dummy.position.set(5, -25, 0);
      dummy.getWorldPosition(finalPos);
      dummy.getWorldQuaternion(finalQuat);
      finalEuler.setFromQuaternion(finalQuat);
      const nickNameText = addText(tetris.createInfo.nickName, {
        position: [finalPos.x, finalPos.y, finalPos.z],
        rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
        scale: [2,2,2],
      });

      // dummy.position.set(-4, -15, 0);
      // dummy.getWorldPosition(finalPos);
      // dummy.getWorldQuaternion(finalQuat);
      // finalEuler.setFromQuaternion(finalQuat);
      // const txt = "elapsed:\n11:11:11\nscore:\n1\nclearline:\n3\nattacked:\n1";
      // const infoText = addText(txt, {
      //   position: [finalPos.x, finalPos.y, finalPos.z],
      //   rotation: [finalEuler.x, finalEuler.y, finalEuler.z],
      //   scale: [1,1,1],
      // });

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
        // "infoText": infoText,
      }

     

      dummy.position.set(-1 + 0.4, -12.5, 0);
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

      dummy.position.set(10 - 0.4, -12.5, 0);
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

      dummy.position.set(4.5, -23 + 0.4, 0);
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

      for (const [idx, _] of Array(19).fill(null).entries()) {
        dummy.position.set(4.5, -3.5 + -idx, -0.5);
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

      for (const [idx, _] of Array(9).fill(null).entries()) {
        dummy.position.set(0.5 + idx, -12.5, -0.5);
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

      dummy.position.set(4.5 , -12.5, -0.51);
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


      dummy.position.set(12, -2, 0);
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


      dummy.position.set(-6, -2, 0);
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

    boardDelete,
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
