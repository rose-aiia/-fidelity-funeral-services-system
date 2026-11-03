// Reference implementation of the API contract in docs/openapi.yaml, backed by the app's own sample data.
// Run it with `npm run mock-api`, then start the app against it with VITE_API_MODE=live.
// Needs Node 22.18+ (it imports the app's .ts data, pricing, order-flow, account and memorial modules directly).
//
// Accounts: sign in with a demo phone number (listed at startup) and the code 123456. Sessions, users, policy
// links, requests, memorials and marketplace orders live in memory and reset when the server restarts.
//
// Orders: payments are simulated. EcoCash and Paynow both settle by themselves about 4 seconds after they start
// (a real Paynow payment would hand the buyer a hosted page); EcoCash 0780000000 is always declined. A paid order
// then moves on a timer (see features/marketplace/order-flow.ts) and is brought up to date whenever it is read.
//
// Failure injection, for testing the UI's error states:
//   curl 'localhost:8080/__fail?on=1'   every API call returns 503
//   curl 'localhost:8080/__fail?on=0'   back to normal
import { randomBytes } from 'node:crypto'
import http from 'node:http'
import { demoPolicyLinks, demoRequestsFor, findPolicyByNumber, findPolicyRecord, policyRecords } from '../src/features/account/policy-records.ts'
import { DEMO_OTP, demoUsers } from '../src/features/auth/demo.ts'
import { isEmail, isOtpCode, normalisePhone } from '../src/features/auth/validation.ts'
import { faqs } from '../src/features/faq/data.ts'
import { marketplaceItems } from '../src/features/marketplace/data.ts'
import { advanceOrder, createOrderRecord, seedOrderRecords, startPayment, toPublicOrder } from '../src/features/marketplace/order-flow.ts'
import { hasErrors, validateDelivery, validatePayment } from '../src/features/marketplace/validation.ts'
import {
  approvedTributes,
  BIOGRAPHY_MAX_LENGTH,
  MAX_PHOTOS,
  MAX_TIMELINE_ENTRIES,
  NAME_MAX_LENGTH,
  TAGLINE_MAX_LENGTH,
  TRIBUTE_AUTHOR_MAX_LENGTH,
  TRIBUTE_MAX_LENGTH,
  uniqueSlug,
} from '../src/features/memorials/data.ts'
import { seedMemorials, seedTributes } from '../src/features/memorials/seed.ts'
import { plans } from '../src/features/plans/data.ts'
import { estimateTotal, SERVICE_TYPES, TOWNS } from '../src/features/plans/pricing.ts'

const PORT = Number(process.env.PORT ?? 8080)
const LATENCY_MS = Number(process.env.MOCK_API_LATENCY_MS ?? 300)

const MAX_ATTEMPTS = 5
const LANGUAGES = ['en', 'sn', 'nd']
const REQUEST_KINDS = ['bereavement', 'claim', 'general']
const CONTACT_PREFERENCES = ['call', 'whatsapp', 'sms']
const MESSAGE_MAX_LENGTH = 600 // matches MESSAGE_MAX_LENGTH in features/account/data.ts
const GENERAL_MESSAGE_MIN_LENGTH = 10

// Memorials. Limits that features/memorials/data.ts doesn't define are decided here and written up in openapi.yaml.
const RELATIONSHIP_MAX_LENGTH = 60
const LOCATION_MAX_LENGTH = 80
const TIMELINE_TITLE_MAX_LENGTH = 80
const TIMELINE_TEXT_MAX_LENGTH = 300
const VENUE_MAX_LENGTH = 120
const ADDRESS_MAX_LENGTH = 200
const SERVICE_NOTE_MAX_LENGTH = 500
const CAPTION_MAX_LENGTH = 140
const PHOTO_DATA_URL_MAX_LENGTH = 1_500_000
const PHOTO_DATA_URL = /^data:image\/(jpeg|png|webp|svg\+xml)(;[\w=.+-]+)*,/
const TRIBUTES_PER_HOUR = 5
const OFFERINGS_PER_DAY = 20
const ORDERS_PER_HOUR = 10
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/

let failing = false
let nextReference = 1001
let nextRequestNumber = 1043 // the seeded demo request is AR-1042
let nextUserNumber = 1
let nextMemorialNumber = 1
let nextPhotoNumber = 1
let nextTributeNumber = 1
let nextOrderNumber = 1039 // the seeded orders are FS-1017 and FS-1038

// Accounts, all in memory.
const users = new Map(demoUsers.map((user) => [user.phone, { ...user }])) // phone -> User
const sessions = new Map() // sid -> user id
const policyLinks = new Map(Object.entries(demoPolicyLinks)) // user id -> policy number
const requestsByUser = new Map() // user id -> AssistanceRequest[]
const codeFailures = new Map() // phone -> failed code attempts
const linkFailures = new Map() // user id -> failed policy-link attempts

