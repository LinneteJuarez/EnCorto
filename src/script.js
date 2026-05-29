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
      setBackdropSection(name)

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
  const subtabs = panel.querySelectorAll('.subtabs--sidebar .subtab, .subtabs:not(.subtabs--sidebar) .subtab')
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

function formatTodayLong(timeZone) {
  const label = new Intl.DateTimeFormat('es-MX', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function uniqueArchiveDates(posts) {
  const today = todayCalendarKey(NOTICIAS_TZ)
  const keys = new Set()
  for (const p of posts) {
    const key = calendarDayKey(p.date, NOTICIAS_TZ)
    if (key && key < today) keys.add(key)
  }
  return [...keys].sort((a, b) => b.localeCompare(a))
}

function initHoySidebar(panel) {
  const dateEl = panel.querySelector('[data-today-label]')
  if (!dateEl) return
  const todayKey = todayCalendarKey(NOTICIAS_TZ)
  dateEl.dateTime = todayKey
  dateEl.textContent = formatTodayLong(NOTICIAS_TZ)
}

function initSidebarScroll(panel) {
  const root = panel.querySelector('[data-sidebar-scroll]')
  if (!root) return

  const viewport = root.querySelector('.sidebar-scroll__viewport')
  const content = root.querySelector('.sidebar-scroll__content')
  const prevBtn = root.querySelector('.sidebar-scroll__btn--prev')
  const nextBtn = root.querySelector('.sidebar-scroll__btn--next')
  if (!viewport || !content || !prevBtn || !nextBtn) return

  const step = () => Math.max(72, viewport.clientHeight * 0.72)
  let offset = 0

  const maxOffset = () => Math.max(0, content.scrollHeight - viewport.clientHeight)

  const apply = () => {
    offset = Math.min(Math.max(0, offset), maxOffset())
    content.style.transform = offset ? `translateY(${-offset}px)` : ''
    prevBtn.disabled = offset <= 0
    nextBtn.disabled = offset >= maxOffset() - 1
  }

  if (!root.dataset.scrollReady) {
    prevBtn.addEventListener('click', () => {
      offset -= step()
      apply()
    })
    nextBtn.addEventListener('click', () => {
      offset += step()
      apply()
    })
    const ro = new ResizeObserver(() => apply())
    ro.observe(viewport)
    ro.observe(content)
    root.dataset.scrollReady = 'true'
    root._sidebarScrollApply = apply
  }

  offset = Math.min(offset, maxOffset())
  root._sidebarScrollApply?.()
}

function calendarDayBefore(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() - 1)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function setArchivoPanelHasSelection(panel, hasSelection) {
  const mainEl = panel.querySelector('[data-archivo-main]')
  const promptEl = panel.querySelector('[data-archivo-prompt]')
  const hintEl = panel.querySelector('[data-archivo-date-hint]')

  if (mainEl) mainEl.hidden = !hasSelection
  if (promptEl) promptEl.hidden = hasSelection
  if (hintEl && hasSelection) hintEl.hidden = true
}

function clearArchivoNewsGrids(panel) {
  panel.querySelectorAll('.subpanel .news-grid').forEach((grid) => {
    grid.innerHTML = ''
  })
}

function clearArchivoSelection(panel) {
  delete panel.dataset.selectedArchivoDate
  const picker = panel.querySelector('[data-archivo-date-picker]')
  if (picker) picker.value = ''
  setArchivoPanelHasSelection(panel, false)
  clearArchivoNewsGrids(panel)
}

function showArchivoInvalidDate(panel) {
  const hintEl = panel.querySelector('[data-archivo-date-hint]')
  if (hintEl) hintEl.hidden = false
  setArchivoPanelHasSelection(panel, false)
  clearArchivoNewsGrids(panel)
}

function selectArchivoDate(panel, dayKey) {
  panel.dataset.selectedArchivoDate = dayKey

  const picker = panel.querySelector('[data-archivo-date-picker]')
  if (picker && picker.value !== dayKey) picker.value = dayKey

  setArchivoPanelHasSelection(panel, true)
  renderNoticiasIntoPanel(panel, 'archivo').catch((err) => {
    console.warn('Error cargando archivo:', err)
  })
}

function initArchivoDates(panel, archivePosts) {
  const picker = panel.querySelector('[data-archivo-date-picker]')
  if (!picker) return

  const dates = uniqueArchiveDates(archivePosts)
  panel.dataset.archivoDateList = dates.join(',')

  const today = todayCalendarKey(NOTICIAS_TZ)
  const maxDay = calendarDayBefore(today)
  const hintEl = panel.querySelector('[data-archivo-date-hint]')
  const defaultHint = 'No hay noticias archivadas para esta fecha.'

  picker.disabled = false
  picker.max = maxDay
  picker.min = dates.length ? dates[dates.length - 1] : ''

  if (!dates.length) {
    picker.disabled = true
    if (hintEl) {
      hintEl.textContent = 'No hay fechas en el archivo.'
      hintEl.hidden = false
    }
    clearArchivoSelection(panel)
    return
  }

  if (hintEl) {
    hintEl.textContent = defaultHint
    hintEl.hidden = true
  }

  if (!picker.dataset.pickerReady) {
    picker.addEventListener('change', () => {
      const value = picker.value
      if (hintEl) {
        hintEl.textContent = defaultHint
        hintEl.hidden = true
      }

      if (!value) {
        clearArchivoSelection(panel)
        return
      }

      const available = panel.dataset.archivoDateList?.split(',').filter(Boolean) ?? []
      if (available.includes(value)) {
        selectArchivoDate(panel, value)
      } else {
        showArchivoInvalidDate(panel)
      }
    })
    picker.dataset.pickerReady = 'true'
  }

  const selected = panel.dataset.selectedArchivoDate
  if (selected && dates.includes(selected)) {
    selectArchivoDate(panel, selected)
  } else {
    clearArchivoSelection(panel)
  }
}

function initForoPanel(panel) {
  if (!panel) return

  const STORAGE_KEY = 'encorto-foro-state'
  const currentUser = { name: 'Tú', username: '@tuusuario', avatar: 'T' }

  const defaultState = {
    profile: {
      name: 'Tu Nombre',
      username: '@usuario',
      description: 'Aquí verás tu perfil, tu foto, tu nombre de usuario y tu descripción. Participa en Comunidad y comparte tus resultados.',
    },
    posts: [
      {
        id: 'com-1',
        type: 'comunidad',
        author: 'Alicia',
        username: '@alicia',
        avatar: 'A',
        content: 'Hoy compartí una idea para reciclar botellas en la escuela y muchos se animaron a intentarlo.',
        createdAt: 'Hace 1 hora',
        likes: 12,
        loves: 4,
        claps: 2,
        comments: [
          { id: 'com-1-1', author: 'Carlos', username: '@carlos', content: '¡Qué buena idea! Gracias por inspirar a todos.', createdAt: 'Hace 50 min' },
        ],
      },
      {
        id: 'ann-1',
        type: 'anuncios',
        author: 'Admin',
        username: '@equipo',
        avatar: 'E',
        content: 'El próximo domingo haremos una sesión especial para resolver dudas y compartir resultados de los juegos.',
        createdAt: 'Hace 2 horas',
        likes: 18,
        loves: 7,
        claps: 3,
        comments: [
          { id: 'ann-1-1', author: 'Lucía', username: '@lucia', content: '¡Perfecto, ahí estaré!', createdAt: 'Hace 1 hora' },
        ],
      },
      {
        id: 'game-1',
        type: 'juegos',
        author: 'María',
        username: '@maria',
        avatar: 'M',
        game: 'Trivia — 9/10',
        content: 'Me faltó solo una pregunta. ¡Muy divertido!',
        createdAt: 'Hace 30 min',
        likes: 5,
        loves: 2,
        claps: 1,
        comments: [],
      },
    ],
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : defaultState
    } catch {
      return defaultState
    }
  }

  function saveState(state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  function formatAvatar(profile) {
    return String(profile.username || profile.name || 'U').trim().charAt(1).toUpperCase() || String(profile.name || 'U').trim().charAt(0).toUpperCase()
  }

  function getCounts(state) {
    const posts = state.posts
    return {
      posts: posts.filter((post) => post.type === 'comunidad').length + posts.filter((post) => post.type === 'juegos').length,
      likes: posts.reduce((sum, post) => sum + (post.likes || 0) + (post.loves || 0) + (post.claps || 0), 0),
      comments: posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0),
    }
  }

  function renderProfile(state) {
    const nameEl = panel.querySelector('[data-foro-name]')
    const usernameEl = panel.querySelector('[data-foro-username]')
    const descriptionEl = panel.querySelector('[data-foro-description]')
    const avatarEl = panel.querySelector('[data-foro-avatar]')

    if (nameEl) nameEl.textContent = state.profile.name
    if (usernameEl) usernameEl.textContent = state.profile.username
    if (descriptionEl) descriptionEl.textContent = state.profile.description
    if (avatarEl) avatarEl.textContent = formatAvatar(state.profile)

    const counts = getCounts(state)
    const postsCountEl = panel.querySelector('[data-foro-count-posts]')
    const likesCountEl = panel.querySelector('[data-foro-count-likes]')
    const commentsCountEl = panel.querySelector('[data-foro-count-comments]')

    if (postsCountEl) postsCountEl.textContent = String(counts.posts)
    if (likesCountEl) likesCountEl.textContent = String(counts.likes)
    if (commentsCountEl) commentsCountEl.textContent = String(counts.comments)
  }

  function buildCommentHtml(comment) {
    return `
      <div class="forum-comment">
        <strong>${comment.author}</strong>
        <span class="forum-comment-text">${comment.content}</span>
        <small>${comment.createdAt}</small>
      </div>`
  }

  function buildPostCardHtml(post) {
    const commentCount = post.comments?.length || 0
    return `
      <article class="forum-card" data-post-id="${post.id}">
        <header class="forum-card-header">
          <div class="forum-avatar">${post.avatar || String(post.author || 'U').trim().charAt(0)}</div>
          <div>
            <strong>${post.author}</strong>
            <span class="forum-username">${post.username}</span>
            <div class="forum-card-time">${post.createdAt}${post.game ? ` · ${post.game}` : ''}</div>
          </div>
        </header>
        <p class="forum-card-text">${post.content}</p>
        <div class="forum-card-actions">
          <button type="button" class="forum-action-btn" data-action="like" data-post-id="${post.id}">❤️ ${post.likes || 0}</button>
          <button type="button" class="forum-action-btn" data-action="love" data-post-id="${post.id}">💖 ${post.loves || 0}</button>
          <button type="button" class="forum-action-btn" data-action="clap" data-post-id="${post.id}">👏 ${post.claps || 0}</button>
          <button type="button" class="forum-action-btn" data-action="toggle-comments" data-post-id="${post.id}">💬 ${commentCount}</button>
        </div>
        <div class="forum-comments" data-comments-for="${post.id}">
          <div class="forum-comments-list">
            ${post.comments?.map(buildCommentHtml).join('') || '<p class="forum-empty">Aún no hay comentarios.</p>'}
          </div>
          <form class="forum-comment-form" data-post-id="${post.id}">
            <input type="text" name="comment" placeholder="Escribe un comentario..." required />
            <button type="submit">Enviar</button>
          </form>
        </div>
      </article>`
  }

  function renderFeed(type) {
    const feed = panel.querySelector(`.forum-feed[data-feed="${type}"]`)
    if (!feed) return

    const posts = state.posts
      .filter((post) => post.type === type)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

    if (!posts.length) {
      feed.innerHTML = `<div class="forum-empty">No hay publicaciones en esta sección todavía.</div>`
      return
    }

    feed.innerHTML = posts.map(buildPostCardHtml).join('')
  }

  function renderForo() {
    renderProfile(state)
    renderFeed('comunidad')
    renderFeed('anuncios')
    renderFeed('juegos')
  }

  function saveAndRender() {
    saveState(state)
    renderForo()
  }

  let state = loadState()
  renderForo()

  panel.addEventListener('submit', (event) => {
    const form = event.target.closest('form')
    if (!form) return

    if (form.classList.contains('forum-post-form')) {
      event.preventDefault()
      const type = form.dataset.type
      const contentInput = form.querySelector('textarea[name="content"]')
      const content = contentInput?.value.trim() || ''
      if (!content) return

      const post = {
        id: `post-${Date.now()}`,
        type,
        author: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        content,
        createdAt: 'Ahora',
        likes: 0,
        loves: 0,
        claps: 0,
        comments: [],
      }

      if (type === 'juegos') {
        post.game = form.querySelector('input[name="game"]')?.value.trim() || 'Resultado de juego'
      }

      state.posts.unshift(post)
      saveAndRender()
      form.reset()
      return
    }

    if (form.classList.contains('forum-comment-form')) {
      event.preventDefault()
      const postId = form.dataset.postId
      const commentInput = form.querySelector('input[name="comment"]')
      const commentText = commentInput?.value.trim() || ''
      if (!commentText) return

      const post = state.posts.find((item) => item.id === postId)
      if (!post) return

      post.comments = post.comments || []
      post.comments.push({
        id: `comment-${Date.now()}`,
        author: currentUser.name,
        username: currentUser.username,
        content: commentText,
        createdAt: 'Ahora',
      })

      saveAndRender()
      commentInput.value = ''
    }
  })

  panel.addEventListener('click', (event) => {
    const button = event.target.closest('.forum-action-btn')
    if (!button) return

    const action = button.dataset.action
    const postId = button.dataset.postId
    const post = state.posts.find((item) => item.id === postId)
    if (!post) return

    if (action === 'toggle-comments') {
      const card = button.closest('.forum-card')
      const comments = card?.querySelector('.forum-comments')
      comments?.classList.toggle('open')
      return
    }

    if (action === 'like') post.likes = (post.likes || 0) + 1
    if (action === 'love') post.loves = (post.loves || 0) + 1
    if (action === 'clap') post.claps = (post.claps || 0) + 1

    saveAndRender()
  })
}

/* =====================================================
  NEWS CARDS — expansión / colapso (panel hoy)
  ===================================================== */

const hoyPanel = document.getElementById('panel-hoy')
const archivoPanel = document.getElementById('panel-archivo')

function initNewsCardExpansion(panelEl) {
  if (!panelEl || panelEl.dataset.newsCardsInit === 'true') return
  panelEl.dataset.newsCardsInit = 'true'

  panelEl.addEventListener('click', (e) => {
    const card = e.target.closest('.news-card')
    if (!card) return

    const subpanel = card.closest('.subpanel')
    const isOpen = card.classList.contains('open')

    subpanel?.querySelectorAll('.news-card.open').forEach((c) => {
      c.classList.remove('open')
      c.setAttribute('aria-expanded', 'false')
    })
    if (!isOpen) {
      card.classList.add('open')
      card.setAttribute('aria-expanded', 'true')
    }
  })

  panelEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const card = e.target.closest('.news-card')
    if (!card) return
    e.preventDefault()
    card.click()
  })
}

