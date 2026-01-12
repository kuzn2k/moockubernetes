import Fastify from 'fastify'
import { Pool } from 'pg'

const todosUrl = process.env.TODOS_URL || '/todos'

const fastify = Fastify({
  logger: true
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
      title TEXT NOT NULL
    )
  `)
}

async function getTodos() {
  const res = await pool.query('SELECT id, title FROM todos ORDER BY id')
  return res.rows
}

async function createTodo(title) {
  const res = await pool.query(
    'INSERT INTO todos(title) VALUES($1) RETURNING id, title',
    [title]
  )
  return res.rows[0]
}

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
        title: { type: 'string', maxLength: 140 }
      }
    }
  }
}, async (request, reply) => {
  const { title } = request.body
  if (!title) {
    reply.code(400).send({ error: 'title required' })
    return
  }
  const todo = await createTodo(title)
  reply.code(201).send(todo)
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
    await ensureDb()
    await fastify.listen({ port: port, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()