// Memorials, all in memory. Deep copies, so mutations never touch the seed module's data.
const memorials = structuredClone(seedMemorials()) // MemorialRecord[], including ownerId
const tributesByMemorial = new Map(Object.entries(structuredClone(seedTributes()))) // memorial id -> Tribute[]
const tributeHits = new Map() // `${memorial id}|${visitor}` -> timestamps of recent tributes
const offeringHits = new Map() // `${memorial id}|${visitor}` -> timestamps of recent offerings

// Marketplace orders, all in memory. Records include ownerId and the settlement state; toPublicOrder strips them.
const orderRecords = new Map(seedOrderRecords().map((record) => [record.id, record])) // order id -> OrderRecord
const orderHits = new Map() // user id -> timestamps of recent orders

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers })
  res.end(body === undefined ? undefined : JSON.stringify(body))
}

const problem = (res, status, code, message, details) => send(res, status, { code, message, details })

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('invalid json'))
      }
    })
  })

const parseCookies = (header = '') =>
  Object.fromEntries(
    header
      .split(';')
      .map((pair) => pair.trim().split(/=(.*)/s))
      .filter(([name]) => name),
  )

const sessionUser = (req) => {
  const userId = sessions.get(parseCookies(req.headers.cookie).sid)
  return userId ? [...users.values()].find((user) => user.id === userId) : undefined
}

const startSession = (res, status, user) => {
  const sid = randomBytes(24).toString('hex')
  sessions.set(sid, user.id)
  send(res, status, user, { 'Set-Cookie': `sid=${sid}; HttpOnly; Path=/; SameSite=Lax` })
}

const lockedOut = (res) => problem(res, 429, 'locked_out', 'Too many failed attempts. Try again later.')

const policyFor = (userId) => {
  const number = policyLinks.get(userId)
  return number ? findPolicyByNumber(number) : undefined // the record's ID number is never included
}

const requestsFor = (userId) => {
  if (!requestsByUser.has(userId)) requestsByUser.set(userId, demoRequestsFor(userId))
  return requestsByUser.get(userId)
}

