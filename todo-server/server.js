import Fastify from 'fastify'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.resolve(new URL('.', import.meta.url).pathname, '/var/tmp/mooc/files')
const IMAGE_FILE = "current-image.jpg"

const htmlTemplate = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>The project App</title>
  <style>
    :root{
      --bg:#ffffff;
      --card:#1b1b1b;
      --muted:#6b7280;
      --text:#0b0b0b;
    }
    html,body{height:100%;margin:0;font-family:Georgia, "Times New Roman", serif;color:var(--text);background:var(--bg)}
    .wrap{max-width:980px;margin:36px auto;padding:28px}
    header{display:flex;align-items:flex-start;gap:28px}
    h1{font-size:56px;line-height:1;margin:0;font-weight:700}
    .hero{
      display:grid;
      grid-template-columns:420px 1fr;
      gap:28px;
      align-items:start;
      margin-top:18px;
    }
    figure{margin:0}
    img{
      width:100%;
      height:auto;
      display:block;
      border-radius:4px;
      box-shadow:0 8px 30px rgba(0,0,0,0.25);
      border:6px solid #fff;
      background:#eee;
    }
    figcaption{
      margin-top:10px;
      color:var(--muted);
      font-family:system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      font-size:15px;
    }
    .lead{
      font-size:18px;
      color:#222;
      margin:0 0 12px 0;
    }
    .card{
      padding:18px;
      border-radius:8px;
      background:#fafafa;
      box-shadow:0 8px 20px rgba(0,0,0,0.04);
    }

    /* Responsive */
    @media (max-width:820px){
      .hero{grid-template-columns:1fr;align-items:center}
      h1{font-size:40px}
    }
  </style>
</head>
<body>
  <main class="wrap">
    <header>
      <h1>The project App</h1>
    </header>

    <section class="hero">
      <figure class="card">
        <img src="/image" alt="Current image">
        <figcaption>DevOps with Kubernetes 2025</figcaption>
      </figure>
    </section>
  </main>
</body>
</html>
`

async function ensureDataDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }) } catch { /* ignore */ }
}

async function saveImage(name, buffer) {
  const targetName = DATA_DIR + "/" + name 
  const tmp = targetName + '.tmp'
  await fs.writeFile(tmp, buffer)
  await fs.rename(tmp, targetName)
}

async function loadImage(name) {
  try {
    const buf = await fs.readFile(DATA_DIR + "/" + name)
    return buf
  } catch (err) {
    console.error(err)
    return null
  }
}

async function getNewImage(size = 1200) {
  try {
    const res = await fetch(`https://picsum.photos/${size}`)
    if (!res.ok) {
      console.error('Failed fetching image', res.status, res.statusText)
      return null
    }
    const ab = await res.arrayBuffer()
    return Buffer.from(ab)
  } catch (err) {
    console.error('Error fetching external image', err)
    return null
  }
}

async function getFileCreation(name) {
  try {
    const st = await fs.stat(path.join(DATA_DIR, name))
    const created = st.birthtimeMs && st.birthtimeMs > 0 ? new Date(st.birthtimeMs) : st.ctime
    return created
  } catch (err) {
    return null
  }
}

let rotateInProgress = null

async function rotateImage(name) {
  if (rotateInProgress) return rotateInProgress

  rotateInProgress = (async () => {
    try {
      const buf = await getNewImage(1200)
      if (buf) {
        await saveImage(name, buf)
        outdated = false
      }
    } catch (err) {
      console.error('rotateImage failed', err)
      throw err
    } finally {
      rotateInProgress = null
    }
  })()

  return rotateInProgress
}

const fastify = Fastify({
  logger: true
})

fastify.get('/image', async (request, reply) => {
  const buf = await loadImage(IMAGE_FILE)
  if (!buf) {
    reply.code(404).send('No image found')
    return
  }

  if (outdated && !rotateInProgress) {
    rotateImage(IMAGE_FILE).catch(err => fastify.log.error(err))
  }

  reply.header('Content-Type', 'image/jpeg')
  reply.send(buf)
})

fastify.get('/', async function (request, reply) {
  reply.header('Content-Type', 'text/html');
  reply.send(htmlTemplate)
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

const refreshTime = 10 * 60 * 1000
let imageAge = refreshTime
let outdated = true

await ensureDataDir()

const imageTime = await getFileCreation(IMAGE_FILE)

if (!imageTime) {
  await rotateImage(IMAGE_FILE)
} else {
  const created = (imageTime instanceof Date) ? imageTime : new Date(imageTime)
  const elapsedMs = Date.now() - created.getTime()
  imageAge = Math.max(0, refreshTime - elapsedMs)
  if (imageAge <= 0) {
     imageAge = refreshTime
  } else {
    outdated = false
  }
}

setInterval(() => { outdated = true }, imageAge)

start()