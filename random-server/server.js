import Fastify from 'fastify'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.resolve(new URL('.', import.meta.url).pathname, '/var/tmp/mooc/files')
const DATA_FILE = path.join(DATA_DIR, 'random.txt')
const COUNT_FILE = path.join(DATA_DIR, 'count.txt')

async function ensureDataDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }) } catch { /* ignore */ }
}

async function loadRandomHash() {
  try {
    const txt = await fs.readFile(DATA_FILE, 'utf8')
    return txt.trim() || null
  } catch (err) {
    return null
  }
}

async function loadCount() {
  try {
    const txt = await fs.readFile(COUNT_FILE, 'utf8')
    return txt.trim() || null
  } catch (err) {
    console.error(err)
    return null
  }
}

function getTimestampString(hash) {
    const timestamp = new Date().toISOString()
    return `${timestamp}: ${hash}`
}

ensureDataDir()

const fastify = Fastify({
  logger: true
})

fastify.get('/', async function (request, reply) {
  reply.header('Content-Type', 'text/plain')
  const rs = await loadRandomHash()
  const count = await loadCount()
  const message = `${getTimestampString(rs)}.\nPing / Pongs: ${count}`
  reply.send(message)
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