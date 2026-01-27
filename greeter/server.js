import Fastify from 'fastify'

const fastify = Fastify({
  logger: true,
  routerOptions: {
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true
  }
})

const greeting = process.env.MESSAGE || null
const greeter_path = process.env.GREETING_PATH || "/greeting"

fastify.get(greeter_path, async function (request, reply) {
  reply.header('Content-Type', 'text/plain')
  reply.send(greeting)
})

fastify.get('/healthz', async function (request, reply) {
  if (greeting) {
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
