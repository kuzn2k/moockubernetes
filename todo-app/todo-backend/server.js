import Fastify from 'fastify'

const todosUrl = process.env.TODOS_URL

const fastify = Fastify({
  logger: true
})

const todoList = []
let lastId = 0

fastify.get(todosUrl, (request, reply) => {
  reply.send({size: todoList.length, list: todoList})
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
  const { title} = request.body
  if (!title) {
    reply.code(400).send({ error: 'title required' })
    return
  }
  const id = ++lastId
  const todo = { id, title }
  todoList.push(todo)
  reply.code(201).send(todo)
})

const port = process.env.PORT || 3000

const start = async () => {
  try {

    fastify.listen({ port: port, host: '0.0.0.0' })

  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }

  console.log(`Server started in port ${port}`)
}

start()