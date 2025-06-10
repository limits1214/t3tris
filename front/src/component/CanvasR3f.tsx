import { CameraControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"

const CanvasR3f = () => {
  return (
    <Canvas>
      <CameraControls></CameraControls>
      <mesh>
        <boxGeometry/>
      </mesh>
    </Canvas>
  )
}

export default CanvasR3f