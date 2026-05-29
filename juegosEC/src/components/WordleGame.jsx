import { useCallback, useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { definicionDe, palabraDelDia, PALABRAS_VALIDAS } from '../data/palabras5'
import { combinarTeclado, evaluarIntento } from '../lib/wordleLogic'

const MAX = 6
const ROW_KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
]

function normalizarTecla(key) {
  if (key === 'Backspace') return 'BACK'
  if (key === 'Enter') return 'ENTER'
  const k = key.length === 1 ? key.toUpperCase() : ''
  if (k === 'Ñ' || (k >= 'A' && k <= 'Z')) return k
  return null
}

async function compartirResultado(shareBtn) {
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const title = 'En Corto — La Palabra'
  const text = `Jugué «La Palabra» en En Corto.\n${url}`
  const prev = shareBtn?.textContent
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      if (shareBtn) {
        shareBtn.textContent = 'Copiado'
        window.setTimeout(() => {
          shareBtn.textContent = prev ?? 'Compartir resultado'
        }, 1600)
      }
      return
    }
    window.prompt('Copia tu resultado:', text)
  } catch (err) {
    if (err?.name === 'AbortError') return
    window.prompt('Copia tu resultado:', text)
  }
}

function lanzarConfettiVictoria() {
  const base = { spread: 72, ticks: 140, startVelocity: 38, zIndex: 200 }
  confetti({ ...base, particleCount: 90, origin: { x: 0.25, y: 0.55 } })
  confetti({ ...base, particleCount: 90, origin: { x: 0.75, y: 0.55 } })
  window.setTimeout(() => {
    confetti({ ...base, particleCount: 70, origin: { x: 0.5, y: 0.35 }, scalar: 0.9 })
  }, 180)
}

export function WordleGame({ onBack }) {
  const solucion = useMemo(() => palabraDelDia(), [])
  const definicion = useMemo(() => definicionDe(solucion), [solucion])
  const [intentos, setIntentos] = useState([])
  const [actual, setActual] = useState('')
  const [estados, setEstados] = useState([])
  const [teclas, setTeclas] = useState({})
  const [fin, setFin] = useState(null)
  const [msg, setMsg] = useState('')
  const [shake, setShake] = useState(false)

  const victoria = fin === 'win'
  const derrota = fin === 'lose'

  const enviar = useCallback(() => {
    if (fin) return
    const pal = actual.toUpperCase()
    if (pal.length < 5) {
      setMsg('Faltan letras')
      return
    }
    if (!PALABRAS_VALIDAS.has(pal)) {
      setMsg('No está en la lista')
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }
    const ev = evaluarIntento(solucion, pal)
    setIntentos((prev) => [...prev, pal])
    setEstados((prev) => [...prev, ev])
    setTeclas((prev) => combinarTeclado(prev, pal, ev))
    setActual('')
    setMsg('')
    if (pal === solucion) setFin('win')
    else if (intentos.length + 1 >= MAX) setFin('lose')
  }, [actual, fin, intentos.length, solucion])

  const tecla = useCallback(
    (k) => {
      if (fin) return
      if (k === 'BACK') {
        setActual((s) => s.slice(0, -1))
        setMsg('')
        return
      }
      if (k === 'ENTER') {
        enviar()
        return
      }
      setActual((s) => (s.length < 5 ? s + k : s))
      setMsg('')
    },
    [enviar, fin],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (fin) return
      const n = normalizarTecla(e.key)
      if (!n) return
      e.preventDefault()
      tecla(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fin, tecla])

  useEffect(() => {
    if (fin !== 'win') return
    lanzarConfettiVictoria()
  }, [fin])

  const rendirse = () => setFin('lose')

  return (
    <div className="wordle-screen">
      <header className="ec-topbar">
        <button type="button" className="ec-btn" onClick={onBack}>
          ← Juegos
        </button>
        <h1>La Palabra</h1>
        <button type="button" className="ec-btn ec-btn--accent" onClick={rendirse}>
          Rendirse
        </button>
      </header>

      <div className="wordle-center">
        <p className="wordle-day-label">Palabra del día</p>
        <div className="wordle-board" aria-label="Tablero">
          {Array.from({ length: MAX }, (_, fila) => {
            const pal = intentos[fila]
            const st = estados[fila]
            const esActual = fila === intentos.length && !fin
            const rowShake = shake && esActual
            return (
              <div key={fila} className={`w-row${rowShake ? ' w-row--shake' : ''}`}>
                {Array.from({ length: 5 }, (_, c) => {
                  const letra = esActual ? actual[c] ?? '' : pal?.[c] ?? ''
                  const estado = esActual ? null : st?.[c]
                  const cl = ['w-cell']
                  if (letra) cl.push('filled')
                  if (estado) cl.push(estado)
                  return (
                    <div key={c} className={cl.join(' ')}>
                      {letra}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        <p className="wordle-msg" role="status">
          {msg}
        </p>
        <div className="wordle-keyboard" role="group" aria-label="Teclado">
          {ROW_KEYS.map((row, ri) => (
            <div key={ri} className="wk-row">
              {row.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={
                    'wk-key' +
                    (k === 'ENTER' || k === 'BACK' ? ' wk-key--wide' : '') +
                    (teclas[k] ? ` ${teclas[k]}` : '')
                  }
                  onClick={() => tecla(k === 'BACK' ? 'BACK' : k === 'ENTER' ? 'ENTER' : k)}
                >
                  {k === 'BACK' ? '⌫' : k === 'ENTER' ? 'Enviar' : k}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {(victoria || derrota) && (
        <div className="wordle-end" role="dialog">
          <div className="wordle-modal">
            <p className={`wm-tag ${victoria ? 'wm-tag--win' : 'wm-tag--lose'}`}>
              {victoria ? '¡Ganaste!' : 'Fin de la partida'}
            </p>
            <h2 className="wm-word">{solucion}</h2>
            {definicion ? <p className="wm-def">{definicion}</p> : null}
            <div className="wm-actions">
              <button type="button" className="wm-btn wm-btn--sec" onClick={onBack}>
                ← Juegos
              </button>
              <button
                type="button"
                className="wm-btn wm-btn--pri"
                onClick={(e) => compartirResultado(e.currentTarget)}
              >
                Compartir resultado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
