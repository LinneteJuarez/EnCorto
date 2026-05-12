import './juegos.css'

/**
 * Panel Juegos: menú, transición a Wordle y acciones del modal final.
 * La lógica de partida (palabra del día, teclado) puede ampliarse aquí.
 */

function buildShareLines() {
  const url = typeof window !== "undefined" ? window.location.href : ""
  const title = "En Corto — La Palabra"
  const body = `Jugué «La Palabra» en En Corto.\n${url}`
  return { title, text: body, url }
}

async function shareWordleResult(shareBtn) {
  const { title, text, url } = buildShareLines()
  const prev = shareBtn?.textContent

  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      if (shareBtn) {
        shareBtn.textContent = "Copiado"
        window.setTimeout(() => {
          shareBtn.textContent = prev ?? "Compartir resultado"
        }, 1600)
      }
      return
    }
    window.prompt("Copia tu resultado:", text)
  } catch (err) {
    if (err?.name === "AbortError") return
    console.warn("Compartir resultado:", err)
    window.prompt("Copia tu resultado:", text)
  }
}

/**
 * @param {HTMLElement} panel - elemento #panel-juegos tras cargar juegos/juegos.html
 */
export function initJuegosPanel(panel) {
  const menuEl = panel.querySelector("#games-menu")
  const gameEl = panel.querySelector("#wordle-screen")
  const endEl = panel.querySelector("#wordle-end")
  const btnWordle = panel.querySelector("#btn-wordle")
  const btnBack = panel.querySelector("#wordle-back")
  const wmBack = panel.querySelector("#wm-back")
  const wmShare = panel.querySelector("#wm-share")

  if (!menuEl || !gameEl || !btnWordle) return

  const showMenu = () => {
    menuEl.classList.remove("wordle-hidden")
    gameEl.classList.add("wordle-hidden")
    endEl?.classList.add("wordle-hidden")
  }

  const showGame = () => {
    menuEl.classList.add("wordle-hidden")
    gameEl.classList.remove("wordle-hidden")
    endEl?.classList.add("wordle-hidden")
  }

  showMenu()

  btnWordle.addEventListener("click", (e) => {
    if (e.target.closest(".game-card--soon")) return
    showGame()
  })

  btnBack?.addEventListener("click", showMenu)
  wmBack?.addEventListener("click", showMenu)

  wmShare?.addEventListener("click", () => shareWordleResult(wmShare))
}
