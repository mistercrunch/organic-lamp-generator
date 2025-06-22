import fs from 'fs'
import { generateSlatProfiles } from '../core/generator'

export function exportToSVG(params, outputPath) {
  const profiles = generateSlatProfiles(params)

  // Flatten profiles into SVG paths
  const svgPaths = profiles.map((profile, index) => {
    const path = profile
      .map((p, i) => {
        const prefix = i === 0 ? 'M' : 'L'
        return `${prefix} ${p.x.toFixed(2)} ${(-p.y).toFixed(2)}`
      })
      .join(' ')
    return `<path d="${path} Z" stroke="black" fill="none" />`
  })

  // Arrange in simple grid for now (1 slat per row)
  const spacing = params.height + 20
  const wrappedPaths = svgPaths
    .map((path, i) => {
      const offsetY = i * spacing
      return `<g transform="translate(0, ${offsetY})">${path}</g>`
    })
    .join('\n')

  const width = Math.max(...profiles.map((p) => Math.max(...p.map((pt) => pt.x)))) + 20
  const height = profiles.length * spacing + 20

  const svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${wrappedPaths}
  </svg>`

  fs.writeFileSync(outputPath, svgContent)
  console.log(`✅ SVG exported: ${outputPath}`)
}
