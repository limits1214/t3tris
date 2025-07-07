/** @jsxImportSource @emotion/react */

import { Canvas,  } from "@react-three/fiber"
import {button, useControls} from 'leva'
import { Perf } from "r3f-perf";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { css } from "@emotion/react";
import { useRef } from "react";
import { OptTetris, type OptTetrisController } from "../../component/r3f/OptTetris";

const TestR3fOptPage = () => {
  const ref = useRef<OptTetrisController>(null);
  const boardCnt = useRef(0);
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
    })
  })

  const tetriminos = ["I", "O", "T", "J", "L", "S", "Z"] ;
  const randPickTetrimino = () => {
    return tetriminos[Math.floor(Math.random() * tetriminos.length)] as  "I" | "O" | "T" | "J" | "L" | "S" | "Z";
  }
  
  return (
    <div css={css`height: 100vh;`}>
      <h1 css={css`position: absolute;`}>TestR3fOptPage</h1>
      <Canvas onCreated={({ gl }) => {
    // gl.setClearColor('#e6e6e6'); 
  }}>
        <Perf position="bottom-left"/>
        <PerspectiveCamera makeDefault position={[15, 0, 0]} />
<OrbitControls 
  target={[30, 0, 0]}
/>
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
