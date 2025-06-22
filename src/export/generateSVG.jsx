import { generateSlatProfiles } from '../core/generator'

export function generateSVG(params) {
  const profiles = generateSlatProfiles(params)

  const spacingX = Math.max(...profiles.map(profile => Math.max(...profile.map(p => p.x)))) + 20
  const spacingY = params.height + 20

  let svgPaths = ''
  
  profiles.forEach((profile, i) => {
    const offsetX = (i % 5) * spacingX
    const offsetY = Math.floor(i / 5) * spacingY

    const minY = Math.min(...profile.map(p => p.y))
    const verticalShift = -minY

    const leftEdge = profile.map(p => `${offsetX},${p.y + verticalShift + offsetY}`)
    const rightEdge = [...profile].reverse().map(p => `${p.x + offsetX},${p.y + verticalShift + offsetY}`)

    const pathData = `M ${leftEdge.join(' L ')} L ${rightEdge.join(' L ')} Z`

    svgPaths += `<path d="${pathData}" stroke="black" stroke-width="0.1" fill="none" />\n`
  })

  const totalCols = Math.min(5, profiles.length)
  const totalRows = Math.ceil(profiles.length / 5)
  const totalWidth = totalCols * spacingX
  const totalHeight = totalRows * spacingY

  return `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${totalWidth}mm"
     height="${totalHeight}mm"
     viewBox="0 0 ${totalWidth} ${totalHeight}">
  ${svgPaths}
</svg>
  `
}

