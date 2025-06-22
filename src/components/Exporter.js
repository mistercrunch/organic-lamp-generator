import { createNoise2D } from 'simplex-noise'

const noise = new SimplexNoise()

export function exportSVG(params) {
  const { height, radius, slats, waviness } = params
  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('width', '1000')
  svg.setAttribute('height', '1000')

  for (let i = 0; i < slats; i++) {
    const path = document.createElementNS(svgNS, 'path')
    let d = ''
    for (let j = 0; j <= 30; j++) {
      const zNorm = j / 30
      const z = zNorm * height
      const baseOffset = noise2D(zNorm * 3, i * 0.3)
      const detail = noise2D(zNorm * 15, i * 0.5)
      const offset = (baseOffset + 0.5 * detail) * waviness
      const x = i * 50 + offset
      const y = height - z
      d += (j === 0 ? 'M' : 'L') + `${x},${y} `
    }
    path.setAttribute('d', d)
    path.setAttribute('stroke', 'black')
    path.setAttribute('fill', 'none')
    svg.appendChild(path)
  }

  const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'lamp.svg'
  link.click()
}
