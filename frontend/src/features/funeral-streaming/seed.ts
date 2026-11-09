import type { FuneralStream } from './data'

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

export function seedStreams(): FuneralStream[] {
  return [
    {
      id: 'fs-nyathi',
      personName: 'Grace Nyathi',
      serviceTitle: 'Funeral service and burial (recording)',
      date: '2025-09-10',
      time: '10:00 CAT',
      venue: "St Mary's Church, Makokoba / Athlone Cemetery",
      details: 'Family authorised a private coverage link for relatives who could not attend in person. This prototype shows how a completed stream can be saved to Digital Funeral Records.',
      status: 'ended',
      viewers: [
        { id: 'sv1', name: 'Samuel Nyathi', contact: 'samuel@example.com', status: 'accessed', invitedAt: daysAgo(28), accessedAt: daysAgo(27) },
        { id: 'sv2', name: 'Lindiwe Khumalo', contact: '+263 77 111 2222', status: 'invited', invitedAt: daysAgo(27) },
      ],
      recordingAvailable: true,
      savedToArchiveId: 'fr-nyathi',
      updatedAt: daysAgo(26),
    },
    {
      id: 'fs-upcoming',
      personName: 'Sample Family Service',
      serviceTitle: 'Scheduled memorial service (demonstration)',
      date: '2026-06-20',
      time: '11:00 CAT',
      venue: 'Harare Chapel (sample venue)',
      details: 'This scheduled event demonstrates invitation management and live status changes. No real funeral is being streamed.',
      status: 'scheduled',
      viewers: [{ id: 'sv3', name: 'Invited relative', contact: 'relative@example.com', status: 'invited', invitedAt: daysAgo(1) }],
      recordingAvailable: false,
      updatedAt: daysAgo(1),
    },
  ]
}
