/** @jsxImportSource @emotion/react */

import { Canvas,  } from "@react-three/fiber"
import {button, useControls} from 'leva'
import { Perf } from "r3f-perf";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { css } from "@emotion/react";
import { useRef } from "react";
import { OptTetris, type OptTetrisController } from "../../component/r3f/OptTetris";
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

const TestR3fOptPage = () => {
  const ref = useRef<OptTetrisController>(null);
  const boardCnt = useRef(0);
  const cameraCnt = useRef(0);
  useControls({
    boardId: {
      value: 'HI',
      label: 'boardId'
    },
    boardCreate: button((get)=> {
      ref.current?.boardCreateBySlot(get('boardId'), {nickName: 'nick_' + get('boardId')});
      boardCnt.current += 1;
    }),
    boardDelete: button((get)=> {
      ref.current?.boardDelete(get('boardId'));
    }),
    spawnNext: button((get)=>{
      ref.current?.spawnFromNext(get('boardId'), randPickTetrimino())
    }),
    step: button((get)=> {
      ref.current?.step(get('boardId'));
    }),
    moveRight: button((get)=> {
      ref.current?.moveRight(get('boardId'));
    }),
    moveLeft: button((get)=> {
      ref.current?.moveLeft(get('boardId'));
    }),
    rotateRight: button((get)=> {
      ref.current?.rotateRight(get('boardId'));
    }),
    rotateLeft: button((get)=> {
      ref.current?.rotateLeft(get('boardId'));
    }),
    hardDrop: button((get)=> {
      ref.current?.hardDrop(get('boardId'));
    }),
    placing: button((get)=> {
      ref.current?.placing(get('boardId'));
    }),
    lineClear: button((get)=> {
      ref.current?.lineClear(get('boardId'));
    }),
    boardReset: button((get)=> {
      ref.current?.boardReset(get('boardId'));
    }),
    cameraTest: button((get) => {
      
      if (controlsRef.current && cameraRef.current) {
       
        const boardId = get('boardId');
        const {position, rotation} = ref.current!.tetrisInfo(boardId)!.boardTransform;
        console.log(position, rotation)
        const angle = rotation[1] + Math.PI/2;
        const distanceZ = 4.5;
        const offsetX = Math.sin(angle) * distanceZ;
        const offsetZ = Math.cos(angle) * distanceZ;

        const dx = offsetX;
        const dy = -12.5;
        const dz = offsetZ  ;
        const from = new THREE.Vector3(position[0], position[1] , position[2] );
        const to = from.clone().normalize().multiplyScalar(-30).add(from);
        const to2 = to.clone().normalize().multiplyScalar(-10).add(to);
        // cameraRef.current.position.set(to.x + dx, to.y + dy, to.z + dz);
        // controlsRef.current.target.set(position[0] + dx, position[1] + dy, position[2] + dz);
        controlsRef.current.target.set(to.x + dx, to.y + dy, to.z + dz);
        cameraRef.current.position.set(to2.x + dx, to2.y + dy, to2.z + dz);
        controlsRef.current.update()

        // const dx = 0;
        // const dy = -12.5;
        // const dz = 4.5;
        // cameraRef.current.position.set(15 + dx, 0 + dy, 0 + dz);
        // controlsRef.current.target.set(30 + dx, 0 + dy, 0 + dz);
        // controlsRef.current.update()
      }
      cameraCnt.current += 1;
    })
  })

  const tetriminos = ["I", "O", "T", "J", "L", "S", "Z"] ;
  const randPickTetrimino = () => {
    return tetriminos[Math.floor(Math.random() * tetriminos.length)] as  "I" | "O" | "T" | "J" | "L" | "S" | "Z";
  }
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
const controlsRef = useRef<OrbitControlsImpl>(null)
  return (
    <div css={css`height: 100vh;`}>
      <h1 css={css`position: absolute;`}>TestR3fOptPage</h1>
      <Canvas onCreated={({ gl }) => {
        // gl.setClearColor('#e6e6e6'); 
      }}>
        <Perf position="bottom-left"/>
        <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 0]} />
        <OrbitControls 
          ref={controlsRef}
          target={[1, 0, 0]}
        />
        <mesh position={[60, 0 -12.5, 0 + 4.5]}>
          <boxGeometry/>
          <meshBasicMaterial color={"red"}/>
        </mesh>
{/* 
        <mesh position={[0, 0, 0]}>
          <boxGeometry/>
        </mesh>
        <mesh position={[9, 0, 0]}>
          <boxGeometry/>
        </mesh>
        <mesh position={[9, -22, 0]}>
          <boxGeometry/>
        </mesh>
        <mesh position={[0, -22, 0]}>
          <boxGeometry/>
        </mesh>
        
        <mesh position= {[12, -4, 0]}>
          <boxGeometry/>
        </mesh>

        <mesh position= {[-6, -4, 0]}>
          <boxGeometry/>
        </mesh> */}

        {/* 
        
        <mesh position= {[4.5, -3.5, 0]} scale={[10, 0.05, 0.05]}>
          <boxGeometry/>
          <meshBasicMaterial color="black" />
        </mesh>
        <mesh position= {[4.5, -4.5, 0]} scale={[10, 0.05, 0.05]}>
          <boxGeometry/>
          <meshBasicMaterial color="black" />
        </mesh>

         <mesh position= {[4.5, -13.5, 0]} scale={[0.05, 20, 0.05]}>
          <boxGeometry/>
          <meshBasicMaterial color="black" />
        </mesh>
        <mesh position= {[5.5, -13.5, 0]} scale={[0.05, 20, 0.05]}>
          <boxGeometry/>
          <meshBasicMaterial color="black" />
        </mesh>
        
        */}

        <OptTetris ref={ref}/>
      </Canvas>
    </div>
  )
}

export default TestR3fOptPage
