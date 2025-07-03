import { Instance, Instances, Text, } from "@react-three/drei";
import { InstancedRigidBodies, RapierRigidBody, type InstancedRigidBodyProps } from "@react-three/rapier";
import { Multiline } from "./Multiline";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';

export type TimeController = {
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export const TetrisBoardCase = forwardRef(({isOver}:{isOver: boolean | null}, ref)=>{
  /* const [startTime, setStartTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false); */

  const startTime = useRef<number | null>(null);
  const isRunning = useRef(false);
  useImperativeHandle(ref, ()=>({
    start: () => {
      startTime.current = performance.now() / 1000;
      isRunning.current = true;
      /* setStartTime(performance.now() / 1000); */
      /* setIsRunning(true) */
    },
    stop: () => {
      /* setIsRunning(false) */
      isRunning.current = false;
    },
    reset: () => {
      /* setIsRunning(false)
      setStartTime(null) */
      isRunning.current = false;
      startTime.current = null;
      console.log('rest!!!')
      if(textRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ThreeText = textRef.current as any;
        ThreeText.text  = ''
      }
    }
  }));
  const textRef = useRef<THREE.Mesh>(null);
  useFrame(()=>{
    
    if (!isRunning.current || startTime.current == null || !textRef.current) return;

    const now = performance.now() / 1000;
    const elapsed = now - startTime.current;
   
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ThreeText = textRef.current as any;
     ThreeText.text  = elapsed.toFixed(2)
  })

  const [lines, setLines] = useState<[number, number, number][][]>();
  useEffect(() => {
    const x: [number, number, number][][] = Array.from({length: 9}, (_, i)=>[[i + 1, 0, -0.49], [i + 1, -20, -0.49]]);
    const y: [number, number, number][][] = Array.from({length: 19}, (_, i)=>[[0, i  - 19, -0.49], [10, i - 19, -0.49]]);
    const lines: [number, number, number][][] = [...x, ...y];
    setLines(lines)
  }, [])

  const rigidBodies = useRef<RapierRigidBody[]>(null);
  const instances = useMemo(() => {
    const instances: InstancedRigidBodyProps[] = [];
      instances.push({
        key: "instance_" + Math.random(),
        position: [0 - 0.5, -9 - 0.5, 0],
        scale: [1, 21, 1]
      })
      instances.push({
        key: "instance_" + Math.random(),
        position: [11 - 0.5, -9 - 0.5, 0],
        scale: [1, 21, 1]
      })
      instances.push({
        key: "instance_" + Math.random(),
        position: [5,-20.5,0],
        scale: [12, 1, 1]
      })
    return instances;
  }, []);
  return <>
    <Text position={[-4, -1, 0]} color="black" scale={1}>Hold</Text>
    <Text position={[-6, -15, 0]} color="black" scale={1}>Time</Text>

    <Text ref={textRef} position={[-6, -16, 0]} color="black">00.00</Text>
    <Text position={[14, -1, 0]} color="black" scale={1}>Next</Text>
    
    {lines && <Multiline lines={lines} />}

    {/* Case */}
    {isOver ? (
      <InstancedRigidBodies
        ref={rigidBodies}
        instances={instances}
        colliders="cuboid"
        gravityScale={1}
      >
        <instancedMesh args={[undefined, undefined, 3]} count={3} >
          <boxGeometry />
          <meshBasicMaterial color={"black"}/>
        </instancedMesh>
      </InstancedRigidBodies>
    ) : (
      <Instances>
        <boxGeometry/>
        <meshBasicMaterial color={"black"}/>
        <Instance position={[0 - 0.5, -9 - 0.5, 0]} scale={[1, 21, 1]} />
        <Instance position={[11 - 0.5, -9 - 0.5, 0]} scale={[1, 21, 1]} />
        <Instance position={[5,-20.5,0]} scale={[12, 1, 1]} />
      </Instances>
    )}
    
  </>
})
