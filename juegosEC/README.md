# En Corto — Juegos EC

Mini-aplicación **React + Vite** con tres juegos. Se usa sola en desarrollo o **embebida** en la pestaña «Juegos» del sitio En Corto (`iframe`).

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
cd juegosEC
npm install
```

(O desde la raíz: `npm install --prefix juegosEC`)

## Cómo acceder

### Desarrollo (app de juegos sola)

```bash
npm run dev
```

| | |
|---|---|
| **URL** | http://localhost:5174/ |
| **Puerto** | Fijo `5174` (`strictPort` en `vite.config.js`) |

Menú → **La Palabra** (Wordle), **Adivinanzas**, **Pintar**.

### Desarrollo (dentro de En Corto)

En la **raíz** del repo:

```bash
npm run dev:all
```

| Servicio | URL |
|----------|-----|
| Sitio principal | http://localhost:5173/ |
| Juegos (iframe) | http://localhost:5174/ |

Abre el sitio → pestaña **Juegos**. El padre carga el iframe con `VITE_JUEGOS_EC_DEV_URL` o, por defecto, `http://localhost:5174/`.

### Producción

Tras `npm run build` en la **raíz**, los archivos quedan en `dist/juegos-ec/`. El sitio principal los carga con:

`./juegos-ec/index.html`

No hace falta el puerto 5174 en producción.

### Vista previa del build de juegos

```bash
cd juegosEC
npm run build
npm run preview
```

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo (puerto 5174) |
| `npm run build` | Salida en `juegosEC/dist/` |
| `npm run preview` | Previsualizar el build |
| `npm run lint` | ESLint |

## Juegos incluidos

| Juego | Archivo | Notas |
|-------|---------|--------|
| **La Palabra** | `src/components/WordleGame.jsx` | Wordle en español; palabra del día (UTC); confetti al ganar |
| **Adivinanzas** | `src/components/RiddlesGame.jsx` | Quiz con opciones múltiples |
| **Pintar** | `src/components/PaintGame.jsx` | Lienzo, temas aleatorios, galería local con lightbox |

Datos: `src/data/` (`palabras5.js`, `adivinanzas.js`, `temasPaint.js`).

## Paquetes instalados

### Dependencias de producción

| Paquete | Uso en este proyecto |
|---------|----------------------|
| [react](https://react.dev/) / [react-dom](https://react.dev/) | UI de menú y juegos |
| [an-array-of-spanish-words](https://www.npmjs.com/package/an-array-of-spanish-words) | Diccionario de 5 letras para La Palabra (adivinanzas válidas + solución del día) |
| [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) | Animación al ganar en La Palabra |

### Dependencias de desarrollo

| Paquete | Uso |
|---------|-----|
| [vite](https://vitejs.dev/) | Bundler y dev server |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | JSX y HMR en React |
| [eslint](https://eslint.org/) + plugins React | Calidad de código (`npm run lint`) |

## Estructura de carpetas

```
juegosEC/
├── index.html
├── vite.config.js      # base './', puerto 5174
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/     # WordleGame, RiddlesGame, PaintGame, GamesMenu
│   ├── data/
│   ├── lib/            # wordleLogic, paintGallery (localStorage)
│   └── styles/         # tokens.css, juegos.css
└── dist/               # generado por npm run build
```

## Integración con el sitio padre

En `src/script.js` (repo raíz):

- **Dev:** `iframe.src = http://localhost:5174/`
- **Prod:** `iframe.src = ./juegos-ec/index.html`

Variable opcional en el sitio principal: `VITE_JUEGOS_EC_DEV_URL`.

## Galería (Pintar)

Los dibujos guardados viven en **localStorage** del navegador (`encorto-paint-gallery`), máximo 24 imágenes. No se sincronizan entre dispositivos.

## La Palabra — palabra del día

- Una palabra por **día calendario UTC**.
- Lista mezclada al cargar el módulo (evita rachas alfabéticas del JSON ordenado).
- Definiciones opcionales en `DEFINICIONES` dentro de `src/data/palabras5.js`.

## Documentación del sitio completo

Ver [README.md](../README.md) en la raíz del repositorio.
