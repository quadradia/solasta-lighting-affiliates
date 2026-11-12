# Solasta Affiliate Portal

The portal for Solasta affiliates at **affiliates.mysolasta.com**. Approved affiliates sign in, get their referral link and QR code, make a tracked link for each place they post, tell us where they posted ("I posted it") so staff can approve the 10 Bucks, and see their Solasta Bucks ledger. English and Spanish.

Built from the same setup as the admin app (`solasta-lighting-admin`): React 19 + TypeScript + Vite, Tailwind v4 with shadcn/ui primitives, React Router, TanStack Query, and `oidc-client-ts` / `react-oidc-context` for sign-in. Phone first.

## How it fits together

| Piece | Repo | Role |
|---|---|---|
| This app | `solasta-lighting-affiliates` | Browser SPA, no secrets, no server code |
| Identity Server | `NOAHIdentityServer` | Affiliates sign in on its `/Account/Login` page (Authorization Code + PKCE, public client `affiliate-portal`, scopes `openid profile email affiliate offline_access`) |
| Solasta API | `solasta-lighting-est-api` | `api/affiliate/...`, all require the `Affiliate` policy (role `affiliate` + scope `affiliate`). The API finds the affiliate from the token, never from the request |
| Admin app | `solasta-lighting-admin` | Staff approve applications; approval invites the person here |
| Database | `Solasta_Database` | `AFL.Affiliates`, `AFL.AffiliateCampaigns`, `AFL.CampaignPlacements`, `AFL.BucksTransactions` |

How someone gets in: they apply on mysolasta.com, staff approve them in the admin app, the API asks the Identity Server to invite them with the `affiliate` role, and they get an email to set their password. The set-password page's Sign in button brings them here.

## Run locally

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5174` (fixed: it is part of the registered redirect URI; the admin app uses 5173). `.env.development` points at `https://identity-dev.nuvol9.com` and `https://solasta-api-dev.nuvol9.com`. To use other servers, copy `.env.example` to `.env.local` and edit it.

Before the first sign-in:

1. Apply `20261112_0130_ConfigureAffiliatePortalClient.sql` in NOAHIdentityServer (`Database/Scripts/Apply-Migrations.ps1`).
2. Approve an application in the admin app (or call `POST api/affiliates/{proxy}/invite`) so a login with the `affiliate` role exists and is linked to the affiliate.
3. The API must allow this origin in `Cors:AllowedOrigins` (already set for `localhost:5174` in its `appsettings.Development.json`).

A signed-in user without the `affiliate` role sees a page explaining the portal, with a link to apply.

## Test and build

```bash
npm test
npm run build
```

Tests use Vitest + Testing Library with `fetch` and the OIDC layer mocked; they never call real servers.

## Deploy

Cloudflare Workers static assets (`wrangler.jsonc`), at `affiliates.mysolasta.com`:

```bash
npm run build
npx wrangler deploy
```

`.env.production` holds the production Identity Server and API URLs. **Confirm those hosts before the first deploy.**

## Layout

```
src/
  i18n/           English and Spanish messages, LanguageProvider, translate()
  lib/            config, auth (UserManager, affiliate role), api (apiFetch + DSM envelope), format
  components/     ui/ primitives, layout (sidebar + phone tab bar), RequireAffiliate, CopyField, ErrorPanel
  features/
    portal/       home, share & earn (campaigns, links, "I posted it"), earnings, profile
    branding/     tenant accent color and logo (read only)
  pages/          callback, not found
```
