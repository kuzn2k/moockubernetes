import Fastify from 'fastify'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.resolve(new URL('.', import.meta.url).pathname, '/var/tmp/mooc/files')
const DATA_FILE = path.join(DATA_DIR, 'random.txt')

const CONFIG_DIR = path.resolve(new URL('.', import.meta.url).pathname, '/config')
const INFO_FILE = path.join(CONFIG_DIR, 'information.txt')

let isPingsReady = false

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

async function loadInformationFile() {
  try {
    const txt = await fs.readFile(INFO_FILE, 'utf8')
    return txt.trim() || null
  } catch (err) {
    return null
  }
}

async function checkPings() {
  try {
    const res = await fetch("http://ping-pong-service-svc:2345/healthz")
    if (!res.ok) {
      fastify.log.error('Pings is not ready')
    } else {
      fastify.log.info('Pings is up')
      isPingsReady = true
      return true
    }
  } catch (err) {
    fastify.log.error(err)
    fastify.log.error('Error: Pings is not ready')
  }
  isPingsReady = false
  return false
}

async function loadCount() {
  if (isPingsReady) {
    try {
      const res = await fetch("http://ping-pong-service-svc:2345/pings")
      if (!res.ok) {
        fastify.log.error(`Failed fetching pings: ${res.status} ${res.statusText}`)
        return null
      }
      const { count } = await res.json()
      return count
    } catch (err) {
      fastify.log.error(err)
      return null
    }
  }
  return null
}

function getTimestampString(hash) {
    const timestamp = new Date().toISOString()
    return `${timestamp}: ${hash}`
}

ensureDataDir()

const fastify = Fastify({
  logger: true,
  routerOptions: {
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true
  }
})

fastify.get('/', async function (request, reply) {
  reply.header('Content-Type', 'text/plain')
  const rs = await loadRandomHash()
  const count = await loadCount()
  const infoText = await loadInformationFile()
  const message = `file content: ${infoText}\nenv variable: MESSAGE=${process.env.MESSAGE || 'N/A'}\n${getTimestampString(rs)}.\nPing / Pongs: ${count}`
  reply.send(message)
})

fastify.get('/healthz', async function (request, reply) {
  const ready = await checkPings()
  if (ready) {
    reply.code(200)
    fastify.log.info("Return code " + reply.statusCode)
  } else {
    reply.code(500)
    fastify.log.info("Return code " + reply.statusCode)
  }
  reply.send("")
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
