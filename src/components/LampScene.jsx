import React, { useMemo } from 'react'
import { createNoise2D } from 'simplex-noise'
import * as THREE from 'three'
import { Line } from '@react-three/drei'

const globalNoise2D = createNoise2D()

export default function LampScene({ params }) {
  const {
    height, radius, slats, waviness, angleOffset,
    roundiness, opacity, waveSharpness, twistAngle, tiltAngle
  } = params

  const minSlatWidth = 5 // mm

  const slatsData = useMemo(() => {
    return Array.from({ length: slats }).map((_, i) => {
      const thetaCenter = (i / slats) * Math.PI * 2 + angleOffset
      const profile = []

      for (let j = 0; j <= 30; j++) {
        const zNorm = j / 30
        const y = zNorm * height - height / 2

        const sharedWave = globalNoise2D(zNorm * waveSharpness, 0)
        const slatVariation = globalNoise2D(zNorm * 5, i * 0.5)
        const offset = sharedWave * waviness + slatVariation * waviness * 0.3

        const bulge = roundiness * radius * Math.sin(zNorm * Math.PI)
        const innerR = radius + bulge * 0.5

        const outerOffset = Math.max(offset, minSlatWidth)
        const x = outerOffset + bulge

        profile.push({ x, y, innerR, thetaCenter })
      }

      return profile
    })
  }, [height, radius, slats, waviness, angleOffset, roundiness, waveSharpness])

  return (
    <>
      {slatsData.map((profile, i) => {
        const geometry = generateSlatGeometry(profile, twistAngle, tiltAngle)
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

function generateSlatGeometry(profile, twistAngle, tiltAngle) {
  const vertices = []
  const indices = []

  for (let j = 0; j < profile.length - 1; j++) {
    const p1 = profile[j]
    const p2 = profile[j + 1]

    const p1Left = { x: 0, y: p1.y }
    const p1Right = { x: p1.x, y: p1.y }
    const p2Left = { x: 0, y: p2.y }
    const p2Right = { x: p2.x, y: p2.y }

    vertices.push(
      ...transformAndWrap(p1Left, p1, twistAngle, tiltAngle),
      ...transformAndWrap(p1Right, p1, twistAngle, tiltAngle),
      ...transformAndWrap(p2Left, p2, twistAngle, tiltAngle),
      ...transformAndWrap(p2Right, p2, twistAngle, tiltAngle)
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

function generateStrokeLines(profile, twistAngle, tiltAngle) {
  const leftEdge = profile.map(p => transformAndWrap({ x: 0, y: p.y }, p, twistAngle, tiltAngle))
  const rightEdge = profile.map(p => transformAndWrap({ x: p.x, y: p.y }, p, twistAngle, tiltAngle))

  const topEdge = [
    transformAndWrap({ x: 0, y: profile[profile.length - 1].y }, profile[profile.length - 1], twistAngle, tiltAngle),
    transformAndWrap({ x: profile[profile.length - 1].x, y: profile[profile.length - 1].y }, profile[profile.length - 1], twistAngle, tiltAngle)
  ]

  const bottomEdge = [
    transformAndWrap({ x: 0, y: profile[0].y }, profile[0], twistAngle, tiltAngle),
    transformAndWrap({ x: profile[0].x, y: profile[0].y }, profile[0], twistAngle, tiltAngle)
  ]

  return [leftEdge, rightEdge, topEdge, bottomEdge]
}

function transformAndWrap(local, profilePoint, twistAngle, tiltAngle) {
  const { innerR, thetaCenter } = profilePoint

  // Build slat's tangent frame at this theta
  const radial = new THREE.Vector3(Math.cos(thetaCenter), 0, Math.sin(thetaCenter))
  const vertical = new THREE.Vector3(0, 1, 0)
  const tangent = new THREE.Vector3(-Math.sin(thetaCenter), 0, Math.cos(thetaCenter))

  // Convert flat slat point to local 3D
  let point = new THREE.Vector3(local.x, local.y, 0)

  // Apply twist (around local X axis → radial direction)
  const twistQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), twistAngle)
  point.applyQuaternion(twistQuat)

  // Apply tilt (around local Y axis → vertical direction)
  const tiltQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), tiltAngle)
  point.applyQuaternion(tiltQuat)

  // Map local slat point into world space using slat frame
  const worldPos = new THREE.Vector3()
    .addScaledVector(radial, innerR + point.x)
    .addScaledVector(vertical, point.y)
    .addScaledVector(tangent, point.z)

  return [worldPos.x, worldPos.y, worldPos.z]
}

