/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Box, Button, Flex } from "@radix-ui/themes";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import {
  ClientTetris,
  type ClientTetrisController,
} from "../component/r3f/ClientTetris";
import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { MobileButton } from "../component/MobileButton";
const RoomSinglePage = () => {
  const tetrisRef = useRef<ClientTetrisController>(null);
  return (
    <Box
      css={css`
        height: 100dvh;
        width: 100dwh;
        -webkit-touch-callout: none; /* iOS 컨텍스트 메뉴 막기 */
        -webkit-user-select: none; /* 텍스트 선택 막기 (iOS/Android) */
        user-select: none;
        /* touch-action: none;          터치 동작 막기 (스크롤/줌 등) */
        touch-action: manipulation; /* 더블탭 확대 방지 */
      `}
    >
      <CanvasWrap tetrisRef={tetrisRef} />
      <HUD tetrisRef={tetrisRef} />
    </Box>
  );
};
export default RoomSinglePage;
const CanvasWrap = ({
  tetrisRef,
}: {
  tetrisRef: RefObject<ClientTetrisController | null>;
}) => {
  const [isOrth] = useState(true);
  return (
    <Canvas orthographic={isOrth}>
      <GameBoard isOrth={isOrth} tetrisRef={tetrisRef} />
    </Canvas>
  );
};
type GameBoardParam = {
  isOrth: boolean;
  tetrisRef: RefObject<ClientTetrisController | null>;
};
const GameBoard = ({ isOrth, tetrisRef }: GameBoardParam) => {
  // const ref = useRef<ClientTetrisController>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const [cameraX] = useState(0);

  const { camera } = useThree();

  // XY만 제한할 박스(2D)
  const min = new THREE.Vector2(-20, -20);
  const max = new THREE.Vector2(20, 20);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // 회전 끄면 offset의 방향은 고정(보통 z축만 차이)
    const offset = new THREE.Vector3().subVectors(
      camera.position,
      controls.target
    );

    const onChange = () => {
      // 1) target을 XY로만 클램프
      const t = controls.target;
      const clampedX = THREE.MathUtils.clamp(t.x, min.x, max.x);
      const clampedY = THREE.MathUtils.clamp(t.y, min.y, max.y);

      // 변화 없으면 조기 종료 (피드백 루프 방지)
      if (t.x === clampedX && t.y === clampedY) return;

      t.set(clampedX, clampedY, t.z);

      // 2) 카메라도 같은 XY로 이동 (오프셋 유지: 보통 z만 차이)
      camera.position.set(t.x + offset.x, t.y + offset.y, t.z + offset.z);

      // 3) 변경 알림
      camera.updateProjectionMatrix();
      controls.update();
    };

    controls.addEventListener("change", onChange);
    return () => controls.removeEventListener("change", onChange);
  }, [camera]);

  useEffect(() => {
    const localRef = tetrisRef.current;
    localRef?.createPlayerBoard("Player", "");
    return () => {
      localRef?.deleteBoard("Player");
    };
  }, []);

  return (
    <>
      {/* camera */}
      {isOrth ? (
        <OrthographicCamera
          makeDefault
          ref={orthoCameraRef}
          position={[cameraX, 0, 10]}
          near={1}
          far={12}
          zoom={20}
        />
      ) : (
        <PerspectiveCamera
          makeDefault
          ref={cameraRef}
          position={[13, 0, 100]}
          near={0.1}
          far={5000}
        />
      )}

      {/* CameraControls */}
      <OrbitControls
        ref={controlsRef}
        target={[cameraX, 0, 0]}
        enableRotate={false}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: THREE.TOUCH.PAN,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />

      {/* Lights */}
      <ambientLight intensity={1} />
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => {
        const x = Math.cos(angle) * 100;
        const z = Math.sin(angle) * 100;
        return (
          <directionalLight key={i} position={[x, 100, z]} intensity={1} />
        );
      })}

      {/* Game */}
      <ClientTetris ref={tetrisRef} />
    </>
  );
};

const HUD = ({
  tetrisRef,
}: {
  tetrisRef: RefObject<ClientTetrisController | null>;
}) => {
  return (
    <>
      <Flex
        direction="column"
        css={css`
          background-color: rgba(255, 255, 255, 0.7);
          position: absolute;
          padding: 0.5rem;
          left: 0;
          top: 0;
          width: 250px;
          /* height: 300px; */
          border: 1px solid black;
          pointer-events: none;
          /* z-index: 1; */
        `}
      >
        <Flex
          direction="column"
          css={css`
            pointer-events: auto;
            /* z-index: 1; */
          `}
        >
          <Button
            variant="classic"
            onClick={() => {
              tetrisRef.current?.gameStart("Player");
            }}
          >
            GAME START
          </Button>
          {/* <HUDInfoMenu /> */}
        </Flex>
        <HUDRoomButton />
      </Flex>

      {/* <HUDGameStartTimer /> */}
      <HUDMobileButton />
    </>
  );
};
const HUDRoomButton = () => {
  const navigate = useNavigate();
  return (
    <Flex
      css={css`
        margin-top: 1rem;
        pointer-events: auto;
        justify-content: space-between;
      `}
    >
      <Button onClick={() => navigate("/")}>나가기</Button>
    </Flex>
  );
};
const HUDMobileButton = () => {
  return (
    <Box
      css={css`
        position: absolute;
        pointer-events: auto;
        /* border: 1px solid red; */
        bottom: 1%;
        /* width: 100%; */
        /* height: 100%; */
        left: 50%;
        transform: translate(-50%, 0%);
      `}
    >
      <MobileButton />
    </Box>
  );
};
