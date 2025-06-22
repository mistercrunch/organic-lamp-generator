import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import LampScene from './components/LampScene'
import { Leva, useControls, useCreateStore } from 'leva'
import { generateSlatsSVG, generateDonutSVG } from './export/generateSVG'

export default function App() {
  const store = useCreateStore()

  const params = useControls(
    {
      height: { value: 300, min: 100, max: 500 },
      radius: { value: 100, min: 50, max: 200 },
      slats: { value: 40, min: 10, max: 100, step: 1 },
      roundiness: { value: 0, min: 0, max: 5 },
      baseSize: { value: 20, min: 0, max: 200 },

      lfo1Shape: { options: ['sine', 'triangle', 'square', 'flat'], value: 'flat' },
      lfo1Frequency: { value: 1, min: 0.1, max: 100, step: 0.1 },
      lfo1Amplitude: { value: 200, min: 0, max: 100 },
      lfo1PhaseRandomness: { value: 0, min: 0, max: 1 },
      lfo1AmplitudeRandomness: { value: 0, min: 0, max: 1 },

      lfo2Shape: { options: ['sine', 'triangle', 'square', 'flat'], value: 'flat' },
      lfo2Frequency: { value: 1, min: 0.1, max: 100 },
      lfo2Amplitude: { value: 200, min: 0, max: 100 },
      lfo2PhaseRandomness: { value: 0, min: 0, max: 1 },
      lfo2AmplitudeRandomness: { value: 0, min: 0, max: 1 },

			coneAngle: { value: 0, min: -0.5, max: 0.5 },
			spiralTwistAngle: { value: 0, min: -1, max: 1 },
			blindsTiltAngle: { value: 0, min: -1, max: 1 },
			opacity: { value: 0.5, min: 0, max: 1 },
      color: { value: '#ffffff' },
    },
    { store }
  )

  const handleExport = () => {
    const fullState = store.get()
    const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lamp_params.json'
    link.click()
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const importedState = JSON.parse(event.target.result)
      store.set(importedState)
    }
    reader.readAsText(file)
  }
  const downloadSVG = (svgContent, filename) => {
		const blob = new Blob([svgContent], { type: 'image/svg+xml' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = filename
		link.click()
	}

 const handleGenerateSlatsSVG = () => {
		const svg = generateSlatsSVG(params)
		downloadSVG(svg, 'lamp_slats.svg')
	}

	const handleGenerateDonutSVG = () => {
		const svg = generateDonutSVG(params)
		downloadSVG(svg, 'lamp_donuts.svg')
	}

  const handleGenerateSVG = () => {

    handleGenerateSlatsSVG();
    handleGenerateDonutSVG();
  }

  return (
    <>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <button onClick={handleExport}>Export State</button>
        <input type="file" accept=".json" onChange={handleImport} />
        <button onClick={handleGenerateSVG}>Generate SVG</button>
      </div>

      <Leva store={store} collapsed />
      <Canvas  camera={{ fov: 100, position: [0, 0, 600] }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[1, 1, 1]} />
        <OrbitControls />
        <LampScene params={params} />
      </Canvas>
    </>
  )
}

