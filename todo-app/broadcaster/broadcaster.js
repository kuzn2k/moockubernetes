import http from 'http'
import { connect, StringCodec } from 'nats'

const natsUrl = process.env.NATS_URL || 'nats://nats:4222'
const natsSubject = process.env.NATS_SUBJECT || 'todos.events'
const natsQueue = process.env.NATS_QUEUE || 'broadcaster'
const telegramToken = process.env.TELEGRAM_BOT_TOKEN
const telegramChatId = process.env.TELEGRAM_CHAT_ID
const healthPort = Number.parseInt(process.env.HEALTH_PORT || '8080', 10)
const telegramCheckIntervalMs = Number.parseInt(process.env.TELEGRAM_CHECK_INTERVAL_SEC || '30', 10) * 1000
const telegramTimeoutMs = Number.parseInt(process.env.TELEGRAM_TIMEOUT_MS || '5000', 10)

const codec = StringCodec()
let natsConnected = false
let lastTelegramCheckAt = 0
let lastTelegramOk = false

function formatMessage(payload) {
  const todo = payload?.todo
  const title = todo?.title || 'Untitled'
  const doneText = todo?.done ? 'done' : 'pending'
  const idText = Number.isInteger(todo?.id) ? ` #${todo.id}` : ''

  if (payload?.type === 'todo.created') {
    return `New todo${idText}: ${title} [${doneText}]`
  }
  if (payload?.type === 'todo.updated') {
    return `Updated todo${idText}: ${title} [${doneText}]`
  }
  return `Todo event${idText}: ${title} [${doneText}]`
}

async function sendTelegramMessage(text) {
  const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: telegramChatId, text })
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('Failed to send Telegram message', res.status, body)
  }
}

async function checkTelegramHealth() {
  if (!telegramToken) return false
  const now = Date.now()
  if (now - lastTelegramCheckAt < telegramCheckIntervalMs) {
    return lastTelegramOk
  }
  lastTelegramCheckAt = now

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), telegramTimeoutMs)
  try {
    const res = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`, {
      signal: controller.signal
    })
    lastTelegramOk = res.ok
  } catch (err) {
    lastTelegramOk = false
  } finally {
    clearTimeout(timeout)
  }
  return lastTelegramOk
}

function startHealthServer() {
  const server = http.createServer((req, res) => {
    if (req.url !== '/healthz' && req.url !== '/readyz') {
      res.statusCode = 404
      res.end()
      return
    }

    Promise.resolve()
      .then(async () => {
        const telegramOk = await checkTelegramHealth()
        if (!natsConnected || !telegramOk) {
          res.statusCode = 500
          res.end('unhealthy')
          return
        }
        res.statusCode = 200
        res.end('ok')
      })
      .catch(() => {
        res.statusCode = 500
        res.end('unhealthy')
      })
  })

  server.listen(healthPort, '0.0.0.0', () => {
    console.log(`Health endpoint listening on :${healthPort}/healthz`)
  })
}

async function run() {
  if (!telegramToken || !telegramChatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
    process.exit(1)
  }

  const nc = await connect({ servers: natsUrl, name: `broadcaster-${process.pid}` })
  natsConnected = true
  nc.closed().then(() => {
    natsConnected = false
  })
  const sub = nc.subscribe(natsSubject, { queue: natsQueue })

  console.log(`Broadcaster listening on ${natsSubject} via ${natsUrl} (queue: ${natsQueue})`)

  startHealthServer()

  const shutdown = async () => {
    await nc.drain()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  for await (const msg of sub) {
    let payload
    try {
      payload = JSON.parse(codec.decode(msg.data))
    } catch (err) {
      console.error('Invalid message payload', err)
      continue
    }

    const text = formatMessage(payload)
    await sendTelegramMessage(text)
  }
}

run().catch((err) => {
  console.error('Broadcaster failed', err)
  process.exit(1)
})
