# UAT Results — Fidelity Funeral Services

**Run date:** 2026-11-12
**Executed by:** Claude (automated, headless Chromium via Playwright)
**Build under test:** local dev server of branch `claude/dreamy-curie-8il8l8` (same code as `main`), mock mode. The deployed URL in `UAT_PLAN.md` was not tested.
**Scope:** automated checks against `UAT_PLAN.md`. This is not a human sign-off and not a visual or accessibility review.

## Summary

| Result | Count |
| --- | --- |
| Pass | 17 |
| Pass with note | 3 |
| Not run | 8 |
| Fail | 0 |

Also: 178 of 178 unit tests pass (vitest, 15 files). No console or page errors on any of 69 route visits across all personas.

## Results by plan section

| # | Scenario | Result | Evidence / notes |
| --- | --- | --- | --- |
| A1 | Landing page loads: hero, plans, cemeteries | Pass | All public routes load without errors. |
| A2 | Compare plans, request a quote | Pass with note | Submit shows "Sample enquiry submitted (reference SAMPLE-xxxx)". The confirmation is a short-lived toast and is gone after a few seconds. Submitting with no name still succeeds. |
| A3 | Search cemeteries by town | Pass | "Bulawayo" narrows the list to 1 of 4. |
| A3 | Send a grave or plot enquiry | Not run | Form opens; submit and confirmation were not verified. |
| A3 | Grave records search | Not run | Control present; not exercised. |
| A4 | Repatriation overview and documents | Not run | Not exercised. |
| A5 | Create memorial, keep private, publish, share link | Pass with note | Created as "Private draft", then published, and the share link `/memorials/uat-test-memorial` appeared. Note: a memorial at 0% complete (no story or photo) can be published with no warning or block. |
| A6 | Visitor opens shared memorial; flowers, candle, tribute; family moderates | Not run | Needs a second browser profile; not executed. Mock data is per-browser, so this must be run by hand. |
| A7 | Marketplace: add to basket, checkout | Pass | Order placed. |
| A7 | EcoCash 077/078 approves | Pass | Awaiting payment, then Paid automatically. |
| A7 | EcoCash `078 000 0000` declines | Pass | "Payment failed: Insufficient funds…", order kept for retry. |
| A7 | Paynow stand-in page | Pass | "Paynow secure checkout (Demo)" page shown. |
| A8 | Aftercare guidance and AI suggestions | Not run | Page loads without errors; content not exercised. |
| B1–2 | Policyholder: link policy `FLA-318227` / `08-765432-B-15` | Pass | Policy linked: Essential, US$4,200, beneficiary shown. Tested as the "New family" persona. |
| B3 | Raise request, choose channel, track | Pass | Bereavement request created with reference. Status moves received to complete. |
| B3 | Contact method selection | Pass with note | The WhatsApp option never reached a stable state for the click (Playwright "element is not stable"). A forced click worked. Likely an animation or overlay; please check by hand. |
| B4–5 | Manage memorials, update profile | Not run | Profile and memorials pages load; edits not exercised. |
| C1 | Admin sees all requests; urgent unassigned at top | Pass | Urgent items sort first, and the new bereavement appears at the top. |
| C2 | Assign request to a provider (with private note) | Pass | Status changes to Assigned. |
| C4 | Switch off a provider | Not run | Provider drawer actions not located in the run. |
| C5 | Activity log | Pass | Assign, accept and complete entries recorded, newest first. |
| C-access | Admin-only pages | Pass | Provider and vendor see no content on Customers, Providers, Activity and Messaging. Policyholder sees a near-empty page (no data) on every staff route. |
| D1 | Provider accepts and completes | Pass | The family sees Complete. |
| D2 | Family never sees internal note | Pass | Note visible to the provider, absent from the customer view. |
| D3 | Provider orders limited | Pass | Funeral provider sees no marketplace orders. |
| E1–3 | Vendor sees own orders; confirm, prepare, deliver | Pass | Confirm order, Start preparing, Mark delivered reached Delivered. Customer sees the same steps with timestamps. |
| — | Mobile 375px and tablet 768px | Pass | No horizontal overflow on /, /cemeteries, /marketplace, product page, /login. |
| — | Performance | Not run | No Lighthouse run; no blank screens observed. |

## Observations to review (none blocking)

1. **Request assignment list is unfiltered.** The admin can hand a bereavement request to any directory entry, including a florist or printer.
2. **Publishing an empty memorial is allowed.** Consider a completeness gate or confirmation.
3. **Quote confirmation is transient.** The reference number is easy to miss.
4. **Contact method radio (WhatsApp)** failed Playwright's stability check; confirm there is no flicker or overlay.
5. **Detail drawers stay open after an action** (for example after Assign) and block the header controls until closed. Likely intended.

## Not covered by this run

Deployed URL; cross-browser; separate-browser memorial visitor and tribute moderation; provider switch-off; accessibility; performance audit; real payments, alerts and backend (live mode).

## Sign-off

- [ ] Public visitor flows (partial)
- [ ] Policyholder flows (partial)
- [x] Administrator flows (assign, activity log, access checked)
- [x] Provider flows
- [x] Vendor flows
- [x] Mobile/responsive (automated overflow check only)
- [ ] Performance

Human sign-off: ____________  Date: ____________
