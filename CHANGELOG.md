# Changelog

What changed in the front end (`frontend/`), newest first. The app runs on sample data by default, so every item below works without a backend. Where a change touches the API, the contract is in `frontend/docs/openapi.yaml` and a reference server is `npm run mock-api`.

## SMS and WhatsApp alerts

**Added (front end, simulated)**
- `/account/alerts` ("Alerts" in the account navigation): choose which updates arrive by SMS or WhatsApp. Everything is off until switched on. An outbox shows exactly what would be sent, to whom, and why anything was blocked (not opted in, no consent, STOP, duplicate, invalid number). A "Simulate STOP" button shows opt-out working.
- Triggers: help request received, assigned, accepted, declined and completed (sent on the contact preference chosen on the request); procession sharing started and stopped and the funeral stream going live (to invited relatives who gave a number and agreed); aftercare thank-yous and anniversary reminders (7 and 1 days before); order paid, confirmed, delivered and payment failed; premium due (3 days before).
- Non-urgent messages are held between 21:00 and 06:00 Harare time. Funeral-day messages are not.
- Numbers outside Zimbabwe are accepted with a `+` country code, so relatives abroad can be messaged. Add a number after a name in the thank-you form, or beside a relative in the procession form.
- The dead "Set reminder (sample)" button on a scheduled stream now links to the alert settings.
- Shona and Ndebele wording is not written yet; those recipients receive English until a native speaker supplies it (`features/alerts/templates.ts`).

**Added (staff portal)**
- `/provider-portal/messaging` ("Messaging", admin only): pair the company WhatsApp number by QR code or pairing code, reconnect or disconnect it, switch WhatsApp sending on or off, and choose and test the SMS provider. In demonstration mode a "Simulate scan" button stands in for the phone.

**Added (backend, off by default), ported from the Kuwana architecture**
- Three processes: the API, a pg-boss worker (`src/worker.ts`, sends SMS), and a Baileys WhatsApp bridge (`src/whatsapp/bridge.ts`, bundled to `dist-whatsapp/bridge.mjs`) that holds one company-owned WhatsApp session, consumes the `send-whatsapp` queue and exposes a localhost control server. `backend/ecosystem.config.cjs` runs all three under pm2; run exactly one bridge.
- One entry point, `deliverAlert` (`src/alerts/deliver.ts`): phone, STOP, consent, dedupe and quiet-hours rules, then an `AlertOutbox` row and a pg-boss job. Both consumers share `processOutboxJob`, which never sends a message twice and retries through the queue.
- SMS through Africa's Talking, then Twilio, then a log fallback, using the provider the admin chose (provider and sender ID live in the database, API keys only in the environment). Delivery receipts update the outbox from Africa's Talking, Twilio (signature checked) and WhatsApp (Baileys receipts).
- STOP and START replies on WhatsApp opt the number out or back in. WhatsApp sends are paced with a minimum gap and jitter, and the master switch is checked on every send.
- Prisma: `AlertOutbox`, `AlertPreference`, `AlertOptOut`, `WhatsAppConnection`, `WhatsAppEvent`, `AppSetting`, with the first migration in `backend/prisma/migrations`. Prisma 7 now connects through `@prisma/adapter-pg`.
- Admin API under `/api/admin` (WhatsApp session, master switch, SMS settings and test, events, 24-hour stats). `ALERTS_ENABLED` is false and `ALERTS_MODE` is `log` by default, so nothing is sent until configured. See `backend/.env.example`.
- Templates are written once in the frontend and copied into the backend with `npm run sync:alerts`; a backend test fails if they drift.
- Fixes over Kuwana: constant-time bridge secret check, saved SMS settings are actually used by the sender, provider message ids are recorded, and STOP is honoured.

**Not done yet**
- Backend authentication does not exist, so `/api/alerts/*` and `/api/admin/*` use an interim shared token (`ALERTS_API_TOKEN`). The front end cannot send that token, so live mode for the Alerts page and the Messaging page is not usable until staff authentication is added (and `/alerts/state` needs the signed-in user instead of a `userId` query). The reference mock server (`scripts/mock-api.mjs`) does not implement alerts.
- Server-side cron for reminders and premium-due alerts needs aftercare and policy data moved off the browser first.
- Baileys is an unofficial WhatsApp client: it can break when WhatsApp changes and the number can be banned. Use a dedicated number, keep volumes low, send only to opted-in people, and rely on SMS as the fallback. Sender IDs must be registered for SMS. WhatsApp messages go out as ordinary text, so there are no template approvals to obtain.
- Delivery receipts for WhatsApp depend on Baileys events and have only been unit-tested; pairing a real number and sending a real message have not been tried.
- BRD section 3.2 excludes real-time messaging from the prototype; update the BRD to reflect this change.

