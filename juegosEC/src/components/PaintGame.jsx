import { useEffect, useRef, useState } from 'react'
import { temaAleatorio } from '../data/temasPaint'

export function PaintGame({ onBack }) {
  const canvasRef = useRef(null)
  const [color, setColor] = useState('#000000')
  const [grosor, setGrosor] = useState(4)
  const [tema, setTema] = useState(() => temaAleatorio())
  const dibujando = useRef(false)

  useEffect(() => {
    let cancelled = false
    const run = () => {
      if (cancelled) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      if (w < 2 || h < 2) {
        requestAnimationFrame(run)
        return
      }
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }
    requestAnimationFrame(run)
    return () => {
      cancelled = true
    }
  }, [tema])

  const pos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const r = canvas.getBoundingClientRect()
    const t = e.touches?.[0]
    const clientX = t ? t.clientX : e.clientX
    const clientY = t ? t.clientY : e.clientY
    return { x: clientX - r.left, y: clientY - r.top }
  }

  const start = (e) => {
    e.preventDefault()
    dibujando.current = true
    const { x, y } = pos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (e) => {
    if (!dibujando.current) return
    e.preventDefault()
    const { x, y } = pos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = color
    ctx.lineWidth = grosor
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const end = (e) => {
    e.preventDefault()
    dibujando.current = false
  }

  const limpiar = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !canvas.offsetWidth) return
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    const dpr = canvas.width / w
    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }

  return (
    <div>
      <header className="ec-topbar">
        <button type="button" className="ec-btn" onClick={onBack}>
          ← Juegos
        </button>
        <h1>Pintar</h1>
        <span style={{ width: 72 }} />
      </header>
      <div className="paint-wrap">
        <div className="paint-tema">Tema: {tema}</div>
        <div className="paint-toolbar">
          <label>
            Color{' '}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Trazo
            <input
              type="range"
              min={1}
              max={24}
              value={grosor}
              onChange={(e) => setGrosor(Number(e.target.value))}
            />
          </label>
          <button type="button" className="ec-btn" onClick={limpiar}>
            Limpiar
          </button>
          <button type="button" className="ec-btn ec-btn--accent" onClick={() => setTema(temaAleatorio())}>
            Otro tema
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className="paint-canvas"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
    </div>
  )
}
