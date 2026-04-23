import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IndonesiaFootprintMap } from '@/components/location/indonesia-footprint-map'

describe('IndonesiaFootprintMap', () => {
  it('renders province boundaries and city overlays from the GeoJSON-backed map', () => {
    const handleSelectCity = vi.fn()
    const { container } = render(
      <IndonesiaFootprintMap
        cities={[
          {
            city: 'Jakarta',
            province: 'DKI Jakarta',
            lat: -6.2088,
            lng: 106.8456,
            employeeCount: 24,
            departments: [{ name: 'Engineering', count: 8 }],
            roles: [{ name: 'Software Engineer', count: 5 }],
            topSkills: [{ name: 'Communication', count: 10 }],
          },
          {
            city: 'Makassar',
            province: 'South Sulawesi',
            lat: -5.1477,
            lng: 119.4327,
            employeeCount: 10,
            departments: [{ name: 'Operations', count: 4 }],
            roles: [{ name: 'Ops Manager', count: 2 }],
            topSkills: [{ name: 'Leadership', count: 5 }],
          },
        ]}
        selectedCity="Jakarta"
        onSelectCity={handleSelectCity}
      />,
    )

    expect(container.querySelectorAll('svg path').length).toBeGreaterThan(25)
    expect(screen.getByText('Jakarta')).toBeInTheDocument()
    expect(screen.getByText('Makassar')).toBeInTheDocument()
  })
})
