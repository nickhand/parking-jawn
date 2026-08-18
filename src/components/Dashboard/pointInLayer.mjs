const EDGE_TOLERANCE = 1e-10
const ringBoundsCache = new WeakMap()

function ringBounds(ring) {
  const cached = ringBoundsCache.get(ring)
  if (cached) return cached

  const bounds = ring.reduce(
    (result, [x, y]) => ({
      minX: Math.min(result.minX, x),
      minY: Math.min(result.minY, y),
      maxX: Math.max(result.maxX, x),
      maxY: Math.max(result.maxY, y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  )
  ringBoundsCache.set(ring, bounds)
  return bounds
}

function pointOnSegment([x, y], [startX, startY], [endX, endY]) {
  const deltaX = endX - startX
  const deltaY = endY - startY
  const cross = (x - startX) * deltaY - (y - startY) * deltaX
  const scale = Math.max(1, Math.abs(deltaX), Math.abs(deltaY))

  return (
    Math.abs(cross) <= EDGE_TOLERANCE * scale &&
    x >= Math.min(startX, endX) - EDGE_TOLERANCE &&
    x <= Math.max(startX, endX) + EDGE_TOLERANCE &&
    y >= Math.min(startY, endY) - EDGE_TOLERANCE &&
    y <= Math.max(startY, endY) + EDGE_TOLERANCE
  )
}

function classifyPointInRing(point, ring) {
  if (ring.length < 3) return 'outside'

  const [x, y] = point
  const bounds = ringBounds(ring)
  if (
    x < bounds.minX - EDGE_TOLERANCE ||
    x > bounds.maxX + EDGE_TOLERANCE ||
    y < bounds.minY - EDGE_TOLERANCE ||
    y > bounds.maxY + EDGE_TOLERANCE
  ) {
    return 'outside'
  }

  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const currentPoint = ring[index]
    const previousPoint = ring[previous]
    if (pointOnSegment(point, previousPoint, currentPoint)) return 'boundary'

    const [currentX, currentY] = currentPoint
    const [previousX, previousY] = previousPoint
    const intersects =
      currentY > y !== previousY > y &&
      x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX
    if (intersects) inside = !inside
  }

  return inside ? 'inside' : 'outside'
}

function polygonContainsPoint(point, rings) {
  const exterior = classifyPointInRing(point, rings[0] ?? [])
  if (exterior === 'outside') return false
  if (exterior === 'boundary') return true

  return rings.slice(1).every((hole) => classifyPointInRing(point, hole) !== 'inside')
}

export function pointInGeometry(point, geometry) {
  if (geometry?.type === 'Polygon') {
    return polygonContainsPoint(point, geometry.coordinates)
  }
  if (geometry?.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => polygonContainsPoint(point, polygon))
  }
  return false
}

function layerGeometry(layer) {
  return layer.feature?.geometry ?? layer.toGeoJSON?.().geometry
}

export function pointInLayer(point, layerGroup, first = false) {
  const coordinate = Array.isArray(point) ? point : [point.lng, point.lat]
  if (!coordinate.every(Number.isFinite)) return []

  const matches = []
  layerGroup.eachLayer((layer) => {
    if ((!first || matches.length === 0) && pointInGeometry(coordinate, layerGeometry(layer))) {
      matches.push(layer)
    }
  })

  return matches
}
