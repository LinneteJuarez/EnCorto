# En Corto

Sitio editorial con noticias (Sanity), secciones Inicio, Lo de hoy, Archivo, Foro, Funding y **Juegos** (mini-app React embebida).

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior (recomendado 20+)
- npm (incluido con Node)

## Estructura del repositorio

| Carpeta | Descripción |
|---------|-------------|
| `src/` | Sitio principal (HTML, CSS, `script.js`, paneles) |
| `juegosEC/` | Juegos en React + Vite (La Palabra, Adivinanzas, Pintar) |
| `encortoAdmin/` | Sanity Studio para editar noticias |
| `dist/` | Build de producción (se genera con `npm run build`) |

## Instalación

Desde la raíz del proyecto:

```bash
npm install
cd juegosEC
npm install
cd ..
```

> El panel de administración (`encortoAdmin`) tiene dependencias propias. Si lo usas: `cd encortoAdmin && npm install`.

## Variables de entorno

Copia `.env.example` a `.env` en la raíz (solo para scripts de migración y tareas con Sanity CLI).

Para el **sitio en el navegador**, Vite lee variables con prefijo `VITE_`. Puedes crear `src/.env` o `.env` en la raíz según tu configuración:

| Variable | Uso |
|----------|-----|
| `VITE_SANITY_PROJECT_ID` | Proyecto Sanity (por defecto en código: `1viy3uxj`) |
| `VITE_SANITY_DATASET` | Dataset (`production`) |
| `VITE_SANITY_API_VERSION` | Versión API Sanity |
| `VITE_NOTICIAS_TZ` | Zona horaria para «Lo de hoy» / Archivo (ej. `America/Mexico_City`) |
| `VITE_JUEGOS_EC_DEV_URL` | URL del dev server de juegos (por defecto `http://localhost:5174/`) |

## Cómo ejecutar en desarrollo

### Solo el sitio principal

```bash
npm run dev
```

Abre **http://localhost:5173/**

Las noticias se cargan desde Sanity. La pestaña **Juegos** necesita el servidor de `juegosEC` en paralelo (ver abajo).

### Solo juegos (desarrollo aislado)

```bash
npm run dev:juegos
```

Abre **http://localhost:5174/** — menú y los tres juegos sin el resto del sitio.

Documentación detallada: [juegosEC/README.md](./juegosEC/README.md)

### Sitio + juegos a la vez (recomendado)

```bash
npm run dev:all
```

| Servicio | URL |
|----------|-----|
| En Corto (principal) | http://localhost:5173/ |
| Juegos EC | http://localhost:5174/ |

En el sitio principal, entra a la pestaña **Juegos**: el iframe apunta al puerto 5174 en modo desarrollo.

## Build de producción

```bash
npm run build
```

1. Compila el sitio en `dist/`
2. Compila `juegosEC` en `juegosEC/dist/`
3. Copia juegos a `dist/juegos-ec/`

Sirve la carpeta `dist/` con cualquier servidor estático. Ejemplo:

```bash
npx vite preview --root src
# o, si tienes live-server instalado en el proyecto:
npm run serve
```

En producción, Juegos carga `./juegos-ec/index.html` (sin puerto 5174).

## Scripts npm (raíz)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Dev server Vite del sitio (`src/`) |
| `npm run dev:juegos` | Dev server de `juegosEC` |
| `npm run dev:all` | Ambos con [concurrently](https://www.npmjs.com/package/concurrently) |
| `npm run build` | Build sitio + juegos + copia a `dist/juegos-ec` |
| `npm run serve` | [live-server](https://www.npmjs.com/package/live-server) (según configuración local) |
| `npm run migrate:noticias` | Migra Markdown a Sanity (requiere `SANITY_WRITE_TOKEN` en `.env`) |

## Paquetes principales (sitio)

| Paquete | Para qué se usa |
|---------|------------------|
| [vite](https://vitejs.dev/) | Dev server y build del frontend |
| [@sanity/client](https://www.sanity.io/docs/js-client) | Consultar noticias en Lo de hoy, Archivo, etc. |
| [@portabletext/to-html](https://github.com/portabletext/to-html) | Cuerpo de noticias (Portable Text → HTML) |
| [concurrently](https://www.npmjs.com/package/concurrently) | Ejecutar sitio y juegos en un solo comando (`dev:all`) |

Otros en `package.json` (Supabase, socket.io, Konva, etc.) se usan en partes concretas del proyecto o están listos para extensiones.

## Sanity Studio (contenido)

```bash
cd encortoAdmin
npm install
npm run dev
```

Studio en **http://localhost:3333/** (tras `npm install` en esa carpeta).

## Secciones del sitio

- **Inicio** — portada
- **Lo de hoy** — noticias del día (filtro por `VITE_NOTICIAS_TZ`)
- **Archivo** — noticias por fecha (selector de calendario)
- **Juegos** — iframe → `juegosEC`
- **Foro** / **Funding** — paneles propios

## Enlaces útiles

- [Juegos EC — README](./juegosEC/README.md)
- Repositorio: https://github.com/LinneteJuarez/EnCorto
