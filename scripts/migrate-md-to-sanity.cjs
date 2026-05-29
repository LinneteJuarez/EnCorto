/* eslint-disable no-console */
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

// Load .env from repo root (Node doesn't do this automatically)
require('dotenv').config({path: path.resolve(__dirname, '..', '.env')})

const matter = require('gray-matter')
const {marked} = require('marked')
const {createClient} = require('@sanity/client')

const ROOT = path.resolve(__dirname, '..')

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || '1viy3uxj'
const SANITY_DATASET = process.env.SANITY_DATASET || 'production'
const SANITY_API_VERSION = process.env.SANITY_API_VERSION || '2026-05-06'
const SANITY_WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN

function fail(msg) {
  console.error(`\n${msg}\n`)
  process.exit(1)
}

if (!SANITY_WRITE_TOKEN) {
  fail(
    [
      'Missing SANITY_WRITE_TOKEN.',
      'Create a Sanity API token with write permissions and run:',
      '  $env:SANITY_WRITE_TOKEN="YOUR_TOKEN_HERE"',
      '  npm run migrate:noticias',
    ].join('\n'),
  )
}

// People sometimes paste a session token (skcy...) instead of an API token.
// That will 401 with "Session not found" / "Session does not match project host".
if (String(SANITY_WRITE_TOKEN).startsWith('skcy')) {
  fail(
    [
      'Your SANITY_WRITE_TOKEN looks like a Sanity session token (starts with "skcy").',
      `Please create a real API token for THIS project (${SANITY_PROJECT_ID}) with write permissions:`,
      '  Sanity Manage → Project "encorto" → API → Tokens → Add API token',
      'Then put it in .env as SANITY_WRITE_TOKEN=...',
    ].join('\n'),
  )
}

const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
})

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function toIsoDateTime(value, fallbackFromFilename) {
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  // fallback: YYYY-MM-DD in filename
  const m = String(fallbackFromFilename || '').match(/(\d{4}-\d{2}-\d{2})/)
  if (m) return new Date(`${m[1]}T12:00:00.000Z`).toISOString()
  return new Date().toISOString()
}

function normCategory(value) {
  const v = String(value || '').trim().toLowerCase()
  const allowed = new Set([
    'global',
    'politica',
    'economia',
    'tec',
    'deportes',
    'espectaculos',
    'felices',
  ])
  return allowed.has(v) ? v : 'global'
}

function span(text, marks) {
  return {
    _type: 'span',
    _key: crypto.randomUUID(),
    text: text == null ? '' : String(text),
    marks: marks && marks.length ? marks : [],
  }
}

function block(style, children, markDefs) {
  return {
    _type: 'block',
    _key: crypto.randomUUID(),
    style,
    markDefs: markDefs || [],
    children: children && children.length ? children : [span('')],
  }
}

function flattenInline(tokens, ctx) {
  const out = []
  for (const t of tokens || []) {
    if (!t) continue
    if (t.type === 'text') {
      out.push(span(t.raw || t.text || '', ctx.marks))
      continue
    }
    if (t.type === 'strong') {
      out.push(...flattenInline(t.tokens || [], {marks: [...ctx.marks, 'strong']}))
      continue
    }
    if (t.type === 'em') {
      out.push(...flattenInline(t.tokens || [], {marks: [...ctx.marks, 'em']}))
      continue
    }
    if (t.type === 'codespan') {
      out.push(span(t.text || '', [...ctx.marks, 'code']))
      continue
    }
    if (t.type === 'br') {
      out.push(span('\n', ctx.marks))
      continue
    }
    if (t.type === 'link') {
      const key = crypto.randomUUID()
      ctx.markDefs.push({_key: key, _type: 'link', href: t.href})
      out.push(...flattenInline(t.tokens || [{type: 'text', text: t.text || t.href}], {marks: [...ctx.marks, key]}))
      continue
    }
    if (t.type === 'image') {
      // keep alt text as a hint in content; actual thumbnail is handled from frontmatter
      out.push(span(t.text ? `[Imagen: ${t.text}]` : '[Imagen]', ctx.marks))
      continue
    }
    // Fallback: try raw/text
    out.push(span(t.raw || t.text || '', ctx.marks))
  }
  return out
}

