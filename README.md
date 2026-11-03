# Fidelity Funeral Services – frontend prototype

React 19 + TypeScript + Vite prototype of a funeral-services site: plans and quotes, memorials, marketplace, FAQ and a provider portal concept. All content is sample data.

```bash
npm run dev      # start the dev server
npm run build    # type-check and build
npm run lint     # oxlint
npm test         # vitest (unit tests)
```

## Customer accounts and demo mode

Customers sign in with their mobile number and a one-time code (`/login`, `/signup`), optionally link an existing policy, and land in `/account`: overview, policy, requests and profile. The provider portal (`/provider-portal`) now needs a provider, staff or admin sign-in.

In the default `mock` mode everything runs in the browser, and `/login` shows **demo personas** for one-click sign-in (a policyholder, a new family and provider staff). The one-time code is always `123456`. To link a policy by hand, use `FLA-318227` with ID `08-765432-B-15`. Accounts, links and requests are kept in `localStorage`.

With `VITE_API_MODE=live` the same screens talk to the API in [`docs/openapi.yaml`](docs/openapi.yaml); `npm run mock-api` is a reference server for it (see [`docs/backend-integration.md`](docs/backend-integration.md)). The personas are hidden in live mode.

Feature layout: `features/auth` is the session (types, API calls, route guard, hooks) and `features/account` is everything a signed-in customer sees. Other features import auth through `@/features/auth`.

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
