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
    opacity: { value: 0.5, min: 0, max: 1 }
  })

  return (
    <>
      <Canvas camera={{ position: [0, params.height / 2, params.radius * 3] }}>
        <ambientLight />
        <OrbitControls />
        <LampScene params={params} />
      </Canvas>
    </>
  )
}

export default App

