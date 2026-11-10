/** BRD 6.1: sample cemetery, plot and grave-record data. Every record here is fictional demonstration data. */

export type PlotAvailability = 'available' | 'limited' | 'full'

export type Cemetery = {
  id: string
  name: string
  town: string
  region: string
  about: string
  directions: string
  phone: string
  email: string
  hours: string
  availability: PlotAvailability
  /** Published plot guidance, in USD. 0 means the operator has not published prices. */
  plotFrom: number
  plotTo: number
  sections: string[]
}

export type GraveRecord = {
  id: string
  fullName: string
  birthYear: number
  deathYear: number
  cemeteryId: string
  section: string
  plot: string
  /** Unverified records are listed with a warning rather than as a confirmed match. */
  verified: boolean
}

export type PlotEnquiry = {
  id: string
  cemeteryId: string
  name: string
  contact: string
  kind: 'purchase' | 'reserve' | 'information'
  message: string
  createdAt: string
}

export const availabilityLabels: Record<PlotAvailability, string> = {
  available: 'Plots available',
  limited: 'Limited plots',
  full: 'No plots published',
}

export const cemeteries: Cemetery[] = [
  { id: 'cem-1', name: 'Sample Eastlea Memorial Park', town: 'Harare', region: 'Harare East', about: 'A fictional lawn cemetery used to demonstrate search, plot guidance and enquiries.', directions: 'Sample directions: off the main eastern road, second turn after the sample garden centre. Follow the signs to the lodge.', phone: '+263 000 000 001 (sample)', email: 'sample-eastlea@example.invalid', hours: 'Daily 07:00 to 17:00', availability: 'available', plotFrom: 350, plotTo: 900, sections: ['A', 'B', 'C', 'Garden'] },
  { id: 'cem-2', name: 'Sample Highfield Community Cemetery', town: 'Harare', region: 'Harare South', about: 'A fictional community cemetery with older sections and a small number of reserved plots.', directions: 'Sample directions: beside the sample community hall; the entrance faces the bus terminus.', phone: '+263 000 000 002 (sample)', email: 'sample-highfield@example.invalid', hours: 'Daily 06:30 to 17:30', availability: 'limited', plotFrom: 200, plotTo: 450, sections: ['Old', 'East', 'West'] },
  { id: 'cem-3', name: 'Sample Hillside Gardens', town: 'Bulawayo', region: 'Bulawayo North', about: 'A fictional hillside cemetery used to show how plot prices may be compared.', directions: 'Sample directions: north of the sample ring road, behind the sample reservoir.', phone: '+263 000 000 003 (sample)', email: 'sample-hillside@example.invalid', hours: 'Daily 07:00 to 16:30', availability: 'available', plotFrom: 300, plotTo: 750, sections: ['North', 'South', 'Terrace'] },
  { id: 'cem-4', name: 'Sample Riverside Cemetery', town: 'Mutare', region: 'Manicaland', about: 'A fictional cemetery. Its operator has not published plot availability.', directions: 'Sample directions: signposted from the sample river bridge.', phone: '+263 000 000 004 (sample)', email: 'sample-riverside@example.invalid', hours: 'Mon to Sat 08:00 to 16:00', availability: 'full', plotFrom: 0, plotTo: 0, sections: ['Main'] },
]

export const graveRecords: GraveRecord[] = [
  { id: 'gr-1', fullName: 'Tendai Moyo', birthYear: 1948, deathYear: 2021, cemeteryId: 'cem-1', section: 'B', plot: 'B-114', verified: true },
  { id: 'gr-2', fullName: 'Rudo Chikwanha', birthYear: 1955, deathYear: 2019, cemeteryId: 'cem-2', section: 'East', plot: 'E-32', verified: true },
  { id: 'gr-3', fullName: 'Sipho Ndlovu', birthYear: 1962, deathYear: 2023, cemeteryId: 'cem-3', section: 'Terrace', plot: 'T-09', verified: true },
  { id: 'gr-4', fullName: 'Tendai Moyo', birthYear: 1971, deathYear: 2020, cemeteryId: 'cem-2', section: 'Old', plot: 'O-77', verified: false },
]

export const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

export function searchCemeteries(query: string, publishedOnly: boolean): Cemetery[] {
  const q = norm(query)
  return cemeteries.filter((c) => {
    if (publishedOnly && c.availability === 'full') return false
    return !q || [c.name, c.town, c.region].some((v) => norm(v).includes(q))
  })
}

export function searchGraves(name: string, deathYear?: number): GraveRecord[] {
  const q = norm(name)
  if (!q) return []
  return graveRecords.filter((g) => norm(g.fullName).includes(q) && (!deathYear || g.deathYear === deathYear))
}

export const priceRange = (c: Cemetery) => (c.plotTo ? `$${c.plotFrom} to $${c.plotTo}` : 'Not published')
