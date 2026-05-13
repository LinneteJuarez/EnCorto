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

function isoUTC(d = new Date()) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function hash32(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

export function palabraDelDia(d = new Date()) {
  const n = PALABRAS_ORDENADAS.length
  if (!n) return 'PERRO'
  const i = Math.abs(hash32(`encorto-wordle|${isoUTC(d)}`)) % n
  return PALABRAS_ORDENADAS[i]
}

export function definicionDe(p) {
  void p
  return 'Palabra válida en español (listado amplio; sin definición enlazada).'
}
