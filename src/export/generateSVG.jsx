
import { generateSlatProfiles } from '../core/generator'


export function generateSlatsSVG(params) {
  const { materialThickness, height } = params

  const defaultMaterialThickness = 5
  const effectiveMaterialThickness = (typeof materialThickness === 'number') ? materialThickness : defaultMaterialThickness

  const clearance = 0.5
  const notchWidth = effectiveMaterialThickness + clearance
  const notchDepth = effectiveMaterialThickness * 1;

  const margin = 20
  const spacing = 20

  const profiles = generateSlatProfiles(params)

  let yOffset = margin

  const packed = profiles.map((profile, i) => {
    const minY = Math.min(...profile.map(p => p.y))
    const maxY = Math.max(...profile.map(p => p.y))
    const slatHeight = maxY - minY

    const pathPoints = [
      ...profile.map(p => [0, p.y - minY - yOffset]),
      ...[...profile].reverse().map(p => [p.x, p.y - minY - yOffset]),
      [0, profile[0].y - minY - yOffset]
    ]

    const notchPositions = [0.25, 0.75].map(zNorm => {
      const y = (zNorm * height - height / 2) - minY - yOffset
      return { x: 0, y }
    })

    const label = {
      text: `${i + 1}`,
      x: 5,
      y: pathPoints[0][1] + 10
    }

    yOffset += slatHeight + spacing

    return { pathPoints, notchPositions, label }
  })

  const maxWidth = Math.max(...packed.flatMap(p => p.pathPoints.map(([x]) => x))) + margin + 20
  const totalHeight = yOffset + margin

  const svgPaths = packed.map(p => {
    const d = p.pathPoints.map(([x, y], idx) => {
      const cmd = (idx === 0) ? 'M' : 'L'
      return `${cmd}${x.toFixed(3)},${(-y).toFixed(3)}`
    }).join(' ') + ' Z'
    return `<path d="${d}" stroke="black" fill="none"/>`
  }).join('\n')

  const svgNotches = packed.flatMap(p => {
    return p.notchPositions.map(pos => {
      return `<rect x="0" y="${-pos.y - notchWidth / 2}" width="${notchDepth}" height="${notchWidth}" stroke="black" fill="none" stroke-width="1" />`
    })
  }).join('\n')

  const svgLabels = packed.map(p => {
    return `<text x="${p.label.x}" y="${-p.label.y}" font-size="5" fill="black">${p.label.text}</text>`
  }).join('\n')

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${maxWidth}" height="${totalHeight}" viewBox="0 0 ${maxWidth} ${totalHeight}">
${svgPaths}
${svgNotches}
${svgLabels}
</svg>`.trim()
}


export function generateDonutSVG(params) {
  const { radius, roundiness, coneAngle, height, slats, materialThickness, blindsTiltAngle } = params

  const margin = 20
  const donutSpacing = 50

  const defaultMaterialThickness = 5
  const effectiveMaterialThickness = (typeof materialThickness === 'number') ? materialThickness : defaultMaterialThickness

  const clearance = 0.5
  const notchWidth = effectiveMaterialThickness + clearance
  const notchDepth = effectiveMaterialThickness * 4

  const donutPositions = [0.25, 0.75]
  const donutRings = donutPositions.map(zNorm => {
    const bulge = roundiness * radius * Math.sin(zNorm * Math.PI)
    const rOffset = coneAngle * (zNorm - 0.5) * height
    const donutRadius = radius + rOffset + bulge * 0.5
    return { zNorm, donutRadius: Math.max(0, donutRadius) }
  })

  const totalWidth = donutRings.reduce(
    (acc, ring, idx) => acc + (idx > 0 ? donutSpacing : 0) + ring.donutRadius * 2,
    0
  ) + margin * 2

  const totalHeight = Math.max(...donutRings.map(r => r.donutRadius)) * 2 + margin * 2

  let currentX = margin

  const donutPaths = donutRings.map((ring, ringIndex) => {
    const centerX = currentX + ring.donutRadius
    const centerY = margin + ring.donutRadius
    currentX += ring.donutRadius * 2 + (ringIndex < donutRings.length - 1 ? donutSpacing : 0)

    const outerCircle = `<circle cx="${centerX}" cy="${centerY}" r="${ring.donutRadius}" stroke="black" fill="none"/>`

    const blindsTiltDegrees = (blindsTiltAngle || 0) * (180 / Math.PI)

    const slots = Array.from({ length: slats }).map((_, i) => {
      const theta = (i / slats) * 2 * Math.PI

      // Compute initial slot center position
      const baseX = centerX + ring.donutRadius * Math.cos(theta)
      const baseY = centerY + ring.donutRadius * Math.sin(theta)

      // Apply outward shift before rotation
      const shift = notchWidth / 2
      const correctedX = baseX + shift * Math.cos(theta)
      const correctedY = baseY + shift * Math.sin(theta)

      const angle = (theta * 180 / Math.PI) - 90 + blindsTiltDegrees

      return `
        <g transform="translate(${correctedX},${correctedY}) rotate(${angle})">
          <rect x="${-notchWidth/2}" y="${-notchDepth}" width="${notchWidth}" height="${notchDepth}" stroke="black" fill="none"/>
        </g>`
    }).join('\n')

    return `${outerCircle}\n${slots}`
  }).join('\n')

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}mm" height="${totalHeight}mm" viewBox="0 0 ${totalWidth} ${totalHeight}">
${donutPaths}
</svg>`.trim()
}


