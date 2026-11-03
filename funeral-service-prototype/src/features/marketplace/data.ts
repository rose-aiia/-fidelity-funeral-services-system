// Types and sample catalogue for the marketplace. Importable from Node (scripts/mock-api.mjs): only relative `.ts` imports.
import { marqueeArt, plaqueArt, repatriationArt, stationeryArt, videoArt, wreathArt } from './product-art.ts'

export type OptionChoice = {
  id: string
  label: string
  /** Added to the item's base price, whole US dollars. May be negative. */
  priceDelta: number
}

/** One decision the buyer makes (a material, a size). The first choice is the default. */
export type OptionGroup = {
  id: string
  label: string
  choices: OptionChoice[]
}

/** Free text printed or engraved on the item, or written on a card. */
export type Personalisation = {
  label: string
  placeholder: string
  maxLength: number
  required?: boolean
}

/** `delivery` items are physical and incur the delivery fee; `service` items are arranged by the provider. */
export type Fulfilment = 'delivery' | 'service'

export type MarketplaceItem = {
  id: string
  category: string
  title: string
  description: string
  /** Starting price in whole US dollars (before options). */
  price: number
  /** Decorative glyph, shown when there is no image. */
  accent: string
  image?: string
  provider?: string
  leadTime?: string
  fulfilment?: Fulfilment
  details?: string
  includes?: string[]
  options?: OptionGroup[]
  personalisation?: Personalisation
}

export type CartLine = {
  /** Unique within the cart. */
  id: string
  itemId: string
  /** Chosen `OptionChoice.id` per `OptionGroup.id`. */
  options: Record<string, string>
  quantity: number
  personalisation?: string
}

/** What a client sends when ordering: choices only, never prices. */
export type OrderLineInput = Omit<CartLine, 'id'>

export type DeliveryDetails = {
  recipientName: string
  /** E.164. */
  phone: string
  town: string
  address: string
  /** `YYYY-MM-DD`: when the order is needed by. */
  neededBy?: string
  note?: string
}

export type PaymentMethod = 'ecocash' | 'paynow'
export type PaymentStatus = 'pending' | 'paid' | 'failed'

export type PaymentInput = {
  method: PaymentMethod
  /** The EcoCash wallet to charge. Required for `ecocash`. */
  ecocashNumber?: string
}

export type NewOrder = {
  lines: OrderLineInput[]
  delivery: DeliveryDetails
  payment: PaymentInput
  /** Name of the person the order honours, if it was started from a memorial. */
  inMemoryOf?: string
}

export type OrderStatus =
  | 'awaiting_payment'
  | 'payment_failed'
  | 'paid'
  | 'confirmed'
  | 'in_progress'
  | 'delivered'
  | 'cancelled'

export type OrderLine = {
  itemId: string
  title: string
  provider?: string
  image?: string
  /** Human-readable choices, e.g. `Black granite`. */
  optionLabels: string[]
  quantity: number
  unitPrice: number
  lineTotal: number
  personalisation?: string
}

export type OrderPayment = {
  method: PaymentMethod
  status: PaymentStatus
  /** Quote this when phoning about the payment. */
  reference: string
  amount: number
  /** Masked, e.g. `+263 77 ••• 4567`. */
  ecocashNumber?: string
  paidAt?: string
  failureReason?: string
}

export type OrderEvent = {
  at: string
  label: string
}

export type Order = {
  id: string
  /** Human-readable, e.g. `FS-1042`. */
  reference: string
  status: OrderStatus
  lines: OrderLine[]
  subtotal: number
  deliveryFee: number
  total: number
  delivery: DeliveryDetails
  payment: OrderPayment
  events: OrderEvent[]
  inMemoryOf?: string
  createdAt: string
}

export const ALL_CATEGORIES = 'All'
export const MAX_QUANTITY = 10
export const DELIVERY_TOWNS = ['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Chitungwiza'] as const

