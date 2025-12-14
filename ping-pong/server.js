import Fastify from 'fastify'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.resolve(new URL('.', import.meta.url).pathname, '/var/tmp/mooc/files')
const DATA_FILE = path.join(DATA_DIR, 'count.txt')

async function ensureDataDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }) } catch { /* ignore */ }
}

async function saveCount(count) {
  const tmp = DATA_FILE + '.tmp'
  await fs.writeFile(tmp, count, 'utf8')
  await fs.rename(tmp, DATA_FILE)
}

async function loadCount() {
  try {
    const txt = await fs.readFile(DATA_FILE, 'utf8')
    return txt.trim() || null
  } catch (err) {
    console.error(err)
    return null
  }
}

ensureDataDir()

const fastify = Fastify({
  logger: true
})

fastify.get('/pingpong', async function (request, reply) {
  reply.header('Content-Type', 'text/plain')

  let txt = await loadCount()
  let count = parseInt(txt, 10)  
  if (Number.isNaN(count)) {
     count = 1
  } else {
    count++
  }
  const out = "pong " + count

  try {
    await saveCount(String(count))
    console.log("Updated count: " + count)
  } catch (err) {
    console.error('Failed saving count', err)
  }

  reply.send(out)
})

const port = process.env.PORT || 3000

const start = async () => {
  try {

    fastify.listen({ port: port, host: '0.0.0.0' })

  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()