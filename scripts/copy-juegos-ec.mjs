import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const src = path.join(root, 'juegosEC', 'dist')
const dest = path.join(root, 'dist', 'juegos-ec')

if (!fs.existsSync(src)) {
  console.error('copy-juegos-ec: no existe juegosEC/dist. Ejecuta antes: cd juegosEC && npm run build')
  process.exit(1)
}

fs.mkdirSync(dest, { recursive: true })
fs.cpSync(src, dest, { recursive: true })
console.log('copy-juegos-ec: copiado a dist/juegos-ec')
