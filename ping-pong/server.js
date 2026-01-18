import Fastify from 'fastify'
import { Pool } from 'pg'

let isDbAlive = false

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

async function checkConnectDb() {
  try {
    await pool.query(`SELECT value FROM kv WHERE key = $1`, ['count'])
    isDbAlive = true
    return true
  } catch (err) {
    fastify.log.error('database is down', err)
    isDbAlive = false
  }
  return false
}

async function checkDb() {
  try {
    await ensureDb()
    fastify.log.info("Database is ready")
    isDbAlive = true
    return true
  } catch (err) {
    fastify.log.error(err)
    setTimeout(() => checkDb(), 2)
  }
  return false
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
  if (isDbAlive) {
    const newCount = await incrementCount()
    const out = "pong " + newCount
    reply.send(out)
  } else {
    reply.code(500).send("database is not ready")
  }
})

fastify.get('/pings', async function (request, reply) {
  if (isDbAlive) {
    const c = await getCount()
    reply.send({count: c})
  } else {
    reply.code(500).send({error: "database is not ready"})
  }
})

fastify.get('/', async function (request, reply) {
  reply.send({healthcheck: true})
})

fastify.get('/healthz', async function (request, reply) {
  const dbAlive = await checkConnectDb()
  if (dbAlive) {
    reply.code(200)
  }
  else {
    reply.code(500)
  }
  reply.send("")
})

const port = process.env.PORT || 3000

const start = async () => {
  try {
    await fastify.listen({ port: port, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
checkDb()
