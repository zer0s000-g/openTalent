'use client'

import React, { useMemo } from 'react'
import {
  getBubbleRadius,
  getCityLabelOffset,
  getIndonesiaProvinceShapes,
  normalizeProvinceName,
  projectIndonesiaCoordinates,
} from '@/lib/location-footprint'

export interface FootprintBreakdownItem {
  name: string
  count: number
}

export interface FootprintCity {
  city: string
  province: string
  lat: number
  lng: number
  employeeCount: number
  departments: FootprintBreakdownItem[]
  roles: FootprintBreakdownItem[]
  topSkills: FootprintBreakdownItem[]
}

interface IndonesiaFootprintMapProps {
  cities: FootprintCity[]
  selectedCity: string | null
  onSelectCity: (city: string) => void
  svgClassName?: string
  expandedLabels?: boolean
}

const islandLabels = [
  { label: 'Sumatra', x: 170, y: 184 },
  { label: 'Java', x: 402, y: 300 },
  { label: 'Kalimantan', x: 535, y: 180 },
  { label: 'Sulawesi', x: 694, y: 208 },
  { label: 'Papua', x: 862, y: 292 },
  { label: 'Nusa Tenggara', x: 618, y: 330 },
]

export function IndonesiaFootprintMap({
  cities,
  selectedCity,
  onSelectCity,
  svgClassName,
  expandedLabels = false,
}: IndonesiaFootprintMapProps) {
  const maxCount = Math.max(...cities.map((city) => city.employeeCount), 0)
  const provinceShapes = useMemo(() => getIndonesiaProvinceShapes(), [])

  const provinceCoverage = useMemo(() => {
    const coverage = new Map<string, number>()

    for (const city of cities) {
      const key = normalizeProvinceName(city.province)
      coverage.set(key, (coverage.get(key) || 0) + city.employeeCount)
    }

    return coverage
  }, [cities])

  const maxProvinceCount = Math.max(...provinceShapes.map((shape) => provinceCoverage.get(shape.canonicalName) || 0), 0)

  const selectedProvince = selectedCity
    ? normalizeProvinceName(cities.find((city) => city.city === selectedCity)?.province || '')
    : ''

  const visibleLabels = useMemo(() => {
    const topCities = [...cities]
      .sort((left, right) => right.employeeCount - left.employeeCount)
      .slice(0, expandedLabels ? 14 : 10)
      .map((city) => city.city)
    return new Set(selectedCity ? [...topCities, selectedCity] : topCities)
  }, [cities, expandedLabels, selectedCity])

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.10),transparent_42%),linear-gradient(180deg,#f8fbff_0%,#edf4fb_100%)]">
      <svg viewBox="0 0 1000 560" className={svgClassName || 'h-[34rem] w-full'}>
        <defs>
          <linearGradient id="footprintGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.34)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.08)" />
          </linearGradient>
          <linearGradient id="bubbleFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="selectedBubbleFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="1000" height="560" fill="transparent" />

        <g opacity="0.98">
          {provinceShapes.map((shape) => {
            const provinceCount = provinceCoverage.get(shape.canonicalName) || 0
            const intensity = maxProvinceCount > 0 ? provinceCount / maxProvinceCount : 0
            const isSelectedProvince = selectedProvince === shape.canonicalName
            const fillOpacity = provinceCount > 0 ? 0.14 + intensity * 0.28 : 0.04
            const strokeOpacity = provinceCount > 0 ? 0.22 + intensity * 0.4 : 0.1

            return (
              <path
                key={shape.name}
                d={shape.path}
                fill={`rgba(59,130,246,${fillOpacity.toFixed(2)})`}
                stroke={isSelectedProvince ? 'rgba(15,23,42,0.66)' : `rgba(71,85,105,${strokeOpacity.toFixed(2)})`}
                strokeWidth={isSelectedProvince ? '2.4' : '1.2'}
              >
                <title>{shape.canonicalName}: {provinceCount} employees</title>
              </path>
            )
          })}
        </g>

        <g opacity="0.72">
          {islandLabels.map((label) => (
            <text
              key={label.label}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              className="fill-slate-400 text-[13px] font-medium tracking-[0.2em]"
            >
              {label.label}
            </text>
          ))}
        </g>

        <g>
          {cities.map((city) => {
            const point = projectIndonesiaCoordinates(city.lng, city.lat)
            const radius = getBubbleRadius(city.employeeCount, maxCount)
            const isSelected = city.city === selectedCity
            const labelOffset = getCityLabelOffset(city.city)
            const labelWidth = Math.max(96, city.city.length * 7.6)
            const labelX = point.x + radius + labelOffset.dx
            const labelY = point.y - 14 + labelOffset.dy

            return (
              <g key={city.city}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius + (isSelected ? 11 : 7)}
                  fill="url(#footprintGlow)"
                  opacity={isSelected ? 0.92 : 0.54}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={isSelected ? 'url(#selectedBubbleFill)' : 'url(#bubbleFill)'}
                  stroke={isSelected ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.85)'}
                  strokeWidth={isSelected ? '4' : '3'}
                  className="cursor-pointer transition-all"
                  onClick={() => onSelectCity(city.city)}
                />
                <title>{city.city}: {city.employeeCount} employees</title>

                {radius >= 14 && (
                  <text
                    x={point.x}
                    y={point.y + 4}
                    textAnchor="middle"
                    className="pointer-events-none fill-white text-[12px] font-semibold"
                  >
                    {city.employeeCount}
                  </text>
                )}

                {visibleLabels.has(city.city) && (
                  <>
                    <rect
                      x={labelX}
                      y={labelY}
                      rx="12"
                      ry="12"
                      width={labelWidth}
                      height="28"
                      fill="rgba(255,255,255,0.92)"
                      stroke={isSelected ? 'rgba(59,130,246,0.65)' : 'rgba(203,213,225,0.9)'}
                    />
                    <text
                      x={labelX + 12}
                      y={labelY + 18}
                      className="pointer-events-none fill-slate-700 text-[13px] font-medium"
                    >
                      {city.city}
                    </text>
                  </>
                )}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
