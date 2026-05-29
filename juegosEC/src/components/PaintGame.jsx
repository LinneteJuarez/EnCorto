import { useCallback, useEffect, useRef, useState } from 'react'
import { temaAleatorio } from '../data/temasPaint'
import { addToGallery, loadGallery, removeFromGallery } from '../lib/paintGallery'

export function PaintGame({ onBack }) {
  const canvasRef = useRef(null)
  const [color, setColor] = useState('#000000')
  const [grosor, setGrosor] = useState(4)
  const [tema, setTema] = useState(() => temaAleatorio())
  const [galeria, setGaleria] = useState(() => loadGallery())
  const [msg, setMsg] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState(null)
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
    setMsg('')
  }

  const guardarEnGaleria = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas?.width) {
      setMsg('Espera a que cargue el lienzo')
      return
    }
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
      const next = addToGallery({ dataUrl, tema })
      setGaleria(next)
      setMsg('Guardado en la galería')
      window.setTimeout(() => setMsg(''), 2200)
    } catch {
      setMsg('No se pudo guardar')
    }
  }, [tema])

  const eliminarDeGaleria = (id) => {
    const next = removeFromGallery(id)
    setGaleria(next)
    setLightboxIndex((idx) => {
      if (idx === null) return null
      const currentId = galeria[idx]?.id
      if (currentId !== id) {
        const newIdx = next.findIndex((it) => it.id === currentId)
        return newIdx >= 0 ? newIdx : null
      }
      if (!next.length) return null
      return Math.min(idx, next.length - 1)
    })
  }

  const lightboxAbierto = lightboxIndex !== null && galeria[lightboxIndex]
  const itemLightbox = lightboxAbierto ? galeria[lightboxIndex] : null

  const cerrarLightbox = useCallback(() => setLightboxIndex(null), [])

  const irAnterior = useCallback(() => {
    setLightboxIndex((idx) => (idx === null || idx <= 0 ? idx : idx - 1))
  }, [])

  const irSiguiente = useCallback(() => {
    setLightboxIndex((idx) => {
      if (idx === null) return idx
      return idx >= galeria.length - 1 ? idx : idx + 1
    })
  }, [galeria.length])

  useEffect(() => {
    if (!lightboxAbierto) return
    const onKey = (e) => {
      if (e.key === 'Escape') cerrarLightbox()
      if (e.key === 'ArrowLeft') irAnterior()
      if (e.key === 'ArrowRight') irSiguiente()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxAbierto, cerrarLightbox, irAnterior, irSiguiente])

  return (
    <div className="ec-game-screen">
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
          <label className="paint-toolbar__range">
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
          <button type="button" className="ec-btn" onClick={guardarEnGaleria}>
            Guardar en galería
          </button>
        </div>
        {msg ? (
          <p className="paint-msg" role="status">
            {msg}
          </p>
        ) : null}
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
        <section className="paint-gallery" aria-label="Galería de dibujos">
          <div className="paint-gallery__head">
            <h2 className="paint-gallery__title">Mi galería</h2>
            <span className="paint-gallery__count">{galeria.length}</span>
          </div>
          {galeria.length === 0 ? (
            <p className="paint-gallery__empty">
              Tus dibujos guardados aparecerán aquí. Usa «Guardar en galería» cuando termines.
            </p>
          ) : (
            <ul className="paint-gallery__list">
              {galeria.map((item, index) => (
                <li key={item.id} className="paint-gallery__item">
                  <button
                    type="button"
                    className="paint-gallery__thumb"
                    onClick={() => setLightboxIndex(index)}
                    aria-label={`Ver dibujo: ${item.tema}`}
                  >
                    <img src={item.dataUrl} alt="" loading="lazy" />
                  </button>
                  <p className="paint-gallery__caption" title={item.tema}>
                    {item.tema}
                  </p>
                  <button
                    type="button"
                    className="paint-gallery__del"
                    aria-label="Eliminar dibujo"
                    onClick={(e) => {
                      e.stopPropagation()
                      eliminarDeGaleria(item.id)
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {lightboxAbierto && itemLightbox && (
        <div
          className="paint-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de la galería"
          onClick={cerrarLightbox}
        >
          <div className="paint-lightbox__panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="paint-lightbox__close ec-btn"
              onClick={cerrarLightbox}
              aria-label="Cerrar"
            >
              Cerrar
            </button>
            <p className="paint-lightbox__counter">
              {lightboxIndex + 1} / {galeria.length}
            </p>
            <div className="paint-lightbox__stage">
              {galeria.length > 1 && (
                <button
                  type="button"
                  className="paint-lightbox__nav paint-lightbox__nav--prev ec-btn"
                  onClick={irAnterior}
                  disabled={lightboxIndex <= 0}
                  aria-label="Imagen anterior"
                >
                  ‹
                </button>
              )}
              <figure className="paint-lightbox__figure">
                <img src={itemLightbox.dataUrl} alt={`Dibujo: ${itemLightbox.tema}`} />
                <figcaption className="paint-lightbox__caption">{itemLightbox.tema}</figcaption>
              </figure>
              {galeria.length > 1 && (
                <button
                  type="button"
                  className="paint-lightbox__nav paint-lightbox__nav--next ec-btn"
                  onClick={irSiguiente}
                  disabled={lightboxIndex >= galeria.length - 1}
                  aria-label="Imagen siguiente"
                >
                  ›
                </button>
              )}
            </div>
            <div className="paint-lightbox__actions">
              <button
                type="button"
                className="ec-btn ec-btn--accent"
                onClick={() => eliminarDeGaleria(itemLightbox.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