## Grief support assistant (BRD 6.4)

**Added**
- A public `/support-assistant` page with a chat of pre-written answers: first steps after a death (linking to the estate checklist), journaling prompts, remembrance ideas, finding counselling, difficult dates, talking to children, and common grief feelings. Suggested questions and a clear-conversation button are included.
- Safety and honesty come first: anything suggesting self-harm is answered with a message pointing to emergency services and human help, and questions about what it is (or whether it is the deceased) get a plain answer that it is a program, not a person, counsellor or therapist.
- The page is labelled as a scripted demonstration, not AI; no AI service is called and nothing typed is sent or saved. Linked from the home page's support section and the footer.

## Funeral day: schedule, directions and procession sharing (BRD 6.11)

**Added**
- `/account/funeral-day`: the day's programme (departure, service, burial) with times, addresses and directions.
- Simulated procession sharing: the family invites relatives, ticks a consent box, picks 30, 60 or 120 minutes and starts sharing. Invited relatives see a route tracker with simulated movement, and the family can stop it at any time; it also ends on its own when the time is up.
- The page never reads a device's location and says clearly that the venues and movement are fictional.

## Aftercare (BRD 6.9)

**Added**
- `/account/aftercare`: write thank-you messages to mourners from an editable template (saved as sent; nothing is delivered), set yearly anniversary and memorial reminders that show the next date and a countdown, and read follow-up support information with links to memorials and the estate checklist.
- An "Aftercare" entry in the account navigation. The page is labelled as a demonstration and stores data in the browser only.

## Estate support (BRD 6.10)

**Added**
- `/account/estate`: a post-death checklist grouped by stage with a progress bar, a document list, appointments, and estate contacts. Users can add their own tasks and reset the list. It is saved in the browser only and states plainly that it is organisational help, not legal advice.
- An "Estate" entry in the account navigation.

## Cemetery and grave search (BRD 6.1)

**Added**
- A public `/cemeteries` page: search sample cemeteries by town or area, see published plot price guidance, availability, opening hours, contact details and directions, and send a plot enquiry (stored in the browser only).
- Grave search by name and optional year of death, showing section and plot, with records the operator has not verified clearly flagged.
- Links from the home page's cemetery card and the footer. All data is fictional and labelled as a demonstration.

## Brand and landing page polish

**Added**
- A hero led by a photograph of mourners resting their hands on a coffin with white flowers: large, bleeding off the right edge and fading softly into the page, over an original dusk backdrop. If the photo fails to load, the hero is just the headline.
- A transparent, adaptive header on the public pages: it sits over the hero with white text, and switches to dark text, the colour logo and a frosted background when the section behind it is light (sections declare `data-header-tone="dark"`; light is the default). Dark heroes slide up under it. The signed-in areas keep their solid header.
- Fixed the mobile menu breaking once the page had scrolled: the header's frosted blur made the open drawer position itself inside the header. The menu no longer covers the page at all.
- The header no longer lists page links (Services, Plans, Marketplace, Memorials, Support); only the logo and the Sign in, Request a quote and basket buttons remain, in the same positions. On small screens the Menu button opens a small card under the button (closes on an outside click or Escape) instead of a full-screen panel.
- A "Visit or call us" section with a photograph of Fidelity House, the head office, and the company's address, phone and email.
- An About page (`/about`) with Fidelity Life's own vision, mission and core values, linked from the footer, and the company's published contact details in the footer.
- Four quick paths along the bottom of the hero (help now, plans, remembrance, marketplace).
- A slim, dismissible "demonstration prototype" notice, replacing the badge that sat in the hero.
- Fade-and-lift on scroll for sections (`Reveal`), switched off for people who prefer reduced motion. The header now turns translucent and slightly shorter once you scroll.
- `docs/brand-assets.md` listing the files to supply and the guidance for the hero photograph.

