import React, { useMemo } from 'react'
import * as THREE from 'three'
import { generateSlatProfiles } from '../core/generator'
import { Line } from '@react-three/drei'

export default function LampScene({ params }) {
  const profiles = useMemo(() => generateSlatProfiles(params, 'render'), [params])

  return (
    <>
      {profiles.map((profile, i) => {
        const theta = (i / profiles.length) * Math.PI * 2

        const geometry = buildGeometry(profile, params, theta)
        const strokePoints = buildStroke(profile, params, theta)

        return (
          <group key={i}>
            <mesh geometry={geometry}>
              <meshStandardMaterial
                color={params.color}
                transparent
                opacity={params.opacity}
                side={THREE.DoubleSide}
              />
            </mesh>
            <Line points={strokePoints} color="black" lineWidth={1} />
          </group>
        )
      })}
    </>
  )
}

function buildGeometry(profile, params, theta) {
  const vertices = []
  const indices = []

  for (let j = 0; j < profile.length - 1; j++) {
    const p1 = profile[j]
    const p2 = profile[j + 1]

    const p1L = transformToWorld(p1, 0, params, theta)
    const p1R = transformToWorld(p1, p1.x, params, theta)
    const p2L = transformToWorld(p2, 0, params, theta)
    const p2R = transformToWorld(p2, p2.x, params, theta)

    vertices.push(...p1L, ...p1R, ...p2L, ...p2R)

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

function buildStroke(profile, params, theta) {
  const leftEdge = profile.map((p) => transformToWorld(p, 0, params, theta))
  const rightEdge = [...profile].reverse().map((p) => transformToWorld(p, p.x, params, theta))
  const closed = [...leftEdge, ...rightEdge, leftEdge[0]]
  return closed.map(([x, y, z]) => new THREE.Vector3(x, y, z))
}
function transformToWorld(p, offsetX, params, theta) {
  // Build flat slat-local position
  const localX = offsetX
  const localY = p.y
  let localPos = new THREE.Vector3(localX, localY, 0)

  // Align slats so they face outward at blindsTiltAngle = 0
  const alignQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2)

  localPos.applyQuaternion(alignQ)

  // Apply blinds tilt (around slat-local Y)
  const blindsQ = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    params.blindsTiltAngle
  )
  localPos.applyQuaternion(blindsQ)

  // Apply spiral twist (around slat-local Z)
  const spiralQ = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    params.spiralTwistAngle
  )
  localPos.applyQuaternion(spiralQ)

  // Apply cone deformation (radial offset grows with vertical position)
  const zNorm = (localY + params.height / 2) / params.height
  const coneOffset = params.coneAngle * (zNorm - 0.5) * params.height
  const finalR = p.baseR + coneOffset

  // Translate outward along slat-local Z by final radius
  localPos.z += finalR

  // Rotate into cylinder around global Y by theta
  const cosTheta = Math.cos(theta)
  const sinTheta = Math.sin(theta)
  const worldX = cosTheta * localPos.z - sinTheta * localPos.x
  const worldY = localPos.y
  const worldZ = sinTheta * localPos.z + cosTheta * localPos.x

  return [worldX, worldY, worldZ]
}
