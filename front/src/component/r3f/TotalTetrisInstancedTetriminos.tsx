import { Instance, Instances } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import { useEffect, useRef } from "react";
import * as THREE from 'three';


export type TotalTetrisInstancedTetriminosParam = {
  tetriminos: {
    I: Location[]
    O: Location[]
    T: Location[]
    S: Location[]
    Z: Location[]
    J: Location[]
    L: Location[]
    H: Location[]
    Case: Location[]
  } | null,
};
export const TotalTetrisInstancedTetriminos = ({ tetriminos }: TotalTetrisInstancedTetriminosParam, ) => {
  // const meshRef = useRef<THREE.InstancedMesh>(null);
  // const dummy = new THREE.Object3D();



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
      } else if (tet === "Case") {
        color = "black"
      }
      return <Instances frustumCulled={false}>
        <boxGeometry/>
        <meshBasicMaterial color={color}/>
        {pos.map((pos)=>(
          <Instance
            position={[pos.blockPosition[0], -pos.blockPosition[1], pos.blockPosition[2]]}
            rotation={[pos.blockRotation[0], -pos.blockRotation[1], pos.blockRotation[2]]}
          />
        ))}
      </Instances>
    })}
  </>
}
const tetriminoClientMap = { E: 0, I: 1, O: 2, T: 3, J: 4, L: 5, S: 6, Z: 7, H: 8 }
type InstancedTetriminoConvert = {
  boardPosition: [number, number, number],
  boardRotatoin: [number, number, number],
  board: number[][],
  next: number[],
  hold: number | null,
}
type Location = {
  convertIdx: number,
  blockPosition: [number, number, number],
  blockRotation: [number, number, number],
};
export const convertTotalInstancedTetrimino = (convert: InstancedTetriminoConvert[]) => {
    const I: Location[] = [];
    const O: Location[] = [];
    const T: Location[] = [];
    const J: Location[] = [];
    const L: Location[] = [];
    const S: Location[] = [];
    const Z: Location[] = [];
    const H: Location[] = [];
    const Case: Location[] = [];

    const boardDummy = new THREE.Object3D();
    const caseDummy = new THREE.Object3D();
    const tileDummy = new THREE.Object3D();




const finalPos = new THREE.Vector3();
 const finalQuat = new THREE.Quaternion();
 const finalEuler = new THREE.Euler();
    for (const [cvtIdx, cvt] of convert.entries()) {
      boardDummy.position.set(cvt.boardPosition[0], cvt.boardPosition[1], cvt.boardPosition[2]);
      boardDummy.rotation.set(cvt.boardRotatoin[0], cvt.boardRotatoin[1], cvt.boardRotatoin[2]);
      
      const lineLength = cvt.board.length;
      const tileLength = cvt.board[0].length;
      for (let i = 0; i < lineLength; i ++) {
        
        caseDummy.position.set(-1, i, 0);
        boardDummy.add(caseDummy);

        caseDummy.getWorldPosition(finalPos);


        caseDummy.getWorldQuaternion(finalQuat);

        finalEuler.setFromQuaternion(finalQuat);

        Case.push({
          convertIdx: cvtIdx,
          blockPosition: [finalPos.x ,finalPos.y, finalPos.z],
          blockRotation: [finalEuler.x, finalEuler.y, finalEuler.z]
        });
      }

      for (let i = 0; i < lineLength; i ++) {
        
        caseDummy.position.set(tileLength, i, 0);
        boardDummy.add(caseDummy);

        caseDummy.getWorldPosition(finalPos);


        caseDummy.getWorldQuaternion(finalQuat);

        finalEuler.setFromQuaternion(finalQuat);

        Case.push({
          convertIdx: cvtIdx,
          blockPosition: [finalPos.x ,finalPos.y, finalPos.z],
          blockRotation: [finalEuler.x, finalEuler.y, finalEuler.z]
        });
      }

      for (let i = -1; i < tileLength + 1; i ++) {
        
        caseDummy.position.set(i, lineLength, 0);
        boardDummy.add(caseDummy);

        caseDummy.getWorldPosition(finalPos);


        caseDummy.getWorldQuaternion(finalQuat);

        finalEuler.setFromQuaternion(finalQuat);

        Case.push({
          convertIdx: cvtIdx,
          blockPosition: [finalPos.x ,finalPos.y, finalPos.z],
          blockRotation: [finalEuler.x, finalEuler.y, finalEuler.z]
        });
      }

      for (const [lineIdx, line] of cvt.board.entries()) {
        for (const [tileIdx, tile] of line.entries()) {
          
          tileDummy.position.set(tileIdx, lineIdx, 0);
          // tileDummy.rotation.set(cvt.boardRotatoin[0], cvt.boardRotatoin[1], cvt.boardRotatoin[2]);
          boardDummy.add(tileDummy);
          

          // 최종 world 위치를 가져옴
          
          tileDummy.getWorldPosition(finalPos);


         
          tileDummy.getWorldQuaternion(finalQuat);

          
          finalEuler.setFromQuaternion(finalQuat);
          if (tile === tetriminoClientMap["E"]) {
            //
          } else if (tile === tetriminoClientMap["I"]) {
            I.push({
              convertIdx: cvtIdx,
              blockPosition: [finalPos.x ,finalPos.y, finalPos.z],
              blockRotation: [finalEuler.x, finalEuler.y, finalEuler.z]
            });
          } else if (tile === tetriminoClientMap["O"]) {
            O.push({
              convertIdx: cvtIdx,
              blockPosition: [finalPos.x ,finalPos.y, finalPos.z],
              blockRotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            });
          } else if (tile === tetriminoClientMap["T"]) {
            T.push({
              convertIdx: cvtIdx,
              blockPosition: [finalPos.x ,finalPos.y, finalPos.z],
              blockRotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            });
          } else if (tile === tetriminoClientMap["J"]) {
            J.push({
              convertIdx: cvtIdx,
              blockPosition: [finalPos.x ,finalPos.y, finalPos.z],
              blockRotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            });
          } else if (tile === tetriminoClientMap["L"]) {
            L.push({
              convertIdx: cvtIdx,
              blockPosition: [finalPos.x ,finalPos.y, finalPos.z],
              blockRotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            });
          } else if (tile === tetriminoClientMap["S"]) {
            S.push({
              convertIdx: cvtIdx,
              blockPosition: [finalPos.x ,finalPos.y, finalPos.z],
              blockRotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            });
          } else if (tile === tetriminoClientMap["Z"]) {
            Z.push({
              convertIdx: cvtIdx,
              blockPosition: [finalPos.x ,finalPos.y, finalPos.z],
              blockRotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            });
          } else if (tile === tetriminoClientMap["H"]) {
            H.push({
              convertIdx: cvtIdx,
              blockPosition: [finalPos.x ,finalPos.y, finalPos.z],
              blockRotation: [finalEuler.x, finalEuler.y, finalEuler.z],
            });
          }
        }
      }
    }

    return {I, O, T, J, L, S, Z, H, Case}
  }





export const InstancedBoxes = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  const COUNT = 1001;
  useEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      dummy.position.set(
        (Math.random() - 0.5 * 20),
        (Math.random() - 0.5 * 20),
        (Math.random() - 0.5 * 20),
      );
      dummy.rotation.set(
        (Math.random() - 0.5 * 20),
        (Math.random() - 0.5 * 20),
        (Math.random() - 0.5 * 20),
      );
      dummy.scale.setScalar(0.5 + Math.random());

      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix)
      
    }
    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  })
useFrame(() => {
  if (meshRef.current) {
    meshRef.current.rotation.y += 0.01
  }
})
  return (
    <instancedMesh ref={meshRef} args={ [undefined, undefined, COUNT] }>
      <boxGeometry/>
      <meshBasicMaterial color="orange" />
    </instancedMesh>
  )
}