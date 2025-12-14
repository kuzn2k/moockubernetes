import Fastify from 'fastify'

const fastify = Fastify({
  logger: true
})

fastify.get('/pingpong', async function (request, reply) {
  reply.header('Content-Type', 'text/plain')
  const out = "pong " + ++count
  reply.send(out)
})

fastify.get('/pings', function (request, reply) {
  reply.send({count: count})
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

let count = 0

start()