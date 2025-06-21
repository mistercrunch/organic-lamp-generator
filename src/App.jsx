import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import LampScene from './components/LampScene'
import { Leva, useControls } from 'leva'

export default function App() {
  const params = useControls({
    height: { value: 300, min: 100, max: 500 },
    radius: { value: 100, min: 50, max: 200 },
    slats: { value: 40, min: 10, max: 100, step: 1 },
    profileResolution: { value: 100, min: 20, max: 300, step: 1 },
    roundiness: { value: 0, min: 0, max: 1 },
    baseSize: { value: 20, min: 0, max: 200 },

    // LFO 1
    lfo1Shape: { options: ['sine', 'triangle', 'square', 'flat'], value: 'flat' },
    lfo1Frequency: { value: 1, min: 0.1, max: 10 },
    lfo1Amplitude: { value: 20, min: 0, max: 100 },
    lfo1Randomness: { value: 0, min: 0, max: 1 },

    // LFO 2
    lfo2Shape: { options: ['sine', 'triangle', 'square', 'flat'], value: 'flat' },
    lfo2Frequency: { value: 1, min: 0.1, max: 10 },
    lfo2Amplitude: { value: 20, min: 0, max: 100 },
    lfo2Randomness: { value: 0, min: 0, max: 1 },

    twistAngle: { value: 0, min: -0.5, max: 0.5 },
    tiltAngle: { value: 0, min: -0.5, max: 0.5 },
    opacity: { value: 0.5, min: 0, max: 1 },
  })

  return (
    <>
      <Leva collapsed />
      <Canvas camera={{ fov: 50, position: [0, 0, 600] }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[1, 1, 1]} />
        <OrbitControls />
        <LampScene params={params} />
      </Canvas>
    </>
  )
}

