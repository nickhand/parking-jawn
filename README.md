# Visualizing Parking Tickets across Philadelphia

This repo holds the source code for [https://www.parkingjawn.com](https://www.parkingjawn.com).

We use the [dc.js](https://dc-js.github.io/dc.js/), [Leaflet](http://leafletjs.com), and [Vue](https://github.com/vuejs) to visualize the parking tickets across Philly on a monthly basis. 

Data is available via Philadelphia's open data website, [Open Data Philly](https://www.opendataphilly.org/dataset/parking-violations).

## Hosting

The Vue SPA is deployed to Cloudflare Workers Static Assets. The API-free site
continues to read its monthly JSON files directly from the public S3 bucket.

```bash
corepack enable
yarn install --frozen-lockfile
yarn dry-run:cloudflare:staging
yarn deploy:cloudflare:staging
yarn dry-run:cloudflare:production
yarn deploy:cloudflare:production
```

Staging is noindex at the `parking-jawn-staging` workers.dev hostname.
Production owns `parkingjawn.com` and `www.parkingjawn.com`; the apex redirects
to `www` while preserving the path and query. Keep the Netlify deployment and
`public/_redirects` file during the rollback window.
