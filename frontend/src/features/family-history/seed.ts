import type { FamilyHistoryArchive } from './data'
import { hillsAtSunrise, riverAtMidday, acaciaAtDusk } from '../memorials/sample-art'

const now = new Date().toISOString()
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

export function seedFamilyHistory(): FamilyHistoryArchive {
  return {
    id: 'fh-nyathi',
    familyName: 'Nyathi Family',
    summary:
      'A sample family history connected to the Nyathi memorial, showing how biographies, origins, relationships and approved contributions can be preserved together for future generations.',
    visibility: 'invited',
    members: [
      { id: 'fm1', name: 'Grace Nyathi', relationship: 'Matriarch', birthDate: '1949-06-12', deathDate: '2025-09-03', location: 'Bulawayo', bio: 'Teacher, headmistress, choir member and the heart of the Nyathi home.', photoUrl: hillsAtSunrise, memorialSlug: 'grace-nyathi' },
      { id: 'fm2', name: 'Joseph Nyathi', relationship: 'Patriarch', birthDate: '1946-02-18', deathDate: '2018-11-20', location: 'Bulawayo', bio: 'Railway engineer who valued education, faith and family gatherings.', photoUrl: acaciaAtDusk },
      { id: 'fm3', name: 'Ruth Nyathi-Moyo', relationship: 'Daughter', birthDate: '1975-04-03', location: 'Harare', bio: 'Nurse and family coordinator who keeps records and photographs organised.' },
      { id: 'fm4', name: 'Samuel Nyathi', relationship: 'Son', birthDate: '1978-09-14', location: 'Johannesburg', bio: 'Works in logistics and supports family repatriation and travel planning.' },
      { id: 'fm5', name: 'Thandi Moyo', relationship: 'Granddaughter', birthDate: '2001-01-22', location: 'Harare', bio: 'University student preserving Gogo Grace’s recipes and garden stories.' },
      { id: 'fm6', name: 'Ellen Ndlovu', relationship: 'Mother of Grace', birthDate: '1924-05-01', deathDate: '1997-08-09', location: 'Gwanda', bio: 'Remembered for her storytelling, faith and care for extended family.' },
      { id: 'fm7', name: 'Peter Ndlovu', relationship: 'Father of Grace', birthDate: '1921-03-11', deathDate: '1984-12-02', location: 'Gwanda', bio: 'Farmer and community elder who encouraged all his children to attend school.' },
    ],
    links: [
      { id: 'fl1', fromId: 'fm2', toId: 'fm1', type: 'spouse', note: 'Married 1974' },
      { id: 'fl2', fromId: 'fm1', toId: 'fm3', type: 'parent' },
      { id: 'fl3', fromId: 'fm2', toId: 'fm3', type: 'parent' },
      { id: 'fl4', fromId: 'fm1', toId: 'fm4', type: 'parent' },
      { id: 'fl5', fromId: 'fm2', toId: 'fm4', type: 'parent' },
      { id: 'fl6', fromId: 'fm3', toId: 'fm5', type: 'parent' },
      { id: 'fl7', fromId: 'fm3', toId: 'fm4', type: 'sibling' },
      { id: 'fl8', fromId: 'fm7', toId: 'fm1', type: 'parent' },
      { id: 'fl9', fromId: 'fm6', toId: 'fm1', type: 'parent' },
      { id: 'fl10', fromId: 'fm6', toId: 'fm7', type: 'spouse' },
    ],
    records: [
      { id: 'fr1', title: 'Family origins in Gwanda', kind: 'origin', date: '1920s', content: 'The Ndlovu and Nyathi families trace roots to communities around Gwanda, where farming, teaching and church life shaped early generations.', contributedBy: 'Ruth Nyathi-Moyo', status: 'approved', visibility: 'family', addedAt: daysAgo(30) },
      { id: 'fr2', title: 'Grace’s classroom legacy', kind: 'biography', date: '1970–2004', content: 'Grace taught for 34 years and served as headmistress for 12 years. Former pupils often describe her as firm, patient and deeply encouraging.', contributedBy: 'Ruth Nyathi-Moyo', status: 'approved', visibility: 'invited', addedAt: daysAgo(22) },
      { id: 'fr3', title: 'Sunday lunch tradition', kind: 'story', content: 'Every Sunday, Grace cooked enough for family, neighbours and anyone who needed a meal. The tradition continues at family gatherings in her memory.', contributedBy: 'Samuel Nyathi', status: 'approved', visibility: 'family', addedAt: daysAgo(10) },
      { id: 'fr4', title: 'Proposed reunion dates', kind: 'event', date: '2026-08', content: 'Relatives suggested a family remembrance gathering in Bulawayo. Dates and venue are awaiting confirmation.', contributedBy: 'Thandi Moyo', status: 'pending', visibility: 'invited', addedAt: daysAgo(2) },
    ],
    photos: [
      { id: 'fp1', url: hillsAtSunrise, caption: 'Morning light near the family home', year: 2019 },
      { id: 'fp2', url: riverAtMidday, caption: 'Family picnic by the river', year: 2016 },
      { id: 'fp3', url: acaciaAtDusk, caption: 'The acacia tree remembered in family stories', year: 2021 },
    ],
    contributions: [
      { id: 'fc1', invitedName: 'Nomsa Dlamini', invitedEmail: 'nomsa@example.com', submittedBy: 'Nomsa Dlamini', summary: 'Memory from a former pupil', details: 'Mrs Nyathi helped me learn to read and encouraged me to become a teacher. I would like this added to her biography.', status: 'approved', submittedAt: daysAgo(18), reviewedAt: daysAgo(17), reviewer: 'Ruth Nyathi-Moyo' },
      { id: 'fc2', invitedName: 'Brian Sibanda', invitedEmail: 'brian@example.com', submittedBy: 'Brian Sibanda', summary: 'Neighbourhood story', details: 'Grace often shared vegetables from her garden with families on our street. This could be included in family stories.', status: 'pending', submittedAt: daysAgo(1) },
    ],
    connectedMemorialSlugs: ['grace-nyathi'],
    updatedAt: now,
  }
}
