# Development notes

How the Fidelity Funeral Services prototype is built. For what the app does, see the [README](../README.md).

```bash
npm run dev      # start the dev server
npm run build    # type-check and build
npm run lint     # oxlint
npm test         # vitest (unit tests)
```

## API modes

With `VITE_API_MODE=live` the screens talk to the API in [`openapi.yaml`](openapi.yaml); `npm run mock-api` is a reference server for it (see [`backend-integration.md`](backend-integration.md)). The demo personas are hidden in live mode.

Feature layout: `features/auth` is the session (types, API calls, route guard, hooks), `features/account` is the customer's policy and requests, `features/memorials` is the public memorial pages and the owner's editor, and `features/marketplace` is the shop, basket, checkout and orders. Other features import each other only through their `index.ts` (for example `@/features/auth`).

### Marketplace and orders

- **Server-authoritative prices.** The browser sends choices (item, options, quantity, wording), never prices. `pricing.ts` is the one place prices are worked out; the basket and checkout use it for a preview, and the server (or the mock) recomputes the real total when the order is placed.
- **Shared, pure logic.** `pricing.ts`, `validation.ts`, `order-flow.ts` and `seed` data import only relative `.ts` files, so `scripts/mock-api.mjs` loads them straight from `src/` under Node and the browser mock and the reference server cannot drift apart.
- **Order lifecycle.** `order-flow.ts` moves an order from `awaiting_payment` to `paid`, `confirmed`, `in_progress` and `delivered`, or to `payment_failed` and back. Time is passed in, so it is easy to test. The page polls an order while its payment is pending or it is in progress.
- **Mock payments.** In mock mode any 077 or 078 EcoCash number is approved after a few seconds, `078 000 0000` is always declined, and Paynow shows a stand-in for its hosted page. A real integration needs gateway credentials, signed webhooks and idempotency keys (see `backend-integration.md`).
- **Basket.** `cart.ts` is a small external store backed by `localStorage`, read through `useSyncExternalStore`, so the header button, the drawer and product pages share it without a provider.


## Code structure

```text
src/
  app/          App shell: router, route effects (scroll, title), error boundary, 404
  components/   Shared, feature-agnostic UI (layout/ = header, footer, shells; ui/ = small widgets)
  config/       Site-wide constants: route paths, navigation, titles
  features/     One folder per product area. Each owns its components, data, logic and CSS
  lib/          Pure helpers (formatting)
  styles/       Design system: tokens, base, layout, shared components
```

- Import across folders with the `@/` alias (`@/components/ui/Section`); use `./` only within a folder.
- Features don't reach into each other's internals (only `features/home` composes the other features' section components into the page). Shared pieces move up into `components/`.
- Data and business logic (`data.ts`, `pricing.ts`, `api.ts`) stay out of components so they can be tested and replaced. `features/plans/api.ts` is the seam for a real quote endpoint.
- The provider portal and the customer account pages are lazy-loaded routes.

## Design system

CSS is organised in cascade layers, declared once in `src/index.css`:

```text
tokens → base → layout → components → features
```

A later layer always beats an earlier one, so there are no specificity fights and file import order does not matter.

| Layer | Where | Contains |
| --- | --- | --- |
| `tokens` | `styles/tokens.css` | Palette and semantic tokens, spacing, type, radius, shadow, motion, z-index |
| `base` | `styles/base.css` | Reset, typography, `.container`, `.section`, `.stack`, `.muted` |
| `layout` | `styles/layout.css` | Header, mobile drawer, footer |
| `components` | `styles/components.css` | `.btn`, `.badge`, `.card`, `.icon-tile`, `.split`, `.grid`, forms, chip, accordion, stat card, toast |
| `features` | `features/*/*.css` | Styles specific to one feature, imported by that feature's components |

Rules:

1. **Components use semantic tokens only** (`--color-accent`, `--color-surface`, `--space-4`), never palette values (`--red-500`) and never raw hex/px colours. To re-theme, change the semantic tier in `tokens.css`.
2. **Reuse a primitive before writing a new class.** A card is `card` plus modifiers (`card--interactive`, `stack`), not a new bespoke block. Feature CSS only adds what is genuinely unique.
3. **Vary a primitive with custom properties**, e.g. `--card-pad`, `--stack-gap`, `--outline-color`, rather than overriding its rules.
4. Anchored sections get `scroll-margin-top` from the header height token, so new `id`s need no extra work.
5. Class names are BEM-style (`block__element--modifier`); one block per component.
