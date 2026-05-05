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

      if (name === "hoy" || name === "archivo") {
        renderNoticiasIntoPanel(panel, name).catch(() => {
          // Si aún no hay noticias/configuración, dejamos el contenido estático del panel.
        });
      }
    });
}


/* =====================================================
   CARGA INICIAL
   ===================================================== */

loadPanel("inicio");


/* =====================================================
   NOTICIAS (Markdown + frontmatter) usando marked
   ===================================================== */

const NOTICIAS_INDEX_URL = "content/noticias/index.json";
const CATEGORY_LABELS = {
  global: "Global",
  politica: "Política",
  economia: "Economía",
  tec: "Tec & Ciencia",
  deportes: "Deportes",
  espectaculos: "Espectáculos",
  felices: "Noticias Felices"
};

function isMarkedAvailable() {
  return typeof window !== "undefined" && typeof window.marked?.parse === "function";
}

function parseFrontmatter(markdownText) {
  const text = markdownText.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) return { data: {}, body: text };

  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return { data: {}, body: text };

  const raw = text.slice(4, end).trim();
  const body = text.slice(end + "\n---\n".length);

  const data = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let value = m[2].trim();
    value = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    data[key] = value;
  }

  return { data, body };
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`No se pudo cargar ${url}`);
  return await r.json();
}

async function fetchText(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`No se pudo cargar ${url}`);
  return await r.text();
}

function formatDate(isoLike) {
  if (!isoLike) return "";
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "2-digit" });
}

function buildNewsCardHtml(post) {
  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category ?? "";
  const dateLabel = formatDate(post.date);
  const thumb = post.thumbnail
    ? `<img src="${post.thumbnail}" alt="" loading="lazy" decoding="async" />`
    : `<span class="news-thumb-label">IMG</span>`;

  return `
    <article class="news-card" tabindex="0">
      <div class="news-thumb">${thumb}</div>
      <div class="news-body">
        <p class="news-section-tag">${categoryLabel}${dateLabel ? ` · ${dateLabel}` : ""}</p>
        <h2 class="news-title">${post.title ?? "Sin título"}</h2>
        <p class="news-excerpt">${post.excerpt ?? ""}</p>
        <div class="news-expanded">
          ${post.html ?? ""}
          <button class="news-close">Cerrar ↑</button>
        </div>
      </div>
    </article>
  `.trim();
}

function buildExcerptFromText(text, maxLen = 120) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1)}…`;
}

async function loadPost(mdPath) {
  if (!isMarkedAvailable()) throw new Error("marked no está cargado");

  const md = await fetchText(mdPath);
  const { data, body } = parseFrontmatter(md);

  const html = window.marked.parse(body);
  const excerpt = data.excerpt || buildExcerptFromText(body);

  return {
    ...data,
    category: data.category || "global",
    title: data.title || "Sin título",
    date: data.date || "",
    thumbnail: data.thumbnail || "",
    html,
    excerpt
  };
}

async function loadNoticias() {
  const index = await fetchJson(NOTICIAS_INDEX_URL);
  const items = Array.isArray(index) ? index : (index?.items ?? []);

  const loaded = [];
  for (const it of items) {
    const path = typeof it === "string" ? it : it?.path;
    if (!path) continue;
    try {
      loaded.push(await loadPost(path));
    } catch {
      // saltar md roto/no encontrado
    }
  }

  loaded.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return loaded;
}

function groupByCategory(posts) {
  const grouped = {
    global: [],
    politica: [],
    economia: [],
    tec: [],
    deportes: [],
    espectaculos: [],
    felices: []
  };

  for (const p of posts) {
    const key = grouped[p.category] ? p.category : "global";
    grouped[key].push(p);
  }

  return grouped;
}

async function renderNoticiasIntoPanel(panelEl, panelName) {
  const posts = await loadNoticias();
  const grouped = groupByCategory(posts);

  for (const [category, list] of Object.entries(grouped)) {
    const grid = panelEl.querySelector(`.subpanel[data-subpanel="${category}"] .news-grid`);
    if (!grid) continue;

    const max = panelName === "hoy" ? 3 : list.length;
    const slice = list.slice(0, max);

    if (!slice.length) {
      grid.innerHTML = "";
      continue;
    }

    grid.innerHTML = slice.map(buildNewsCardHtml).join("\n");
  }
}