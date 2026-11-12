# Agent notes

Affiliate portal SPA for Solasta Lighting. Read `README.md` first.

## Rules

- No secrets in this repo. Every `VITE_*` value ships in the browser bundle. The OIDC client is public (PKCE); never add a client secret or switch to the password grant.
- Tokens stay in `sessionStorage` (configured in `src/lib/auth.ts`). Do not move them to `localStorage`.
- All API calls go through `apiFetch` in `src/lib/api.ts`, which adds the bearer token and unwraps the API's DSM envelope (`{ code, message, validationErrors, payload }`).
- Never send an affiliate id or proxy to `api/affiliate/...`. The API resolves the affiliate from the token; that is the security boundary.
- Every visible string goes through `t('key')` from `useI18n()` (or `translate()` outside React), with the key in both `en` and `es` in `src/i18n/messages.ts`. A test fails when a key or placeholder is missing in Spanish.
- Design phone first: check new screens at 390px wide. The bottom tab bar covers the last 80px, so pages keep `pb-24`.
- UI primitives in `src/components/ui` follow shadcn/ui (new-york style) and the theme in `src/main.css` matches the public website. Icons come from `@phosphor-icons/react`.

## Commands

- `npm run dev`: port 5174 (fixed; part of the registered redirect URI)
- `npm test`: Vitest
- `npm run build`: typecheck + production build

## API contract used here

| Call | Purpose |
|---|---|
| `GET api/affiliate/me` / `PUT { phoneMobile }` | Profile, referral link, Bucks summary |
| `GET api/affiliate/me/bucks?page=&pageSize=` | Ledger, newest first, with balance |
| `GET api/affiliate/me/campaigns` / `POST { name, description }` | Campaigns with their tracked links |
| `POST api/affiliate/me/campaigns/{id}/placements { platformCode }` | Tracked link for a platform (repeat returns the same one) |
| `PUT api/affiliate/me/placements/{token}/post { postUrl }` | "I posted it" |
| `GET api/affiliate/platforms` | Platforms |
| `GET api/tenant/branding` (+ `/logo`) | Accent color and logo |

Types for these responses live in `src/features/portal/api.ts`.
