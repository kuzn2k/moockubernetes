import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.resolve(new URL('.', import.meta.url).pathname, '/var/tmp/mooc/files')
const DATA_FILE = path.join(DATA_DIR, 'random.txt')

async function ensureDataDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }) } catch { /* ignore */ }
}

async function saveRandomHash(hash) {
  const tmp = DATA_FILE + '.tmp'
  await ensureDataDir()
  await fs.writeFile(tmp, hash, 'utf8')
  await fs.rename(tmp, DATA_FILE)
}

function getRandomHash() {
    return randomUUID();
}

function updateHash() {
    const rs = getRandomHash()
    saveRandomHash(rs)
    console.log("Updated random hash: " + rs)
}

updateHash()

setInterval(() => updateHash(), 5000);

