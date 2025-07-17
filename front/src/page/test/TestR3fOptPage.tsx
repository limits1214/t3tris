/** @jsxImportSource @emotion/react */

import { Canvas,   } from "@react-three/fiber"
import {button, useControls} from 'leva'
import { OrbitControls, PerspectiveCamera,  } from "@react-three/drei";
import { css } from "@emotion/react";
import { useEffect, useRef } from "react";
import { OptTetris, type GameSyncData, type OptTetrisController } from "../../component/r3f/OptTetris";
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import React from "react";

const LazyPerf = React.lazy(()=>import('../../component/r3f/Perf'));

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
    }),
    scoreEffect: button((get)=>{
      const boardId = get('boardId');

      ref.current!.scoreEffect(boardId, "sdf");
    }),
    infoTextUpdat: button((get)=>{
      const boardId = get('boardId');

      // const txt = `level:\n1\nscore:\n21`
      ref.current!.infoTextUpdate(boardId, {level: 999});
    }),
    addEndCover: button((get)=>{
      const boardId = get('boardId');
      ref.current!.addEndCover(boardId, "sdf");
    }),
    removeEndCover: button((get)=>{
      const boardId = get('boardId');

      ref.current!.removeEndCover(boardId);
    }),

    timerOn: button((get)=>{
      ref.current!.timerOn(get('boardId'));
    }),

    timerOff: button((get)=>{
      ref.current!.timerOff(get('boardId'));
    }),

    timerReset: button((get)=>{
      ref.current!.timerReset(get('boardId'));
    }),

    garbageQueue: button((get)=>{
      ref.current!.garbageQueueSet(get('boardId'), [
        {
          kind: "Queued",
          line: 1
        },
        {
          kind: "Ready",
          line: 2
        },
         {
          kind: "Queued",
          line: 3
        }
      ]);
    }),
    garbageAdd: button((get)=>{
      ref.current!.garbageAdd(get('boardId'), [1,2,3])
    }),

    gameSync: button((get)=>{
      const boardId = get('boardId');
      
      const msg2 = {
        "type":"gameSync",
        "data":{
          "gameId":"-yC4Bq-OUUfx88t85IYaB",
          "roomId":"BL0Lnnp4sqvBQHWf7BulG",
          "data":{
            [boardId]:{"board":[["Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty"],["Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty"],["Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty"],["Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty"],["Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty"],[{"Placed":4},"Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty","Empty"],[{"Placed":4},{"Placed":4},{"Placed":4},"Empty","Empty","Empty","Empty","Empty","Empty","Empty"],["Empty",{"Placed":3},"Empty","Empty","Empty","Empty","Empty","Empty",{"Placed":6},{"Placed":6}],[{"Placed":3},{"Placed":3},{"Placed":3},"Empty","Empty","Empty","Empty",{"Placed":6},{"Placed":6},{"Placed":3}],[{"Placed":4},{"Placed":4},"Empty","Empty","Empty","Empty","Empty","Empty",{"Placed":3},{"Placed":3}],[{"Placed":4},{"Placed":4},"Empty","Empty","Empty","Empty","Empty","Empty",{"Placed":5},{"Placed":3}],[{"Placed":4},{"Placed":4},"Empty",{"Falling":{"id":0,"kind":"J","rotation":"D0"}},"Empty","Empty","Empty","Empty",{"Placed":5},"Empty"],[{"Placed":4},{"Placed":4},{"Placed":5},{"Falling":{"id":1,"kind":"J","rotation":"D0"}},{"Falling":{"id":2,"kind":"J","rotation":"D0"}},{"Falling":{"id":3,"kind":"J","rotation":"D0"}},"Empty","Empty",{"Placed":5},{"Placed":5}],[{"Placed":5},{"Placed":5},{"Placed":5},"Empty","Empty","Empty","Empty","Empty","Empty",{"Placed":1}],[{"Placed":2},{"Placed":2},"Empty","Empty","Empty","Empty","Empty","Empty","Empty",{"Placed":1}],[{"Placed":2},{"Placed":2},"Empty",{"Placed":1},{"Placed":1},{"Placed":1},{"Placed":1},"Empty",{"Placed":5},{"Placed":1}],[{"Placed":7},{"Placed":7},"Empty","Empty",{"Placed":6},{"Placed":6},"Empty","Empty",{"Placed":5},{"Placed":1}],["Empty",{"Placed":7},{"Placed":7},{"Placed":6},{"Placed":6},"Empty","Empty","Empty",{"Placed":5},{"Placed":5}],["Empty","Empty",{"Placed":5},{"Placed":7},{"Placed":7},"Empty",{"Placed":1},{"Placed":1},{"Placed":1},{"Placed":1}],[{"Placed":5},{"Placed":5},{"Placed":5},"Empty",{"Placed":7},{"Placed":7},"Empty","Empty",{"Placed":2},{"Placed":2}],[{"Placed":2},{"Placed":2},"Empty",{"Placed":7},{"Placed":7},"Empty","Empty","Empty",{"Placed":2},{"Placed":2}],[{"Placed":2},{"Placed":2},"Empty","Empty",{"Placed":7},{"Placed":7},{"Placed":1},{"Placed":1},{"Placed":1},{"Placed":1}],["Empty",{"Placed":3},"Empty","Empty",{"Placed":2},{"Placed":2},"Empty","Empty",{"Placed":2},{"Placed":2}],[{"Placed":3},{"Placed":3},{"Placed":3},"Empty",{"Placed":2},{"Placed":2},"Empty","Empty",{"Placed":2},{"Placed":2}],[{"Placed":4},"Empty","Empty",{"Placed":2},{"Placed":2},"Empty","Empty","Empty",{"Placed":2},{"Placed":2}],[{"Placed":4},{"Placed":4},{"Placed":4},{"Placed":2},{"Placed":2},"Empty","Empty","Empty",{"Placed":2},{"Placed":2}]],"garbageQueue":[{"from":"Mndei1HCZORO2gHHsg8XS","kind":"Queued","line":2,"tick":3390}],"hold":"O","level":1,"next":["L","T","T","O","L"],"score":588, "line": 1}}}}
      const data = msg2.data.data as Record<string, GameSyncData>; 
      ref.current!.gameSync(data);
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
      <Canvas onCreated={() => {
        // gl.setClearColor('#e6e6e6'); 
      }}>
        <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 0]} />
        <OrbitControls 
          ref={controlsRef}
          target={[1, 0, 0]}
        />
        <mesh position={[60, 0 -12.5, 0 + 4.5]}>
          <boxGeometry/>
          <meshBasicMaterial color={"red"}/>
        </mesh>
        <LazyPerf position="bottom-left"/>
        {/* <BorderedBlock/> */}
        {/* <BorderedStandardBox/> */}

        

        <ambientLight intensity={2} />
        {/* <hemisphereLight intensity={2} position={[0, 10, 0]}/> */}


        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => {
  const x = Math.cos(angle) * 100;
  const z = Math.sin(angle) * 100;
  return (
    <directionalLight
      key={i}
      position={[x, 100, z]}
      intensity={2}
    />
  );
})}
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


