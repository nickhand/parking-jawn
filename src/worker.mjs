function addResponseHeaders(response, requestUrl, indexable) {
  const headers = new Headers(response.headers)
  const requestPath = new URL(requestUrl).pathname
  const contentType = headers.get('Content-Type') ?? ''

  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=()')
  headers.set('X-Frame-Options', 'DENY')

  if (new URL(requestUrl).hostname.endsWith('parkingjawn.com')) {
    headers.set('Strict-Transport-Security', 'max-age=31536000')
  }

  if (!indexable) {
    headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  if (response.ok && requestPath.startsWith('/assets/') && !contentType.includes('text/html')) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (contentType.includes('text/html')) {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function isFileRequest(requestUrl) {
  const pathname = new URL(requestUrl).pathname
  return pathname.startsWith('/assets/') || /\/[^/]+\.[a-z0-9]+$/i.test(pathname)
}

export function resolveParkingRoute(requestUrl) {
  const url = new URL(requestUrl)
  if (url.hostname === 'parkingjawn.com') {
    const target = new URL(url)
    target.hostname = 'www.parkingjawn.com'
    target.protocol = 'https:'
    return { kind: 'redirect', status: 301, url: target }
  }
  return { kind: 'asset', url }
}

export default {
  async fetch(request, env) {
    const route = resolveParkingRoute(request.url)
    const indexable = env.INDEXABLE === 'true'

    if (route.kind === 'redirect') {
      return addResponseHeaders(
        Response.redirect(route.url, route.status),
        request.url,
        indexable,
      )
    }

    const response = await env.ASSETS.fetch(request)
    if (
      isFileRequest(request.url) &&
      (response.headers.get('Content-Type') ?? '').includes('text/html')
    ) {
      return addResponseHeaders(new Response('Not found', { status: 404 }), request.url, indexable)
    }
    return addResponseHeaders(response, request.url, indexable)
  },
}
