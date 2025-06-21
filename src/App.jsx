import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import LampScene from './components/LampScene'
import { useControls } from 'leva'

function App() {
  const params = useControls({
    height: { value: 300, min: 100, max: 500 },
    radius: { value: 100, min: 50, max: 200 },
    slats: { value: 40, min: 10, max: 100, step: 1 },
    waviness: { value: 20, min: 0, max: 50 },
    angleOffset: { value: 0, min: -Math.PI, max: Math.PI },
    roundiness: { value: 0, min: 0, max: 1 },
    opacity: { value: 0.5, min: 0, max: 1 },
    waveSharpness: { value: 2, min: 0, max: 10 },
    twistAngle: { value: 0, min: -0.5, max: 0.5 },
    tiltAngle: { value: 0, min: -1, max: 1 },
    cameraFOV: { value: 50, min: 20, max: 120 }
  })

  return (
    <>
      <Canvas camera={{ fov: params.cameraFOV, position: [0, 0, params.radius * 4] }}>
        <ambientLight />
        <OrbitControls />
        <LampScene params={params} />
      </Canvas>
    </>
  )
}

export default App

