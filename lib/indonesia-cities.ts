export interface IndonesiaCity {
  name: string
  province: string
  lat: number
  lng: number
  weight: number
}

export const indonesiaCities: IndonesiaCity[] = [
  { name: 'Jakarta', province: 'DKI Jakarta', lat: -6.2088, lng: 106.8456, weight: 24 },
  { name: 'Surabaya', province: 'East Java', lat: -7.2575, lng: 112.7521, weight: 18 },
  { name: 'Bandung', province: 'West Java', lat: -6.9175, lng: 107.6191, weight: 14 },
  { name: 'Medan', province: 'North Sumatra', lat: 3.5952, lng: 98.6722, weight: 12 },
  { name: 'Makassar', province: 'South Sulawesi', lat: -5.1477, lng: 119.4327, weight: 10 },
  { name: 'Semarang', province: 'Central Java', lat: -6.9667, lng: 110.4167, weight: 8 },
  { name: 'Denpasar', province: 'Bali', lat: -8.6705, lng: 115.2126, weight: 8 },
  { name: 'Yogyakarta', province: 'Special Region of Yogyakarta', lat: -7.7971, lng: 110.3708, weight: 7 },
  { name: 'Balikpapan', province: 'East Kalimantan', lat: -1.2379, lng: 116.8529, weight: 7 },
  { name: 'Palembang', province: 'South Sumatra', lat: -2.9909, lng: 104.7566, weight: 7 },
  { name: 'Pekanbaru', province: 'Riau', lat: 0.5071, lng: 101.4478, weight: 6 },
  { name: 'Pontianak', province: 'West Kalimantan', lat: -0.0263, lng: 109.3425, weight: 6 },
  { name: 'Banjarmasin', province: 'South Kalimantan', lat: -3.3194, lng: 114.5908, weight: 6 },
  { name: 'Manado', province: 'North Sulawesi', lat: 1.4748, lng: 124.8421, weight: 5 },
  { name: 'Kupang', province: 'East Nusa Tenggara', lat: -10.1772, lng: 123.607, weight: 4 },
  { name: 'Jayapura', province: 'Papua', lat: -2.5337, lng: 140.7181, weight: 4 },
]

export const indonesiaCityMap = new Map(indonesiaCities.map((city) => [city.name, city]))

export function getIndonesiaCity(name: string) {
  return indonesiaCityMap.get(name)
}

