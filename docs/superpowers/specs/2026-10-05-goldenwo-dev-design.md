# goldenwo.dev personal site: design

- **Date:** 2026-10-05
- **Status:** approved in brainstorming, awaiting written-spec review
- **Owner:** Golden Wo

## 1. Purpose

`https://goldenwo.dev` is Golden Wo's personal site, the address that goes in a job application's "Website"
field. It presents the owner as a person (background, work, links) and claims the owner's studio and projects.

It is the counterpart to **Blindly** (`https://blindly.ai`, repo `goldenwo/blindly-site`), the owner's software
studio. The separation is one-way: this site names Blindly and links to it; blindly.ai never names the owner.

Target readers are recruiters and hiring managers for three kinds of roles:

- AI / agent engineering;
- general software engineering;
- fintech / quant technology.

## 2. Decisions

| Topic | Decision |
|---|---|
| Headline | **Engineer first:** "Software engineer in Boston." Blindly appears lower on the page. |
| Experience | **Compact timeline** (role, org, dates, one line each) plus a résumé PDF link. |
| Blindly | **Its own section:** a card with a "Founder" chip, one sentence, Raccoon Heist art, and links. |
| Projects | **All six current public projects**, in two groups of three. No pre-2023 work. |
| Contact | **No email anywhere on the site.** LinkedIn and GitHub only. |
| Photo | The **existing professional headshot** from the 2022 site. |
| Look | **Sibling of blindly.ai, Mist palette:** a faint wash of its gradient, frosted cards, violet accent, Inter. |
| Motion | **Full blur-to-focus**, ported from blindly.ai: cards sharpen on scroll and the name sharpens once on load. |
| Stack | Astro 7, static output, TypeScript, plain CSS. Same toolchain and gates as blindly-site. |
| Hosting | **Cloudflare Worker (static assets)** built by Workers Builds, like blindly.ai. |
| Repo | New **public** repo `goldenwo/goldenwo.dev`. |
| `www` | 301 to the apex, same mechanism as blindly.ai. |
| Old URL | `goldenwo.github.io` becomes a meta-refresh stub pointing to `https://goldenwo.dev/`. No custom domain on GitHub. |
| Résumé PDF | **Exported from Word** by the owner as a public copy (no phone, no email), committed to the repo. |

## 3. Current infrastructure (2026-10-05)

- **Domain:** `goldenwo.dev`, Cloudflare Registrar, bought 2026-10-05, expires 2027-10-05. DNS on Cloudflare
  (`hunts` / `ulla.ns.cloudflare.com`), the same account as `blindly.ai`. No records yet.
- `.dev` is on the HSTS preload list, so the site is HTTPS-only. Cloudflare's edge certificate covers it.
- **`goldenwo/goldenwo.github.io`:** GitHub Pages user site served from `gh-pages`, no custom domain. Both
  `gh-pages` and `master` hold only a 2022 Create React App build. Its source was recovered from the source map
  and holds nothing worth keeping beyond the headshot.
- **Project sites under the user site** are why `goldenwo.github.io` must not get a custom domain: setting one
  would move every project site without its own domain under it. `goldenwo.github.io/ai-x-feed/` is live and
  linked from blindly.ai. `raccoon.blindly.ai` has its own custom domain and is unaffected either way.

## 4. Architecture

```
goldenwo/goldenwo.dev (public)
├─ src/
│  ├─ data/site.ts          # name, headline, bio, links, photo, résumé PDF path (or null)
│  ├─ data/experience.ts    # timeline rows
│  ├─ data/projects.ts      # project cards and groups
│  ├─ data/studio.ts        # the Blindly section
│  ├─ data/validate.ts      # data rules, run at build and in tests
│  ├─ components/           # Nav, Hero, Experience, Studio, ProjectGroup, ProjectCard, Footer
│  ├─ layouts/Base.astro    # <head>: meta, Open Graph, JSON-LD, tokens, font
│  ├─ scripts/focus.ts      # blur-to-focus, ported unchanged from blindly-site
│  ├─ styles/               # tokens.css (Mist, light/dark), global.css
│  ├─ assets/headshot.png   # source image for astro:assets
│  └─ pages/                # index.astro, 404.astro
├─ public/                  # _headers, favicon set, og-image.png, art/, résumé PDF once it exists
├─ scripts/                 # make-images, privacy-scan, lighthouse, preview-server, verify-live
├─ tests/unit, tests/e2e
├─ docs/deploy.md           # runbook (dashboard steps are the owner's)
└─ AGENTS.md, .claude/CLAUDE.md
```

