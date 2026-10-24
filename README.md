# Digvation Content Studio

A frontend-only, multi-client content dashboard built with React, TypeScript, Vite and Tailwind CSS. Vireo's public demo is the visual reference for the white sidebar, soft cards, spacing and theme controls. The default accent is blue; six accents and light/dark mode are available.

## Run

Use Node.js 22.19 or newer.

    npm ci
    npm run dev

Open the address printed by Vite. The development server uses port 3000.

    npm test
    npm run build
    npm run preview

The production build is in dist/. Static hosting needs an SPA fallback to index.html; public/_redirects supplies that rule for Cloudflare Pages.

## Demo accounts

All three accounts use the example password demo123. The account shortcuts on the login screen fill the form.

| Account | Email | Access |
| --- | --- | --- |
| Digvation operator | admin@digvation.test | Both websites |
| Poseidon client | owner@poseidon.test | Poseidon only |
| Arunika client | owner@arunika.test | Arunika only |

These are fictional frontend fixtures, not CORE users or real credentials.

## Two different website contracts

Poseidon starts with the existing six public JSON documents: 102 products, 3 articles, 34 gallery images, company content and FAQs. Representative editable fields are registered for home, products, articles, gallery, about, FAQs and contact/global content. The full documents are preserved while only the registered field paths are edited.

Arunika Studio is a fictional newly registered architecture website. Its setup flow introduces its contract, then opens the first content editor. Its content modules are home, services, projects, team and contact. The illustration in public/demo/ is original demo artwork.

The two JSON contracts are defined in src/data/contracts.json and typed by src/domain/types.ts. A contract describes sections, fields, field types, required values, choices and document paths. Client users can manage content records; they cannot create field definitions or change page layout. New supported field types require a renderer; registering another website with existing field types is configuration.

## What works in this frontend

- Mock login, logout, website access restrictions and workspace switching.
- New-client setup and an empty-state-to-first-record flow.
- Search, sorting, pagination, visibility filtering and table/card views.
- Contract-driven editors, product specifications, image selection and sanitized article previews.
- Browser-local drafts, record creation/deletion, demo publications, immutable version snapshots, draft restoration and JSON download.
- Media selection, image URL registration and local JPG/PNG/WebP uploads up to 2 MB.
- Theme accents and light/dark preferences.
- Official supplied Digvation logo on the login, sidebar and favicon.
- Per-website traffic and Google Ads / Meta Ads campaign monitoring UI, with 7/30/90-day filters, daily visitor charts, channels, popular pages, devices, campaign filters and details. All analytics numbers are explicitly synthetic; the new-client workspace starts empty.
- Responsive navigation and editors, keyboard search, native modal focus handling and unsaved-edit navigation protection.

Demo changes are stored in this browser's localStorage. Storage denial/quota does not block the current session. The operator can reset both demo websites from Settings → Account & access. Media uploads and publication never contact production R2 or the live client websites.

## CORE integration boundary

src/domain/types.ts exports ContentGateway, the interface consumed by the frontend. src/domain/gateway.ts is its browser-local mock implementation. src/state/Studio.tsx owns the current session/workspace and coordinates mutations.

Replace the mock gateway with an implementation backed by verified CORE authentication and content-editor contracts. The interface describes frontend needs; it does not claim those endpoints already exist. Production must enforce user membership, website ownership/access, registered field paths, schema validation, media permissions and publication authorization in the backend. Browser-side filtering and mock credentials are not a production security boundary.

R2 credentials and CORE secrets do not belong in this frontend. Backend integration, real account management, real uploads/publication and deployment automation are outside this phase.

### Traffic and advertising integration

`ContentGateway.getAnalytics(websiteId, period)` is the read-only integration boundary. Its mock supplies sample Poseidon traffic and promotional campaigns, not AdSense revenue. Source status is explicitly "not connected". There are no OAuth connections or campaign start/pause/budget actions in this frontend.

A future CORE adapter can aggregate a website analytics provider, Google Ads reporting and Meta Ads Insights using server-side tokens and verified client/account membership. Metric definitions, date/timezone, currency and conversion attribution must be agreed when integrating providers; the current IDR fixtures do not assert provider semantics. Access to analytics must be checked server-side, separately from content publication rights where needed.

## Reference inspection

Visual reference: https://vireo.jawad.work/src/html/dashboards/sales.html

The public demo was inspected in the browser. REA CLI 6.7.0 was also invoked with explicit authorization to inspect a selected public JavaScript artifact. It produced inventory evidence but could not complete semantic analysis because this environment's Linux process-ownership check failed. No claim of complete REA reconstruction is made.
