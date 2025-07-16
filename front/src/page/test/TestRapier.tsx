/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import { OrbitControls,  } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Perf } from "r3f-perf"
import { Physics,  CuboidCollider, RapierRigidBody, type InstancedRigidBodyProps, InstancedRigidBodies, RigidBody } from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef } from "react";
const TestRapier = () => {
  return (
    <div css={css`height: 100vh;`}>
      <h1 css={css`position: absolute`}>TestRapier</h1>
      <Canvas>
        <OrbitControls/>
        <Perf/>
        <MyCanvas/>
      </Canvas>
    </div>
  )
}

export default TestRapier

const COUNT = 200 ;
const MyCanvas = () => {
  const rigidBodies = useRef<RapierRigidBody[]>(null);

  useEffect(() => {
    if (!rigidBodies.current) {
      return;
    }

    // You can access individual instanced by their index
    /* rigidBodies.current[40].applyImpulse({ x: 0, y: 10, z: 0 }, true); */
    /* rigidBodies.current.at(100).applyImpulse({ x: 0, y: 10, z: 0 }, true); */

    // Or update all instances
    /* rigidBodies.current.forEach((api) => { */
      /* api.applyImpulse({ x: 0, y: 10, z: 0 }, true); */
    /* }); */
  }, []);
  const instances = useMemo(() => {
    const instances: InstancedRigidBodyProps[] = [];

    for (let i = 0; i < COUNT; i++) {
      instances.push({
        key: "instance_" + Math.random(),
        position: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
        rotation: [Math.random(), Math.random(), Math.random()]
      });
    }

    return instances;
  }, [COUNT]);
  return <>
    <Suspense>
      <Physics >
        {/* <RigidBody >
          
          <Torus />
        </RigidBody> */}
<RigidBody>
</RigidBody>


        <InstancedRigidBodies
          ref={rigidBodies}
          instances={instances}
          colliders="cuboid"
          
        >
          <instancedMesh args={[undefined, undefined, COUNT]} count={COUNT} >
            <boxGeometry />
            <meshStandardMaterial color="orange" />
          </instancedMesh>
        </InstancedRigidBodies>

        <CuboidCollider position={[0, -2, 0]} args={[200, 0.5, 200]} />
      </Physics>
    </Suspense>
  </>
}