// Returns true once it has answered the request.
async function handleAccount(req, res, pathname) {
  const { method } = req

  if (method === 'POST' && pathname === '/auth/otp') {
    const body = await readJson(req).catch(() => null)
    const phone = normalisePhone(String(body?.phone ?? ''))
    if (!phone) return problem(res, 422, 'validation_failed', 'The request is invalid', { phone: 'Enter a Zimbabwean mobile number' }), true
    if ((codeFailures.get(phone) ?? 0) >= MAX_ATTEMPTS) return lockedOut(res), true
    return send(res, 200, { expiresInSeconds: 300 }), true // a real backend sends the SMS here
  }

  if (method === 'POST' && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    const signingUp = pathname === '/auth/signup'
    const body = await readJson(req).catch(() => null)
    const phone = normalisePhone(String(body?.phone ?? ''))
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const errors = {}
    if (!phone) errors.phone = 'Enter a Zimbabwean mobile number'
    if (!isOtpCode(String(body?.code ?? ''))) errors.code = 'Enter the 6-digit code'
    if (signingUp && !name) errors.name = 'Enter your name'
    if (signingUp && email && !isEmail(email)) errors.email = 'Enter a valid email address'
    if (Object.keys(errors).length) return problem(res, 422, 'validation_failed', 'The request is invalid', errors), true

    if ((codeFailures.get(phone) ?? 0) >= MAX_ATTEMPTS) return lockedOut(res), true
    if (body.code !== DEMO_OTP) {
      codeFailures.set(phone, (codeFailures.get(phone) ?? 0) + 1)
      return problem(res, 401, 'otp_invalid', 'The code is wrong or has expired'), true
    }
    codeFailures.delete(phone)

    const existing = users.get(phone)
    if (!signingUp) {
      if (!existing) return problem(res, 404, 'account_not_found', 'No account for this phone number'), true
      return startSession(res, 200, existing), true
    }
    if (existing) return problem(res, 409, 'account_exists', 'An account already exists for this phone number'), true
    const user = { id: `u-new-${nextUserNumber++}`, name, phone, ...(email && { email }), role: 'customer', language: 'en' }
    users.set(phone, user)
    return startSession(res, 201, user), true
  }

  if (method === 'POST' && pathname === '/auth/signout') {
    sessions.delete(parseCookies(req.headers.cookie).sid)
    return send(res, 204, undefined, { 'Set-Cookie': 'sid=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0' }), true
  }

  const routes = [
    ['GET', '/me'],
    ['PATCH', '/me'],
    ['GET', '/me/policy'],
    ['POST', '/me/policy'],
    ['GET', '/me/requests'],
    ['POST', '/me/requests'],
  ]
  if (!routes.some(([routeMethod, path]) => routeMethod === method && path === pathname)) return false

  // Everything below needs a session.
  const user = sessionUser(req)
  if (!user) return problem(res, 401, 'unauthenticated', 'Sign in required'), true

  if (method === 'GET' && pathname === '/me') return send(res, 200, user), true

  if (method === 'PATCH' && pathname === '/me') {
    const body = await readJson(req).catch(() => null)
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const errors = {}
    if (!name) errors.name = 'Enter your name'
    if (email && !isEmail(email)) errors.email = 'Enter a valid email address'
    if (!LANGUAGES.includes(body?.language)) errors.language = 'Unknown language'
    if (Object.keys(errors).length) return problem(res, 422, 'validation_failed', 'The request is invalid', errors), true

    user.name = name
    user.language = body.language
    if (email) user.email = email
    else delete user.email
    return send(res, 200, user), true
  }

  if (method === 'GET' && pathname === '/me/policy') {
    const policy = policyFor(user.id)
    return (policy ? send(res, 200, policy) : send(res, 204)), true
  }

  if (method === 'POST' && pathname === '/me/policy') {
    const body = await readJson(req).catch(() => null)
    const policyNumber = typeof body?.policyNumber === 'string' ? body.policyNumber.trim() : ''
    const idNumber = typeof body?.idNumber === 'string' ? body.idNumber.trim() : ''
    const errors = {}
    if (!policyNumber) errors.policyNumber = 'Enter your policy number'
    if (!idNumber) errors.idNumber = 'Enter your ID number'
    if (Object.keys(errors).length) return problem(res, 422, 'validation_failed', 'The request is invalid', errors), true

    if ((linkFailures.get(user.id) ?? 0) >= MAX_ATTEMPTS) return lockedOut(res), true
    const record = findPolicyRecord(policyNumber, idNumber)
    if (!record) {
      linkFailures.set(user.id, (linkFailures.get(user.id) ?? 0) + 1)
      return problem(res, 422, 'policy_not_found', 'No policy matches those details'), true
    }
    linkFailures.delete(user.id)
    policyLinks.set(user.id, record.policy.number)
    return send(res, 200, record.policy), true // the ID number stays on the server
  }

  if (method === 'GET' && pathname === '/me/requests') {
    return send(res, 200, [...requestsFor(user.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt))), true
  }

  // POST /me/requests
  const body = await readJson(req).catch(() => null)
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  const errors = {}
  if (!REQUEST_KINDS.includes(body?.kind)) errors.kind = 'Unknown request type'
  if (!CONTACT_PREFERENCES.includes(body?.contactPreference)) errors.contactPreference = 'Unknown contact preference'
  if (message.length > MESSAGE_MAX_LENGTH) errors.message = `Keep it under ${MESSAGE_MAX_LENGTH} characters`
  else if (body?.kind === 'general' && message.length < GENERAL_MESSAGE_MIN_LENGTH) errors.message = 'Tell us a little more'
  if (Object.keys(errors).length) return problem(res, 422, 'validation_failed', 'The request is invalid', errors), true

  const reference = `AR-${nextRequestNumber++}`
  const request = {
    id: reference.toLowerCase(),
    reference,
    kind: body.kind,
    message,
    contactPreference: body.contactPreference,
    status: 'received',
    createdAt: new Date().toISOString(),
  }
  requestsFor(user.id).unshift(request)
  return send(res, 201, request), true
}

// ---- Memorials ---------------------------------------------------------------------------------------------------

// Matches patterns like '/me/memorials/:id/photos'. Returns the params, or null when the path doesn't match.
const matchPath = (pattern, pathname) => {
  const want = pattern.split('/')
  const have = pathname.split('/')
  if (want.length !== have.length) return null
  const params = {}
  for (let index = 0; index < want.length; index += 1) {
    if (!want[index].startsWith(':')) {
      if (want[index] !== have[index]) return null
      continue
    }
    let value = ''
    try {
      value = decodeURIComponent(have[index])
    } catch {
      return null
    }
    if (!value) return null
    params[want[index].slice(1)] = value
  }
  return params
}

const visitorKey = (req) => req.socket.remoteAddress ?? 'unknown'

// Records a hit for `key` inside a sliding window. Returns false (recording nothing) once the limit is reached.
const withinLimit = (hits, key, limit, windowMs) => {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }
  hits.set(key, [...recent, now])
  return true
}

const memorialNotFound = (res) => problem(res, 404, 'not_found', 'No such memorial')
const invalid = (res, errors) => problem(res, 422, 'validation_failed', 'The request is invalid', errors)
const rateLimited = (res) => problem(res, 429, 'rate_limited', 'Too many requests. Try again later.')

const tributesFor = (memorialId) => {
  if (!tributesByMemorial.has(memorialId)) tributesByMemorial.set(memorialId, [])
  return tributesByMemorial.get(memorialId)
}

const publicMemorial = ({ ownerId: _ownerId, ...memorial }) => memorial // never exposes ownerId

const ownedMemorial = (record) => {
  const tributes = tributesFor(record.id)
  return {
    ...publicMemorial(record),
    tributeCount: tributes.filter((tribute) => tribute.status === 'approved').length,
    pendingTributes: tributes.filter((tribute) => tribute.status === 'pending').length,
  }
}

