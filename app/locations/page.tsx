'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { Button } from '@/components/shared/button'
import { Badge } from '@/components/shared/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { IndonesiaFootprintMap, type FootprintCity } from '@/components/location/indonesia-footprint-map'
import { LocationDetailPanel } from '@/components/location/location-detail-panel'
import { summarizeFootprint } from '@/lib/location-footprint'

interface FilterOption {
  name: string
  count: number
}

interface LocationDetail {
  city: string
  province: string
  lat: number | null
  lng: number | null
  employeeCount: number
  departments: FilterOption[]
  roles: FilterOption[]
  topSkills: FilterOption[]
  employees: Array<{
    employee_id: string
    name: string
    title: string
    department: string
    location: string
  }>
}

async function queryGraphQL(query: string, variables?: Record<string, unknown>) {
  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  const payload = await response.json()
  if (payload.errors) {
    throw new Error(payload.errors[0]?.message || 'GraphQL request failed')
  }

  return payload.data
}

export default function LocationsPage() {
  const [skills, setSkills] = useState<FilterOption[]>([])
  const [departments, setDepartments] = useState<FilterOption[]>([])
  const [roles, setRoles] = useState<FilterOption[]>([])
  const [footprint, setFootprint] = useState<FootprintCity[]>([])
  const [selectedSkill, setSelectedSkill] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [locationDetail, setLocationDetail] = useState<LocationDetail | null>(null)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [loadingFootprint, setLoadingFootprint] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const footprintRequestIdRef = useRef(0)
  const detailRequestIdRef = useRef(0)

  const currentFilters = useMemo(
    () => ({
      skillName: selectedSkill,
      department: selectedDepartment,
      roleTitle: selectedRole,
    }),
    [selectedDepartment, selectedRole, selectedSkill],
  )

  useEffect(() => {
    async function bootstrap() {
      try {
        const [skillsData, statsData, rolesData] = await Promise.all([
          queryGraphQL(`
            query GetSkills {
              skills {
                name
                employeeCount
              }
            }
          `),
          queryGraphQL(`
            query GraphFilterDepartments {
              getDashboardStats {
                departments { name count }
              }
            }
          `),
          queryGraphQL(`
            query GetLocationRoleOptions {
              getLocationRoleOptions {
                name
                count
              }
            }
          `),
        ])

        setSkills((skillsData.skills || []).map((skill: any) => ({
          name: skill.name,
          count: Number(skill.employeeCount || 0),
        })))
        setDepartments((statsData.getDashboardStats?.departments || []).map((department: any) => ({
          name: department.name,
          count: Number(department.count || 0),
        })))
        setRoles((rolesData.getLocationRoleOptions || []).map((role: any) => ({
          name: role.name,
          count: Number(role.count || 0),
        })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Indonesia footprint')
      } finally {
        setBootstrapping(false)
      }
    }

    void bootstrap()
  }, [])

  useEffect(() => {
    if (bootstrapping) return

    const requestId = ++footprintRequestIdRef.current
    setLoadingFootprint(true)
    setError(null)

    async function fetchFootprint() {
      try {
        const data = await queryGraphQL(
          `
            query GetIndonesiaLocationFootprint($skillName: String, $department: String, $roleTitle: String) {
              getIndonesiaLocationFootprint(skillName: $skillName, department: $department, roleTitle: $roleTitle) {
                city
                province
                lat
                lng
                employeeCount
                departments { name count }
                roles { name count }
                topSkills { name count }
              }
            }
          `,
          currentFilters,
        )

        if (requestId !== footprintRequestIdRef.current) return
        setFootprint(data.getIndonesiaLocationFootprint || [])
      } catch (err) {
        if (requestId === footprintRequestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load the Indonesia footprint')
        }
      } finally {
        if (requestId === footprintRequestIdRef.current) {
          setLoadingFootprint(false)
        }
      }
    }

    void fetchFootprint()
  }, [bootstrapping, currentFilters])

  useEffect(() => {
    if (!footprint.length) {
      setSelectedCity(null)
      setLocationDetail(null)
      return
    }

    if (!selectedCity || !footprint.some((city) => city.city === selectedCity)) {
      setSelectedCity(footprint[0].city)
    }
  }, [footprint, selectedCity])

  useEffect(() => {
    if (!selectedCity) {
      setLocationDetail(null)
      return
    }

    const requestId = ++detailRequestIdRef.current
    setLoadingDetail(true)
    setDetailError(null)

    async function fetchLocationDetail() {
      try {
        const data = await queryGraphQL(
          `
            query GetLocationDetail($cityName: String!, $skillName: String, $department: String, $roleTitle: String) {
              getLocationDetail(cityName: $cityName, skillName: $skillName, department: $department, roleTitle: $roleTitle) {
                city
                province
                lat
                lng
                employeeCount
                departments { name count }
                roles { name count }
                topSkills { name count }
                employees {
                  employee_id
                  name
                  title
                  department
                  location
                }
              }
            }
          `,
          {
            cityName: selectedCity,
            ...currentFilters,
          },
        )

        if (requestId !== detailRequestIdRef.current) return
        setLocationDetail(data.getLocationDetail || null)
      } catch (err) {
        if (requestId === detailRequestIdRef.current) {
          setDetailError(err instanceof Error ? err.message : 'Failed to load city detail')
        }
      } finally {
        if (requestId === detailRequestIdRef.current) {
          setLoadingDetail(false)
        }
      }
    }

    void fetchLocationDetail()
  }, [currentFilters, selectedCity])

  const summary = useMemo(() => summarizeFootprint(footprint), [footprint])

  useEffect(() => {
    if (!isMapFullscreen) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMapFullscreen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMapFullscreen])

  const renderMapExperience = (fullscreen = false) => (
    <Card className={fullscreen ? 'flex h-full flex-col overflow-hidden rounded-[32px] bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.18)]' : ''}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-label">Indonesia Map</p>
          <h3 className={`mt-3 font-display font-semibold text-ink-900 ${fullscreen ? 'text-4xl lg:text-5xl' : 'text-2xl'}`}>
            City-based workforce distribution
          </h3>
          <p className={`mt-2 max-w-2xl leading-6 text-ink-500 ${fullscreen ? 'text-base' : 'text-sm'}`}>
            Bubble size reflects employee count in each city after filters are applied. Click a city to inspect its dominant roles, skills, and employees.
          </p>
          {fullscreen && (
            <p className="mt-3 text-sm text-ink-400">Press `Esc` to exit full screen mode.</p>
          )}
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <Button
            variant="primary"
            size="sm"
            className="shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
            onClick={() => setIsMapFullscreen((current) => !current)}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
              {fullscreen ? (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 7 3 3m10 4 4-4m-4 10 4 4M7 13l-4 4" />
                </>
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 3 3 7m10-4 4 4m-4 10 4-4M7 17l-4-4" />
                </>
              )}
            </svg>
            {fullscreen ? 'Exit full screen' : 'View full screen map'}
          </Button>

          <div className="flex flex-wrap gap-2">
            <Badge color="blue">City bubbles</Badge>
            <Badge color="green">Skill-aware</Badge>
            <Badge color="gray">{footprint.length} cities active</Badge>
            {selectedSkill && <Badge color="blue">{selectedSkill}</Badge>}
            {selectedRole && <Badge color="gray">{selectedRole}</Badge>}
            {selectedDepartment && <Badge color="yellow">{selectedDepartment}</Badge>}
          </div>
        </div>
      </div>

      <div className={fullscreen ? 'mt-6 min-h-0 flex-1' : 'mt-6'}>
        {loadingFootprint && !footprint.length ? (
          <div className={`flex items-center justify-center rounded-[28px] border border-[color:var(--border)] bg-white/68 ${fullscreen ? 'h-full min-h-[24rem]' : 'h-[34rem]'}`}>
            <LoadingSpinner size="lg" />
          </div>
        ) : footprint.length > 0 ? (
          fullscreen ? (
            <div className="grid h-full min-h-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-h-0">
                <IndonesiaFootprintMap
                  cities={footprint}
                  selectedCity={selectedCity}
                  onSelectCity={setSelectedCity}
                  expandedLabels
                  svgClassName="h-[calc(100vh-16rem)] min-h-[34rem] w-full"
                />
              </div>

              <div className="min-h-0 overflow-y-auto pr-1">
                <LocationDetailPanel
                  detail={locationDetail}
                  loading={loadingDetail}
                  error={detailError}
                  footprint={footprint}
                />
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute right-4 top-4 z-10">
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label="Open full screen map"
                  className="rounded-full bg-white/94 px-3 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
                  onClick={() => setIsMapFullscreen(true)}
                >
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 3 3 7m10-4 4 4m-4 10 4-4M7 17l-4-4" />
                  </svg>
                </Button>
              </div>

              <IndonesiaFootprintMap
                cities={footprint}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
              />
            </div>
          )
        ) : (
          <EmptyState
            title="No mapped workforce for these filters"
            description="Try clearing one or more filters to bring cities back onto the Indonesia map."
          />
        )}
      </div>
    </Card>
  )

  if (bootstrapping) {
    return (
      <AppLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (error && !footprint.length) {
    return (
      <AppLayout>
        <EmptyState title="Unable to load Indonesia footprint" description={error} />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 px-6">
        <section className="lg:max-w-[38rem]">
          <h2 className="font-display text-3xl font-semibold text-ink-900">Indonesia Talent Footprint</h2>
          <p className="mt-2 text-base leading-7 text-ink-500">
            Explore how employees, roles, and skills are distributed across Indonesian cities, then drill into each city to inspect talent concentration.
          </p>
        </section>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Card>
              <p className="section-label">Filters</p>
              <div className="mt-4 space-y-3">
                <select
                  value={selectedSkill}
                  onChange={(event) => setSelectedSkill(event.target.value)}
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-ink-900 outline-none transition-all focus:border-primary-300 focus:ring-4 focus:ring-[var(--ring)]"
                >
                  <option value="">All skills</option>
                  {skills.map((skill) => (
                    <option key={skill.name} value={skill.name}>
                      {skill.name} ({skill.count})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-ink-900 outline-none transition-all focus:border-primary-300 focus:ring-4 focus:ring-[var(--ring)]"
                >
                  <option value="">All roles</option>
                  {roles.map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.name} ({role.count})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDepartment}
                  onChange={(event) => setSelectedDepartment(event.target.value)}
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-ink-900 outline-none transition-all focus:border-primary-300 focus:ring-4 focus:ring-[var(--ring)]"
                >
                  <option value="">All departments</option>
                  {departments.map((department) => (
                    <option key={department.name} value={department.name}>
                      {department.name} ({department.count})
                    </option>
                  ))}
                </select>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setSelectedSkill('')
                    setSelectedRole('')
                    setSelectedDepartment('')
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </Card>

            <Card>
              <p className="section-label">Coverage Snapshot</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
                  <p className="text-sm font-medium text-ink-500">Mapped employees</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{summary.totalEmployees}</p>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
                  <p className="text-sm font-medium text-ink-500">Active cities</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{summary.activeCities}</p>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
                  <p className="text-sm font-medium text-ink-500">Largest hub</p>
                  <p className="mt-2 font-medium text-ink-900">{summary.largestCity?.city || 'Not available'}</p>
                  <p className="mt-1 text-sm text-ink-500">{summary.largestCity?.employeeCount || 0} employees</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <p className="text-sm font-medium text-ink-500">Mapped employees</p>
                <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{summary.totalEmployees}</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-ink-500">Cities on map</p>
                <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{summary.activeCities}</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-ink-500">Selected filter</p>
                <p className="mt-2 font-medium text-ink-900">{selectedSkill || selectedRole || selectedDepartment || 'All workforce'}</p>
              </Card>
            </div>

            {!isMapFullscreen && renderMapExperience()}
          </div>

          <LocationDetailPanel
            detail={locationDetail}
            loading={loadingDetail}
            error={detailError}
            footprint={footprint}
          />
        </div>
      </div>

      {isMapFullscreen && (
        <div className="fixed inset-0 z-[80] bg-[linear-gradient(180deg,rgba(241,245,252,0.97)_0%,rgba(232,239,249,0.98)_100%)] p-4 backdrop-blur-sm lg:p-6">
          <div className="mx-auto h-full max-w-[1800px]">
            {renderMapExperience(true)}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
