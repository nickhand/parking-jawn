import assert from 'node:assert/strict'
import test from 'node:test'

import worker, { resolveParkingRoute } from '../src/worker.mjs'

test('redirects the apex to www while preserving path and query', () => {
  const route = resolveParkingRoute('http://parkingjawn.com/2017/1?source=test')
  assert.deepEqual(
    { kind: route.kind, status: route.status, url: route.url.href },
    {
      kind: 'redirect',
      status: 301,
      url: 'https://www.parkingjawn.com/2017/1?source=test',
    },
  )
})

test('serves www and workers.dev requests from static assets', () => {
  assert.equal(resolveParkingRoute('https://www.parkingjawn.com/2017/1').kind, 'asset')
  assert.equal(
    resolveParkingRoute('https://parking-jawn-staging.example.workers.dev/2017/1').kind,
    'asset',
  )
})

test('staging assets receive noindex and immutable hashed caching', async () => {
  const assets = {
    fetch: async () => new Response('console.log("parking")', {
      headers: { 'Content-Type': 'application/javascript' },
    }),
  }
  const response = await worker.fetch(
    new Request('https://parking-jawn-staging.example.workers.dev/assets/app.123.js'),
    { ASSETS: assets, INDEXABLE: 'false' },
  )

  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow')
  assert.equal(response.headers.get('Strict-Transport-Security'), null)
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=31536000, immutable')
})

test('production HTML receives security headers and revalidation', async () => {
  const assets = {
    fetch: async () => new Response('<main>Parking Jawn</main>', {
      headers: { 'Content-Type': 'text/html' },
    }),
  }
  const response = await worker.fetch(
    new Request('https://www.parkingjawn.com/2017/1'),
    { ASSETS: assets, INDEXABLE: 'true' },
  )

  assert.equal(response.headers.get('X-Robots-Tag'), null)
  assert.equal(response.headers.get('Strict-Transport-Security'), 'max-age=31536000')
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY')
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate')
})

test('missing files return 404 instead of the SPA document', async () => {
  const assets = {
    fetch: async () => new Response('<main>SPA fallback</main>', {
      headers: { 'Content-Type': 'text/html' },
    }),
  }
  const response = await worker.fetch(
    new Request('https://www.parkingjawn.com/assets/not-real.js'),
    { ASSETS: assets, INDEXABLE: 'true' },
  )

  assert.equal(response.status, 404)
  assert.equal(response.headers.get('Cache-Control'), null)
})
