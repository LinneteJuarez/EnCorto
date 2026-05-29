const STORAGE_KEY = 'encorto-paint-gallery'
const MAX_ITEMS = 24

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRaw(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* quota u otro error: no romper el juego */
  }
}

export function loadGallery() {
  return readRaw()
    .filter((it) => it?.id && it?.dataUrl)
    .slice(0, MAX_ITEMS)
}

export function addToGallery({ dataUrl, tema }) {
  if (!dataUrl) return loadGallery()
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    dataUrl,
    tema: tema || 'Sin tema',
    createdAt: new Date().toISOString(),
  }
  const next = [entry, ...readRaw()].slice(0, MAX_ITEMS)
  writeRaw(next)
  return next
}

export function removeFromGallery(id) {
  const next = readRaw().filter((it) => it.id !== id)
  writeRaw(next)
  return next
}
