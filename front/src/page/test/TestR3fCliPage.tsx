/** @jsxImportSource @emotion/react */

import { Canvas, useFrame } from "@react-three/fiber";
import { button, folder, useControls } from "leva";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { css } from "@emotion/react";
import { useEffect, useRef } from "react";

import React from "react";
import {
  ClientTetris,
  type ClientTetrisController,
} from "../../component/r3f/ClientTetris";
import { RaTimer } from "../../component/game/util";

const LazyPerf = React.lazy(() => import("../../component/r3f/Perf"));

const TestR3fCliPage = () => {
  return (
    <div
      css={css`
        height: 100dvh;
      `}
    >
      <h1
        css={css`
          position: absolute;
        `}
      >
        TestR3fClientPage
      </h1>
      <Canvas
        onCreated={() => {
          // gl.setClearColor('#e6e6e6');
        }}
        orthographic={true}
      >
        {/* <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 100]} /> */}
        <OrthographicCamera makeDefault position={[0, 0, 1]} zoom={20} />
        <OrbitControls
          // ref={controlsRef}
          target={[0, 0, 0]}
          enableRotate={false}
        />

        <LazyPerf position="bottom-left" />

        <ambientLight intensity={2} />
        {/* <hemisphereLight intensity={2} position={[0, 10, 0]}/> */}

        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => {
          const x = Math.cos(angle) * 100;
          const z = Math.sin(angle) * 100;
          return (
            <directionalLight key={i} position={[x, 100, z]} intensity={2} />
          );
        })}

        <mesh>
          <boxGeometry />
          <meshBasicMaterial color="red" />
        </mesh>
        <ThreeComponent />
      </Canvas>
    </div>
  );
};

export default TestR3fCliPage;

const ThreeComponent = () => {
  const ref = useRef<ClientTetrisController>(null);
  const raTimer = useRef(new RaTimer());
  // const controlsRef = useRef<OrbitControlsImpl>(null);
  useFrame((_state, delta) => {
    raTimer.current.frame(delta);
  });

  useControls({
    boardId: {
      value: "HI",
      label: "boardId",
    },
    // setPlayer: button((get) => {
    //   // ref.current?.setPlayer(get("boardId"), get("boardId"));
    // }),
    createPlayerBoard: button((get) => {
      ref.current?.createPlayerBoard(get("boardId"), get("boardId"));
    }),
    deleteBoard: button((get) => {
      ref.current?.deleteBoard(get("boardId"));
    }),
    Timer: folder({
      timerOn: button((get) => {
        ref.current?.boardTimerOn(get("boardId"));
      }),
      timerOff: button((get) => {
        ref.current?.boardTimerOff(get("boardId"));
      }),
      timerReset: button((get) => {
        ref.current?.boardTimerReset(get("boardId"));
      }),
    }),
    gameStart: button(() => {
      ref.current?.gameStart();
    }),
    boardSetup: button((get) => {
      ref.current?.setup(get("boardId"), {
        hold: "T",
        next: ["I", "J", "L", "O", "S"],
      });
    }),
    spawnFromNext: button((get) => {
      ref.current?.spawnFromNext(get("boardId"));
    }),
    step: button((get) => {
      ref.current?.step(get("boardId"));
    }),
    testRaTimeout: button(() => {
      console.log("fire");
      const x = raTimer.current.setTimeout(() => {
        console.log("ra timeout");
      }, 1000);
      setTimeout(() => {
        console.log("Native timeout");
      }, 1000);
      raTimer.current.clearInterval(x);
      const y = raTimer.current.setInterval(() => {
        console.log("ra setInterval");
      }, 1000);

      setInterval(() => {
        console.log("Native setInterval");
      }, 1000);
    }),
  });
  return (
    <>
      <ClientTetris ref={ref} />
    </>
  );
};

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
