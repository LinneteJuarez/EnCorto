/* =====================================================
  MAIN TABS (pestañas principales)
  ===================================================== */

import {createClient} from '@sanity/client'
import {toHTML} from '@portabletext/to-html'

const tabs = document.querySelectorAll('.tab')
const panels = document.querySelectorAll('.panel')

function getActivePanelName() {
  const active = document.querySelector('.panel.active')
  if (!active?.id?.startsWith('panel-')) return null
  return active.id.slice('panel-'.length)
}

function runInicioEnter(panelEl) {
  const inicioEl = panelEl?.querySelector?.('.inicio')
  if (!inicioEl) return
  inicioEl.classList.remove('is-leaving')
  inicioEl.classList.add('is-entering')
  const cleanup = () => inicioEl.classList.remove('is-entering')
  inicioEl.addEventListener('animationend', cleanup, {once: true})
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const name = tab.dataset.tab
    const current = getActivePanelName()
    if (current === name) return

    const doSwitch = () => {
      // activar tab
      tabs.forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')

      // mostrar panel
      panels.forEach((p) => p.classList.remove('active'))
      const nextPanel = document.getElementById(`panel-${name}`)
      nextPanel.classList.add('active')

      // cargar contenido si hace falta
      loadPanel(name)

      if (name === 'inicio') runInicioEnter(nextPanel)
    }

    // Si salimos de INICIO, animamos antes de cambiar de panel.
    if (current === 'inicio') {
      const currentPanel = document.getElementById('panel-inicio')
      const inicioEl = currentPanel?.querySelector?.('.inicio')
      if (inicioEl) {
        inicioEl.classList.remove('is-entering')
        inicioEl.classList.add('is-leaving')
        window.setTimeout(doSwitch, 420)
        return
      }
    }

    doSwitch()
  })
})

/* =====================================================
  SUBTABS (aisladas por panel)
  ===================================================== */

function initSubtabs(panel) {
  const subtabs = panel.querySelectorAll('.subtab')
  const subpanels = panel.querySelectorAll('.subpanel')

  if (!subtabs.length) return

  subtabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.sub

      subtabs.forEach((t) => t.classList.remove('active'))
      subpanels.forEach((p) => p.classList.remove('active'))

      tab.classList.add('active')
      panel.querySelector(`.subpanel[data-subpanel="${target}"]`)?.classList.add('active')
    })
  })
}

/* =====================================================
  NEWS CARDS — expansión / colapso (panel hoy)
  ===================================================== */

const hoyPanel = document.getElementById('panel-hoy')

hoyPanel.addEventListener('click', (e) => {
  // Botón cerrar
  if (e.target.closest('.news-close')) {
    e.stopPropagation()
    const card = e.target.closest('.news-card')
    card?.classList.remove('open')
    return
  }

  // Click en card
  const card = e.target.closest('.news-card')
  if (!card) return

  const subpanel = card.closest('.subpanel')
  const isOpen = card.classList.contains('open')

  // cerrar otras
  subpanel.querySelectorAll('.news-card.open').forEach((c) => c.classList.remove('open'))

  if (!isOpen) card.classList.add('open')
})

// Soporte teclado
hoyPanel.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  const card = e.target.closest('.news-card')
  if (!card) return
  e.preventDefault()
  card.click()
})

/* =====================================================
  CARGA DE PANELES (HTML externo)
===================================================== */

const panelMap = {
  inicio: new URL('./panels/inicio.html', import.meta.url).href,
  hoy: new URL('./panels/hoy.html', import.meta.url).href,
  juegos: new URL('./panels/juegos.html', import.meta.url).href,
  foro: new URL('./panels/foro.html', import.meta.url).href,
  funding: new URL('./panels/funding.html', import.meta.url).href,
  archivo: new URL('./panels/archivo.html', import.meta.url).href,
}

function loadPanel(name) {
  const panel = document.getElementById(`panel-${name}`)
  if (!panel || panel.dataset.loaded) return

  fetch(panelMap[name])
    .then((r) => r.text())
    .then((html) => {
      panel.innerHTML = html
      panel.dataset.loaded = 'true'

      panel.insertAdjacentHTML(
        "afterbegin",
        "<p style='color:white'>JUEGOS CARGADOS</p>"
      )

      initSubtabs(panel)

      if (name === 'juegos') {
        initWordle(panel)
      }

      if (name === 'hoy' || name === 'archivo') {
        renderNoticiasIntoPanel(panel, name).catch((err) => {
          console.warn('Error cargando noticias:', err)
        })
      }

      if (name === 'inicio') {
        runInicioEnter(panel)
      }
    })
}

      if (name === 'hoy' || name === 'archivo') {
        renderNoticiasIntoPanel(panel, name).catch((err) => {
          console.warn('Error cargando noticias:', err)
        })
      }

      if (name === 'inicio') {
        runInicioEnter(panel)
      }
    

