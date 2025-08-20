/** @jsxImportSource @emotion/react */

import { Canvas, useFrame } from "@react-three/fiber";
import { button, folder, useControls } from "leva";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { css } from "@emotion/react";
import { useRef } from "react";

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
    // heavyTask(50);
  });
  function heavyTask(ms: number) {
    const end = performance.now() + ms;
    while (performance.now() < end) {
      // 아무 것도 안 하고 CPU만 태움
    }
  }

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

    boardMove: button((get) => {
      ref.current?.moveBoard(get("boardId"), {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1.5, 1.5, 1.5],
      });
    }),
    spawnFromNext: button((get) => {
      ref.current?.spawnFromNext(get("boardId"));
    }),
    step: button((get) => {
      ref.current?.step(get("boardId"));
    }),
    testRaTimeout: button(() => {
      heavyTask(500);
      // console.log("fire");
      // const x = raTimer.current.setTimeout(() => {
      //   console.log("ra timeout");
      // }, 1000);
      // setTimeout(() => {
      //   console.log("Native timeout");
      // }, 1000);
      // raTimer.current.clearInterval(x);
      // const y = raTimer.current.setInterval(() => {
      //   console.log("ra setInterval");
      // }, 1000);
      // setInterval(() => {
      //   console.log("Native setInterval");
      // }, 1000);
    }),
  });
  return (
    <>
      <ClientTetris ref={ref} />
    </>
  );
};
