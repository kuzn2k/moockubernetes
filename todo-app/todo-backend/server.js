import Fastify from 'fastify'
import { Pool } from 'pg'
import { connect, StringCodec } from 'nats'

const todosUrl = process.env.TODOS_URL || '/todos'
const natsUrl = process.env.NATS_URL || 'nats://nats:4222'
const natsSubject = process.env.NATS_SUBJECT || 'todos.events'

let natsConn = null
let natsConnectPromise = null
const natsCodec = StringCodec()

const fastify = Fastify({
  logger: true,
  routerOptions: {
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true
  }
})

const pool = new Pool({
  host: process.env.DB_URL || 'todo-postgres-svc',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'postgres'
})

async function ensureDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false
    )
  `)
  await pool.query(`
    ALTER TABLE todos
    ADD COLUMN IF NOT EXISTS done BOOLEAN NOT NULL DEFAULT false
  `)
}

async function checkConnectDb() {
  try {
    await pool.query('SELECT COUNT(id) FROM todos')
    return true
  } catch (err) {
    fastify.log.error('database is down', err)
  }
  return false
}

async function checkDb() {
  try {
    await ensureDb()
    fastify.log.info("Database is ready")
    return true
  } catch (err) {
    fastify.log.error(err)
    setTimeout(() => checkDb(), 2)
  }
  return false
}

async function getTodos() {
  const res = await pool.query('SELECT id, title, done FROM todos ORDER BY id')
  return res.rows
}

async function createTodo(title, done) {
  const res = await pool.query(
    'INSERT INTO todos(title, done) VALUES($1, $2) RETURNING id, title, done',
    [title, done]
  )
  return res.rows[0]
}

async function updateTodoDone(id, done) {
  const res = await pool.query(
    'UPDATE todos SET done = $1 WHERE id = $2 RETURNING id, title, done',
    [done, id]
  )
  return res.rows[0] || null
}

async function getNatsConnection() {
  if (natsConn) return natsConn
  if (!natsConnectPromise) {
    natsConnectPromise = connect({ servers: natsUrl, name: 'todo-backend' })
      .then((conn) => {
        natsConn = conn
        conn.closed().then((err) => {
          if (err) {
            fastify.log.error({ err }, 'NATS connection closed with error')
          }
          natsConn = null
          natsConnectPromise = null
        })
        return conn
      })
      .catch((err) => {
        fastify.log.error({ err }, 'Failed to connect to NATS')
        natsConnectPromise = null
        return null
      })
  }
  return natsConnectPromise
}

async function publishTodoEvent(type, todo) {
  const conn = await getNatsConnection()
  if (!conn) {
    fastify.log.error('No NATS connection')
    return
  }
  const payload = {
    type,
    todo,
    ts: new Date().toISOString()
  }
  try {
    conn.publish(natsSubject, natsCodec.encode(JSON.stringify(payload)))
    fastify.log.info('Published new todo event')
  } catch (err) {
    fastify.log.error({ err }, 'Failed to publish todo event')
  }
}

fastify.get('/', async function (request, reply) {
  reply.send({healthcheck: true})
})

fastify.get(todosUrl, async (request, reply) => {
  const list = await getTodos()
  reply.send({ size: list.length, list })
})

fastify.post(todosUrl, {
  schema: {
    body: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', maxLength: 140 },
        done: { type: 'boolean' }
      }
    }
  }
}, async (request, reply) => {
  const { title, done } = request.body
  if (!title) {
    reply.code(400).send({ error: 'title required' })
    return
  }
  const todo = await createTodo(title, done ?? false)
  await publishTodoEvent('todo.created', todo)
  reply.code(201).send(todo)
})

fastify.put(`${todosUrl}/:id`, {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'integer' }
      }
    },
    body: {
      type: 'object',
      required: ['done'],
      properties: {
        done: { type: 'boolean' }
      }
    }
  }
}, async (request, reply) => {
  const id = Number(request.params.id)
  if (!Number.isInteger(id)) {
    reply.code(400).send({ error: 'invalid id' })
    return
  }
  const { done } = request.body
  const updated = await updateTodoDone(id, done)
  if (!updated) {
    reply.code(404).send({ error: 'todo not found' })
    return
  }
  await publishTodoEvent('todo.updated', updated)
  reply.send(updated)
})

fastify.get('/healthz', async function (request, reply) {
  const dbAlive = await checkConnectDb()
  if (dbAlive) {
    const conn = await getNatsConnection()
    if (conn) {
      reply.code(200).send("")
      return
    } else {
      fastify.log.error('NATS connection is broken')
    }
  } else {
    fastify.log.error('Database is down')
  }
  reply.code(500).send("")
})

fastify.setErrorHandler(function (error, request, reply) {
  if (error.validation) {
    fastify.log.info({ 
      statusCode: 400, 
      error: error.message, 
      validation: error.validation,
      body: request.body
    }, 'Validation failed')
    reply.status(400).send({ error: error.message, validation: error.validation })
  } else {
    fastify.log.error(error)
    reply.send(error)
  }
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