const isRealDate = (value) => {
  if (!ISO_DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

// Sets or clears an optional text field on `target`, recording an error under `key` when it is too long.
const applyOptionalText = (value, key, max, target, errors) => {
  if (typeof value !== 'string') {
    errors[key] = 'Enter text'
    return
  }
  const text = value.trim()
  if (text.length > max) errors[key] = `Keep it under ${max} characters`
  else if (text) target[key] = text
  else delete target[key]
}

// Validates name, dates, tagline and location for a create or an update. `draft` holds the merged values and
// `present(key)` says whether the caller sent that field.
function applyIdentity(body, present, draft, errors) {
  if (present('name')) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) errors.name = 'Enter a name'
    else if (name.length > NAME_MAX_LENGTH) errors.name = `Keep it under ${NAME_MAX_LENGTH} characters`
    else draft.name = name
  }
  for (const key of ['born', 'died']) {
    if (!present(key)) continue
    if (typeof body[key] === 'string' && isRealDate(body[key])) draft[key] = body[key]
    else errors[key] = 'Enter a valid date (YYYY-MM-DD)'
  }
  if (present('died') && !errors.died && draft.died > new Date().toISOString().slice(0, 10)) {
    errors.died = 'The date cannot be in the future'
  }
  if ((present('born') || present('died')) && !errors.born && !errors.died && draft.died < draft.born) {
    errors[present('died') ? 'died' : 'born'] = 'The date of death cannot be before the date of birth'
  }
  if (present('tagline')) applyOptionalText(body.tagline, 'tagline', TAGLINE_MAX_LENGTH, draft, errors)
  if (present('location')) applyOptionalText(body.location, 'location', LOCATION_MAX_LENGTH, draft, errors)
}

function validateTimeline(value) {
  if (!Array.isArray(value)) return { error: 'Send a list of timeline entries' }
  if (value.length > MAX_TIMELINE_ENTRIES) return { error: `Use at most ${MAX_TIMELINE_ENTRIES} entries` }
  const latestYear = new Date().getUTCFullYear()
  const ids = new Set()
  const entries = []
  for (const raw of value) {
    const id = typeof raw?.id === 'string' ? raw.id.trim() : ''
    const title = typeof raw?.title === 'string' ? raw.title.trim() : ''
    const text = typeof raw?.text === 'string' ? raw.text.trim() : ''
    if (!id || ids.has(id)) return { error: 'Each entry needs a unique id' }
    if (!Number.isInteger(raw.year) || raw.year < 1800 || raw.year > latestYear) return { error: `Years run from 1800 to ${latestYear}` }
    if (!title || title.length > TIMELINE_TITLE_MAX_LENGTH) return { error: `Titles need 1 to ${TIMELINE_TITLE_MAX_LENGTH} characters` }
    if (raw.text !== undefined && typeof raw.text !== 'string') return { error: 'Entry text must be a string' }
    if (text.length > TIMELINE_TEXT_MAX_LENGTH) return { error: `Keep entry text under ${TIMELINE_TEXT_MAX_LENGTH} characters` }
    ids.add(id)
    entries.push({ id, year: raw.year, title, ...(text && { text }) })
  }
  return { entries: entries.sort((a, b) => a.year - b.year) } // a stable sort: equal years keep the owner's order
}

function validateService(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { error: 'Send the service details or null' }
  const venue = typeof value.venue === 'string' ? value.venue.trim() : ''
  if (typeof value.date !== 'string' || !ISO_DATE_TIME.test(value.date) || Number.isNaN(Date.parse(value.date))) {
    return { error: 'Enter a valid date and time' }
  }
  if (!venue || venue.length > VENUE_MAX_LENGTH) return { error: `The venue needs 1 to ${VENUE_MAX_LENGTH} characters` }
  const service = { date: value.date, venue }
  const errors = {}
  if (value.address !== undefined) applyOptionalText(value.address, 'address', ADDRESS_MAX_LENGTH, service, errors)
  if (value.note !== undefined) applyOptionalText(value.note, 'note', SERVICE_NOTE_MAX_LENGTH, service, errors)
  const [firstError] = Object.values(errors)
  return firstError ? { error: firstError } : { service }
}