- Scaffolding (configs, `focus.ts`, scripts, CI) is **copied** from blindly-site, not shared through a package.
  Two small sites do not justify a shared package yet.
- Output is static HTML, CSS, one small script and assets. No server code, analytics or cookies.
- **All copy lives in `src/data/*.ts`.** Components only render it.

## 5. Content model

```ts
interface Site {
  name: string;                 // 'Golden Wo'
  url: string;                  // 'https://goldenwo.dev'
  headline: string;             // 'Software engineer in Boston.'
  bio: string;                  // two sentences
  links: { linkedin: string; github: string };
  resumePdf: string | null;     // '/golden-wo-resume.pdf' once the public export exists; null hides the button
}

interface Role {
  id: string;
  when: string;                 // display text, e.g. '2023 – now'
  title: string;
  org: string;
  summary?: string;             // one line
}

type ProjectGroup = 'agent-tooling' | 'research';

interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  group: ProjectGroup;
  links: { source?: string; site?: string };
}

interface Studio {
  name: string;                 // 'Blindly'
  url: string;                  // 'https://blindly.ai/'
  role: string;                 // 'Founder'
  blurb: string;
  featured: { name: string; url: string; status: string; art: { src: string; alt: string; width: number; height: number } };
}
```

**Rules enforced at build and in tests:**

- Every `id` is unique within its list.
- Every link is `https://`.
- Every image has non-empty `alt`.
- Every `ProjectGroup` has at least one project.
- If `resumePdf` is set, the file exists in `public/`.
- No data string contains an email address or a phone-number pattern.

**Launch content (draft copy; final wording is reviewed on the preview):**

- **Bio:** "I'm a full-stack engineer at Fidelity Investments, where I build the shared Angular libraries and
  micro-frontends other teams build on, and lately the LLM tooling around them. Outside work I run Blindly, a
  small software studio for games, agent tooling and market research."
- **Experience:**

  | When | Title · Org | Summary |
  |---|---|---|
  | 2023 – now | Full-Stack Software Engineer · Fidelity Investments | Shared Angular libraries and micro-frontends used by 5+ teams; led LLM integration in the monorepo. |
  | 2018, 2021 | Intern · State Street | IT (2018) and Securities Finance (2021). |
  | 2022 | B.S. Information & Computer Sciences · UMass Amherst | (none) |

  Source: the owner's résumé as of 2026-10-05, marked old. It is replaced when the updated résumé arrives.
  GPA is left off.
- **Studio:** "I run Blindly, an independent software studio. Its first game, Raccoon Heist: Idle Crates, is in
  closed testing on Android." Links: `https://blindly.ai/`, `https://raccoon.blindly.ai/`. Art and alt text are
  reused from blindly-site (`public/art/raccoon-heist-feature.png`, 1024×500).
