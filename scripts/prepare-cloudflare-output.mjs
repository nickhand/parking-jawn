import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const netlifyRedirects = join(root, 'dist', '_redirects')

assert.ok(
  existsSync(netlifyRedirects),
  'The Vite build did not copy Netlify’s rollback _redirects file.',
)
rmSync(netlifyRedirects)

console.log('Removed Netlify-only _redirects from the Cloudflare artifact.')
