import type { ContributionStatus, FamilyContribution, FamilyHistoryArchive, FamilyMember, FamilyVisibility } from './data'
import { nextMemberId } from './data'
import { seedFamilyHistory } from './seed'

const KEY = 'fidelity.mock.familyHistory'

function read(): FamilyHistoryArchive {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as FamilyHistoryArchive
  } catch {
    /* seed fallback */
  }
  const seed = seedFamilyHistory()
  localStorage.setItem(KEY, JSON.stringify(seed))
  return seed
}

function write(archive: FamilyHistoryArchive) {
  const next = { ...archive, updatedAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export const familyHistoryStore = {
  get: (): FamilyHistoryArchive => read(),
  setVisibility: (visibility: FamilyVisibility) => write({ ...read(), visibility }),
  addMember: (input: Pick<FamilyMember, 'name' | 'relationship' | 'birthDate' | 'deathDate' | 'location' | 'bio' | 'memorialSlug'>) => {
    const archive = read()
    const member: FamilyMember = { id: nextMemberId(), ...input }
    return write({ ...archive, members: [...archive.members, member] })
  },
  reviewContribution: (id: string, status: ContributionStatus, reviewer: string) => {
    const archive = read()
    return write({
      ...archive,
      contributions: archive.contributions.map((c) => (c.id === id ? { ...c, status, reviewedAt: new Date().toISOString(), reviewer } : c)),
      records:
        status === 'approved'
          ? [
              {
                id: nextMemberId('fr'),
                title: archive.contributions.find((c) => c.id === id)?.summary ?? 'Approved contribution',
                kind: 'story',
                content: archive.contributions.find((c) => c.id === id)?.details ?? '',
                contributedBy: archive.contributions.find((c) => c.id === id)?.submittedBy ?? reviewer,
                status: 'approved',
                visibility: archive.visibility,
                addedAt: new Date().toISOString(),
              },
              ...archive.records,
            ]
          : archive.records,
    })
  },
  addContribution: (input: Pick<FamilyContribution, 'invitedName' | 'invitedEmail' | 'submittedBy' | 'summary' | 'details'>) => {
    const archive = read()
    const item: FamilyContribution = { id: nextMemberId('fc'), ...input, status: 'pending', submittedAt: new Date().toISOString() }
    return write({ ...archive, contributions: [item, ...archive.contributions] })
  },
}