initNewsCardExpansion(hoyPanel)
initNewsCardExpansion(archivoPanel)

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

/** Mini-app React (juegosEC): en dev suele ir en otro puerto; en build se copia a dist/juegos-ec */
function initPinCarousel(carousel) {
  if (!carousel || carousel.dataset.pinCarouselInit === 'true') return

  const viewport = carousel.querySelector('.pin-carousel__viewport')
  const track = viewport?.querySelector('.pin-carousel__track')
  const slides = [...carousel.querySelectorAll('.pin-slide')]
  const prevBtn = carousel.querySelector('.pin-carousel__btn--prev')
  const nextBtn = carousel.querySelector('.pin-carousel__btn--next')
  const dotsHost = carousel.querySelector('.pin-carousel__dots')

  if (!track || !viewport || !dotsHost || slides.length === 0) return

  carousel.dataset.pinCarouselInit = 'true'

  let index = 0
  let dragStartX = 0
  let dragDelta = 0
  let isDragging = false

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button')
    dot.type = 'button'
    dot.className = 'pin-carousel__dot'
    dot.setAttribute('role', 'tab')
    dot.setAttribute('aria-label', `Pin ${i + 1}`)
    dot.addEventListener('click', () => goTo(i))
    dotsHost.appendChild(dot)
    return dot
  })

  function goTo(nextIndex) {
    index = (nextIndex + slides.length) % slides.length
    track.style.transform = `translate3d(-${index * 100}%, 0, 0)`
    dots.forEach((dot, i) => {
      const active = i === index
      dot.classList.toggle('is-active', active)
      dot.setAttribute('aria-selected', active ? 'true' : 'false')
    })
    carousel.setAttribute('aria-label', `Pines disponibles, ${index + 1} de ${slides.length}`)
  }

  function step(delta) {
    goTo(index + delta)
  }

  prevBtn?.addEventListener('click', () => step(-1))
  nextBtn?.addEventListener('click', () => step(1))

  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      step(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      step(1)
    }
  })

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    isDragging = true
    dragStartX = e.clientX
    dragDelta = 0
    carousel.classList.add('is-dragging')
    viewport.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!isDragging) return
    dragDelta = e.clientX - dragStartX
    const offset = (-index * 100) + (dragDelta / viewport.offsetWidth) * 100
    track.style.transform = `translate3d(${offset}%, 0, 0)`
  }

  const onPointerUp = (e) => {
    if (!isDragging) return
    isDragging = false
    carousel.classList.remove('is-dragging')
    viewport.releasePointerCapture(e.pointerId)
    const threshold = viewport.offsetWidth * 0.18
    if (dragDelta < -threshold) step(1)
    else if (dragDelta > threshold) step(-1)
    else goTo(index)
    dragDelta = 0
  }

  carousel.querySelectorAll('.pin-product').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => e.stopPropagation())
  })

  viewport.addEventListener('pointerdown', onPointerDown)
  viewport.addEventListener('pointermove', onPointerMove)
  viewport.addEventListener('pointerup', onPointerUp)
  viewport.addEventListener('pointercancel', onPointerUp)

  carousel.setAttribute('tabindex', '0')
  carousel.setAttribute('role', 'region')
  carousel.setAttribute('aria-roledescription', 'carrusel')
  goTo(0)
}