/* =====================================================
  CARGA INICIAL
  ===================================================== */

loadPanel('inicio')

/* =====================================================
  NOTICIAS (Sanity + Portable Text)
  ===================================================== */

const SANITY_PROJECT_ID = import.meta?.env?.VITE_SANITY_PROJECT_ID || '1viy3uxj'
const SANITY_DATASET = import.meta?.env?.VITE_SANITY_DATASET || 'production'
const SANITY_API_VERSION = import.meta?.env?.VITE_SANITY_API_VERSION || '2026-05-06'

const IS_LOCALHOST =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  // In local dev we want fresh content right after publishing/migrating.
  useCdn: !IS_LOCALHOST,
})

const CATEGORY_LABELS = {
  global: 'Global',
  politica: 'Política',
  economia: 'Economía',
  tec: 'Tec & Ciencia',
  deportes: 'Deportes',
  espectaculos: 'Espectáculos',
  felices: 'Noticias Felices',
}

function formatDate(isoLike) {
  if (!isoLike) return ''
  const d = new Date(isoLike)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-MX', {year: 'numeric', month: 'short', day: '2-digit'})
}

function buildNewsCardHtml(post) {
  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category ?? ''
  const dateLabel = formatDate(post.date)
  const thumb = post.thumbnail
    ? `<img src="${post.thumbnail}" alt="" loading="lazy" decoding="async" />`
    : `<span class="news-thumb-label">IMG</span>`

  return `
    <article class="news-card" tabindex="0">
      <div class="news-thumb">${thumb}</div>
      <div class="news-body">
        <p class="news-section-tag">${categoryLabel}${dateLabel ? ` · ${dateLabel}` : ''}</p>
        <h2 class="news-title">${post.title ?? 'Sin título'}</h2>
        <p class="news-excerpt">${post.excerpt ?? ''}</p>
        <div class="news-expanded">
          ${post.html ?? ''}
          <button class="news-close">Cerrar ↑</button>
        </div>
      </div>
    </article>
  `.trim()
}

function buildExcerptFromText(text, maxLen = 120) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLen) return clean
  return `${clean.slice(0, maxLen - 1)}…`
}

function portableTextToPlainText(blocks) {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .flatMap((b) => {
      if (b?._type !== 'block' || !Array.isArray(b.children)) return []
      return b.children.map((c) => c?.text ?? '')
    })
    .join(' ')
}

async function loadNoticias() {
  const query = `*[_type=="noticia"]|order(date desc){
    _id,
    title,
    date,
    category,
    body,
    "thumbnail": thumbnail.asset->url
  }`

  const items = await sanity.fetch(query)

  return (Array.isArray(items) ? items : []).map((it) => {
    const html = toHTML(it.body ?? [])
    const excerpt = buildExcerptFromText(portableTextToPlainText(it.body ?? []))
    return {
      ...it,
      title: it.title || 'Sin título',
      date: it.date || '',
      category: it.category || 'global',
      thumbnail: it.thumbnail || '',
      html,
      excerpt,
    }
  })
}

function groupByCategory(posts) {
  const grouped = {
    global: [],
    politica: [],
    economia: [],
    tec: [],
    deportes: [],
    espectaculos: [],
    felices: [],
  }

  for (const p of posts) {
    const key = grouped[p.category] ? p.category : 'global'
    grouped[key].push(p)
  }

  return grouped
}

async function renderNoticiasIntoPanel(panelEl, panelName) {
  const posts = await loadNoticias()
  const grouped = groupByCategory(posts)

  for (const [category, list] of Object.entries(grouped)) {
    const grid = panelEl.querySelector(`.subpanel[data-subpanel="${category}"] .news-grid`)
    if (!grid) continue

    const max = panelName === 'hoy' ? 3 : list.length
    const slice = list.slice(0, max)

    if (!slice.length) {
      grid.innerHTML = `<p class="news-empty">Aún no hay noticias en esta categoría.</p>`
      continue
    }

    grid.innerHTML = slice.map(buildNewsCardHtml).join('\n')
  }
}

function initWordle(panel) {
  const menuEl = panel.querySelector('#games-menu')
  const gameEl = panel.querySelector('#wordle-screen')

  const btnWordle = panel.querySelector('#btn-wordle')
  const btnBack   = panel.querySelector('#wordle-back')

  if (!menuEl || !gameEl || !btnWordle) return

  const showMenu = () => {
    menuEl.classList.remove('wordle-hidden')
    gameEl.classList.add('wordle-hidden')
  }

  const showGame = () => {
    menuEl.classList.add('wordle-hidden')
    gameEl.classList.remove('wordle-hidden')
  }

  // estado inicial
  showMenu()

  btnWordle.addEventListener('click', showGame)
  btnBack?.addEventListener('click', showMenu)

  console.log('INIT WORDLE')
}

