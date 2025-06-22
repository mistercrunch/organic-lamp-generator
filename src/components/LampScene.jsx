import React, { useMemo } from 'react'
import * as THREE from 'three'
import { generateSlatProfiles } from '../core/generator'
import { Line } from '@react-three/drei'

export default function LampScene({ params }) {
  const profiles = useMemo(() => generateSlatProfiles(params, 'render'), [params])

  return (
    <>
      {profiles.map((profile, i) => {
        const geometry = buildGeometry(profile, params)
        const strokePoints = buildStroke(profile, params)

        return (
          <group key={i}>
            <mesh geometry={geometry}>
              <meshStandardMaterial color="white" transparent opacity={params.opacity} side={THREE.DoubleSide} />
            </mesh>
            <Line points={strokePoints} color="black" lineWidth={1} />
          </group>
        )
      })}
    </>
  )
}

function buildGeometry(profile, params) {
  const vertices = []
  const indices = []

  for (let j = 0; j < profile.length - 1; j++) {
    const p1 = profile[j]
    const p2 = profile[j + 1]

    const p1L = transformToWorld(p1, 0, params)
    const p1R = transformToWorld(p1, p1.x, params)
    const p2L = transformToWorld(p2, 0, params)
    const p2R = transformToWorld(p2, p2.x, params)

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

function buildStroke(profile, params) {
  const leftEdge = profile.map(p => transformToWorld(p, 0, params))
  const rightEdge = [...profile].reverse().map(p => transformToWorld(p, p.x, params))
  const closed = [...leftEdge, ...rightEdge, leftEdge[0]]
  return closed.map(([x, y, z]) => new THREE.Vector3(x, y, z))
}

function transformToWorld(p, offsetX, params) {
  const theta = p.thetaNorm * Math.PI * 2
  const r = p.baseR + offsetX

  // World space initial position
  let pos = new THREE.Vector3(
    Math.cos(theta) * r,
    p.y,
    Math.sin(theta) * r
  )

  // Build slat-local frame
  const radial = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta))  // Z (normal)
  const vertical = new THREE.Vector3(0, 1, 0)                            // Y (height)
  const tangent = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta))// X (width)

  // Move into slat-local coordinates
  const localX = tangent.dot(pos)
  const localY = vertical.dot(pos)
  const localZ = radial.dot(pos)
  let localPos = new THREE.Vector3(localX, localY, localZ)

  // Spiral twist: slat-local Z rotation
  const spiralQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), params.spiralTwistAngle)
  localPos.applyQuaternion(spiralQ)

  // Blinds tilt: slat-local Y rotation (closing blinds)
  const blindsQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), params.blindsTiltAngle)
  localPos.applyQuaternion(blindsQ)

  // Back to world coordinates
  pos = new THREE.Vector3()
  pos.addScaledVector(tangent, localPos.x)
  pos.addScaledVector(vertical, localPos.y)
  pos.addScaledVector(radial, localPos.z)

  return [pos.x, pos.y, pos.z]
}

