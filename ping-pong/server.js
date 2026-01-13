import Fastify from 'fastify'
import { Pool } from 'pg'

const fastify = Fastify({
  logger: true,
  routerOptions: {
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true
  }
})

const pool = new Pool({
  host: process.env.PGHOST || 'postgress-svc',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'postgres'
})

async function ensureDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value BIGINT NOT NULL
    )
  `)
  await pool.query(
    `INSERT INTO kv(key, value) VALUES($1, $2) ON CONFLICT (key) DO NOTHING`,
    ['count', 0]
  )
}

async function incrementCount() {
  const res = await pool.query(
    `UPDATE kv SET value = value + 1 WHERE key = $1 RETURNING value`,
    ['count']
  )
  if (res.rowCount === 0) {
    await pool.query(`INSERT INTO kv(key, value) VALUES($1, $2)`, ['count', 1])
    return 1
  }
  return parseInt(res.rows[0].value, 10)
}

async function getCount() {
  const res = await pool.query(`SELECT value FROM kv WHERE key = $1`, ['count'])
  return res.rowCount ? parseInt(res.rows[0].value, 10) : 0
}

fastify.get('/pingpong', async function (request, reply) {
  reply.header('Content-Type', 'text/plain')
  const newCount = await incrementCount()
  const out = "pong " + newCount
  reply.send(out)
})

fastify.get('/pings', async function (request, reply) {
  const c = await getCount()
  reply.send({count: c})
})

fastify.get('/', async function (request, reply) {
  reply.send({healthcheck: true})
})

const port = process.env.PORT || 3000

const start = async () => {
  try {
    await ensureDb()
    await fastify.listen({ port: port, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()