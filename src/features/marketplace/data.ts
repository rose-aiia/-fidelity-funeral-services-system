export type MarketplaceItem = {
  id: string
  category: string
  title: string
  description: string
  price: number
  accent: string
}

export const marketplaceItems: MarketplaceItem[] = [
  {
    category: 'Memorial',
    id: 'granite-plaque',
    title: 'Granite remembrance plaque',
    description: 'Hand-finished headstone options with personalised engraving and family wording.',
    price: 420,
    accent: '✦',
  },
  {
    category: 'Flowers',
    id: 'wreath-package',
    title: 'Wreath & sympathy package',
    description: 'Fresh floral arrangements for church services, graveside ceremonies and family spaces.',
    price: 180,
    accent: '❀',
  },
  {
    category: 'Services',
    id: 'repatriation-coordination',
    title: 'Repatriation coordination',
    description: 'Trusted transport and document guidance for families arranging funerals across borders.',
    price: 1200,
    accent: '✈',
  },
  {
    category: 'Venue',
    id: 'marquee-hire',
    title: 'Marquee & seating hire',
    description: 'Chairs, canopies and guest comfort packages for gatherings and memorial venues.',
    price: 680,
    accent: '▣',
  },
  {
    category: 'Media',
    id: 'video-tribute',
    title: 'Memorial video tribute',
    description: 'A professionally composed tribute video built from family photos, voice notes and stories.',
    price: 340,
    accent: '◉',
  },
  {
    category: 'Services',
    id: 'stationery-pack',
    title: 'Programme & stationery pack',
    description: 'Printed funeral programmes, keepsakes and order-of-service stationery for the ceremony.',
    price: 260,
    accent: '✎',
  },
]

export const ALL_CATEGORIES = 'All'