// Returns true once it has answered the request.
async function handleMemorials(req, res, pathname) {
  const { method } = req

  // Public. No session is needed, but a valid one identifies the owner, who can see their own unpublished page.
  const publicRoutes = [
    ['GET', '/memorials/:slug'],
    ['GET', '/memorials/:slug/tributes'],
    ['POST', '/memorials/:slug/tributes'],
    ['POST', '/memorials/:slug/offerings'],
  ]
  for (const [routeMethod, pattern] of publicRoutes) {
    const params = routeMethod === method ? matchPath(pattern, pathname) : null
    if (!params) continue

    const memorial = memorials.find((record) => record.slug === params.slug)
    const viewer = sessionUser(req)
    const isOwner = Boolean(memorial && viewer && memorial.ownerId === viewer.id)
    // Unpublished and not yours looks exactly like "doesn't exist".
    if (!memorial || (!memorial.published && !isOwner)) return memorialNotFound(res), true

    if (pattern === '/memorials/:slug') return send(res, 200, publicMemorial(memorial)), true
    if (pattern === '/memorials/:slug/tributes' && method === 'GET') {
      return send(res, 200, approvedTributes([...tributesFor(memorial.id)])), true
    }

    const body = await readJson(req).catch(() => null)
    if (pattern === '/memorials/:slug/tributes') {
      const authorName = typeof body?.authorName === 'string' ? body.authorName.trim() : ''
      const relationship = typeof body?.relationship === 'string' ? body.relationship.trim() : ''
      const message = typeof body?.message === 'string' ? body.message.trim() : ''
      const errors = {}
      if (!authorName) errors.authorName = 'Enter your name'
      else if (authorName.length > TRIBUTE_AUTHOR_MAX_LENGTH) errors.authorName = `Keep it under ${TRIBUTE_AUTHOR_MAX_LENGTH} characters`
      if (body?.relationship !== undefined && typeof body.relationship !== 'string') errors.relationship = 'Enter text'
      else if (relationship.length > RELATIONSHIP_MAX_LENGTH) errors.relationship = `Keep it under ${RELATIONSHIP_MAX_LENGTH} characters`
      if (!message) errors.message = 'Write a message'
      else if (message.length > TRIBUTE_MAX_LENGTH) errors.message = `Keep it under ${TRIBUTE_MAX_LENGTH} characters`
      if (Object.keys(errors).length) return invalid(res, errors), true

      if (!withinLimit(tributeHits, `${memorial.id}|${visitorKey(req)}`, TRIBUTES_PER_HOUR, HOUR_MS)) return rateLimited(res), true
      const tribute = {
        id: `tr-${nextTributeNumber++}`,
        authorName,
        ...(relationship && { relationship }),
        message,
        createdAt: new Date().toISOString(),
        status: isOwner ? 'approved' : 'pending', // the family's own tributes need no moderation
      }
      tributesFor(memorial.id).push(tribute)
      return send(res, 201, tribute), true
    }

    // POST /memorials/:slug/offerings
    if (body?.kind !== 'flower' && body?.kind !== 'candle') return invalid(res, { kind: 'Choose a flower or a candle' }), true
    if (!withinLimit(offeringHits, `${memorial.id}|${visitorKey(req)}`, OFFERINGS_PER_DAY, DAY_MS)) return rateLimited(res), true
    if (body.kind === 'flower') memorial.flowers += 1
    else memorial.candles += 1
    return send(res, 200, { flowers: memorial.flowers, candles: memorial.candles }), true
  }

  // Owner. A session is required, and someone else's memorial looks like it doesn't exist.
  const ownerRoutes = {
    list: ['GET', '/me/memorials'],
    create: ['POST', '/me/memorials'],
    get: ['GET', '/me/memorials/:id'],
    update: ['PATCH', '/me/memorials/:id'],
    remove: ['DELETE', '/me/memorials/:id'],
    addPhoto: ['POST', '/me/memorials/:id/photos'],
    removePhoto: ['DELETE', '/me/memorials/:id/photos/:photoId'],
    updatePhoto: ['PATCH', '/me/memorials/:id/photos/:photoId'],
    listTributes: ['GET', '/me/memorials/:id/tributes'],
    moderate: ['PATCH', '/me/memorials/:id/tributes/:tributeId'],
  }
  let route
  let params
  for (const [name, [routeMethod, pattern]] of Object.entries(ownerRoutes)) {
    params = routeMethod === method ? matchPath(pattern, pathname) : null
    if (params) {
      route = name
      break
    }
  }
  if (!route) return false

  const user = sessionUser(req)
  if (!user) return problem(res, 401, 'unauthenticated', 'Sign in required'), true

  if (route === 'list') {
    const mine = memorials.filter((record) => record.ownerId === user.id)
    return send(res, 200, mine.map(ownedMemorial).sort((a, b) => b.createdAt.localeCompare(a.createdAt))), true
  }

  if (route === 'create') {
    const body = await readJson(req).catch(() => null)
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return invalid(res, { name: 'Enter a name' }), true
    const errors = {}
    const draft = {}
    applyIdentity({ tagline: '', location: '', ...body }, () => true, draft, errors)
    if (Object.keys(errors).length) return invalid(res, errors), true

    const record = {
      id: `m-${nextMemorialNumber++}`,
      ownerId: user.id,
      slug: uniqueSlug(draft.name, memorials.map((existing) => existing.slug)),
      name: draft.name,
      born: draft.born,
      died: draft.died,
      ...(draft.tagline && { tagline: draft.tagline }),
      ...(draft.location && { location: draft.location }),
      biography: '',
      timeline: [],
      photos: [],
      published: false,
      flowers: 0,
      candles: 0,
      createdAt: new Date().toISOString(),
    }
    memorials.push(record)
    return send(res, 201, ownedMemorial(record)), true
  }

  const record = memorials.find((candidate) => candidate.id === params.id && candidate.ownerId === user.id)
  if (!record) return memorialNotFound(res), true

  if (route === 'get') return send(res, 200, ownedMemorial(record)), true

  if (route === 'remove') {
    memorials.splice(memorials.indexOf(record), 1)
    tributesByMemorial.delete(record.id)
    return send(res, 204), true
  }

  if (route === 'update') {
    const body = await readJson(req).catch(() => null)
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return invalid(res, { body: 'Send a JSON object' }), true
    const present = (key) => body[key] !== undefined
    const errors = {}
    const draft = { ...record }
    applyIdentity(body, present, draft, errors)

    if (present('biography')) {
      if (typeof body.biography !== 'string') errors.biography = 'Enter text'
      else if (body.biography.length > BIOGRAPHY_MAX_LENGTH) errors.biography = `Keep it under ${BIOGRAPHY_MAX_LENGTH} characters`
      else draft.biography = body.biography.trim()
    }
    if (present('timeline')) {
      const result = validateTimeline(body.timeline)
      if (result.error) errors.timeline = result.error
      else draft.timeline = result.entries
    }
    if (present('published')) {
      if (typeof body.published === 'boolean') draft.published = body.published
      else errors.published = 'Must be true or false'
    }
    if (present('service')) {
      if (body.service === null) delete draft.service
      else {
        const result = validateService(body.service)
        if (result.error) errors.service = result.error
        else draft.service = result.service
      }
    }
    if (present('portraitId')) {
      if (body.portraitId === null) delete draft.portraitId
      else if (typeof body.portraitId === 'string' && record.photos.some((photo) => photo.id === body.portraitId)) {
        draft.portraitId = body.portraitId
      } else errors.portraitId = 'Choose one of this memorial’s photos'
    }
    if (Object.keys(errors).length) return invalid(res, errors), true

    // id, ownerId, slug, photos, counters and createdAt are never touched. Optional keys may have been cleared.
    for (const key of ['tagline', 'location', 'service', 'portraitId']) delete record[key]
    Object.assign(record, draft)
    return send(res, 200, ownedMemorial(record)), true
  }

  if (route === 'addPhoto') {
    const body = await readJson(req).catch(() => null)
    const dataUrl = typeof body?.dataUrl === 'string' ? body.dataUrl : ''
    const errors = {}
    const photo = {}
    if (!PHOTO_DATA_URL.test(dataUrl)) errors.dataUrl = 'Use a JPEG, PNG, WebP or SVG image'
    else if (dataUrl.length > PHOTO_DATA_URL_MAX_LENGTH) errors.dataUrl = 'The image is too large (about 1.5 MB at most)'
    if (body?.caption !== undefined) applyOptionalText(body.caption, 'caption', CAPTION_MAX_LENGTH, photo, errors)
    if (Object.keys(errors).length) return invalid(res, errors), true
    if (record.photos.length >= MAX_PHOTOS) return problem(res, 422, 'photo_limit', `A memorial holds at most ${MAX_PHOTOS} photos`), true

    const created = { id: `p-${nextPhotoNumber++}`, url: dataUrl, ...photo }
    record.photos.push(created)
    return send(res, 201, created), true
  }

  if (route === 'removePhoto' || route === 'updatePhoto') {
    const photo = record.photos.find((candidate) => candidate.id === params.photoId)
    if (!photo) return problem(res, 404, 'not_found', 'No such photo'), true
    if (route === 'removePhoto') {
      record.photos.splice(record.photos.indexOf(photo), 1)
      if (record.portraitId === photo.id) delete record.portraitId
      return send(res, 204), true
    }
    const body = await readJson(req).catch(() => null)
    const errors = {}
    applyOptionalText(body?.caption, 'caption', CAPTION_MAX_LENGTH, photo, errors) // an empty caption removes it
    if (Object.keys(errors).length) return invalid(res, errors), true
    return send(res, 200, photo), true
  }

  if (route === 'listTributes') {
    const visible = tributesFor(record.id).filter((tribute) => tribute.status !== 'removed')
    return send(res, 200, [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt))), true
  }

  // moderate: removed tributes are gone for good, so they can't be changed again
  const tribute = tributesFor(record.id).find((candidate) => candidate.id === params.tributeId && candidate.status !== 'removed')
  if (!tribute) return problem(res, 404, 'not_found', 'No such tribute'), true
  const body = await readJson(req).catch(() => null)
  if (body?.status !== 'approved' && body?.status !== 'removed') return invalid(res, { status: 'Choose approved or removed' }), true
  tribute.status = body.status
  return send(res, 200, tribute), true
}

