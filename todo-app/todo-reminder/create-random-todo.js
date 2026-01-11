import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_URL || 'todo-postgres-svc',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'postgres'
})

async function getRandomWikiArticle() {
  const res = await fetch('https://en.wikipedia.org/wiki/Special:Random', {
    method: 'GET',
    redirect: 'manual'
  })
  const loc = res.headers.get('location')
  if (loc) return new URL(loc, 'https://en.wikipedia.org').toString()
  const followed = await fetch('https://en.wikipedia.org/wiki/Special:Random')
  return followed.url
}

async function run() {
  const client = await pool.connect()
  try {
    const url = await getRandomWikiArticle()
    const title = `Read ${url}`

    await client.query('BEGIN')
    await client.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL
      )
    `)
    const res = await client.query(
      'INSERT INTO todos(title) VALUES($1) RETURNING id, title',
      [title]
    )
    await client.query('COMMIT')

    console.log(JSON.stringify(res.rows[0]))
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('error:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

run()