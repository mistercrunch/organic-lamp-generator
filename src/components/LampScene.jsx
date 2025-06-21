import React, { useMemo } from 'react'
import { createNoise2D } from 'simplex-noise'
import * as THREE from 'three'

const globalNoise2D = createNoise2D()

export default function LampScene({ params }) {
  const { height, radius, slats, waviness, angleOffset, roundiness, opacity } = params

  const slatsData = useMemo(() => {
    return Array.from({ length: slats }).map((_, i) => {
      const theta = (i / slats) * Math.PI * 2 + angleOffset
      const profile = []

      for (let j = 0; j <= 30; j++) {
        const zNorm = j / 30
        const z = zNorm * height

        const sharedWave = globalNoise2D(zNorm * 2, 0)
        const slatVariation = globalNoise2D(zNorm * 5, i * 0.5)
        const offset = sharedWave * waviness + slatVariation * waviness * 0.3

        const baseRadius = radius + offset
        const bulge = roundiness * baseRadius * Math.sin(zNorm * Math.PI)
        const effectiveR = baseRadius + bulge

        const x = effectiveR * Math.cos(theta)
        const y = z
        const z3 = effectiveR * Math.sin(theta)
        profile.push([x, y, z3])
      }

      return profile
    })
  }, [height, radius, slats, waviness, angleOffset, roundiness])

  return (
    <>
      {slatsData.map((profile, i) => {
        const geometry = generateGeometry(profile)
        return (
          <mesh key={i} geometry={geometry}>
            <meshStandardMaterial color="white" transparent opacity={opacity} />
          </mesh>
        )
      })}
    </>
  )
}

function generateGeometry(profile) {
  const vertices = []
  const indices = []

  for (let j = 0; j < profile.length - 1; j++) {
    const [x1, y1, z1] = profile[j]
    const [x2, y2, z2] = profile[j + 1]

    const width = 2

    const normal = normalize(cross([x2 - x1, 0, z2 - z1], [0, 1, 0]))
    const [nx, ny, nz] = normal

    vertices.push(x1 + nx * width, y1, z1 + nz * width)
    vertices.push(x1 - nx * width, y1, z1 - nz * width)
    vertices.push(x2 + nx * width, y2, z2 + nz * width)
    vertices.push(x2 - nx * width, y2, z2 - nz * width)

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

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ]
}

function normalize(v) {
  const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

