import { slugify } from '../../lib/slug'

export type FamilyVisibility = 'private' | 'invited' | 'family'
export type ContributionStatus = 'draft' | 'pending' | 'approved' | 'declined'
export type RelationType = 'spouse' | 'parent' | 'child' | 'sibling'

export type FamilyPhoto = {
  id: string
  url: string
  caption?: string
  year?: number
}

export type FamilyHistoryRecord = {
  id: string
  title: string
  kind: 'biography' | 'origin' | 'story' | 'event'
  date?: string
  content: string
  contributedBy: string
  status: ContributionStatus
  visibility: FamilyVisibility
  addedAt: string
}

export type FamilyMember = {
  id: string
  name: string
  relationship: string
  birthDate?: string
  deathDate?: string
  location?: string
  bio: string
  photoUrl?: string
  memorialSlug?: string
}

export type FamilyLink = {
  id: string
  fromId: string
  toId: string
  type: RelationType
  note?: string
}

export type FamilyContribution = {
  id: string
  invitedName: string
  invitedEmail?: string
  submittedBy: string
  summary: string
  details: string
  status: ContributionStatus
  submittedAt: string
  reviewedAt?: string
  reviewer?: string
}

export type FamilyHistoryArchive = {
  id: string
  familyName: string
  summary: string
  visibility: FamilyVisibility
  members: FamilyMember[]
  links: FamilyLink[]
  records: FamilyHistoryRecord[]
  photos: FamilyPhoto[]
  contributions: FamilyContribution[]
  connectedMemorialSlugs: string[]
  updatedAt: string
}

export function memberById(archive: FamilyHistoryArchive, id: string): FamilyMember | undefined {
  return archive.members.find((m) => m.id === id)
}

export function memberLinks(archive: FamilyHistoryArchive, memberId: string): Array<FamilyLink & { other: FamilyMember; direction: 'from' | 'to' }> {
  const out: Array<FamilyLink & { other: FamilyMember; direction: 'from' | 'to' }> = []
  for (const link of archive.links) {
    if (link.fromId === memberId) {
      const other = memberById(archive, link.toId)
      if (other) out.push({ ...link, other, direction: 'from' })
    } else if (link.toId === memberId) {
      const other = memberById(archive, link.fromId)
      if (other) out.push({ ...link, other, direction: 'to' })
    }
  }
  return out
}

export function relationLabel(link: FamilyLink, perspectiveId: string): string {
  const isFrom = link.fromId === perspectiveId
  switch (link.type) {
    case 'spouse':
      return 'Spouse'
    case 'parent':
      return isFrom ? 'Parent of' : 'Child of'
    case 'child':
      return isFrom ? 'Child of' : 'Parent of'
    case 'sibling':
      return 'Sibling of'
    default:
      return 'Related to'
  }
}

export type GenerationGroup = { generation: number; members: FamilyMember[] }

/** Simple generation layout heuristic for prototype visualization. */
export function buildGenerations(archive: FamilyHistoryArchive): GenerationGroup[] {
  const gen = new Map<string, number>()
  for (const m of archive.members) gen.set(m.id, 0)
  // Anchor: members with no parent links pointing to them as child? heuristic by birth year
  const byBirth = [...archive.members].sort((a, b) => (a.birthDate ?? '9999').localeCompare(b.birthDate ?? '9999'))
  if (byBirth[0]) gen.set(byBirth[0].id, 0)
  let changed = true
  for (let i = 0; i < 8 && changed; i++) {
    changed = false
    for (const link of archive.links) {
      const gf = gen.get(link.fromId) ?? 0
      const gt = gen.get(link.toId) ?? 0
      if (link.type === 'parent') {
        // from is parent of to
        if (gt <= gf) { gen.set(link.toId, gf + 1); changed = true }
      }
      if (link.type === 'child') {
        if (gf <= gt) { gen.set(link.fromId, gt + 1); changed = true }
      }
      if (link.type === 'spouse' || link.type === 'sibling') {
        const target = Math.max(gf, gt)
        if (gf !== target) { gen.set(link.fromId, target); changed = true }
        if (gt !== target) { gen.set(link.toId, target); changed = true }
      }
    }
  }
  const groups = new Map<number, FamilyMember[]>()
  for (const m of archive.members) {
    const g = gen.get(m.id) ?? 0
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(m)
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([generation, members]) => ({ generation, members }))
}

export const visibilityLabels: Record<FamilyVisibility, string> = {
  private: 'Private',
  invited: 'Invited relatives only',
  family: 'Family members',
}

export const contributionLabels: Record<ContributionStatus, string> = {
  draft: 'Draft',
  pending: 'Pending approval',
  approved: 'Approved',
  declined: 'Declined',
}

export const nextMemberId = (prefix = 'fm') => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
export const makeSlug = (name: string) => slugify(name)
