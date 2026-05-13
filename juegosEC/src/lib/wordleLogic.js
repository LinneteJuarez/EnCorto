/** @typedef {'correct' | 'present' | 'absent'} CeldaEstado */

/**
 * Evalúa un intento frente a la solución (reglas tipo Wordle).
 * @param {string} solucion
 * @param {string} intento
 * @returns {CeldaEstado[]}
 */
export function evaluarIntento(solucion, intento) {
  const sol = solucion.toUpperCase()
  const g = intento.toUpperCase()
  /** @type {CeldaEstado[]} */
  const out = Array(5).fill('absent')
  const cuenta = {}
  for (let i = 0; i < 5; i++) {
    const ch = sol[i]
    cuenta[ch] = (cuenta[ch] || 0) + 1
  }
  for (let i = 0; i < 5; i++) {
    if (g[i] === sol[i]) {
      out[i] = 'correct'
      cuenta[g[i]]--
    }
  }
  for (let i = 0; i < 5; i++) {
    if (out[i] === 'correct') continue
    if (cuenta[g[i]] > 0) {
      out[i] = 'present'
      cuenta[g[i]]--
    }
  }
  return out
}

/**
 * Mejora el mapa de teclas con los estados más informativos.
 * @param {Record<string, CeldaEstado | undefined>} prev
 * @param {string} intento
 * @param {CeldaEstado[]} estados
 */
export function combinarTeclado(prev, intento, estados) {
  const next = { ...prev }
  for (let i = 0; i < 5; i++) {
    const letra = intento[i].toUpperCase()
    const st = estados[i]
    const cur = next[letra]
    const rank = { absent: 0, present: 1, correct: 2 }
    if (!cur || rank[st] > rank[cur]) next[letra] = st
  }
  return next
}
