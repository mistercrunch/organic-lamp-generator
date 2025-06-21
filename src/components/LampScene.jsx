import React, { useMemo } from 'react'
import { createNoise2D } from 'simplex-noise'
import * as THREE from 'three'
import { Line } from '@react-three/drei'

const noise = createNoise2D()

export default function LampScene({ params }) {
  const {
    height, radius, slats, profileResolution, roundiness,
    baseSize,
    lfo1Shape, lfo1Frequency, lfo1Amplitude, lfo1Randomness,
    lfo2Shape, lfo2Frequency, lfo2Amplitude, lfo2Randomness,
    twistAngle, tiltAngle, opacity
  } = params

  const minSlatWidth = 5

  const slatsData = useMemo(() => {
    return Array.from({ length: slats }).map((_, i) => {
      const thetaNorm = i / slats
      const thetaCenter = thetaNorm * Math.PI * 2
      const profile = []

      for (let j = 0; j <= profileResolution; j++) {
        const zNorm = j / profileResolution
        const y = zNorm * height - height / 2

        const phaseNoise = computeNoise(zNorm)  // single vertical noise used by both LFOs

        const lfo1 = computeLFO(zNorm, lfo1Shape, lfo1Frequency, lfo1Randomness, phaseNoise)
        const lfo2 = computeLFO(zNorm, lfo2Shape, lfo2Frequency, lfo2Randomness, phaseNoise)

        const totalOffset = baseSize + lfo1Amplitude * lfo1 + lfo2Amplitude * lfo2

        const bulge = roundiness * radius * Math.sin(zNorm * Math.PI)
        const baseR = radius + bulge * 0.5

        const x = Math.max(totalOffset + bulge, bulge + minSlatWidth)
        profile.push({ x, y, baseR, thetaCenter })
      }

      return profile
    })
  }, [height, radius, slats, profileResolution, roundiness, baseSize,
      lfo1Shape, lfo1Frequency, lfo1Amplitude, lfo1Randomness,
      lfo2Shape, lfo2Frequency, lfo2Amplitude, lfo2Randomness])

  return (
    <>
      {slatsData.map((profile, i) => {
        const geometry = buildSlatGeometry(profile, twistAngle, tiltAngle)
        const strokeLines = generateStrokeLines(profile, twistAngle, tiltAngle)
        return (
          <group key={i}>
            <mesh geometry={geometry}>
              <meshStandardMaterial color="white" transparent opacity={opacity} side={THREE.DoubleSide} />
            </mesh>
            {strokeLines.map((points, idx) => (
              <Line key={idx} points={points} color="white" lineWidth={1} />
            ))}
          </group>
        )
      })}
    </>
  )
}

function computeNoise(zNorm) {
  // Smooth vertical organic noise (shared for both LFOs)
  return noise(Math.cos(zNorm * Math.PI * 2), Math.sin(zNorm * Math.PI * 2)) 
}

function computeLFO(zNorm, shape, frequency, randomness, phaseNoise) {
  const phaseBase = zNorm * frequency
  const phase = phaseBase + randomness * phaseNoise
  return getWaveform(phase, shape)
}

function getWaveform(phase, shape) {
  const p = phase % 1
  switch (shape) {
    case 'sine':
      return (Math.sin(p * Math.PI * 2) + 1) / 2
    case 'triangle':
      return 1 - Math.abs((p * 2) - 1)
    case 'square':
      return p < 0.5 ? 1 : 0
    case 'flat':
    default:
      return 0
  }
}

function buildSlatGeometry(profile, twistAngle, tiltAngle) {
  const vertices = []
  const indices = []

  for (let j = 0; j < profile.length - 1; j++) {
    const p1 = profile[j]
    const p2 = profile[j + 1]

    vertices.push(
      ...transform(p1, 0, twistAngle, tiltAngle),
      ...transform(p1, p1.x, twistAngle, tiltAngle),
      ...transform(p2, 0, twistAngle, tiltAngle),
      ...transform(p2, p2.x, twistAngle, tiltAngle)
    )

    const base = j * 4
    indices.push(base, base + 2, base + 1)
    indices.push(base + 1, base + 2, base + 3)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function transform(p, localX, twistAngle, tiltAngle) {
  const radial = new THREE.Vector3(Math.cos(p.thetaCenter), 0, Math.sin(p.thetaCenter))
  const vertical = new THREE.Vector3(0, 1, 0)
  const tangent = new THREE.Vector3(-Math.sin(p.thetaCenter), 0, Math.cos(p.thetaCenter))

  let pt = new THREE.Vector3(localX, p.y, 0)
  pt.applyAxisAngle(new THREE.Vector3(1, 0, 0), twistAngle)

  const worldPos = new THREE.Vector3()
    .addScaledVector(radial, p.baseR + pt.x)
    .addScaledVector(vertical, pt.y)
    .addScaledVector(tangent, pt.z)

  const hinge = new THREE.Vector3().addScaledVector(radial, p.baseR)
  worldPos.sub(hinge).applyAxisAngle(vertical, tiltAngle).add(hinge)

  return [worldPos.x, worldPos.y, worldPos.z]
}

function generateStrokeLines(profile, twistAngle, tiltAngle) {
  const leftEdge = profile.map(p => transform(p, 0, twistAngle, tiltAngle))
  const rightEdge = profile.map(p => transform(p, p.x, twistAngle, tiltAngle))

  const topEdge = [
    transform(profile[profile.length - 1], 0, twistAngle, tiltAngle),
    transform(profile[profile.length - 1], profile[profile.length - 1].x, twistAngle, tiltAngle)
  ]

  const bottomEdge = [
    transform(profile[0], 0, twistAngle, tiltAngle),
    transform(profile[0], profile[0].x, twistAngle, tiltAngle)
  ]

  return [leftEdge, rightEdge, topEdge, bottomEdge]
}

