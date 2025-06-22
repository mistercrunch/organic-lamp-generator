import { createNoise2D } from 'simplex-noise'
const globalNoise2D = createNoise2D()

function computeLFO(shape, freq, amp, zNorm, slatIndex, phaseRand, ampRand) {
  if (shape === 'flat') return 0

  const phaseOffset = phaseRand > 0 ? globalNoise2D(zNorm, slatIndex) * phaseRand * 2 * Math.PI : 0
  const ampOffset = ampRand > 0 ? globalNoise2D(zNorm * 2, slatIndex * 3) * ampRand * amp : 0
  const fullAmp = amp + ampOffset

  const cycles = zNorm * freq
  const posInCycle = cycles - Math.floor(cycles)

  if (shape === 'square') {
    return posInCycle < 0.5 ? fullAmp : 0
  }
  if (shape === 'triangle') {
    const up = posInCycle < 0.5
    const local = up ? posInCycle * 2 : 1 - (posInCycle - 0.5) * 2
    return local * fullAmp
  }
  if (shape === 'sine') {
    const phase = 2 * Math.PI * cycles + phaseOffset
    return ((Math.sin(phase) + 1) / 2) * fullAmp
  }

  return 0
}

export function generateSlatProfiles(params) {
  const {
    height,
    radius,
    slats,
    roundiness,
    baseSize,
    coneAngle,
    lfo1Shape,
    lfo1Frequency,
    lfo1Amplitude,
    lfo1PhaseRandomness,
    lfo1AmplitudeRandomness,
    lfo2Shape,
    lfo2Frequency,
    lfo2Amplitude,
    lfo2PhaseRandomness,
    lfo2AmplitudeRandomness,
  } = params

  const profiles = []

  const maxFreq = Math.max(lfo1Frequency, lfo2Frequency)
  const pointsPerCycle = 50
  const steps = Math.max(Math.ceil(maxFreq * pointsPerCycle), 1000)

  for (let i = 0; i < slats; i++) {
    const thetaNorm = i / slats
    const profile = []

    for (let j = 0; j <= steps; j++) {
      const zNorm = j / steps
      const y = zNorm * height - height / 2

      const lfo1 = computeLFO(
        lfo1Shape,
        lfo1Frequency,
        lfo1Amplitude,
        zNorm,
        i,
        lfo1PhaseRandomness,
        lfo1AmplitudeRandomness
      )
      const lfo2 = computeLFO(
        lfo2Shape,
        lfo2Frequency,
        lfo2Amplitude,
        zNorm,
        i,
        lfo2PhaseRandomness,
        lfo2AmplitudeRandomness
      )

      const bulge = roundiness * radius * Math.sin(zNorm * Math.PI)
      const rOffset = coneAngle * (zNorm - 0.5) * height
      const innerR = radius + rOffset + bulge * 0.5

      const width = baseSize + lfo1 + lfo2

      profile.push({
        x: width,
        y,
        baseR: innerR,
        thetaNorm,
      })
    }
    profiles.push(profile)
  }
  return profiles
}