function markdownToPortableText(md) {
  const tokens = marked.lexer(md || '')
  const blocks = []

  for (const t of tokens) {
    if (!t) continue

    if (t.type === 'space') continue

    if (t.type === 'heading') {
      const markDefs = []
      const children = flattenInline(t.tokens || [], {marks: [], markDefs})
      const depth = Math.min(Math.max(t.depth || 2, 1), 6)
      const style = depth === 1 ? 'h1' : depth === 2 ? 'h2' : depth === 3 ? 'h3' : depth === 4 ? 'h4' : depth === 5 ? 'h5' : 'h6'
      blocks.push(block(style, children, markDefs))
      continue
    }

    if (t.type === 'paragraph') {
      const markDefs = []
      const children = flattenInline(t.tokens || [], {marks: [], markDefs})
      blocks.push(block('normal', children, markDefs))
      continue
    }

    if (t.type === 'list') {
      const listItemBlocks = []
      for (const item of t.items || []) {
        const markDefs = []
        const children = flattenInline(item.tokens || [{type: 'text', text: item.text || ''}], {marks: [], markDefs})
        listItemBlocks.push({
          _type: 'block',
          _key: crypto.randomUUID(),
          style: 'normal',
          listItem: t.ordered ? 'number' : 'bullet',
          level: 1,
          markDefs,
          children: children && children.length ? children : [span('')],
        })
      }
      blocks.push(...listItemBlocks)
      continue
    }

    if (t.type === 'code') {
      // Keep code blocks as plain paragraphs; schema only supports blocks, so we store as inline code-ish.
      blocks.push(
        block('normal', [span(t.text ? t.text : '', ['code'])], []),
      )
      continue
    }
  }

  // Ensure not empty (schema requires body)
  if (!blocks.length) blocks.push(block('normal', [span('')], []))
  return blocks
}

async function maybeUploadThumbnail(thumbnailValue, mdFilePath) {
  if (!thumbnailValue) return null
  const raw = String(thumbnailValue).trim()
  if (!raw) return null

  // Only support local files in this repo for now
  const rel = raw.startsWith('/') ? raw.slice(1) : raw
  const abs = path.resolve(ROOT, rel)

  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null

  const ext = path.extname(abs).toLowerCase()
  const contentType =
    ext === '.png'
      ? 'image/png'
      : ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
            ? 'image/gif'
            : null

  if (!contentType) return null

  const stream = fs.createReadStream(abs)
  const asset = await sanity.assets.upload('image', stream, {
    filename: path.basename(abs),
    contentType,
  })

  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: asset._id},
  }
}

async function upsertNoticiaFromMd(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = matter(raw)
  const front = parsed.data || {}

  const title = String(front.title || '').trim() || path.basename(filePath, path.extname(filePath))
  const date = toIsoDateTime(front.date, path.basename(filePath))
  const category = normCategory(front.category)
  const porQueImporta = String(front.porQueImporta || front.por_que_importa || '').trim()
  const queSigue = String(front.queSigue || front.que_sigue || '').trim()
  const body = markdownToPortableText(parsed.content || '')

  const slugBase = path
    .basename(filePath, path.extname(filePath))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const docId = `noticia.${slugBase || crypto.randomUUID()}`

  const thumbnail = await maybeUploadThumbnail(front.thumbnail, filePath)

  const doc = {
    _id: docId,
    _type: 'noticia',
    title,
    date,
    category,
    ...(porQueImporta ? {porQueImporta} : {}),
    ...(queSigue ? {queSigue} : {}),
    body,
    ...(thumbnail ? {thumbnail} : {}),
  }

  await sanity.createOrReplace(doc)
  return {docId, title}
}

async function main() {
  const contentDir = path.resolve(ROOT, 'content', 'noticias')
  if (!fs.existsSync(contentDir)) fail(`Missing directory: ${contentDir}`)

  const files = walk(contentDir).filter((f) => f.toLowerCase().endsWith('.md'))
  if (!files.length) fail(`No .md files found under: ${contentDir}`)

  console.log(`Migrating ${files.length} markdown files to Sanity (${SANITY_PROJECT_ID}/${SANITY_DATASET})...`)

  for (const f of files) {
    const rel = path.relative(ROOT, f)
    try {
      const res = await upsertNoticiaFromMd(f)
      console.log(`- OK  ${rel}  →  ${res.docId}`)
    } catch (err) {
      console.error(`- FAIL ${rel}`)
      throw err
    }
  }

  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

