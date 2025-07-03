import { Instance, Instances } from "@react-three/drei";
import { InstancedRigidBodies, type InstancedRigidBodyProps, type RapierRigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";

export type TetrisInstancedTetriminosParam = {
  tetriminos: {
    I: [number, number][]
    O: [number, number][]
    T: [number, number][]
    S: [number, number][]
    Z: [number, number][]
    J: [number, number][]
    L: [number, number][]
    H: [number, number][]
  } | null,
  isOver: boolean | null
};
export const TetrisInstancedTetriminos = ({tetriminos, isOver}: TetrisInstancedTetriminosParam, ) => {

  const rigidBodies = useRef<RapierRigidBody[]>(null);

  const objs = useMemo(() => {
    if (!tetriminos) return;

    /* for (let i = 0; i < COUNT; i++) {
      instances.push({
        key: "instance_" + Math.random(),
        position: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
        rotation: [Math.random(), Math.random(), Math.random()]
      });
    } */
     
    const entries = Object.entries(tetriminos);
    const obj: Record<string, {color: string, instances: InstancedRigidBodyProps[]}> = {};
    for (const [tet, pos] of entries) {
      

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
      } else {
        color = ""
      }

      if (!obj[tet]) obj[tet] = {color, instances: []};
      /* const instances: InstancedRigidBodyProps[] = []; */
        /* const poses = pos.map((pos)=>(
          [pos[0] + 0.5, -pos[1] + 2.5, 0]
        )) */

      pos.forEach((pos)=>{
         obj[tet].instances.push({
          key: "instance_tet_" + Math.random(),
          position: [pos[0] + 0.5, -pos[1] + 2.5, 0]
        });
      })
      
    }
    



    return obj;
  }, [tetriminos]);
useEffect(() => {
  if (rigidBodies.current) {
    rigidBodies.current.forEach((body) => {
      body.applyImpulse({ x: 0, y: 110, z: 0 }, true);
    });
  }
}, [objs]);
  if (isOver) {
return <>
    {objs && Object.entries(objs).map(([tet, pos]) => {
      return <InstancedRigidBodies
                key={tet}
                instances={pos.instances}
                colliders="cuboid"
                gravityScale={4}
              >
                <instancedMesh args={[undefined, undefined, pos.instances.length]}  >
                  <boxGeometry />
                  <meshBasicMaterial color={pos.color} />
                </instancedMesh>
              </InstancedRigidBodies>
    })}
  </>
  } else {
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
      }
      return <Instances>
        <boxGeometry/>
        <meshBasicMaterial color={color}/>
        {pos.map((pos)=>(
          <Instance position={[pos[0] + 0.5, -pos[1] + 2.5, 0]} />
        ))}
      </Instances>
    })}
  </>
  }
  
  
}
  const tetriminoClientMap = { E: 0, I: 1, O: 2, T: 3, J: 4, L: 5, S: 6, Z: 7, H: 8 }
export const convertInstancedTetrimino = (board: number[][]  , next: number[]   , hold: number | null) => {
    const I: [number, number][] = [];
    const O: [number, number][] = [];
    const T: [number, number][] = [];
    const J: [number, number][] = [];
    const L: [number, number][] = [];
    const S: [number, number][] = [];
    const Z: [number, number][] = [];
    const H: [number, number][] = [];

    if (hold) {
      const refx = -5;
      const refy =  + 5;
      if (hold === tetriminoClientMap["I"]) {
        I.push([refx, refy]);
        I.push([refx+1, refy]);
        I.push([refx+2, refy]);
        I.push([refx+3, refy]);
      } else if (hold === tetriminoClientMap["O"]) {
        O.push([refx, refy]);
        O.push([refx+1, refy]);
        O.push([refx+1, refy + 1]);
        O.push([refx, refy + 1]);
      } else if (hold === tetriminoClientMap["T"]) {
        T.push([refx, refy]);
        T.push([refx+1, refy]);
        T.push([refx+2, refy]);
        T.push([refx+1, refy+1]);
      } else if (hold === tetriminoClientMap["J"]) {
        J.push([refx, refy ]);
        J.push([refx, refy + 1]);
        J.push([refx+1, refy + 1]);
        J.push([refx+2, refy + 1]);
      } else if (hold === tetriminoClientMap["L"]) {
        L.push([refx, refy + 1]);
        L.push([refx + 1, refy + 1]);
        L.push([refx + 2, refy + 1]);
        L.push([refx + 2, refy]);
      } else if (hold === tetriminoClientMap["S"]) {
        S.push([refx+2, refy]);
        S.push([refx+1, refy+1]);
        S.push([refx+1, refy]);
        S.push([refx, refy+1]);
      } else if (hold === tetriminoClientMap["Z"]) {
        Z.push([refx, refy]);
        Z.push([refx+1, refy+1]);
        Z.push([refx+1, refy]);
        Z.push([refx+2, refy+1]);
      }
    }

    for (const [idx, n] of next.entries() ) {
      const refx = 12;
      const refy = idx*3 + 5;
      
      if (n === tetriminoClientMap["I"]) {
        I.push([refx, refy]);
        I.push([refx+1, refy]);
        I.push([refx+2, refy]);
        I.push([refx+3, refy]);
      } else if (n === tetriminoClientMap["O"]) {
        O.push([refx, refy]);
        O.push([refx+1, refy]);
        O.push([refx+1, refy + 1]);
        O.push([refx, refy + 1]);
      } else if (n === tetriminoClientMap["T"]) {
        T.push([refx, refy]);
        T.push([refx+1, refy]);
        T.push([refx+2, refy]);
        T.push([refx+1, refy+1]);
      } else if (n === tetriminoClientMap["J"]) {
        J.push([refx, refy ]);
        J.push([refx, refy + 1]);
        J.push([refx+1, refy + 1]);
        J.push([refx+2, refy + 1]);
      } else if (n === tetriminoClientMap["L"]) {
        L.push([refx, refy + 1]);
        L.push([refx + 1, refy + 1]);
        L.push([refx + 2, refy + 1]);
        L.push([refx + 2, refy]);
      } else if (n === tetriminoClientMap["S"]) {
        S.push([refx+2, refy]);
        S.push([refx+1, refy+1]);
        S.push([refx+1, refy]);
        S.push([refx, refy+1]);
      } else if (n === tetriminoClientMap["Z"]) {
        Z.push([refx, refy]);
        Z.push([refx+1, refy+1]);
        Z.push([refx+1, refy]);
        Z.push([refx+2, refy+1]);
      }
    }

    for (const [lineIdx, line] of board.entries()) {
      for (const [tileIdx, tile] of line.entries()) {
        if (tile === tetriminoClientMap["E"]) {
          //
        } else if (tile === tetriminoClientMap["I"]) {
          I.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["O"]) {
          O.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["T"]) {
          T.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["J"]) {
          J.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["L"]) {
          L.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["S"]) {
          S.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["Z"]) {
          Z.push([tileIdx, lineIdx]);
        } else if (tile === tetriminoClientMap["H"]) {
          H.push([tileIdx, lineIdx]);
        }
      }
    }
    return {I, O, T, J, L, S, Z, H}
  }