- **Projects** (wording from blindly-site's `products.ts`):

  | Group | Projects |
  |---|---|
  | Agent tooling | universal-memory · claude-state-drift · attune |
  | Research and data | edge-catcher · ai-x-feed (site and source links) · product-search-ai-agent |

## 6. Page structure

1. **Skip link**, then **Nav:** "Golden Wo" on the left; in-page links Experience · Blindly · Projects.
2. **Hero:** circular headshot, `h1` name, headline, bio, then buttons: Résumé (PDF) (only when `resumePdf` is
   set), LinkedIn, GitHub.
3. **Experience:** one frosted card holding the timeline rows.
4. **Blindly:** one card: art, "Founder" chip, blurb, links.
5. **Projects:** a group heading and a grid of three cards for each group.
6. **Footer:** © year Golden Wo · LinkedIn · GitHub.

The 404 page uses the same layout with a short message and a link home.

**Head:**

- Title "Golden Wo · Software engineer"; meta description; canonical `https://goldenwo.dev/`.
- Open Graph and Twitter card tags with a static `og-image.png` (1200×630: Mist gradient, name, headline).
- JSON-LD `Person`: `name`, `url`, `jobTitle`, `image`, `sameAs` (LinkedIn, GitHub).
- Favicon: a "GW" monogram in the accent colour (SVG, 32px PNG, apple-touch icon).
- `theme-color` for light and dark.

## 7. Visual system and interaction

**Tokens** (`tokens.css`; dark mode follows `prefers-color-scheme`, no toggle):

| | Light | Dark |
|---|---|---|
| Background | gradient `#f8f2ec` → `#f2eef8` → `#ecf3f5` | gradient `#17141d` → `#15161f` → `#11191e` |
| Ink | `#1d1a24` | `#f3eff8` |
| Muted | `#565068` | `#bdb5cf` |
| Card | `rgba(255,255,255,.72)`, 16px radius, `backdrop-filter: blur(8px)` | `rgba(255,255,255,.05)` |
| Accent | `#5b3fc4` | `#c3b3ff` |

Final values are tuned until axe reports no contrast failures in either mode.

**Type:** Inter Variable via `@fontsource-variable/inter`, self-hosted. Headings bold with negative letter-spacing.

**Blur to focus** (ported from blindly-site, behaviour unchanged):

- The page ships sharp. An inline `<head>` script adds `html.js`; `focus.ts` adds `html.focus-ready`. Only then do
  `.reveal` cards start at `blur(3px)` and sharpen when an `IntersectionObserver` reports them in view.
- The name in the hero sharpens once on load (the `.hero-blur` animation).
- No JS, script failure, `prefers-reduced-motion: reduce`, or print: everything is sharp.
- Blur only, never opacity, so waiting cards never fail contrast.

**Images:** the headshot goes through `astro:assets` to AVIF/WebP at 1× and 2× of its 148px display size. The
Raccoon art is served as-is with `image-rendering: pixelated`.

**Responsive:** content width 880px. The hero stacks below 720px. Project grids use 3 columns at ≥1024px, 2 at
≥640px, 1 below that. Timeline rows stack on phones.

**Accessibility:** semantic landmarks, headings in order, real `<a>` links, visible `:focus-visible` ring in the
accent colour, skip link, alt text on all images, WCAG AA contrast in both modes.

## 8. Security and privacy

- **CSP:** Astro's `security.csp`, which hashes bundled scripts and styles and emits a `<meta>` policy. Extra
  directives: `default-src 'self'`, `img-src 'self' data:`, `font-src 'self'`, `object-src 'none'`,
  `base-uri 'none'`, `form-action 'none'`. The inline `html.js` script is hashed explicitly in config and a test
  checks the hash still matches. No inline `style=""` attributes.
- **`public/_headers`** (applied by Workers static assets) carries what a `<meta>` CSP cannot:

  ```
  /*
    Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
    X-Content-Type-Options: nosniff
    X-Frame-Options: DENY
    Referrer-Policy: strict-origin-when-cross-origin
    Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
    Cross-Origin-Opener-Policy: same-origin
  /_astro/*
    Cache-Control: public, max-age=31536000, immutable
  ```

- **Privacy gate** (the repo is public): `scripts/privacy-scan.mjs` runs after every build. It reads every text
  file in `dist/` and the extracted text of every PDF (via `unpdf`). It fails if it finds an email address or a
  phone-number pattern. An explicit allowlist handles any false positive (empty at launch). The same check runs on
  the data files in unit tests.
- The private résumé (with phone and email) never enters the repo. Only the owner's redacted export does.

## 9. Testing and quality gates

`npm run check` runs, in order: `astro check` → vitest → build → privacy scan → Playwright → Lighthouse.

- **Unit (vitest):** data rules (§5), content shape (six projects, two groups, timeline rows), privacy patterns on
  data.
- **E2E (Playwright, Chromium):**
  - smoke: every section and link renders; résumé button present only when configured;
  - head: title, canonical, OG tags, JSON-LD parses as `Person`, CSP meta present, no CSP violations in console;
  - a11y: axe with no violations, light and dark, at 390px and 1280px;
  - focus: blur only after `focus-ready`; sharp with JS off and under reduced motion;
  - 404 page renders.
- **Lighthouse** (median of 3 runs): performance 95, accessibility 100, best practices 95, SEO 95.
- **CI:** GitHub Actions runs `npm run check` on every push and pull request.
- **`npm run verify:live`** (after go-live):
  - the apex returns 200 over HTTPS with the `_headers` set;
  - `www` returns a 301 to the apex, keeping path and query;
  - `http://` upgrades to `https://`;
  - `goldenwo.github.io` serves the stub pointing to goldenwo.dev;
  - `goldenwo.github.io/ai-x-feed/` returns 200.

## 10. Hosting and DNS

- **Worker** `goldenwo-dev` (Worker names cannot contain dots). `wrangler.jsonc`: assets from `./dist`,
  `not_found_handling: "404-page"`, `workers_dev: true`, `preview_urls: true`, no `routes`.
- **Workers Builds:** `main` deploys production; other branches get preview URLs. Build `npm run build`,
  deploy `npx wrangler deploy`.
- **Dashboard steps (the owner does these; runbook in `docs/deploy.md`):**
  1. Connect the repo in Workers Builds (only this repository); check the `workers.dev` URL.
  2. After visual sign-off, attach `goldenwo.dev` under the Worker's **Domains**. Never through `routes`: the
     Workers Builds token cannot create DNS records (error 10013).
  3. `www`: proxied `AAAA` `100::` placeholder plus a redirect rule `https://www.goldenwo.dev/*` →
     `https://goldenwo.dev/${1}`, 301, preserve query string.
  4. **Always Use HTTPS:** on.
  5. **Anti-spoofing** (the domain sends no mail): null MX `0 .` on the apex, TXT `v=spf1 -all` on the apex, TXT
     `v=DMARC1; p=reject;` on `_dmarc`.
  6. Confirm auto-renew is on before the 2027-10-05 expiry.
- **No wildcard records.** Only the apex, `www` and `_dmarc` are touched.

## 11. The old URL (`goldenwo/goldenwo.github.io`)

Changed **only after** `verify:live` passes on goldenwo.dev.

- `gh-pages`: the 2022 bundle is replaced by a stub `index.html` with `<meta http-equiv="refresh" content="0;
  url=https://goldenwo.dev/">`, `<link rel="canonical" href="https://goldenwo.dev/">`, and a visible link as a
  fallback; plus `.nojekyll`. No `CNAME` file.
- `master`: the same stub plus a README pointing to `goldenwo/goldenwo.dev`.
- Project sites (`/ai-x-feed/` and any others) are untouched.

## 12. Rollout

Each step marked **(ask)** needs the owner's OK first.

1. Create `goldenwo/goldenwo.dev`, public **(ask)**. This spec moves there as the first commit.
2. Build to this spec; `npm run check` green locally.
3. Push **(ask)**. CI green.
4. Owner connects Workers Builds; review the `workers.dev` preview; copy and visual sign-off.
5. Owner attaches the domain and does the DNS steps in §10.
6. `npm run verify:live` passes (except the old-URL checks).
7. Push the `goldenwo.github.io` stub **(ask)**; `verify:live` passes in full.
8. Owner updates the website field on LinkedIn and GitHub to `https://goldenwo.dev`.
9. When the redacted résumé export arrives, add it to `public/` and set `resumePdf`.

## 13. Out of scope

- Blog, writing section, contact form, analytics.
- An `@goldenwo.dev` mailbox or forwarding.
- A link from blindly.ai to this site (its `personalUrl` stays `null`).
- Generating the résumé PDF from site data.
- Pre-2023 projects (BrickBreaker, sorting-algorithm-visualizer, cs326-final-iota).

## 14. Open items (not blocking)

- Final bio wording (reviewed on the preview).
- The updated résumé: replaces the timeline content and supplies the public PDF.
- A newer photo may replace the 2022 headshot later. It is one file swap.
