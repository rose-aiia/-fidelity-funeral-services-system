// Reference implementation of the API contract in docs/openapi.yaml, backed by the app's own sample data.
// Run it with `npm run mock-api`, then start the app against it with VITE_API_MODE=live.
// Needs Node 22.18+ (it imports the app's .ts data, pricing and account modules directly).
//
// Accounts: sign in with a demo phone number (listed at startup) and the code 123456. Sessions, users, policy
// links and requests live in memory and reset when the server restarts.
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

let failing = false
let nextReference = 1001
let nextRequestNumber = 1043 // the seeded demo request is AR-1042
let nextUserNumber = 1

// Accounts, all in memory.
const users = new Map(demoUsers.map((user) => [user.phone, { ...user }])) // phone -> User
const sessions = new Map() // sid -> user id
const policyLinks = new Map(Object.entries(demoPolicyLinks)) // user id -> policy number
const requestsByUser = new Map() // user id -> AssistanceRequest[]
const codeFailures = new Map() // phone -> failed code attempts
const linkFailures = new Map() // user id -> failed policy-link attempts

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
    console.log(`Policies you can link: ${policyRecords.map((record) => record.policy.number).join(', ')}`)
  })
