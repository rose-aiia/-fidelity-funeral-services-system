import type { ExhumationEvent } from './data'

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

export function seedExhumationEvents(): ExhumationEvent[] {
  return [
    {
      id: 'exh-sample',
      reference: 'EXH-DEM0-2026-001',
      caseName: 'Sample authorised exhumation case',
      location: 'Authorised cemetery location (sample)',
      scheduledAt: '2026-07-15 09:00 CAT',
      approvalStatus: 'approved',
      authorisingBody: 'Relevant authority / family authorisation (demonstration record)',
      status: 'authorised',
      details: 'This restricted demonstration shows how authorised exhumation coverage could be managed separately from ordinary funeral streaming. It includes approval status, restricted viewers, audit history and suspend/revoke controls. No real exhumation footage is shown.',
      viewers: [
        { id: 'ev1', name: 'Authorised family representative', role: 'Family', status: 'granted', updatedAt: daysAgo(5), updatedBy: 'Case administrator' },
        { id: 'ev2', name: 'Compliance officer (sample)', role: 'Staff', status: 'granted', updatedAt: daysAgo(5), updatedBy: 'Case administrator' },
        { id: 'ev3', name: 'Invited legal representative', role: 'Invited', status: 'pending', updatedAt: daysAgo(2), updatedBy: 'Case administrator' },
      ],
      audit: [
        { id: 'ea1', at: daysAgo(6), by: 'Case administrator', action: 'Restricted case created', details: 'Exhumation coverage record created as a restricted demonstration.' },
        { id: 'ea2', at: daysAgo(5), by: 'Case administrator', action: 'Authorisation approved', details: 'Sample approval status recorded.' },
        { id: 'ea3', at: daysAgo(5), by: 'Case administrator', action: 'Viewer access granted', details: 'Authorised family representative granted access.' },
      ],
      recordingAvailable: true,
      updatedAt: daysAgo(1),
    },
  ]
}
