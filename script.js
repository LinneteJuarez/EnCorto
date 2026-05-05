/* =====================================================
   MAIN TABS (pestañas principales)
   ===================================================== */

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const name = tab.dataset.tab;

    // activar tab
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    // mostrar panel
    panels.forEach(p => p.classList.remove("active"));
    document.getElementById(`panel-${name}`).classList.add("active");

    // cargar contenido si hace falta
    loadPanel(name);
  });
});


/* =====================================================
   SUBTABS (aisladas por panel)
   ===================================================== */

function initSubtabs(panel) {
  const subtabs = panel.querySelectorAll(".subtab");
  const subpanels = panel.querySelectorAll(".subpanel");

  if (!subtabs.length) return;

  subtabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.sub;

      subtabs.forEach(t => t.classList.remove("active"));
      subpanels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      panel
        .querySelector(`.subpanel[data-subpanel="${target}"]`)
        ?.classList.add("active");
    });
  });
}


/* =====================================================
   NEWS CARDS — expansión / colapso (panel hoy)
   ===================================================== */

const hoyPanel = document.getElementById("panel-hoy");

hoyPanel.addEventListener("click", e => {
  // Botón cerrar
  if (e.target.closest(".news-close")) {
    e.stopPropagation();
    const card = e.target.closest(".news-card");
    card?.classList.remove("open");
    return;
  }

  // Click en card
  const card = e.target.closest(".news-card");
  if (!card) return;

  const subpanel = card.closest(".subpanel");
  const isOpen = card.classList.contains("open");

  // cerrar otras
  subpanel
    .querySelectorAll(".news-card.open")
    .forEach(c => c.classList.remove("open"));

  if (!isOpen) card.classList.add("open");
});

// Soporte teclado
hoyPanel.addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const card = e.target.closest(".news-card");
  if (!card) return;
  e.preventDefault();
  card.click();
});


/* =====================================================
   CARGA DE PANELES (HTML externo)
   ===================================================== */

const panelMap = {
  inicio: "panels/inicio.html",
  hoy: "panels/hoy.html",
  juegos: "panels/juegos.html",
  foro: "panels/foro.html",
  funding: "panels/funding.html",
  archivo: "panels/archivo.html"
};

function loadPanel(name) {
  const panel = document.getElementById(`panel-${name}`);
  if (!panel || panel.dataset.loaded) return;

  fetch(panelMap[name])
    .then(r => r.text())
    .then(html => {
      panel.innerHTML = html;
      panel.dataset.loaded = "true";

      // inicializar subtabs del panel recién cargado
      initSubtabs(panel);
    });
}


/* =====================================================
   CARGA INICIAL
   ===================================================== */

loadPanel("inicio");