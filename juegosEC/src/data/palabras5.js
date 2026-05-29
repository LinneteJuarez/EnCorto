/**
 * Listado desde `an-array-of-spanish-words` (main = index.json).
 * Normalizamos a mayúsculas sin marcas diacríticas para coincidir con el teclado del juego.
 */
import palabrasRaw from 'an-array-of-spanish-words/index.json' with { type: 'json' }

function sinMarcas(s) {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
}

const CINCO_LETRAS = palabrasRaw
  .filter((w) => typeof w === 'string' && w.length === 5)
  .map((w) => sinMarcas(w))
  .filter((w) => w.length === 5 && /^[A-ZÑ]+$/.test(w))

export const PALABRAS_ORDENADAS = [...new Set(CINCO_LETRAS)].sort()
export const PALABRAS_VALIDAS = new Set(PALABRAS_ORDENADAS)

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleIndices(length, seed) {
  const indices = Array.from({ length }, (_, i) => i)
  const rng = mulberry32(seed)
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
}

/** Índices mezclados una vez: evita rachas alfabéticas (el JSON viene ordenado). */
const INDICES_MEZCLADOS = shuffleIndices(PALABRAS_ORDENADAS.length, 0x3ec0e705)

function diasDesdeEpoch(d = new Date()) {
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000,
  )
}

export function palabraDelDia(d = new Date()) {
  const n = PALABRAS_ORDENADAS.length
  if (!n) return 'PERRO'
  const slot = ((diasDesdeEpoch(d) % n) + n) % n
  const i = INDICES_MEZCLADOS[slot]
  return PALABRAS_ORDENADAS[i]
}

/** Definición opcional por palabra; null si no hay texto que mostrar. */
const DEFINICIONES = Object.freeze({})

export function definicionDe(palabra) {
  const key = palabra?.toUpperCase?.() ?? ''
  const def = DEFINICIONES[key]
  return typeof def === 'string' && def.trim() ? def.trim() : null
}