// const BorderedBlockMaterial = shaderMaterial(
//   {
//     borderWidth: 0.05,
//     borderColor: new THREE.Color("black"),
//     fillColor: new THREE.Color("orange")
//   },
//   `
//     varying vec2 vUv;
//     void main() {
//       vUv = uv;
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//   `,
//   `
//     varying vec2 vUv;
//     uniform float borderWidth;
//     uniform vec3 borderColor;
//     uniform vec3 fillColor;

//     void main() {
//       float bw = borderWidth;
//       bool isBorder = vUv.x < bw || vUv.x > 1.0 - bw || vUv.y < bw || vUv.y > 1.0 - bw;
//       vec3 color = isBorder ? borderColor : fillColor;
//       gl_FragColor = vec4(color, 1.0);
//     }
//   `
// );
// extend({ BorderedBlockMaterial });

// const BorderedBlock = () => {
//   // const material = useMemo(() => new THREE.MeshStandardMaterial(), []);

//   return (
//     <mesh position={[0, 0, 0]}>
//       <boxGeometry args={[1, 1, 1]} />
//       {/* 👇 여기서 커스텀 머티리얼 사용 */}
//       <borderedBlockMaterial attach="material" />
//     </mesh>
//   );
// };


export function BorderedStandardBox() {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;

    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.color = new THREE.Color("red")

    material.onBeforeCompile = (shader) => {
      // vUv를 전달받기 위한 셰이더 수정
      shader.vertexShader = `
        varying vec2 vUv;
        ${shader.vertexShader}
        `;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <uv_vertex>',
          `
          #include <uv_vertex>
          vUv = uv;
          `
        );

      shader.fragmentShader = `
        varying vec2 vUv;
        uniform float borderWidth;
        uniform vec3 borderColor;
        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        `
        float bw = borderWidth;
        bool isBorder = vUv.x < bw || vUv.x > 1.0 - bw || vUv.y < bw || vUv.y > 1.0 - bw;
        if (isBorder) {
          gl_FragColor.rgb = borderColor;
        }
        #include <dithering_fragment>
        `
      );

      shader.uniforms.borderWidth = { value: 0.05 };
      shader.uniforms.borderColor = { value: new THREE.Color("black") };

      material.userData.shader = shader;
    };

    // 머티리얼 업데이트 트리거
    material.needsUpdate = true;
  }, []);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  );
}




// export function MyBlock() {
//   const { nodes } = useGLTF('/glb/basicBlock.glb'); // public/models/my_block.glb
//   return (
//     <>
//       <mesh
//       position={[ 0, -20, 0]}
//       scale={[0.5,0.5,0.5]}
//         geometry={(nodes.Cube as THREE.Mesh).geometry}
//       >
//         <meshLambertMaterial color="orange" />
//       </mesh>

//       <mesh
//       position={[ 0, -21, 0]}
//       scale={[0.5,0.5,0.5]}
//         geometry={(nodes.Cube as THREE.Mesh).geometry}
//       >
//         <meshLambertMaterial color="orange" />
//       </mesh>

//       {/* <directionalLight position={[ 1010, -1010, 1010]} intensity={10}/> */}
//     </>
//   );
// }