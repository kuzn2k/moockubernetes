import Fastify from 'fastify'
import { randomUUID } from 'crypto'


function getRandomHash() {
    return randomUUID()
}

function getTimestamp(hash) {
    const timestamp = new Date().toISOString()
    return `${timestamp}: ${hash}`
}

let randomString = getRandomHash()

const fastify = Fastify({
  logger: true
})

fastify.get('/', function (request, reply) {
  reply.header('Content-Type', 'text/plain');
  reply.send(getTimestamp(randomString))
})

setInterval(() => { randomString = getRandomHash() }, 5000);

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