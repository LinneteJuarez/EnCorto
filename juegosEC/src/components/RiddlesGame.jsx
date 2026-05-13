import { useState } from 'react'
import { ADIVINANZAS } from '../data/adivinanzas'

export function RiddlesGame({ onBack }) {
  const [i, setI] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const [elegido, setElegido] = useState(null)
  const [mostrarExp, setMostrarExp] = useState(false)

  const item = ADIVINANZAS[i]
  const fin = i >= ADIVINANZAS.length

  const reiniciar = () => {
    setI(0)
    setAciertos(0)
    setElegido(null)
    setMostrarExp(false)
  }

  if (fin) {
    return (
      <div>
        <header className="ec-topbar">
          <button type="button" className="ec-btn" onClick={onBack}>
            ← Juegos
          </button>
          <h1>Adivinanzas</h1>
          <span style={{ width: 72 }} />
        </header>
        <div className="riddles-wrap">
          <p className="riddles-q">Resultado: {aciertos} / {ADIVINANZAS.length}</p>
          <p className="gc-desc">Puedes volver a jugar o regresar al menú.</p>
          <div className="r-foot">
            <button type="button" className="ec-btn" onClick={reiniciar}>
              Otra vez
            </button>
            <button type="button" className="ec-btn" onClick={onBack}>
              Menú
            </button>
          </div>
        </div>
      </div>
    )
  }

  const onPick = (idx) => {
    if (elegido !== null) return
    setElegido(idx)
    setMostrarExp(true)
    if (idx === item.correcta) setAciertos((n) => n + 1)
  }

  const siguiente = () => {
    setI((n) => n + 1)
    setElegido(null)
    setMostrarExp(false)
  }

  return (
    <div>
      <header className="ec-topbar">
        <button type="button" className="ec-btn" onClick={onBack}>
          ← Juegos
        </button>
        <h1>Adivinanzas</h1>
        <span style={{ width: 72 }} />
      </header>
      <div className="riddles-wrap">
        <p className="r-progress">
          Pregunta {i + 1} / {ADIVINANZAS.length}
        </p>
        <p className="riddles-q">{item.texto}</p>
        <div className="riddles-options" role="list">
          {item.opciones.map((op, idx) => {
            let cl = 'r-opt'
            if (elegido !== null) {
              if (idx === item.correcta) cl += ' r-opt--ok'
              else if (idx === elegido) cl += ' r-opt--bad'
            }
            return (
              <button
                key={op}
                type="button"
                className={cl}
                disabled={elegido !== null}
                onClick={() => onPick(idx)}
              >
                {op}
              </button>
            )
          })}
        </div>
        {mostrarExp && (
          <p className="gc-desc" style={{ marginTop: 14 }}>
            {item.explicacion}
          </p>
        )}
        <div className="r-foot">
          {elegido !== null && (
            <button type="button" className="ec-btn" onClick={siguiente}>
              {i + 1 < ADIVINANZAS.length ? 'Siguiente' : 'Ver resultado'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