**Changed**
- The logo: the company's real scales mark (from its website) with the name set as live text, one component for the header, footer and sign-in panel, and its site icon as the favicon. No more hotlinked Google image, cropped logo box or duplicated company name.
- "Where would you like to start?" is a bento layout with a featured "someone has passed away" tile, and its emoji icons are now the app's stroke icons. Each tile links to its own section.
- "What we arrange" is an editorial numbered list instead of six identical cards.
- The hero has no bottom bar of quick links any more, more breathing room above and below, and layered light and shade (glows, a vignette, a soft shadow into the next section, shadow behind the headline and button);
- Hero copy and headline (one italic accent word); the stray horizontal streaks behind the hero photo are gone; gold rule on section eyebrows; favicon is the scales mark.

**Removed**
- The default Vite favicon and the old hand-drawn logo file.
- The page-load fade wrapper around every home section and the stray unlayered `.brand` rules in `components.css` (replaced by the scroll reveal and the new brand styles).

## Phase 4: staff portal (uncommitted at the time of writing)

**Added**
- A staff portal at `/provider-portal` with an overview, requests, orders, customers, providers and an activity log. It replaces the old stat-card stub.
- Three roles with different views: **administrator** (everything), **funeral provider** (only requests handed to them) and **marketplace vendor** (only orders with their products).
- Assigning a request to a funeral service provider. Providers accept, decline or complete it; families see the progress. An internal note from the administrator is never shown to the family.
- Moving orders along (confirm, start preparing, deliver, cancel). A provider can only manage orders that are wholly theirs; shared orders are coordinated by an administrator.
- A provider directory: add a provider, or switch one off. A switched-off provider gets no new requests and its products disappear from the marketplace.
- An append-only activity log of every change made in the portal.
- Demo sign-ins for an administrator, a funeral provider and a marketplace vendor, plus six more demo customers so the tables have something in them.
- API: `/admin/*` endpoints (overview, requests and assignments, orders, customers, providers, activity), role rules, and a mapping to the backend's Prisma models in `docs/backend-integration.md`.

**Changed**
- Every signed-in area now shares one frame (`AppShell`). The mobile tab bar adapts to the number of items.
- A request now carries an optional `assignment`; orders can be moved by people as well as by the demo timer.
- The no-access page is generic ("This page isn't available to your account").
- The footer link "Provider concept" is now "Staff portal".

**Fixed**
- A vendor's overview listed an order shared with another vendor as "ready to confirm" although they could not act on it.

## Phase 3: marketplace and orders

**Added**
- `/marketplace` with category filters, search and sorting, and product pages with options (material, size, quantity), personal wording and a live price.
- A slide-in basket that survives reloads and signing in.
- Checkout with delivery details and EcoCash or Paynow (both simulated).
- Orders: payment states (waiting for the EcoCash prompt, a stand-in for Paynow's page, retry after a failure) and tracking from paid to delivered, with a history.
- "Send flowers" and "order a remembrance plaque" links from a memorial, which prefill the card message and mark the order as in memory of that person.
- An Orders entry in the account and an Orders card on the dashboard.
- Prices are always worked out by the server; the browser only sends choices. The order lifecycle is shared by the browser mock and the reference server.

**Changed**
- The home page's marketplace section uses the new product cards and links to the full marketplace.

## Phase 2: memorials

**Added**
- Public memorial pages at `/memorials/<slug>`: portrait or initials, life story, timeline, photo gallery with a full-screen viewer, service details, share buttons, flowers and candles, and a tribute wall.
- An owner's editor in the account: details, story and timeline, photos (resized in the browser), tribute moderation, sharing and publishing. A memorial stays private until published.
- Tributes from visitors wait for the family's approval. Unpublished memorials are visible to their owner only.
- A sample memorial at `/memorials/grace-nyathi` and a Memorials card on the dashboard.

**Changed**
- Shared page styles moved to `src/styles/app-screens.css`; page titles follow the route, including dynamic ones.

## Phase 1: accounts and customer dashboard

**Added**
- Sign in and sign up with a mobile number and a one-time code (`123456` in demo mode), with one-click demo personas.
- Optional policy linking, and an `/account` area: overview, policy, requests and profile.
- Route guards (`RequireAuth`) with a safe return to where the person was headed.
- A warmer, gold-accented design: new tokens, an icon set, skeleton loaders, status chips, a progress ring.
- API contract for accounts, and a reference server with cookie sessions.

**Changed**
- The provider area now needs a sign-in.

## Before the phases

- A feature-based architecture with real routing, and the API, mock and query layers.
- The original landing-page prototype.