// ---- Marketplace orders ------------------------------------------------------------------------------------------

const orderNotFound = (res) => problem(res, 404, 'not_found', 'No such order')

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

// The order lifecycle lives in features/marketplace/order-flow.ts, shared with the browser mock. Reading an order
// brings it up to date with the clock and stores the result.
const currentOrder = (record) => {
  const next = advanceOrder(record, Date.now())
  orderRecords.set(next.id, next)
  return next
}

// Shapes a JSON body into the types the shared validators expect, so a hostile body can never make them throw.
// Anything of the wrong type is reported against its field instead.
function readDelivery(value, errors) {
  const source = isObject(value) ? value : {}
  if (!isObject(value)) errors['delivery.recipientName'] = 'Send the delivery details'
  const text = (key, optional = false) => {
    const field = source[key]
    if (typeof field === 'string') return field
    if (field !== undefined && field !== null) errors[`delivery.${key}`] = 'Enter text'
    return optional ? undefined : ''
  }
  return {
    recipientName: text('recipientName'),
    phone: text('phone'),
    town: text('town'),
    address: text('address'),
    neededBy: text('neededBy', true),
    note: text('note', true),
  }
}

function readPayment(value, errors, prefix = '') {
  const source = isObject(value) ? value : {}
  if (typeof source.ecocashNumber !== 'string' && source.ecocashNumber !== undefined && source.ecocashNumber !== null) {
    errors[`${prefix}ecocashNumber`] = 'Enter the Econet number that has your EcoCash wallet (077 or 078).'
  }
  return {
    method: source.method,
    ...(typeof source.ecocashNumber === 'string' && { ecocashNumber: source.ecocashNumber }),
  }
}

