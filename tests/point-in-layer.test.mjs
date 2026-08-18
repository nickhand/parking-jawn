import assert from 'node:assert/strict'
import test from 'node:test'

import { pointInGeometry, pointInLayer } from '../src/components/Dashboard/pointInLayer.mjs'

function square(left, bottom, right, top, reverse = false, close = true) {
  const ring = [
    [left, bottom],
    [right, bottom],
    [right, top],
    [left, top],
  ]
  if (reverse) ring.reverse()
  if (close) ring.push(ring[0])
  return ring
}

function polygon(ring, holes = []) {
  return { type: 'Polygon', coordinates: [ring, ...holes] }
}

function layer(geometry, name) {
  return {
    name,
    feature: { geometry },
    toGeoJSON: () => ({ type: 'Feature', properties: {}, geometry }),
  }
}

function layerGroup(...layers) {
  return { eachLayer: (visit) => layers.forEach(visit) }
}

test('finds polygon interiors and rejects exterior points', () => {
  const geometry = polygon(square(0, 0, 2, 2))
  assert.equal(pointInGeometry([1, 1], geometry), true)
  assert.equal(pointInGeometry([3, 1], geometry), false)
})

test('includes polygon edges and vertices', () => {
  const geometry = polygon(square(0, 0, 2, 2))
  assert.equal(pointInGeometry([0, 1], geometry), true)
  assert.equal(pointInGeometry([0, 0], geometry), true)
})

test('excludes hole interiors while including hole boundaries', () => {
  const geometry = polygon(square(0, 0, 4, 4), [square(1, 1, 3, 3)])
  assert.equal(pointInGeometry([2, 2], geometry), false)
  assert.equal(pointInGeometry([1, 2], geometry), true)
})

test('supports every island in a multipolygon and rejects the gap', () => {
  const geometry = {
    type: 'MultiPolygon',
    coordinates: [[square(0, 0, 2, 2)], [square(4, 0, 6, 2)]],
  }
  assert.equal(pointInGeometry([1, 1], geometry), true)
  assert.equal(pointInGeometry([5, 1], geometry), true)
  assert.equal(pointInGeometry([3, 1], geometry), false)
})

test('handles reversed winding and unclosed rings', () => {
  assert.equal(pointInGeometry([1, 1], polygon(square(0, 0, 2, 2, true))), true)
  assert.equal(pointInGeometry([1, 1], polygon(square(0, 0, 2, 2, false, false))), true)
})

test('accepts Leaflet LatLng values and ignores non-polygon layers', () => {
  const matching = layer(polygon(square(0, 0, 2, 2)), 'matching')
  const line = layer({ type: 'LineString', coordinates: [[0, 0], [2, 2]] }, 'line')
  assert.deepEqual(pointInLayer({ lng: 1, lat: 1 }, layerGroup(matching, line)), [matching])
})

test('can return the first layer only on a shared boundary', () => {
  const west = layer(polygon(square(0, 0, 1, 1)), 'west')
  const east = layer(polygon(square(1, 0, 2, 1)), 'east')
  assert.deepEqual(pointInLayer([1, 0.5], layerGroup(west, east)), [west, east])
  assert.deepEqual(pointInLayer([1, 0.5], layerGroup(west, east), true), [west])
})
