# UAT Plan — Fidelity Funeral Services

## Environment
- **URL:** https://engaging-blue-deer.172-93-106-10.cpanel.site/
- **Mode:** Mock (sample data; no real backend). Each tester's changes are stored in their own browser only.
- **Build:** Frontend (Vite + React), redeployed 2026-11-11.

## Access
1. Open the URL in a modern browser (Chrome/Edge recommended).
2. Go to **Sign in**.
3. Choose a **demo persona** with one click, or sign in manually with any mobile number + OTP `123456`.
4. To link a policy by hand: policy number `FLA-318227`, ID `08-765432-B-15`.

### Demo personas available
- Policyholder (customer)
- New family (no policy yet)
- Administrator
- Funeral service provider
- Marketplace vendor

> Tip: Use an incognito/private window per persona so sessions don't collide. Clear site data to reset.

## UAT Objectives
- Validate UI/UX, navigation, and responsiveness (desktop + mobile).
- Validate role-based access and permissions in the staff portal.
- Validate marketplace order lifecycle and mock payments.
- Validate memorial creation, publishing, and tributes.
- Validate service requests lifecycle (received → complete).
- Confirm no console errors and acceptable performance.

## Test Scenarios by Role

### A. Public visitor (no sign-in)
1. Landing page loads; hero, plans, cemeteries sections visible.
2. Compare Essential / Comfort / Legacy plans; request a quote.
3. Search cemeteries by town; send a grave enquiry.
4. Repatriation overview and documents.
5. Create a memorial: story + photos; keep private, then publish; share link.
6. Visitor (separate browser) opens shared memorial; leaves flowers, candle, tribute; family moderates tribute.
7. Marketplace: browse products, add to basket, checkout; EcoCash 077/078 numbers approve, `078 000 0000` declines; Paynow shows stand-in page.
8. Aftercare guidance and AI suggestions.

### B. Policyholder (customer account)
1. Sign in via demo persona.
2. Link policy `FLA-318227` / `08-765432-B-15`; view covered members and amounts.
3. Raise a request ("a loved one has passed away", "make a claim"); choose contact method (call/WhatsApp/SMS); track received → complete.
4. Manage memorials (edit story, photos, sharing).
5. Update profile.

### C. Administrator (staff portal `/provider-portal`)
1. View all families and requests; urgent unassigned bereavements at top.
2. Assign a request to a funeral provider.
3. Follow orders; look up any customer.
4. Add / switch off a provider (stops new requests and hides products).
5. Read activity log (append-only).
6. Coordinate orders shared with multiple vendors.

### D. Funeral provider
1. See only assigned requests; accept / decline / complete.
2. Family sees progress but not internal notes.
3. Orders view limited to handed-over items.

### E. Marketplace vendor
1. See only orders containing their products.
2. Confirm, prepare, deliver.
3. Coordinated (multi-vendor) orders managed by admin.

## Acceptance Criteria
- No blocking console errors on any page.
- All role-restricted actions hidden/unavailable to wrong roles.
- Order lifecycle reaches `delivered` via mock payment.
- Memorial publish/share/tribute moderation works end-to-end.
- Responsive layout usable on mobile (≤ 375px) and tablet.
- Lighthouse/Performance acceptable (no >5s blank screens).

## Known Limitations (mock mode)
- Data is sample only; no real SMS/WhatsApp/email sent (alerts logged).
- No shared state between testers or browsers.
- Mock payments only; no real gateway credentials.
- Demo personas bypass real OTP/auth.

## Defect Reporting Template
- **Tester / role:**
- **Date & browser:**
- **Page / route:**
- **Steps to reproduce:**
- **Expected vs actual:**
- **Screenshot / console error:**
- **Severity:** Blocker / Major / Minor / Cosmetic

## Live backend (optional)
The current UAT build runs in mock mode. Switching to the live API requires:
- A PostgreSQL database (cPanel here exposes MySQL only; Postgres module unavailable).
- Deploying the `backend/` (Express + Prisma) and setting `VITE_API_MODE=live` + `VITE_API_BASE_URL` at build time.
- Recommendation: host the backend on a Postgres-capable platform (Render/Railway/VPS) and point the frontend build to it, or run UAT on mock mode for UI/flow validation.

## Sign-off
- [ ] Public visitor flows
- [ ] Policyholder flows
- [ ] Administrator flows
- [ ] Provider flows
- [ ] Vendor flows
- [ ] Mobile/responsive
- [ ] Performance

Signed off by: ____________  Date: ____________