function initJuegosEcIframe(panel) {
  const frame = panel.querySelector('iframe.juegos-ec-frame')
  if (!frame || frame.dataset.srcSet === 'true') return
  const devUrl = import.meta.env?.VITE_JUEGOS_EC_DEV_URL || 'http://localhost:5174/'
  frame.src = import.meta.env?.DEV ? devUrl : './juegos-ec/index.html'
  frame.dataset.srcSet = 'true'
}

function loadPanel(name) {
  const panel = document.getElementById(`panel-${name}`)
  if (!panel || panel.dataset.loaded) return

  fetch(panelMap[name])
    .then((r) => r.text())
    .then((html) => {
      panel.innerHTML = html
      panel.dataset.loaded = 'true'

      initSubtabs(panel)

      if (name === 'foro') {
        initForoPanel(panel)
      }

      if (name === 'juegos') {
        initJuegosEcIframe(panel)
      }

      if (name === 'hoy') {
        initHoySidebar(panel)
        renderNoticiasIntoPanel(panel, name).catch((err) => {
          console.warn('Error cargando noticias:', err)
        })
      }

      if (name === 'archivo') {
        loadNoticias()
          .then((all) => {
            const archivePosts = filterPostsByNewsDay(all, 'archivo')
            initArchivoDates(panel, archivePosts)
          })
          .catch((err) => {
            console.warn('Error cargando archivo:', err)
          })
      }

      if (name === 'inicio') {
        runInicioEnter(panel)
      }

      if (name === 'funding') {
        panel.querySelectorAll('[data-pin-carousel]').forEach(initPinCarousel)
        initPinCart(panel)
      }
    })
}

