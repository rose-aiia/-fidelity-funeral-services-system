// Sample memorials for mock mode and scripts/mock-api.mjs (both import this file directly).
// Everyone here is fictional.
import type { Memorial, Tribute } from './data.ts'
import { acaciaAtDusk, hillsAtSunrise, riverAtMidday } from './sample-art.ts'

export type MemorialRecord = Memorial & {
  /** Never sent to the browser as such; the API exposes only "is this mine". */
  ownerId: string
}

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

export function seedMemorials(): MemorialRecord[] {
  return [
    {
      id: 'm-grace',
      ownerId: 'u-moyo',
      slug: 'grace-nyathi',
      name: 'Grace Nyathi',
      born: '1949-06-12',
      died: '2025-09-03',
      tagline: 'A mother to many, and a friend to everyone who met her.',
      location: 'Bulawayo',
      biography: [
        'Grace Nyathi was born in Gwanda in the winter of 1949, the third of seven children. She walked six kilometres to school every morning and, by her own telling, never once complained about it. Learning was the thing she loved most, and she spent her life passing that love on.',
        'She trained as a teacher in Bulawayo and spent thirty-four years in the classroom, the last twelve as headmistress. Generations of children learned to read at her desk. Many of them still stop her family in the street to tell them so.',
        'At home, Grace kept the kitchen full. Sunday lunch was never for just the family: neighbours, colleagues and the occasional stranger found a plate waiting. She sang in the church choir, tended a garden of roses she was fiercely proud of, and never missed a birthday.',
        'She is survived by her children, her grandchildren and a community that will keep telling her stories for a long time.',
      ].join('\n\n'),
      timeline: [
        { id: 't1', year: 1949, title: 'Born in Gwanda', text: 'The third of seven children.' },
        { id: 't2', year: 1970, title: 'Qualified as a teacher', text: 'Graduated from teachers’ college in Bulawayo.' },
        { id: 't3', year: 1974, title: 'Married Joseph Nyathi' },
        { id: 't4', year: 1989, title: 'Became headmistress', text: 'Led the school for twelve years.' },
        { id: 't5', year: 2008, title: 'Retired, and took up gardening', text: 'Her rose garden became a neighbourhood landmark.' },
      ],
      photos: [
        { id: 'p1', url: hillsAtSunrise, caption: 'Early mornings, the way she liked them' },
        { id: 'p2', url: acaciaAtDusk, caption: 'The tree outside the family home' },
        { id: 'p3', url: riverAtMidday, caption: 'Sunday picnics by the river' },
      ],
      service: {
        date: '2025-09-10T10:00:00+02:00',
        venue: 'St Mary’s Church, Makokoba',
        address: 'Makokoba, Bulawayo',
        note: 'Burial follows at Athlone Cemetery. All who knew Grace are welcome.',
      },
      published: true,
      flowers: 132,
      candles: 48,
      createdAt: daysAgo(60),
    },
  ]
}

export function seedTributes(): Record<string, Tribute[]> {
  return {
    'm-grace': [
      {
        id: 'tr1',
        authorName: 'Nomsa Dlamini',
        relationship: 'Former pupil',
        message:
          'Mrs Nyathi taught me to read when I was six. I became a teacher because of her. I will carry her patience with me for the rest of my life.',
        createdAt: daysAgo(40),
        status: 'approved',
      },
      {
        id: 'tr2',
        authorName: 'Pastor Elias Ncube',
        relationship: 'Church family',
        message: 'The choir will never sound quite the same. Rest well, sister Grace. Thank you for every Sunday.',
        createdAt: daysAgo(38),
        status: 'approved',
      },
      {
        id: 'tr3',
        authorName: 'Thandi Moyo',
        relationship: 'Granddaughter',
        message: 'Gogo, your roses are blooming again this year. I water them every morning, just like you showed me.',
        createdAt: daysAgo(12),
        status: 'approved',
      },
      {
        id: 'tr4',
        authorName: 'Brian Sibanda',
        relationship: 'Neighbour',
        message: 'She fed half of our street at one time or another. Our thoughts are with the whole family.',
        createdAt: daysAgo(1),
        status: 'pending',
      },
    ],
  }
}
