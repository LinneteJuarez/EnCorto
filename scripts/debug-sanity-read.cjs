/* eslint-disable no-console */
const {createClient} = require('@sanity/client')

const projectId = process.env.SANITY_PROJECT_ID || '1viy3uxj'
const dataset = process.env.SANITY_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2026-05-06'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_READ_TOKEN

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  ...(token ? {token, perspective: 'previewDrafts'} : {}),
})

async function main() {
  const total = await client.fetch('count(*)')
  const noticiaCount = await client.fetch('count(*[_type=="noticia"])')
  const types = await client.fetch('array::unique(*[]._type)[0...50]')
  const sample = await client.fetch('*[_type=="noticia"]|order(date desc){_id,title,date,category}[0...5]')

  console.log(JSON.stringify({projectId, dataset, total, noticiaCount, hasToken: Boolean(token)}, null, 2))
  console.log('types:', types)
  console.log('sample:', sample)
}

main().catch((e) => {
  console.error('ERROR:', e?.message || e)
  process.exit(1)
})

