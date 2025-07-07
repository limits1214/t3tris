import { OrbitControls, Text as DreiText } from '@react-three/drei';
import { Canvas } from '@react-three/fiber'
import { Fullscreen, Container, Text, Root } from "@react-three/uikit";
import { Perf } from 'r3f-perf';
import { useEffect, useRef } from 'react';
import SpriteText from 'three-spritetext'

const MyLabel = () => {
  const ref = useRef<SpriteText>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.text = "User 1"
    }
  }, [])

  return (
    <>
      <primitive object={new SpriteText("User 1")} position={[0, 2, 0]} />
    </>
  )
}
const TestR3fUikit = () => {
  return (
    <Canvas style={{ position: "absolute", inset: "0", touchAction: "none" }} gl={{ localClippingEnabled: true }}>
      <Perf/>
      <OrbitControls />
      

      <Root
        hover={{ backgroundColor: 'red' }}
        active={{ backgroundColor: 'green' }}
        sizeX={1}
        sizeY={1}
        positionTop={10}
      >
        <Text positionTop={0}>sdfs</Text>
      </Root>
{/*       
      <mesh position={[0, 3, 0]}>
        <boxGeometry/>
      </mesh>
      <DreiText>Drei</DreiText> */}

      {/* <MyLabel/> */}
      <DreiText>Drei\ndsdf</DreiText>
    </Canvas>
  )
}

export default TestR3fUikit