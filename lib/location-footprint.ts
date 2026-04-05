import type { IndonesiaCity } from '@/lib/indonesia-cities'
import indonesiaProvinceGeoJson from '@/lib/geo/indonesia-provinces.json'

export interface LocationFootprintPoint {
  city: string
  province: string
  lat: number
  lng: number
  employeeCount: number
}

type PolygonCoordinates = number[][][]
type MultiPolygonCoordinates = number[][][][]

interface PolygonGeometry {
  type: 'Polygon'
  coordinates: PolygonCoordinates
}

interface MultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: MultiPolygonCoordinates
}

type GeoJsonGeometry = PolygonGeometry | MultiPolygonGeometry

interface GeoJsonFeature {
  geometry: GeoJsonGeometry
  properties?: {
    Propinsi?: string
  }
}

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

export interface IndonesiaProvinceShape {
  name: string
  canonicalName: string
  path: string
}

export interface CityLabelOffset {
  dx: number
  dy: number
}

const INDONESIA_BOUNDS = {
  minLng: 95,
  maxLng: 141.5,
  minLat: -11.5,
  maxLat: 6.5,
}

const PROVINCE_NAME_ALIASES: Record<string, string> = {
  BALI: 'Bali',
  'DAERAH ISTIMEWA YOGYAKARTA': 'Special Region of Yogyakarta',
  'DKI JAKARTA': 'DKI Jakarta',
  'IRIAN JAYA BARAT': 'West Papua',
  'IRIAN JAYA TENGAH': 'Central Papua',
  'IRIAN JAYA TIMUR': 'Papua',
  'JAWA BARAT': 'West Java',
  'JAWA TENGAH': 'Central Java',
  'JAWA TIMUR': 'East Java',
  'KALIMANTAN BARAT': 'West Kalimantan',
  'KALIMANTAN SELATAN': 'South Kalimantan',
  'KALIMANTAN TENGAH': 'Central Kalimantan',
  'KALIMANTAN TIMUR': 'East Kalimantan',
  'NUSA TENGGARA TIMUR': 'East Nusa Tenggara',
  NUSATENGGARA_BARAT: 'West Nusa Tenggara',
  'NUSATENGGARA BARAT': 'West Nusa Tenggara',
  PROBANTEN: 'Banten',
  RIAU: 'Riau',
  'SULAWESI SELATAN': 'South Sulawesi',
  'SULAWESI TENGAH': 'Central Sulawesi',
  'SULAWESI TENGGARA': 'Southeast Sulawesi',
  'SULAWESI UTARA': 'North Sulawesi',
  'SUMATERA BARAT': 'West Sumatra',
  'SUMATERA SELATAN': 'South Sumatra',
  'SUMATERA UTARA': 'North Sumatra',
}

const CITY_LABEL_OFFSETS: Record<string, CityLabelOffset> = {
  Jakarta: { dx: 16, dy: -30 },
  Bandung: { dx: 16, dy: 4 },
  Semarang: { dx: 16, dy: -18 },
  Yogyakarta: { dx: 16, dy: 20 },
  Surabaya: { dx: 16, dy: 0 },
  Denpasar: { dx: 16, dy: -10 },
  Palembang: { dx: 16, dy: -4 },
  Banjarmasin: { dx: 16, dy: -2 },
  Balikpapan: { dx: 16, dy: -6 },
  Makassar: { dx: 16, dy: 2 },
  Pekanbaru: { dx: 16, dy: -20 },
}

export function projectIndonesiaCoordinates(lng: number, lat: number, width = 1000, height = 560, padding = 56) {
  const xRatio = (lng - INDONESIA_BOUNDS.minLng) / (INDONESIA_BOUNDS.maxLng - INDONESIA_BOUNDS.minLng)
  const yRatio = (INDONESIA_BOUNDS.maxLat - lat) / (INDONESIA_BOUNDS.maxLat - INDONESIA_BOUNDS.minLat)

  return {
    x: padding + xRatio * (width - padding * 2),
    y: padding + yRatio * (height - padding * 2),
  }
}

function formatSvgNumber(value: number) {
  return Number(value.toFixed(2))
}

function toRingPath(ring: number[][], width: number, height: number, padding: number) {
  return ring
    .map(([lng, lat], index) => {
      const point = projectIndonesiaCoordinates(lng, lat, width, height, padding)
      const command = index === 0 ? 'M' : 'L'
      return `${command}${formatSvgNumber(point.x)} ${formatSvgNumber(point.y)}`
    })
    .join(' ') + ' Z'
}

function geometryToPath(geometry: GeoJsonGeometry, width: number, height: number, padding: number) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates
      .map((ring) => toRingPath(ring, width, height, padding))
      .join(' ')
  }

  return geometry.coordinates
    .flatMap((polygon) => polygon.map((ring) => toRingPath(ring, width, height, padding)))
    .join(' ')
}

export function normalizeProvinceName(name: string) {
  const normalized = name.trim().replace(/\s+/g, ' ').toUpperCase()
  return PROVINCE_NAME_ALIASES[normalized] || name
}

export function getCityLabelOffset(cityName: string): CityLabelOffset {
  return CITY_LABEL_OFFSETS[cityName] || { dx: 16, dy: 0 }
}

export function getIndonesiaProvinceShapes(width = 1000, height = 560, padding = 56): IndonesiaProvinceShape[] {
  const geoJson = indonesiaProvinceGeoJson as GeoJsonFeatureCollection

  return geoJson.features.map((feature) => {
    const rawName = feature.properties?.Propinsi || 'Unknown Province'
    return {
      name: rawName,
      canonicalName: normalizeProvinceName(rawName),
      path: geometryToPath(feature.geometry, width, height, padding),
    }
  })
}

export function getBubbleRadius(employeeCount: number, maxCount: number) {
  if (maxCount <= 0) return 9
  const ratio = employeeCount / maxCount
  return Math.round(10 + ratio * 22)
}

export function summarizeFootprint(points: LocationFootprintPoint[]) {
  const totalEmployees = points.reduce((sum, point) => sum + point.employeeCount, 0)
  const activeCities = points.length
  const largestCity = [...points].sort((left, right) => right.employeeCount - left.employeeCount)[0] || null

  return {
    totalEmployees,
    activeCities,
    largestCity,
  }
}

export function toLocationPoint(city: IndonesiaCity, employeeCount: number): LocationFootprintPoint {
  return {
    city: city.name,
    province: city.province,
    lat: city.lat,
    lng: city.lng,
    employeeCount,
  }
}
