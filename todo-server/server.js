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
      --text:#000;
      --muted:#444;
      --bg:#fff;
      --input-border:#bbb;
      --accent:#111;
    }
    html,body{height:100%;margin:0;background:var(--bg);color:var(--text);font-family:Georgia, "Times New Roman", serif}
    .wrap{max-width:720px;margin:20px auto;padding:18px}
    h1{font-size:48px;margin:0 0 12px 0;font-weight:700}
    .hero-img{
      width:100%;
      display:block;
      border:6px solid #fff;
      box-shadow:0 6px 18px rgba(0,0,0,0.15);
      border-radius:2px;
      background:#eee;
      height:auto;
      max-height:560px;
      object-fit:cover;
    }

    .controls{
      display:flex;
      gap:8px;
      margin:12px 0;
      align-items:center;
    }
    .controls input[type="text"]{
      flex:1;
      padding:8px 10px;
      font-size:16px;
      border:2px solid var(--input-border);
      border-radius:6px;
      outline:none;
      box-sizing:border-box;
      background:#fff;
    }
    .controls button{
      padding:8px 14px;
      font-size:16px;
      border-radius:6px;
      border:2px solid var(--input-border);
      background:#fff;
      cursor:pointer;
    }

    ul.todolist{
      margin:18px 0 6px 18px;
      padding:0;
      font-size:20px;
      line-height:1.6;
    }
    ul.todolist li{margin-bottom:6px}

    .caption{
      margin-top:20px;
      color:var(--muted);
      font-size:16px;
    }

    /* responsive tweaks for very small screens */
    @media (max-width:420px){
      h1{font-size:40px}
      .controls button{padding:8px 10px;font-size:15px}
      ul.todolist{font-size:18px}
    }
  </style>
</head>
<body>
  <main class="wrap">
    <header>
      <h1>The project App</h1>
    </header>

    <section>
      <figure>
        <img class="hero-img" src="/image" alt="Current image">
      </figure>

      <form class="controls" action="/todos" method="post" onsubmit="event.preventDefault(); addTodo();">
        <input id="todo-input" type="text" maxlength="140" placeholder="Add todo..." aria-label="New todo">
        <button type="submit">Create todo</button>
      </form>

      <ul class="todolist" id="todo-list" aria-live="polite">
        <li>Learn JavaScript</li>
        <li>Learn React</li>
        <li>Build a project</li>
      </ul>

      <div class="caption">DevOps with Kubernetes 2025</div>
    </section>
  </main>

  <script>
    function addTodo(){
      const input = document.getElementById('todo-input')
      const v = (input.value || '').trim()
      if (!v) return
      const ul = document.getElementById('todo-list')
      const li = document.createElement('li')
      li.textContent = v
      ul.appendChild(li)
      input.value = ''
      input.focus()
    }
  </script>
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