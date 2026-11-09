import type { FuneralRecordArchive } from './data'
import { hillsAtSunrise, riverAtMidday, acaciaAtDusk } from '../memorials/sample-art'

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

export function seedFuneralRecords(): FuneralRecordArchive[] {
  return [
    {
      id: 'fr-nyathi',
      personName: 'Grace Nyathi',
      reference: 'FDR-2025-0903-GN',
      summary: 'A secure sample archive organising funeral arrangements, service moments, procession and burial records for authorised family access.',
      stages: [
        { id: 'parlour', date: '2025-09-04', location: 'Fidelity Funeral Parlour, Bulawayo', summary: 'Collection, preparation, documentation checks and family viewing arrangements were confirmed.', completed: true },
        { id: 'service', date: '2025-09-10 10:00', location: "St Mary's Church, Makokoba", summary: 'Family and community attended the viewing and funeral service. Tributes and order of service were recorded.', completed: true },
        { id: 'procession', date: '2025-09-10 12:30', location: 'Makokoba to Athlone Cemetery', summary: 'The funeral procession route and authorised convoy details were coordinated with the family.', completed: true },
        { id: 'burial', date: '2025-09-10 13:15', location: 'Athlone Cemetery, Bulawayo', summary: 'Burial was completed and family records were updated with final attendance and documentation notes.', completed: true },
      ],
      media: [
        { id: 'rm1', kind: 'photo', title: 'Parlour arrangement confirmation', stage: 'parlour', url: acaciaAtDusk, note: 'Sample image representing arrangement documentation.', addedAt: daysAgo(28), addedBy: 'Funeral coordinator', simulated: true },
        { id: 'rm2', kind: 'photo', title: 'Service gathering', stage: 'service', url: hillsAtSunrise, note: 'Sample image for demonstration.', addedAt: daysAgo(27), addedBy: 'Ruth Nyathi-Moyo', simulated: true },
        { id: 'rm3', kind: 'video', title: 'Service highlights (sample)', stage: 'service', note: 'Simulated video record. No real funeral footage is stored in this prototype.', addedAt: daysAgo(27), addedBy: 'Media coordinator', simulated: true },
        { id: 'rm4', kind: 'photo', title: 'Burial flowers', stage: 'burial', url: riverAtMidday, note: 'Sample image representing floral tributes.', addedAt: daysAgo(26), addedBy: 'Family member', simulated: true },
      ],
      documents: [
        { id: 'rd1', kind: 'document', title: 'Order of service (sample)', stage: 'service', mime: 'application/pdf', note: 'Sample document metadata. Download is simulated in this prototype.', addedAt: daysAgo(27), addedBy: 'Funeral coordinator', simulated: true },
        { id: 'rd2', kind: 'document', title: 'Burial confirmation record (sample)', stage: 'burial', mime: 'application/pdf', note: 'Sample document metadata.', addedAt: daysAgo(26), addedBy: 'Records officer', simulated: true },
      ],
      access: [
        { id: 'ra1', name: 'Ruth Nyathi-Moyo', relationship: 'Daughter / family administrator', channel: 'ruth@example.com', level: 'family', status: 'granted', grantedAt: daysAgo(28), grantedBy: 'System administrator' },
        { id: 'ra2', name: 'Samuel Nyathi', relationship: 'Son', channel: '+263 77 000 0000', level: 'family', status: 'granted', grantedAt: daysAgo(28), grantedBy: 'Ruth Nyathi-Moyo' },
        { id: 'ra3', name: 'Nomsa Dlamini', relationship: 'Invited relative', channel: 'nomsa@example.com', level: 'invited', status: 'pending' },
      ],
      audit: [
        { id: 'au1', at: daysAgo(28), by: 'Funeral coordinator', action: 'Archive created', details: 'Digital funeral record opened for authorised family organisation.' },
        { id: 'au2', at: daysAgo(27), by: 'Ruth Nyathi-Moyo', action: 'Media added', details: 'Service gathering sample image added.' },
        { id: 'au3', at: daysAgo(27), by: 'Ruth Nyathi-Moyo', action: 'Access granted', details: 'Samuel Nyathi granted family access.' },
      ],
      linkedCoverageId: 'fs-nyathi',
      updatedAt: daysAgo(1),
    },
  ]
}