/* =====================================================
  CARGA INICIAL
  ===================================================== */

loadPanel('inicio')
setBackdropSection('inicio')

/* =====================================================
  Fondo global (gradiente + textura, sigue el mouse)
  ===================================================== */

function setBackdropSection(section) {
  document.body.dataset.bgSection = section || 'inicio'
}

function initPinCart(panel) {
  panel.querySelectorAll('.pin-cart-btn').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => e.stopPropagation())
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()
      btn.classList.add('is-added')
      window.setTimeout(() => btn.classList.remove('is-added'), 700)
    })
  })
}

function initSiteBackdrop() {
  const root = document.documentElement

  const setGradientCenter = (x, y) => {
    root.style.setProperty('--bg-x', `${x}%`)
    root.style.setProperty('--bg-y', `${y}%`)
  }

  setGradientCenter(50, 50)

  const updateFromPointer = (clientX, clientY) => {
    const x = (clientX / window.innerWidth) * 100
    const y = (clientY / window.innerHeight) * 100
    setGradientCenter(x, y)
  }

  window.addEventListener('mousemove', (e) => updateFromPointer(e.clientX, e.clientY), {
    passive: true,
  })

  window.addEventListener(
    'touchmove',
    (e) => {
      const touch = e.touches[0]
      if (touch) updateFromPointer(touch.clientX, touch.clientY)
    },
    {passive: true},
  )

  window.addEventListener('mouseleave', () => setGradientCenter(50, 50))
}

