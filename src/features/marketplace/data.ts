export type MarketplaceItem = {
  category: string
  title: string
  description: string
  price: number
  accent: string
}

export const marketplaceItems: MarketplaceItem[] = [
  {
    category: 'Memorial',
    title: 'Granite remembrance plaque',
    description: 'Hand-finished headstone options with personalised engraving and family wording.',
    price: 420,
    accent: '✦',
  },
  {
    category: 'Flowers',
    title: 'Wreath & sympathy package',
    description: 'Fresh floral arrangements for church services, graveside ceremonies and family spaces.',
    price: 180,
    accent: '❀',
  },
  {
    category: 'Services',
    title: 'Repatriation coordination',
    description: 'Trusted transport and document guidance for families arranging funerals across borders.',
    price: 1200,
    accent: '✈',
  },
  {
    category: 'Venue',
    title: 'Marquee & seating hire',
    description: 'Chairs, canopies and guest comfort packages for gatherings and memorial venues.',
    price: 680,
    accent: '▣',
  },
  {
    category: 'Media',
    title: 'Memorial video tribute',
    description: 'A professionally composed tribute video built from family photos, voice notes and stories.',
    price: 340,
    accent: '◉',
  },
  {
    category: 'Services',
    title: 'Programme & stationery pack',
    description: 'Printed funeral programmes, keepsakes and order-of-service stationery for the ceremony.',
    price: 260,
    accent: '✎',
  },
]

export const ALL_CATEGORIES = 'All'

export const marketplaceCategories = [ALL_CATEGORIES, ...new Set(marketplaceItems.map((item) => item.category))]