// Keeps only what an order line may carry; a malformed line becomes an empty request that priceLines rejects.
function readLines(value) {
  if (!Array.isArray(value)) return []
  return value.map((raw) => {
    const options = isObject(raw?.options) && Object.values(raw.options).every((choice) => typeof choice === 'string') ? raw.options : null
    return {
      itemId: typeof raw?.itemId === 'string' ? raw.itemId : '',
      options: options ?? { '': '' }, // an option group that no item has, so the line is rejected
      quantity: raw?.quantity,
      ...(typeof raw?.personalisation === 'string' && { personalisation: raw.personalisation }),
    }
  })
}

// Returns true once it has answered the request.
async function handleOrders(req, res, pathname) {
  const { method } = req
  const routes = {
    list: ['GET', '/me/orders'],
    create: ['POST', '/me/orders'],
    get: ['GET', '/me/orders/:id'],
    pay: ['POST', '/me/orders/:id/payment'],
  }
  let route
  let params
  for (const [name, [routeMethod, pattern]] of Object.entries(routes)) {
    params = routeMethod === method ? matchPath(pattern, pathname) : null
    if (params) {
      route = name
      break
    }
  }
  if (!route) return false

  const user = sessionUser(req)
  if (!user) return problem(res, 401, 'unauthenticated', 'Sign in required'), true

  if (route === 'list') {
    const mine = [...orderRecords.values()].filter((record) => record.ownerId === user.id).map(currentOrder)
    return send(res, 200, mine.map(toPublicOrder).sort((a, b) => b.createdAt.localeCompare(a.createdAt))), true
  }

  if (route === 'create') {
    const body = await readJson(req).catch(() => null)
    if (!isObject(body)) return invalid(res, { lines: 'Send a JSON object' }), true

    // Delivery, then payment, then lines. Every section is checked so one response lists everything to fix.
    const errors = {}
    const delivery = readDelivery(body.delivery, errors)
    const payment = readPayment(body.payment, errors, 'payment.')
    if (body.inMemoryOf !== undefined && body.inMemoryOf !== null && typeof body.inMemoryOf !== 'string') errors.inMemoryOf = 'Enter text'
    const deliveryErrors = validateDelivery(delivery)
    const paymentErrors = validatePayment(payment)
    for (const [field, message] of Object.entries(deliveryErrors)) errors[`delivery.${field}`] ??= message
    for (const [field, message] of Object.entries(paymentErrors)) errors[`payment.${field}`] ??= message

    const lines = readLines(body.lines)
    // Pricing reports only the first bad line, as priceLines does. The record is only kept once everything passes.
    const pricing = createOrderRecord({
      ownerId: user.id,
      id: `o-${nextOrderNumber}`,
      reference: `FS-${nextOrderNumber}`,
      input: { lines, delivery: { ...delivery, phone: normalisePhone(delivery.phone) ?? delivery.phone }, payment, inMemoryOf: body.inMemoryOf ?? undefined },
      now: Date.now(),
      simulate: true,
    })
    if (!Array.isArray(body.lines)) errors.lines = 'Send a list of items'
    else if (!pricing.ok) Object.assign(errors, pricing.details)
    if (hasErrors(errors)) return invalid(res, errors), true

    if (!withinLimit(orderHits, user.id, ORDERS_PER_HOUR, HOUR_MS)) return rateLimited(res), true

    nextOrderNumber += 1
    const record = pricing.record
    // The mock has no hosted Paynow page to send the buyer to, so Paynow settles by itself, like EcoCash.
    record.settle.auto = true
    orderRecords.set(record.id, record)
    return send(res, 201, toPublicOrder(record)), true
  }

  const found = orderRecords.get(params.id)
  if (!found || found.ownerId !== user.id) return orderNotFound(res), true

  if (route === 'get') return send(res, 200, toPublicOrder(currentOrder(found))), true

  // pay: start a new payment attempt, after a failure or with a different method
  const body = await readJson(req).catch(() => null)
  const errors = {}
  const payment = readPayment(body, errors)
  Object.assign(errors, validatePayment(payment))
  if (hasErrors(errors)) return invalid(res, errors), true

  const record = currentOrder(found)
  if (record.status !== 'awaiting_payment' && record.status !== 'payment_failed') {
    return problem(res, 409, 'order_not_payable', 'This order is not waiting for payment'), true
  }
  const next = startPayment(record, payment, Date.now())
  next.settle.auto = true // see above: Paynow settles by itself in the mock
  orderRecords.set(next.id, next)
  return send(res, 200, toPublicOrder(next)), true
}

