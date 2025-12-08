import Fastify from 'fastify'

const fastify = Fastify({
  logger: true
})

fastify.get('/', function (request, reply) {
  reply.header('Content-Type', 'text/html');
  reply.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ASCII Friend</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #111;
      color: #eee;
    }
    .card {
      text-align: center;
      padding: 1.5rem 2rem;
      border-radius: 8px;
      background: #1b1b1b;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
    }
    pre {
      font-family: monospace, "Courier New", Courier;
      white-space: pre;
      margin: 0 0 1rem;
      font-size: 14px;
    }
    .title {
      margin-bottom: 0.5rem;
      font-size: 1.4rem;
    }
    .subtitle {
      font-size: 0.9rem;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Here’s a tiny ASCII visitor</div>
<pre> /\\_/\\
 ( o.o )
 > ^ <
</pre>
    <div class="subtitle">Simple page. No frameworks. Just vibes coding.</div>
  </div>
</body>
</html>
  `)
})

const port = process.env.PORT

if (!port) {
  console.error("No PORT environment variable")
  process.exit(1)
}

const start = async () => {
  try {

    await fastify.listen({ port: port, host: '0.0.0.0' })

  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }

  console.log(`Server started in port ${port}`)
}

start()