export const marketplaceItems: MarketplaceItem[] = [
  {
    category: 'Memorial',
    id: 'granite-plaque',
    title: 'Granite remembrance plaque',
    description: 'Hand-finished headstone options with personalised engraving and family wording.',
    price: 420,
    accent: '✦',
    image: plaqueArt,
    provider: 'Bulawayo Stone Works',
    leadTime: '10 to 14 days',
    fulfilment: 'delivery',
    details:
      'Cut, polished and engraved by hand in Bulawayo. We send you a proof of the wording before anything is engraved, so there are no surprises.',
    includes: ['Hand-polished granite or marble', 'Engraving of your wording', 'Free proof before engraving', 'Fixing kit'],
    options: [
      {
        id: 'material',
        label: 'Material',
        choices: [
          { id: 'black', label: 'Black granite', priceDelta: 0 },
          { id: 'grey', label: 'Grey granite', priceDelta: -40 },
          { id: 'marble', label: 'White marble', priceDelta: 90 },
        ],
      },
      {
        id: 'size',
        label: 'Size',
        choices: [
          { id: 'standard', label: 'Standard, 40 × 30 cm', priceDelta: 0 },
          { id: 'large', label: 'Large, 60 × 40 cm', priceDelta: 160 },
        ],
      },
    ],
    personalisation: {
      label: 'Engraving wording',
      placeholder: 'Grace Nyathi\n1949 – 2025\nA mother to many',
      maxLength: 120,
      required: true,
    },
  },
  {
    category: 'Flowers',
    id: 'wreath-package',
    title: 'Wreath & sympathy package',
    description: 'Fresh floral arrangements for church services, graveside ceremonies and family spaces.',
    price: 180,
    accent: '❀',
    image: wreathArt,
    provider: 'Msasa Florists',
    leadTime: 'Next day',
    fulfilment: 'delivery',
    details:
      'Arranged on the morning of delivery from seasonal flowers, with a handwritten card. We can deliver to a church, a home or the graveside.',
    includes: ['Fresh seasonal flowers', 'Handwritten card with your message', 'Delivery to the venue of your choice'],
    options: [
      {
        id: 'size',
        label: 'Size',
        choices: [
          { id: 'standard', label: 'Standard', priceDelta: 0 },
          { id: 'large', label: 'Large', priceDelta: 60 },
          { id: 'premium', label: 'Premium', priceDelta: 140 },
        ],
      },
    ],
    personalisation: { label: 'Message on the card', placeholder: 'With love and deepest sympathy', maxLength: 140 },
  },
  {
    category: 'Services',
    id: 'repatriation-coordination',
    title: 'Repatriation coordination',
    description: 'Trusted transport and document guidance for families arranging funerals across borders.',
    price: 1200,
    accent: '✈',
    image: repatriationArt,
    provider: 'Safe Passage Logistics',
    leadTime: 'Starts within 24 hours',
    fulfilment: 'service',
    details:
      'A named coordinator handles transport, permits and paperwork between countries, and keeps your family updated at every stage.',
    includes: ['A named coordinator', 'Permits and documentation', 'Cross-border transport', 'Updates to the family by WhatsApp'],
    options: [
      {
        id: 'region',
        label: 'Destination',
        choices: [
          { id: 'sadc', label: 'Within Southern Africa', priceDelta: 0 },
          { id: 'africa', label: 'Elsewhere in Africa', priceDelta: 800 },
          { id: 'world', label: 'International', priceDelta: 2400 },
        ],
      },
    ],
  },
  {
    category: 'Venue',
    id: 'marquee-hire',
    title: 'Marquee & seating hire',
    description: 'Chairs, canopies and guest comfort packages for gatherings and memorial venues.',
    price: 680,
    accent: '▣',
    image: marqueeArt,
    provider: 'Highveld Events',
    leadTime: 'Book 3 days ahead',
    fulfilment: 'service',
    details: 'Set up the day before and collected the day after, so your family never has to think about it.',
    includes: ['Marquee or canopy', 'Chairs and tables', 'Set-up and collection'],
    options: [
      {
        id: 'guests',
        label: 'Seating for',
        choices: [
          { id: '50', label: '50 guests', priceDelta: 0 },
          { id: '100', label: '100 guests', priceDelta: 320 },
          { id: '200', label: '200 guests', priceDelta: 780 },
        ],
      },
    ],
  },
  {
    category: 'Media',
    id: 'video-tribute',
    title: 'Memorial video tribute',
    description: 'A professionally composed tribute video built from family photos, voice notes and stories.',
    price: 340,
    accent: '◉',
    image: videoArt,
    provider: 'Remembered Studio',
    leadTime: '5 working days',
    fulfilment: 'service',
    details: 'Send us photographs, voice notes and a few favourite stories; we will compose them into a film for the service and for the family to keep.',
    includes: ['Editing of your photos and clips', 'Music licensing', 'A copy for the family'],
    options: [
      {
        id: 'length',
        label: 'Length',
        choices: [
          { id: '3', label: 'About 3 minutes', priceDelta: 0 },
          { id: '5', label: 'About 5 minutes', priceDelta: 120 },
        ],
      },
    ],
  },
  {
    category: 'Services',
    id: 'stationery-pack',
    title: 'Programme & stationery pack',
    description: 'Printed funeral programmes, keepsakes and order-of-service stationery for the ceremony.',
    price: 260,
    accent: '✎',
    image: stationeryArt,
    provider: 'Fine Print Zimbabwe',
    leadTime: '3 working days',
    fulfilment: 'delivery',
    details: 'Programmes on quality card with a portrait on the cover, ready for the service.',
    includes: ['Designed programme', 'Printing on quality card', 'Delivery to the family'],
    options: [
      {
        id: 'count',
        label: 'Quantity',
        choices: [
          { id: '50', label: '50 programmes', priceDelta: 0 },
          { id: '100', label: '100 programmes', priceDelta: 90 },
          { id: '200', label: '200 programmes', priceDelta: 210 },
        ],
      },
    ],
    personalisation: { label: 'Name for the cover', placeholder: 'In loving memory of…', maxLength: 80, required: true },
  },
]