initSiteBackdrop()

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

/** Día editorial para “Lo de hoy” vs archivo (solo fecha, sin librerías extra). */
const NOTICIAS_TZ =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NOTICIAS_TZ) || 'America/Mexico_City'

function calendarDayKey(isoLike, timeZone) {
  if (!isoLike) return ''
  const raw = String(isoLike).trim()
  /* Fecha tipo Sanity `date` (solo día): no pasar por UTC midnight. */
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function todayCalendarKey(timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Lo de hoy: solo noticias cuya fecha de publicación es “hoy” en NOTICIAS_TZ.
 * Archivo: días anteriores (y las sin fecha). Fechas futuras no se muestran hasta su día.
 */
function filterPostsByNewsDay(posts, panelName) {
  if (panelName !== 'hoy' && panelName !== 'archivo') return posts

  const today = todayCalendarKey(NOTICIAS_TZ)

  if (panelName === 'hoy') {
    return posts.filter((p) => calendarDayKey(p.date, NOTICIAS_TZ) === today)
  }

  return posts.filter((p) => {
    const key = calendarDayKey(p.date, NOTICIAS_TZ)
    if (!key) return true
    if (key > today) return false
    return key < today
  })
}

function formatDate(isoLike) {
  if (!isoLike) return ''
  const d = new Date(isoLike)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-MX', {year: 'numeric', month: 'short', day: '2-digit'})
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildNewsSubtitleHtml(label, text) {
  const clean = String(text ?? '').trim()
  if (!clean) return ''
  return `
    <div class="news-subtitle">
      <p class="news-subtitle__label">${label}</p>
      <p class="news-subtitle__text">${escapeHtml(clean)}</p>
    </div>
  `.trim()
}

function buildNewsCardHtml(post) {
  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category ?? ''
  const dateLabel = formatDate(post.date)
  const thumb = post.thumbnail
    ? `<img src="${post.thumbnail}" alt="" loading="lazy" decoding="async" />`
    : `<span class="news-thumb-label">IMG</span>`
  const porQueImporta = post.porQueImporta || post.excerpt || ''
  const queSigue = post.queSigue || ''
  const extraHtml = post.html?.trim() ? `<div class="news-extra">${post.html}</div>` : ''

  return `
    <article class="news-card" tabindex="0" aria-expanded="false">
      <div class="news-thumb">${thumb}</div>
      <div class="news-body">
        <p class="news-section-tag">${categoryLabel}${dateLabel ? ` · ${dateLabel}` : ''}</p>
        <h2 class="news-title">${escapeHtml(post.title ?? 'Sin título')}</h2>
        <div class="news-subtitles">
          ${buildNewsSubtitleHtml('¿Por qué importa?', porQueImporta)}
          ${buildNewsSubtitleHtml('¿Qué sigue?', queSigue)}
          ${extraHtml}
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
    porQueImporta,
    queSigue,
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
      porQueImporta: String(it.porQueImporta || '').trim(),
      queSigue: String(it.queSigue || '').trim(),
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

async function renderNoticiasIntoPanel(panelEl, panelName, preloadedPosts) {
  if (panelName === 'archivo' && !panelEl.dataset.selectedArchivoDate) {
    clearArchivoNewsGrids(panelEl)
    return
  }

  const allPosts = preloadedPosts ?? (await loadNoticias())
  let posts = filterPostsByNewsDay(allPosts, panelName)

  if (panelName === 'archivo' && panelEl.dataset.selectedArchivoDate) {
    const selected = panelEl.dataset.selectedArchivoDate
    posts = posts.filter((p) => calendarDayKey(p.date, NOTICIAS_TZ) === selected)
  }

  const grouped = groupByCategory(posts)

  for (const [category, list] of Object.entries(grouped)) {
    const grid = panelEl.querySelector(`.subpanel[data-subpanel="${category}"] .news-grid`)
    if (!grid) continue

    const max = panelName === 'hoy' ? 3 : list.length
    const slice = list.slice(0, max)

    if (!slice.length) {
      const emptyMsg =
        panelName === 'hoy'
          ? 'No hay noticias de hoy en esta categoría.'
          : 'No hay noticias en esta categoría para la fecha seleccionada.'
      grid.innerHTML = `<p class="news-empty">${emptyMsg}</p>`
      continue
    }

    grid.innerHTML = slice.map(buildNewsCardHtml).join('\n')
  }
}
