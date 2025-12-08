import Fastify from 'fastify'

let count = 0

const fastify = Fastify({
  logger: true
})

fastify.get('/pingpong', function (request, reply) {
  reply.header('Content-Type', 'text/plain');
  reply.send("pong " + count++)
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