import { generateSlatProfiles } from '../core/generator'

export function generateSlatsSVG(params) {
  const { height, slats, materialThickness } = params

  const defaultMaterialThickness = 5
  const effectiveMaterialThickness = (typeof materialThickness === 'number') ? materialThickness : defaultMaterialThickness

  const clearance = 0.5
  const notchWidth = effectiveMaterialThickness * 2 // twice thickness for notch width
  const notchDepth = effectiveMaterialThickness

  const profiles = generateSlatProfiles(params)

  const cols = 10
  const colSpacing = 2
  const rowSpacing = 2
  const margin = 3

  let packed = profiles.map((profile) => {
    const minY = Math.min(...profile.map(p => p.y))
    const maxY = Math.max(...profile.map(p => p.y))
    const slatHeight = maxY - minY
    const slatWidth = Math.max(...profile.map(p => p.x))
    return { profile, slatHeight, slatWidth }
  })

  const maxWidth = Math.max(...packed.map(p => p.slatWidth))
  const maxHeight = Math.max(...packed.map(p => p.slatHeight))

  const numRows = Math.ceil(slats / cols)

  const svgWidth = margin * 2 + cols * (maxWidth + colSpacing)
  const svgHeight = margin * 2 + numRows * (maxHeight + rowSpacing)

  let elements = []
  packed.forEach((p, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)

    const offsetX = margin + col * (maxWidth + colSpacing)
    const offsetY = margin + row * (maxHeight + rowSpacing)

    // Build slat path
    const d = [
      ...p.profile.map((pt, idx) => {
        const x = offsetX + pt.baseR
        const y = offsetY + (pt.y - (-height / 2))
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(3)} ${y.toFixed(3)}`
      }),
      ...[...p.profile].reverse().map(pt => {
        const x = offsetX + pt.baseR + pt.x
        const y = offsetY + (pt.y - (-height / 2))
        return `L ${x.toFixed(3)} ${y.toFixed(3)}`
      }),
      `Z`
    ].join(' ')

    elements.push(`<path d="${d}" stroke="black" fill="none"/>`)

    // Notches inside the slat, aligned with roundiness
    const notchZNorms = [0.25, 0.75]
    notchZNorms.forEach(zNorm => {
      const targetY = zNorm * height - height / 2
      // Find closest point in profile by y
      let closestPt = p.profile[0]
      let minDiff = Math.abs(p.profile[0].y - targetY)
      for (const pt of p.profile) {
        const diff = Math.abs(pt.y - targetY)
        if (diff < minDiff) {
          minDiff = diff
          closestPt = pt
        }
      }
      const xNotch = offsetX + closestPt.baseR
      const yNotch = offsetY + (closestPt.y - (-height / 2))
      elements.push(
        `<rect x="${(xNotch - notchDepth).toFixed(3)}" y="${(yNotch - notchWidth / 2).toFixed(3)}" width="${notchDepth}" height="${notchWidth}" stroke="black" fill="none"/>`
      )
    })
  })

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
${elements.join('\n')}
</svg>`.trim()
}

export function generateDonutSVG(params) {
  const { radius, roundiness, coneAngle, height, slats, materialThickness, blindsTiltAngle } =
    params

  const margin = 20
  const donutSpacing = 50

  const defaultMaterialThickness = 5
  const effectiveMaterialThickness =
    typeof materialThickness === 'number' ? materialThickness : defaultMaterialThickness

  const clearance = 0.5
  const notchWidth = effectiveMaterialThickness + clearance
  const notchDepth = effectiveMaterialThickness * 4

  const donutPositions = [0.25, 0.75]
  const donutRings = donutPositions.map((zNorm) => {
    const bulge = roundiness * radius * Math.sin(zNorm * Math.PI)
    const rOffset = coneAngle * (zNorm - 0.5) * height
    const donutRadius = radius + rOffset + bulge * 0.5
    return { zNorm, donutRadius: Math.max(0, donutRadius) }
  })

  const totalWidth =
    donutRings.reduce(
      (acc, ring, idx) => acc + (idx > 0 ? donutSpacing : 0) + ring.donutRadius * 2,
      0
    ) +
    margin * 2

  const totalHeight = Math.max(...donutRings.map((r) => r.donutRadius)) * 2 + margin * 2

  let currentX = margin

  const donutPaths = donutRings
    .map((ring, ringIndex) => {
      const centerX = currentX + ring.donutRadius
      const centerY = margin + ring.donutRadius
      currentX += ring.donutRadius * 2 + (ringIndex < donutRings.length - 1 ? donutSpacing : 0)

      const outerCircle = `<circle cx="${centerX}" cy="${centerY}" r="${ring.donutRadius}" stroke="black" fill="none"/>`

      const blindsTiltDegrees = (blindsTiltAngle || 0) * (180 / Math.PI)

      const slots = Array.from({ length: slats })
        .map((_, i) => {
          const theta = (i / slats) * 2 * Math.PI

          // Compute initial slot center position
          const baseX = centerX + ring.donutRadius * Math.cos(theta)
          const baseY = centerY + ring.donutRadius * Math.sin(theta)

          // Apply outward shift before rotation
          const shift = notchWidth / 2
          const correctedX = baseX + shift * Math.cos(theta)
          const correctedY = baseY + shift * Math.sin(theta)

          const angle = (theta * 180) / Math.PI - 90 + blindsTiltDegrees

          return `
        <g transform="translate(${correctedX},${correctedY}) rotate(${angle})">
          <rect x="${-notchWidth / 2}" y="${-notchDepth}" width="${notchWidth}" height="${notchDepth}" stroke="black" fill="none"/>
        </g>`
        })
        .join('\n')

      return `${outerCircle}\n${slots}`
    })
    .join('\n')

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}mm" height="${totalHeight}mm" viewBox="0 0 ${totalWidth} ${totalHeight}">
${donutPaths}
</svg>`.trim()
}
