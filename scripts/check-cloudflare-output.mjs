import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const environment = process.argv[2]
assert.ok(
  environment === 'staging' || environment === 'production',
  'Pass either staging or production to the Cloudflare output checker.',
)

const root = new URL('..', import.meta.url).pathname
const dist = join(root, 'dist')
const html = readFileSync(join(dist, 'index.html'), 'utf8')
assert.match(html, /(?:src|href)="\/assets\//)
assert.doesNotMatch(html, /unpkg\.com\/@mapbox\/leaflet-pip|leaflet-pip@latest/)
assert.ok(readdirSync(join(dist, 'assets')).some((name) => /\.[a-f0-9_-]+\.(?:js|css)$/i.test(name)))
assert.ok(existsSync(join(dist, 'favicon.ico')))
assert.ok(!existsSync(join(dist, '_redirects')))

const config = JSON.parse(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'))
assert.deepEqual(config.env.production.routes, [
  { pattern: 'parkingjawn.com', custom_domain: true },
  { pattern: 'www.parkingjawn.com', custom_domain: true },
])
assert.equal(config.env[environment].vars.INDEXABLE, environment === 'production' ? 'true' : 'false')

console.log(`Parking Jawn Cloudflare ${environment} output is ready to deploy.`)
