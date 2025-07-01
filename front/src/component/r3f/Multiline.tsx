import { useEffect, useMemo } from "react";
import * as THREE from 'three';

export const Multiline = ({lines}: {lines: [number, number, number][][]}) => {
  const geometry = useMemo(()=>{
    const positions: number[] = []
    for (const line of lines) {
      const [start, end] = line;
      positions.push(...start, ...end)
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [lines])

  useEffect(() => {
    return () => {
      geometry.dispose();
    }
  }, [geometry])
  return <>
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="black" />
    </lineSegments>
  </>
}