async function handle(req, res) {
  const { pathname, searchParams } = new URL(req.url, 'http://localhost')

  if (pathname === '/__fail') {
    failing = searchParams.get('on') === '1'
    return send(res, 200, { failing })
  }
  if (failing) return problem(res, 503, 'unavailable', 'Service temporarily unavailable')

  if (req.method === 'GET' && pathname === '/plans') return send(res, 200, plans)
  if (req.method === 'GET' && pathname === '/faqs') return send(res, 200, faqs)

  if (req.method === 'GET' && pathname === '/marketplace/items') {
    const category = searchParams.get('category')
    return send(res, 200, category ? marketplaceItems.filter((item) => item.category === category) : marketplaceItems)
  }

  if (req.method === 'GET' && pathname.startsWith('/marketplace/items/')) {
    const params = matchPath('/marketplace/items/:id', pathname)
    const item = params && marketplaceItems.find((candidate) => candidate.id === params.id)
    return item ? send(res, 200, item) : problem(res, 404, 'not_found', 'No such item')
  }

  if (req.method === 'POST' && pathname === '/quote-requests') {
    const body = await readJson(req).catch(() => null)
    const plan = plans.find((candidate) => candidate.id === body?.planId)
    const errors = {}
    if (!plan) errors.planId = 'Unknown plan'
    if (!SERVICE_TYPES.includes(body?.serviceType)) errors.serviceType = 'Unknown service type'
    if (!TOWNS.includes(body?.town)) errors.town = 'Unknown town'
    if (Object.keys(errors).length) return problem(res, 422, 'validation_failed', 'The request is invalid', errors)

    const reference = `QR-${nextReference++}`
    // The server, not the client, decides the total.
    return send(res, 201, { id: reference.toLowerCase(), reference, estimatedTotal: estimateTotal(plan, body.town, body.serviceType) })
  }

  // Memorial routes first: `/me/memorials/...` must never fall through to the generic `/me` handling.
  if ((pathname.startsWith('/memorials/') || pathname.startsWith('/me/memorials')) && (await handleMemorials(req, res, pathname))) return

  // Order routes before the generic /me handling.
  if ((pathname === '/me/orders' || pathname.startsWith('/me/orders/')) && (await handleOrders(req, res, pathname))) return

  if ((pathname.startsWith('/auth/') || pathname === '/me' || pathname.startsWith('/me/')) && (await handleAccount(req, res, pathname))) return

  return problem(res, 404, 'not_found', 'No such endpoint')
}

http
  .createServer((req, res) => {
    setTimeout(() => handle(req, res).catch(() => problem(res, 500, 'internal_error', 'Unexpected error')), LATENCY_MS)
  })
  .listen(PORT, () => {
    console.log(`Mock API listening on http://localhost:${PORT} (latency ${LATENCY_MS}ms)`)
    console.log(`Demo sign-in code for every number: ${DEMO_OTP}`)
    for (const user of demoUsers) console.log(`  ${user.phone}  ${user.name} (${user.role})`)
    console.log(`Memorials: public sample at /memorials/grace-nyathi, owned by +263771234567 (it has one tribute awaiting approval)`)
    console.log(`Marketplace: sign in as +263771234567 to see two seeded orders (FS-1017 delivered, FS-1038 in progress)`)
    console.log(`  An order created through the API walks paid -> confirmed -> in progress -> delivered over about 2.5 minutes`)
    console.log(`  EcoCash 0780000000 is always declined (payment_failed); any other 077 or 078 number pays after about 4 seconds`)
    console.log(`Policies you can link: ${policyRecords.map((record) => record.policy.number).join(', ')}`)
  })
