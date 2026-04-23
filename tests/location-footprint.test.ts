import { describe, expect, it } from 'vitest'
import {
  getBubbleRadius,
  getCityLabelOffset,
  getIndonesiaProvinceShapes,
  normalizeProvinceName,
  projectIndonesiaCoordinates,
  summarizeFootprint,
} from '@/lib/location-footprint'

describe('Location footprint helpers', () => {
  it('projects Indonesian coordinates into the map viewport', () => {
    const jakarta = projectIndonesiaCoordinates(106.8456, -6.2088)
    const jayapura = projectIndonesiaCoordinates(140.7181, -2.5337)

    expect(jakarta.x).toBeGreaterThan(0)
    expect(jakarta.y).toBeGreaterThan(0)
    expect(jayapura.x).toBeGreaterThan(jakarta.x)
  })

  it('scales bubble radii based on employee count', () => {
    expect(getBubbleRadius(5, 20)).toBeLessThan(getBubbleRadius(20, 20))
    expect(getBubbleRadius(0, 0)).toBe(9)
  })

  it('summarizes footprint totals and largest hub', () => {
    const summary = summarizeFootprint([
      { city: 'Jakarta', province: 'DKI Jakarta', lat: -6.2, lng: 106.8, employeeCount: 24 },
      { city: 'Surabaya', province: 'East Java', lat: -7.2, lng: 112.7, employeeCount: 18 },
    ])

    expect(summary.totalEmployees).toBe(42)
    expect(summary.activeCities).toBe(2)
    expect(summary.largestCity?.city).toBe('Jakarta')
  })

  it('builds representative province paths from the GeoJSON dataset', () => {
    const provinceShapes = getIndonesiaProvinceShapes()

    expect(provinceShapes.length).toBeGreaterThan(25)
    expect(provinceShapes.some((shape) => shape.canonicalName === 'DKI Jakarta')).toBe(true)
    expect(provinceShapes.some((shape) => shape.canonicalName === 'East Java')).toBe(true)
    expect(provinceShapes.every((shape) => shape.path.startsWith('M'))).toBe(true)
  })

  it('normalizes province names and provides city label offsets for dense hubs', () => {
    expect(normalizeProvinceName('JAWA BARAT')).toBe('West Java')
    expect(normalizeProvinceName('DKI JAKARTA')).toBe('DKI Jakarta')
    expect(getCityLabelOffset('Jakarta').dy).not.toBe(0)
  })
})
