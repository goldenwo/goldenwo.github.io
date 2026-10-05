# goldenwo.dev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Golden Wo's one-page personal site at `https://goldenwo.dev`, generated from typed data, with `www`
redirecting to the apex and the old `goldenwo.github.io` URL pointing at it.

**Architecture:** Astro 7 builds static HTML from `src/data/*.ts`, with one component per page section. A Mist
palette (CSS tokens, light and dark) and blindly.ai's blur-to-focus script give the look. Astro's built-in CSP plus a
`_headers` file supply the security headers. A post-build privacy scan keeps personal contact data out of the public
repo and site. Hosting is a static-assets-only Cloudflare Worker deployed by Workers Builds. The gates are vitest,
the privacy scan, Playwright with axe, and Lighthouse; they run through `npm run check` locally and in GitHub Actions.

**Tech Stack:** Astro 7.3, TypeScript 6, sharp 0.35, vitest 5, Playwright 1.63 with @axe-core/playwright 4.13,
lighthouse 13 with chrome-launcher, unpdf 1.8, @fontsource-variable/inter 5, wrangler 4. Cloudflare Workers static
assets.

**Spec:** `docs/superpowers/specs/2026-10-05-goldenwo-dev-design.md`

## Global Constraints

- Node `>=22.12.0` (Astro 7). CI and Workers Builds use `.node-version` = `22`.
- TypeScript **`^6`**, not 7: `@astrojs/check` 0.9.10 requires `typescript ^5 || ^6`.
- **The repo and the site are public.** Never commit an email address, a phone number, a street address or the
  private résumé. Test fixtures use only `example.com` addresses and `555-01xx` numbers (reserved as fictional).
- No analytics, cookies or third-party requests at runtime. The font is self-hosted through fontsource.
- `goldenwo/goldenwo.github.io` **never** gets a custom domain: that would move project sites such as `/ai-x-feed/`.
- DNS on `goldenwo.dev`: only the apex, `www` and `_dmarc` are touched. **Never** a wildcard.
- **Owner OK required before:** creating the GitHub repo, any `git push`, any push to `goldenwo.github.io`, and any
  Cloudflare dashboard or DNS change. Dashboard steps are the owner's to do.
- Gates: axe has **zero serious or critical** violations in light and dark at 390px and 1280px. Lighthouse median
  of 3 runs: **performance ≥ 95, accessibility = 100, best-practices ≥ 95, SEO ≥ 95**. Never weaken a gate to make
  it pass; fix the page.
- Project grid breakpoints: 3 columns at ≥1024px, 2 at ≥640px, 1 below that. Hero stacks below 720px.
- **Every Chromium launch honours `CHROMIUM_EXECUTABLE`** (unset means Playwright's own browser). Locally and in CI,
  leave it unset. In the Claude Code cloud container, `export CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` and never
  run `playwright install`: its preinstalled build is older than Playwright 1.63 expects.

## Paths used below

- `$BLINDLY`: a local checkout of `goldenwo/blindly-site` (`main`). Scaffolding is copied from it.
- `$OLD_SITE`: a local checkout of `goldenwo/goldenwo.github.io`, which holds the 2022 headshot (on `master`) and this
  spec and plan (on `claude/keen-fermi-34qd76`).
- Commands run from the new repo's root unless they say otherwise.

## Deviations from the spec (decided while planning)

Each was checked against Astro 7.3.5, unpdf 1.8.1 and vitest 5.0.3 in a throwaway project on 2026-10-05.

1. **CSP and the inline script:** Astro 7 hashes its bundled scripts and styles but **not** `is:inline` scripts. The
   inline `<head>` snippet therefore lives in `src/inline-scripts.mjs`, and `astro.config.mjs` computes its hash from
   the same string, so nothing is pasted by hand. An e2e test asserts that every executable inline script's hash is
   in the policy.
2. **`img-src 'self'`** without `data:`, because no data URIs are used.
3. **Privacy patterns live in `src/privacy.mjs`** (plain JS with JSDoc). The TypeScript validator and the Node scan
   script share them without needing Node's type stripping.
4. **The phone pattern requires separators** (`617-555-0123`, `(617) 555-0123`, `+1 617 555 0123`). Bare 10-digit
   runs are not matched: they would false-positive on numeric IDs, and résumés format phone numbers.
5. **Privacy findings report counts, never values**, because CI logs on a public repo are public.
6. **PDF metadata is scanned too** (title, author, subject), not only the page text.
7. **`Studio.featured.status` is dropped.** The blurb sentence already carries the status.
8. **`sharp` is an explicit dependency.** It is only an *optional* dependency of Astro 7.
9. **vitest 5** (blindly-site is still on 4). It is compatible with Astro 7's Vite 8.
10. **Headshot source** is a 360×360 crop of the 2022 photo, saved as `src/assets/headshot.jpg` (spec: `.png`). It
    loads eagerly with `fetchpriority="high"` because it is above the fold. Its alt text is "Portrait of Golden Wo".
11. **JSON-LD is rendered on the home page only**, not on the 404 page.
12. **`CHROMIUM_EXECUTABLE` override** in `playwright.config.ts`, `make-images`, `lighthouse`, `screenshots` and the
    privacy-scan test, so the same code runs on the owner's machine, in CI and in a cloud container.

## File map

| File | Responsibility |
|---|---|
| `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `wrangler.jsonc`, `.node-version`, `.gitignore`, `.gitattributes` | Toolchain, CSP and hosting config |
| `src/inline-scripts.mjs` | Inline `<head>` script sources (hashed into the CSP by the config) |
| `src/privacy.mjs` | Email and phone patterns, `findPrivateData()` |
| `src/data/types.ts` | `Site`, `Role`, `Project`, `ProjectGroupInfo`, `Studio`, `Content`, `PROJECT_GROUPS` |
| `src/data/validate.ts` | `validateContent()`, `assertValidContent()` |
| `src/data/site.ts`, `experience.ts`, `projects.ts`, `studio.ts`, `content.ts` | Launch content |
| `src/styles/tokens.css`, `src/styles/global.css` | Mist tokens (light and dark), base and shared styles, blur-to-focus rules |
| `src/layouts/Base.astro` | `<head>` (meta, OG, icons, JSON-LD), skip link, focus script |
| `src/components/*.astro` | `Nav`, `Hero`, `Experience`, `Studio`, `ProjectGroup`, `ProjectCard`, `Footer` |
| `src/scripts/focus.ts` | Blur-to-focus (copied unchanged from blindly-site) |
| `src/assets/headshot.jpg` | Headshot source for `astro:assets` |
| `src/pages/index.astro`, `src/pages/404.astro` | Pages |
| `public/` | `_headers`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.png`, `robots.txt`, `art/raccoon-heist-feature.png`, later the résumé PDF |
| `scripts/preview-server.mjs`, `lighthouse.mjs`, `screenshots.mjs` | Copied from blindly-site (the last two gain the `CHROMIUM_EXECUTABLE` override) |
| `scripts/make-images.mjs` | Renders the OG image and PNG icons |
| `scripts/privacy-scan.mjs` | Post-build scan of `dist/` for private data |
| `scripts/verify-live.mjs` | Post-deploy HTTP, header and DNS checks |
| `tests/unit/*.test.ts` | Privacy patterns, data rules, shipped content, `_headers`, privacy scan (vitest) |
| `tests/e2e/*.spec.ts` | Head, CSP, page structure, responsive layout, blur-to-focus, a11y (Playwright) |
| `.github/workflows/ci.yml` | CI running `npm run check` |
| `docs/deploy.md` | Owner's Cloudflare runbook |
| `README.md`, `AGENTS.md`, `.claude/CLAUDE.md` | Repo readme and agent conventions |

---

### Task 0: Local repo

**Files:**
- Create: `docs/superpowers/specs/2026-10-05-goldenwo-dev-design.md`, `docs/superpowers/plans/2026-10-05-goldenwo-dev.md` (copied), `.gitattributes`, `.gitignore`, `.node-version` (copied)

- [ ] **Step 1: Create the repo directory and copy the docs and repo hygiene files**

```bash
mkdir goldenwo.dev && cd goldenwo.dev
git init -b main
mkdir -p docs/superpowers/specs docs/superpowers/plans
git -C "$OLD_SITE" show claude/keen-fermi-34qd76:docs/superpowers/specs/2026-10-05-goldenwo-dev-design.md > docs/superpowers/specs/2026-10-05-goldenwo-dev-design.md
git -C "$OLD_SITE" show claude/keen-fermi-34qd76:docs/superpowers/plans/2026-10-05-goldenwo-dev.md > docs/superpowers/plans/2026-10-05-goldenwo-dev.md
cp "$BLINDLY/.gitattributes" "$BLINDLY/.gitignore" "$BLINDLY/.node-version" .
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "docs: design spec and implementation plan"
```

---

### Task 1: Toolchain scaffold

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `wrangler.jsonc`, `src/pages/index.astro` (temporary), `tests/e2e/smoke.spec.ts`

Do **not** run `npm create astro`: its template overwrites `AGENTS.md` and `CLAUDE.md` later.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "goldenwo-dev",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "typecheck": "astro check",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "privacy": "node scripts/privacy-scan.mjs",
    "images": "node scripts/make-images.mjs",
    "lighthouse": "node scripts/lighthouse.mjs",
    "screenshots": "node scripts/screenshots.mjs",
    "verify:live": "node scripts/verify-live.mjs",
    "check": "npm run typecheck && npm run test:unit && npm run build && npm run privacy && npm run test:e2e && npm run lighthouse"
  },
  "allowScripts": {
    "esbuild": true
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm i astro@^7.3.5 @fontsource-variable/inter@^5.3.0 sharp@^0.35.5
npm i -D @astrojs/check@^0.9.10 typescript@^6.0.3 vitest@^5.0.3 @playwright/test@^1.63.0 @axe-core/playwright@^4.13.0 lighthouse@^13.5.0 chrome-launcher@^1.2.2 unpdf@^1.8.1 wrangler@^4.147.0
npx playwright install chromium
```

Expected: `package-lock.json` created; no errors. In the Claude Code cloud container, skip `playwright install` and
set `CHROMIUM_EXECUTABLE` instead (see Global Constraints).

- [ ] **Step 3: Copy the unchanged configs from blindly-site, then write `playwright.config.ts`**

```bash
cp "$BLINDLY/tsconfig.json" "$BLINDLY/vitest.config.ts" .
```

`playwright.config.ts` (blindly-site's, plus the `CHROMIUM_EXECUTABLE` override):

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    ...devices['Desktop Chrome'],
    launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE },
  },
  webServer: {
    command: 'node node_modules/astro/bin/astro.mjs preview --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 4: Write `astro.config.mjs` (CSP comes in Task 6)**

```js
// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://goldenwo.dev',
});
```

- [ ] **Step 5: Write `wrangler.jsonc`**

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "goldenwo-dev",
  "compatibility_date": "2026-10-05",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  },
  // The custom domain (goldenwo.dev) is attached in the Cloudflare dashboard, not here: the Workers Builds API
  // token cannot create DNS records (code 10013), and `routes` would turn workers.dev off. See docs/deploy.md.
  "workers_dev": true,
  "preview_urls": true
}
```

- [ ] **Step 6: Write a temporary `src/pages/index.astro`**

```astro
<html lang="en">
  <head><meta charset="utf-8" /><title>goldenwo.dev</title></head>
  <body><h1>Golden Wo</h1></body>
</html>
```

- [ ] **Step 7: Copy the smoke test**

```bash
mkdir -p tests/e2e tests/unit
cp "$BLINDLY/tests/e2e/smoke.spec.ts" tests/e2e/
```

- [ ] **Step 8: Run it**

```bash
npm run typecheck && npm run build && npx playwright test
```

Expected: `0 errors`; build complete; `1 passed`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro 7 site with vitest, Playwright and Cloudflare config"
```

---

### Task 2: Privacy patterns

**Files:**
- Create: `src/privacy.mjs`, `tests/unit/privacy.test.ts`

- [ ] **Step 1: Write the failing test** (`tests/unit/privacy.test.ts`)

```ts
import { describe, expect, test } from 'vitest';
import { findPrivateData } from '../../src/privacy.mjs';

describe('findPrivateData', () => {
  test.each(['(617) 555-0123', '617-555-0123', '617.555.0123', '617 555 0123', '+1 617 555 0123', '+1-617-555-0123'])(
    'finds the phone number %s',
    (phone) => {
      expect(findPrivateData(`call ${phone} today`)).toEqual([{ kind: 'phone', count: 1 }]);
    },
  );

  test('finds email addresses', () => {
    expect(findPrivateData('mail someone@example.com or a.b+c@sub.example.org')).toEqual([{ kind: 'email', count: 2 }]);
  });

  test.each([
    '2018, 2021',
    '2023 – now',
    'Jan. 2023 - Present',
    "'sha256-+/LQBSJqJZrp5StU3GEBN6qnKpYPnt0RHliSjOdyJBc='",
    'max-age=63072000',
    '1024 × 500',
    'https://www.linkedin.com/in/goldenwo/',
    '@media (min-width: 640px)',
    'used by 5+ teams with < 100 ms latency',
  ])('ignores %s', (text) => {
    expect(findPrivateData(text)).toEqual([]);
  });

  test('reports counts, never the values', () => {
    expect(JSON.stringify(findPrivateData('someone@example.com 617-555-0123'))).not.toMatch(/example|555/);
  });

  test('skips allowlisted values', () => {
    expect(findPrivateData('617-555-0123', ['617-555-0123'])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/unit/privacy.test.ts`
Expected: FAIL, `Failed to resolve import "../../src/privacy.mjs"`.

- [ ] **Step 3: Implement `src/privacy.mjs`**

```js
// src/privacy.mjs: personal data that must never ship. The repo and the site are both public.
// Shared by the data validator (src/data/validate.ts) and the post-build scan (scripts/privacy-scan.mjs).

/** @typedef {{ kind: 'email' | 'phone', count: number }} PrivateDataHit */

export const PRIVATE_PATTERNS = {
  email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  // Separators required: bare 10-digit runs would match numeric IDs, and résumés format phone numbers.
  phone: /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]\d{4}\b/g,
};

/** Exact strings that match a pattern but are not private. Empty at launch. @type {readonly string[]} */
export const PRIVACY_ALLOWLIST = [];

/**
 * Counts email addresses and phone numbers in `text`. Returns counts only, never the matches: CI logs are public.
 * @param {string} text
 * @param {readonly string[]} [allowlist]
 * @returns {PrivateDataHit[]}
 */
export function findPrivateData(text, allowlist = PRIVACY_ALLOWLIST) {
  /** @type {PrivateDataHit[]} */
  const hits = [];
  for (const kind of /** @type {const} */ (['email', 'phone'])) {
    const count = (text.match(PRIVATE_PATTERNS[kind]) ?? []).filter((m) => !allowlist.includes(m)).length;
    if (count > 0) hits.push({ kind, count });
  }
  return hits;
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run tests/unit/privacy.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/privacy.mjs tests/unit/privacy.test.ts
git commit -m "feat(privacy): email and phone patterns shared by the validator and the build scan"
```

---

### Task 3: Content types and validation rules

**Files:**
- Create: `src/data/types.ts`, `src/data/validate.ts`, `tests/unit/validate.test.ts`

- [ ] **Step 1: Write `src/data/types.ts`**

```ts
export const PROJECT_GROUPS = ['agent-tooling', 'research'] as const;
export type ProjectGroupId = (typeof PROJECT_GROUPS)[number];

export interface Site {
  name: string;
  /** origin, no trailing slash */
  url: string;
  title: string;
  description: string;
  headline: string;
  /** two sentences */
  bio: string;
  /** JSON-LD jobTitle */
  jobTitle: string;
  links: { linkedin: string; github: string };
  /** public path of the redacted résumé PDF; null hides the button */
  resumePdf: string | null;
  photoAlt: string;
  ogImageAlt: string;
}

export interface Role {
  /** kebab-case, unique */
  id: string;
  /** display text, e.g. "2023 – now" */
  when: string;
  title: string;
  org: string;
  /** one line */
  summary?: string;
}

export interface ProjectGroupInfo {
  id: ProjectGroupId;
  title: string;
}

export interface Project {
  /** kebab-case, unique */
  id: string;
  name: string;
  /** one line */
  tagline: string;
  /** one or two sentences */
  description: string;
  group: ProjectGroupId;
  /** https only */
  links: { site?: string; source?: string };
}

export interface Studio {
  name: string;
  url: string;
  role: string;
  /** completes "I run <name>, …" */
  blurb: string;
  featured: { name: string; url: string; art: { src: string; alt: string; width: number; height: number } };
}

export interface Content {
  site: Site;
  roles: Role[];
  groups: ProjectGroupInfo[];
  projects: Project[];
  studio: Studio;
}
```

- [ ] **Step 2: Write the failing test** (`tests/unit/validate.test.ts`)

```ts
import { describe, expect, test } from 'vitest';
import type { Content } from '../../src/data/types';
import { assertValidContent, validateContent } from '../../src/data/validate';

const valid = (): Content => ({
  site: {
    name: 'A Person',
    url: 'https://person.example',
    title: 'A Person',
    description: 'About a person.',
    headline: 'Engineer.',
    bio: 'Builds things.',
    jobTitle: 'Engineer',
    links: { linkedin: 'https://www.linkedin.com/in/someone/', github: 'https://github.com/someone' },
    resumePdf: null,
    photoAlt: 'Portrait of A Person',
    ogImageAlt: 'A Person',
  },
  roles: [{ id: 'job', when: '2020 – now', title: 'Engineer', org: 'Org' }],
  groups: [
    { id: 'agent-tooling', title: 'Agent tooling' },
    { id: 'research', title: 'Research and data' },
  ],
  projects: [
    { id: 'tool', name: 'tool', tagline: 'A tool', description: 'Does things.', group: 'agent-tooling', links: { source: 'https://github.com/someone/tool' } },
    { id: 'study', name: 'study', tagline: 'A study', description: 'Finds things.', group: 'research', links: {} },
  ],
  studio: {
    name: 'Studio',
    url: 'https://studio.example/',
    role: 'Founder',
    blurb: 'a studio.',
    featured: { name: 'Game', url: 'https://game.example/', art: { src: '/art/game.png', alt: 'Game art', width: 10, height: 10 } },
  },
});
const noFiles = () => false;

describe('validateContent', () => {
  test('accepts valid content', () => {
    expect(validateContent(valid(), noFiles)).toEqual([]);
  });

  test('rejects duplicate and non-kebab-case ids', () => {
    const c = valid();
    c.projects.push({ ...c.projects[0] });
    c.roles.push({ ...c.roles[0], id: 'Bad_Id' });
    const errors = validateContent(c, noFiles);
    expect(errors).toContain('project tool: duplicate id');
    expect(errors).toContain('role Bad_Id: id must be kebab-case');
  });

  test('requires https on every link', () => {
    const c = valid();
    c.site.links.github = 'http://github.com/someone';
    c.projects[0].links.site = 'http://tool.example';
    c.studio.featured.url = 'http://game.example/';
    const errors = validateContent(c, noFiles);
    expect(errors).toContain('site.links.github: link must use https');
    expect(errors).toContain('project tool site: link must use https');
    expect(errors).toContain('studio.featured.url: link must use https');
  });

  test('every group has a project and every project a listed group', () => {
    const c = valid();
    c.projects = [{ ...c.projects[0], group: 'music' as never }];
    const errors = validateContent(c, noFiles);
    expect(errors).toContain('group research: no projects');
    expect(errors).toContain('project tool: unknown group "music"');
  });

  test('rejects unknown group ids', () => {
    const c = valid();
    c.groups.push({ id: 'games' as never, title: 'Games' });
    expect(validateContent(c, noFiles)).toContain('group games: unknown group');
  });

  test('requires alt text on the photo and the studio art', () => {
    const c = valid();
    c.site.photoAlt = ' ';
    c.studio.featured.art.alt = '';
    const errors = validateContent(c, noFiles);
    expect(errors).toContain('site.photoAlt: the photo needs alt text');
    expect(errors).toContain('studio.featured.art: the art needs alt text');
  });

  test('the résumé PDF must be an absolute .pdf path that exists', () => {
    const c = valid();
    c.site.resumePdf = '/cv.pdf';
    expect(validateContent(c, noFiles)).toContain('site.resumePdf: public/cv.pdf does not exist');
    expect(validateContent(c, (path) => path === '/cv.pdf')).toEqual([]);
    c.site.resumePdf = 'cv.docx';
    expect(validateContent(c, () => true)).toContain('site.resumePdf must be an absolute path to a .pdf');
  });

  test('rejects email addresses and phone numbers anywhere in the content', () => {
    const c = valid();
    c.site.bio = 'Reach me at someone@example.com or (617) 555-0123.';
    const errors = validateContent(c, noFiles);
    expect(errors).toContain('private data: 1 email match(es)');
    expect(errors).toContain('private data: 1 phone match(es)');
  });
});

describe('assertValidContent', () => {
  test('throws with every problem listed', () => {
    const c = valid();
    c.site.photoAlt = '';
    expect(() => assertValidContent(c, noFiles)).toThrow('Invalid content:\n- site.photoAlt: the photo needs alt text');
  });

  test('passes valid content', () => {
    expect(() => assertValidContent(valid(), noFiles)).not.toThrow();
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run tests/unit/validate.test.ts`
Expected: FAIL, `Failed to resolve import "../../src/data/validate"`.

- [ ] **Step 4: Implement `src/data/validate.ts`**

```ts
import { findPrivateData } from '../privacy.mjs';
import { PROJECT_GROUPS, type Content } from './types';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** `publicFileExists` receives a site path such as "/resume.pdf" and reports whether public/ holds it. */
export function validateContent(content: Content, publicFileExists: (path: string) => boolean): string[] {
  const errors: string[] = [];
  const { site, roles, groups, projects, studio } = content;

  const checkIds = (kind: string, list: readonly { id: string }[]) => {
    const seen = new Set<string>();
    for (const { id } of list) {
      if (!KEBAB.test(id)) errors.push(`${kind} ${id}: id must be kebab-case`);
      if (seen.has(id)) errors.push(`${kind} ${id}: duplicate id`);
      seen.add(id);
    }
  };
  checkIds('role', roles);
  checkIds('group', groups);
  checkIds('project', projects);

  const links: [string, string | undefined][] = [
    ['site.url', site.url],
    ['site.links.linkedin', site.links.linkedin],
    ['site.links.github', site.links.github],
    ['studio.url', studio.url],
    ['studio.featured.url', studio.featured.url],
    ...projects.flatMap((p) => Object.entries(p.links).map(([kind, url]): [string, string | undefined] => [`project ${p.id} ${kind}`, url])),
  ];
  for (const [where, url] of links) {
    if (url !== undefined && !url.startsWith('https://')) errors.push(`${where}: link must use https`);
  }

  for (const g of groups) {
    if (!(PROJECT_GROUPS as readonly string[]).includes(g.id)) errors.push(`group ${g.id}: unknown group`);
    else if (!projects.some((p) => p.group === g.id)) errors.push(`group ${g.id}: no projects`);
  }
  for (const p of projects) {
    if (!groups.some((g) => g.id === p.group)) errors.push(`project ${p.id}: unknown group "${p.group}"`);
  }

  if (!site.photoAlt.trim()) errors.push('site.photoAlt: the photo needs alt text');
  if (!studio.featured.art.alt.trim()) errors.push('studio.featured.art: the art needs alt text');

  if (site.resumePdf !== null) {
    if (!/^\/[\w./-]+\.pdf$/.test(site.resumePdf)) errors.push('site.resumePdf must be an absolute path to a .pdf');
    else if (!publicFileExists(site.resumePdf)) errors.push(`site.resumePdf: public${site.resumePdf} does not exist`);
  }

  for (const { kind, count } of findPrivateData(JSON.stringify(content))) errors.push(`private data: ${count} ${kind} match(es)`);

  return errors;
}

export function assertValidContent(content: Content, publicFileExists: (path: string) => boolean): void {
  const errors = validateContent(content, publicFileExists);
  if (errors.length > 0) throw new Error(`Invalid content:\n- ${errors.join('\n- ')}`);
}
```

- [ ] **Step 5: Run it to see it pass, then typecheck**

Run: `npx vitest run tests/unit/validate.test.ts && npm run typecheck`
Expected: PASS; `0 errors`.

- [ ] **Step 6: Commit**

```bash
git add src/data/types.ts src/data/validate.ts tests/unit/validate.test.ts
git commit -m "feat(data): content types and validation rules"
```

---

### Task 4: Launch content

**Files:**
- Create: `src/data/site.ts`, `src/data/experience.ts`, `src/data/projects.ts`, `src/data/studio.ts`, `src/data/content.ts`, `tests/unit/content.test.ts`, `public/art/raccoon-heist-feature.png` (copied)

- [ ] **Step 1: Write the failing test** (`tests/unit/content.test.ts`)

```ts
import { existsSync } from 'node:fs';
import { expect, test } from 'vitest';
import { content } from '../../src/data/content';
import { validateContent } from '../../src/data/validate';

const inPublic = (path: string) => existsSync(`public${path}`);

test('shipped content passes validation', () => {
  expect(validateContent(content, inPublic)).toEqual([]);
});

test('three timeline rows, newest first', () => {
  expect(content.roles.map((r) => r.id)).toEqual(['fidelity', 'state-street', 'umass']);
});

test('six projects in two groups of three', () => {
  expect(content.groups.map((g) => g.id)).toEqual(['agent-tooling', 'research']);
  expect(content.projects.filter((p) => p.group === 'agent-tooling').map((p) => p.id)).toEqual(['universal-memory', 'claude-state-drift', 'attune']);
  expect(content.projects.filter((p) => p.group === 'research').map((p) => p.id)).toEqual(['edge-catcher', 'ai-x-feed', 'product-search-ai-agent']);
});

test('the studio art ships with the site', () => {
  expect(inPublic(content.studio.featured.art.src)).toBe(true);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/unit/content.test.ts`
Expected: FAIL, `Failed to resolve import "../../src/data/content"`.

- [ ] **Step 3: Write `src/data/site.ts`**

```ts
import type { Site } from './types';

export const site: Site = {
  name: 'Golden Wo',
  url: 'https://goldenwo.dev',
  title: 'Golden Wo · Software engineer',
  description:
    'Golden Wo is a software engineer in Boston working on front-end platforms, AI agent tooling and market research, and the founder of Blindly.',
  headline: 'Software engineer in Boston.',
  bio: "I'm a full-stack engineer at Fidelity Investments, where I build the shared Angular libraries and micro-frontends other teams build on, and lately the LLM tooling around them. Outside work I run Blindly, a small software studio for games, agent tooling and market research.",
  jobTitle: 'Software Engineer',
  links: { linkedin: 'https://www.linkedin.com/in/goldenwo/', github: 'https://github.com/goldenwo' },
  resumePdf: null,
  photoAlt: 'Portrait of Golden Wo',
  ogImageAlt: 'Golden Wo, software engineer in Boston',
};
```

- [ ] **Step 4: Write `src/data/experience.ts`**

```ts
import type { Role } from './types';

// Source: the owner's résumé as of 2026-10-05 (marked old). Replace from the updated résumé when it arrives.
export const roles: Role[] = [
  {
    id: 'fidelity',
    when: '2023 – now',
    title: 'Full-Stack Software Engineer',
    org: 'Fidelity Investments',
    summary: 'Shared Angular libraries and micro-frontends used by 5+ teams; led LLM integration in the monorepo.',
  },
  { id: 'state-street', when: '2018, 2021', title: 'Intern', org: 'State Street', summary: 'IT (2018) and Securities Finance (2021).' },
  { id: 'umass', when: '2022', title: 'B.S. Information & Computer Sciences', org: 'UMass Amherst' },
];
```

- [ ] **Step 5: Write `src/data/projects.ts`** (wording from blindly-site's `products.ts`)

```ts
import type { Project, ProjectGroupInfo } from './types';

export const groups: ProjectGroupInfo[] = [
  { id: 'agent-tooling', title: 'Agent tooling' },
  { id: 'research', title: 'Research and data' },
];

export const projects: Project[] = [
  {
    id: 'universal-memory',
    name: 'universal-memory',
    tagline: 'Memory for LLM agents',
    description: 'Self-hosted, markdown-first memory that follows your agents across devices and sessions.',
    group: 'agent-tooling',
    links: { source: 'https://github.com/goldenwo/universal-memory' },
  },
  {
    id: 'claude-state-drift',
    name: 'claude-state-drift',
    tagline: 'Keeps long Claude Code sessions on track',
    description:
      'A per-project state layer: an orientation block at session start, the goal re-injected as you work, and a nudge when state goes stale.',
    group: 'agent-tooling',
    links: { source: 'https://github.com/goldenwo/claude-state-drift' },
  },
  {
    id: 'attune',
    name: 'attune',
    tagline: 'Explanations tuned to you',
    description: 'A Claude plugin that asks once how you like things explained, remembers, and matches it in every reply.',
    group: 'agent-tooling',
    links: { source: 'https://github.com/goldenwo/attune' },
  },
  {
    id: 'edge-catcher',
    name: 'edge-catcher',
    tagline: 'Prediction-market research pipeline',
    description: 'Takes a market hunch from hypothesis to backtest to paper trader, with the same code at every step.',
    group: 'research',
    links: { source: 'https://github.com/goldenwo/edge-catcher' },
  },
  {
    id: 'ai-x-feed',
    name: 'ai-x-feed',
    tagline: 'Daily AI signal',
    description: 'Curated summaries from 35 vetted accounts, refreshed every four hours by a Raspberry Pi.',
    group: 'research',
    links: { site: 'https://goldenwo.github.io/ai-x-feed/', source: 'https://github.com/goldenwo/ai-x-feed' },
  },
  {
    id: 'product-search-ai-agent',
    name: 'product-search-ai-agent',
    tagline: 'Shopping research agent',
    description: 'A FastAPI agent that turns a product search into a short list of the best options.',
    group: 'research',
    links: { source: 'https://github.com/goldenwo/product-search-ai-agent' },
  },
];
```

- [ ] **Step 6: Write `src/data/studio.ts`**

```ts
import type { Studio } from './types';

export const studio: Studio = {
  name: 'Blindly',
  url: 'https://blindly.ai/',
  role: 'Founder',
  blurb: 'an independent software studio. Its first game, Raccoon Heist: Idle Crates, is in closed testing on Android.',
  featured: {
    name: 'Raccoon Heist',
    url: 'https://raccoon.blindly.ai/',
    art: {
      src: '/art/raccoon-heist-feature.png',
      alt: 'Pixel-art raccoon beside a stack of treasure crates under the title Raccoon Heist',
      width: 1024,
      height: 500,
    },
  },
};
```

- [ ] **Step 7: Write `src/data/content.ts`**

```ts
import { roles } from './experience';
import { groups, projects } from './projects';
import { site } from './site';
import { studio } from './studio';
import type { Content } from './types';

export const content: Content = { site, roles, groups, projects, studio };
```

- [ ] **Step 8: Copy the Raccoon Heist art**

```bash
mkdir -p public/art
cp "$BLINDLY/public/art/raccoon-heist-feature.png" public/art/
```

- [ ] **Step 9: Run it to see it pass**

Run: `npx vitest run && npm run typecheck`
Expected: all unit tests PASS; `0 errors`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(data): launch content (bio, timeline, Blindly, six projects)"
```

---

### Task 5: Brand assets (headshot, favicon, OG image)

**Files:**
- Create: `src/assets/headshot.jpg`, `public/favicon.svg`, `scripts/make-images.mjs`, `public/og-image.png`, `public/favicon-32.png`, `public/apple-touch-icon.png` (generated), `public/robots.txt`

- [ ] **Step 1: Crop the 2022 headshot to a square source image**

```bash
mkdir -p src/assets
git -C "$OLD_SITE" show master:static/media/professional.dacbbaf8b3339f667b9f.png > headshot-original.png
node -e "import('sharp').then(({ default: sharp }) => sharp('headshot-original.png').extract({ left: 34, top: 70, width: 360, height: 360 }).jpeg({ quality: 92, mozjpeg: true }).toFile('src/assets/headshot.jpg'))"
rm headshot-original.png
```

Expected: `src/assets/headshot.jpg`, 360×360. Open it: the face is centred with the shoulders and red tie visible at the bottom edge.

- [ ] **Step 2: Write `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f3dccb"/>
      <stop offset="0.5" stop-color="#ddd2f3"/>
      <stop offset="1" stop-color="#cfe5ea"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#g)"/>
  <text x="32" y="42" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="27" font-weight="800" letter-spacing="-1.5" fill="#5b3fc4">GW</text>
</svg>
```

- [ ] **Step 3: Write `scripts/make-images.mjs`** (adapted from blindly-site: Mist gradient, name, headline, photo)

```js
// scripts/make-images.mjs: renders og-image.png and the PNG icons into public/.
// Re-run after changing favicon.svg, the headshot or the OG copy: `npm run images`.
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const font = (await readFile('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')).toString('base64');
const fontFace = `@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}`;
const photo = (await readFile('src/assets/headshot.jpg')).toString('base64');

const ogHtml = `<html><head><style>${fontFace}
  html,body{margin:0}
  body{position:relative;width:1200px;height:630px;box-sizing:border-box;padding:0 96px;display:flex;flex-direction:column;justify-content:center;
    font-family:Inter;color:#1d1a24;background:linear-gradient(135deg,#f6e6da 0%,#e9e0f6 50%,#dcecf0 100%)}
  .mark{position:absolute;top:64px;left:96px;font-weight:700;font-size:30px;letter-spacing:-.02em;color:#5b3fc4}
  h1{margin:0 0 20px;max-width:620px;font-size:112px;line-height:1;letter-spacing:-.045em;font-weight:800}
  p{margin:0;max-width:620px;font-size:40px;font-weight:600;color:#565068;letter-spacing:-.01em}
  img{position:absolute;right:96px;top:50%;transform:translateY(-50%);width:300px;height:300px;border-radius:50%;
    object-fit:cover;border:6px solid rgba(255,255,255,.75)}
</style></head><body>
  <div class="mark">goldenwo.dev</div>
  <h1>Golden Wo</h1>
  <p>Software engineer in Boston.</p>
  <img src="data:image/jpeg;base64,${photo}" alt="">
</body></html>`;

const svg = await readFile('public/favicon.svg', 'utf8');
const iconHtml = (size) => `<html><head><style>${fontFace}
  html,body{margin:0;background:transparent} svg{display:block;width:${size}px;height:${size}px}
</style></head><body>${svg}</body></html>`;

// iOS rounds the touch icon itself and renders transparent corners black, so it gets a full-bleed square.
const iconHtmlFullBleed = (size) => iconHtml(size).replace('rx="16"', 'rx="0"');

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
async function render(html, width, height, path, transparent = false) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path, omitBackground: transparent });
  await page.close();
}

try {
  await render(ogHtml, 1200, 630, 'public/og-image.png');
  await render(iconHtmlFullBleed(180), 180, 180, 'public/apple-touch-icon.png');
  await render(iconHtml(32), 32, 32, 'public/favicon-32.png', true);
} finally {
  await browser.close();
}
console.log('wrote public/og-image.png, public/apple-touch-icon.png, public/favicon-32.png');
```

- [ ] **Step 4: Copy `robots.txt` and render the images**

```bash
cp "$BLINDLY/public/robots.txt" public/
npm run images
```

Expected: `wrote public/og-image.png, public/apple-touch-icon.png, public/favicon-32.png`. Open `public/og-image.png`:
the name and headline sit on the left, the round photo on the right, and nothing overlaps.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(brand): headshot source, GW favicon, OG image and icons"
```

---

### Task 6: Tokens, base layout, head, CSP and 404

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/inline-scripts.mjs`, `src/layouts/Base.astro`, `src/pages/404.astro`, `tests/e2e/head.spec.ts`, `tests/e2e/csp.spec.ts`
- Modify: `astro.config.mjs`, `src/pages/index.astro` (still temporary)

- [ ] **Step 1: Write the failing tests**

`tests/e2e/head.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { site } from '../../src/data/site';

test('home head has title, description, canonical and Open Graph tags', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(site.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', site.description);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://goldenwo.dev/');
  for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt']) {
    await expect(page.locator(`meta[property="${prop}"]`), prop).toHaveCount(1);
  }
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://goldenwo.dev/og-image.png');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
});

test('JSON-LD describes the person', async ({ page }) => {
  await page.goto('/');
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '');
  expect(data).toMatchObject({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: 'https://goldenwo.dev/',
    jobTitle: site.jobTitle,
    sameAs: [site.links.linkedin, site.links.github],
  });
  expect(data.image).toMatch(/^https:\/\/goldenwo\.dev\/_astro\/.+\.jpg$/);
});

test('static assets are served', async ({ request }) => {
  for (const path of ['/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png', '/og-image.png', '/robots.txt', '/art/raccoon-heist-feature.png']) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test('unknown paths get the 404 page, without canonical or JSON-LD', async ({ page }) => {
  const response = await page.goto('/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nothing here.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

test('skip link targets main content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#main');
  await expect(page.locator('main#main')).toHaveCount(1);
});
```

`tests/e2e/csp.spec.ts`:

```ts
import { createHash } from 'node:crypto';
import { test, expect } from '@playwright/test';

const sha256 = (source: string) => `'sha256-${createHash('sha256').update(source).digest('base64')}'`;
const DIRECTIVES = ["default-src 'self'", "img-src 'self'", "font-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"];

for (const path of ['/', '/does-not-exist']) {
  test(`${path} has a CSP that covers every executable inline script`, async ({ page }) => {
    await page.goto(path);
    const csp = (await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content')) ?? '';
    for (const directive of DIRECTIVES) expect(csp, directive).toContain(directive);
    const inline = await page
      .locator('script:not([src])')
      .evaluateAll((els) => (els as HTMLScriptElement[]).filter((s) => !s.type || s.type === 'module').map((s) => s.textContent ?? ''));
    expect(inline.length).toBeGreaterThan(0);
    for (const source of inline) expect(csp, source.slice(0, 50)).toContain(sha256(source));
  });
}

test('nothing violates the CSP while the page loads and scrolls', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { cspViolations: string[] };
    w.cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => w.cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations)).toEqual([]);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npm run build && npx playwright test tests/e2e/head.spec.ts tests/e2e/csp.spec.ts`
Expected: FAIL (title is `goldenwo.dev`, no canonical, no CSP meta, no 404 page).

- [ ] **Step 3: Write `src/inline-scripts.mjs`**

```js
// src/inline-scripts.mjs: inline <head> scripts. astro.config.mjs hashes each value into the CSP's script-src,
// so the markup and the policy cannot drift. Astro 7 hashes its bundled scripts but not is:inline ones.
export const INLINE_SCRIPTS = {
  /** Lets CSS key the hero animation from first paint; focus.ts loads later. */
  jsClass: "document.documentElement.classList.add('js')",
};
```

- [ ] **Step 4: Replace `astro.config.mjs`**

```js
// @ts-check
import { createHash } from 'node:crypto';
import { defineConfig } from 'astro/config';
import { INLINE_SCRIPTS } from './src/inline-scripts.mjs';

/** @param {string} source */
const sha256 = (source) => /** @type {`sha256-${string}`} */ (`sha256-${createHash('sha256').update(source).digest('base64')}`);

export default defineConfig({
  site: 'https://goldenwo.dev',
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self'",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
      ],
      scriptDirective: { hashes: Object.values(INLINE_SCRIPTS).map(sha256) },
    },
  },
});
```

- [ ] **Step 5: Write `src/styles/tokens.css`** (Mist)

```css
:root {
  color-scheme: light dark;
  --bg-1: #f8f2ec;
  --bg-2: #f2eef8;
  --bg-3: #ecf3f5;
  --ink: #1d1a24;
  --muted: #565068;
  --card: rgba(255, 255, 255, 0.72);
  --card-strong: rgba(255, 255, 255, 0.86);
  --line: rgba(29, 26, 36, 0.09);
  --accent: #5b3fc4;
  --on-accent: #ffffff;
  --chip-bg: rgba(91, 63, 196, 0.09);
  --shadow: 0 1px 2px rgba(29, 26, 36, 0.05), 0 8px 24px rgba(29, 26, 36, 0.05);
  --radius: 16px;
  --max: 880px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-1: #17141d;
    --bg-2: #15161f;
    --bg-3: #11191e;
    --ink: #f3eff8;
    --muted: #bdb5cf;
    --card: rgba(255, 255, 255, 0.05);
    --card-strong: rgba(255, 255, 255, 0.08);
    --line: rgba(255, 255, 255, 0.1);
    --accent: #c3b3ff;
    --on-accent: #17141d;
    --chip-bg: rgba(195, 179, 255, 0.12);
    --shadow: none;
  }
}
```

- [ ] **Step 6: Write `src/styles/global.css`** (blindly-site's base, without badges; focus rules come in Task 8)

```css
*,
*::before,
*::after { box-sizing: border-box; }

html { scroll-padding-top: 76px; -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  min-height: 100vh;
  font-family: 'Inter Variable', system-ui, sans-serif;
  line-height: 1.55;
  color: var(--ink);
  background-color: var(--bg-2);
}

/* Fixed gradient that also works on iOS (background-attachment: fixed does not). */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background: linear-gradient(160deg, var(--bg-1) 0%, var(--bg-2) 50%, var(--bg-3) 100%);
}

img { max-width: 100%; }

:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; border-radius: 6px; }

.wrap { max-width: var(--max); margin: 0 auto; padding: 0 20px; }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

.skip-link {
  position: absolute; left: 16px; top: -100px; z-index: 100;
  padding: 10px 16px; border-radius: 999px; background: var(--ink); color: var(--bg-1);
  font-weight: 600; text-decoration: none;
}
.skip-link:focus { top: 16px; }

.card {
  padding: 20px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  backdrop-filter: blur(8px);
}

.section { padding: 28px 0; }
.section-title {
  margin: 0 0 16px;
  font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--muted);
}

.links { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin: 0; padding: 0; list-style: none; }
.link { color: var(--accent); font-weight: 600; font-size: 0.95rem; text-decoration: none; }
.link:hover { text-decoration: underline; }
```

- [ ] **Step 7: Write `src/layouts/Base.astro`**

```astro
---
// src/layouts/Base.astro
import '@fontsource-variable/inter';
import '../styles/tokens.css';
import '../styles/global.css';
import { getImage } from 'astro:assets';
import headshot from '../assets/headshot.jpg';
import { site } from '../data/site';
import { INLINE_SCRIPTS } from '../inline-scripts.mjs';

interface Props {
  title?: string;
  description?: string;
  path?: string;
  noindex?: boolean;
}

const { title = site.title, description = site.description, path = '/', noindex = false } = Astro.props;
const canonical = new URL(path, site.url).href;
const ogImage = new URL('/og-image.png', site.url).href;
const photo = await getImage({ src: headshot, width: 296, format: 'jpg' });
const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  url: new URL('/', site.url).href,
  jobTitle: site.jobTitle,
  image: new URL(photo.src, site.url).href,
  sameAs: [site.links.linkedin, site.links.github],
};
// JSON inside <script> must never be able to close the element.
const jsonLd = JSON.stringify(person).replaceAll('<', '\\u003c');
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script is:inline set:html={INLINE_SCRIPTS.jsClass} />
    <title>{title}</title>
    <meta name="description" content={description} />
    {!noindex && <link rel="canonical" href={canonical} />}
    {noindex && <meta name="robots" content="noindex" />}
    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f2eef8" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#15161f" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:type" content="profile" />
    <meta property="og:site_name" content={site.name} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content={site.ogImageAlt} />
    <meta name="twitter:card" content="summary_large_image" />
    {!noindex && <script type="application/ld+json" set:html={jsonLd} />}
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <slot />
  </body>
</html>
```

- [ ] **Step 8: Write `src/pages/404.astro`**

```astro
---
// src/pages/404.astro
import Base from '../layouts/Base.astro';
---
<Base title="Page not found · Golden Wo" path="/404" noindex>
  <main id="main" class="wrap notfound">
    <h1>Nothing here.</h1>
    <p>That page doesn't exist. <a href="/">Back home</a></p>
  </main>
</Base>

<style>
  .notfound { padding-top: 20vh; padding-bottom: 20vh; }
  h1 { font-size: clamp(2.5rem, 7vw, 4rem); letter-spacing: -0.04em; margin: 0 0 12px; }
  p { color: var(--muted); }
  a { color: var(--accent); font-weight: 600; }
</style>
```

- [ ] **Step 9: Point the temporary `src/pages/index.astro` at the layout**

```astro
---
import Base from '../layouts/Base.astro';
---
<Base>
  <main id="main" class="wrap"><h1>Golden Wo</h1></main>
</Base>
```

- [ ] **Step 10: Run the tests to see them pass**

Run: `npm run typecheck && npm run build && npx playwright test`
Expected: `0 errors`; all e2e tests PASS (smoke, head, csp).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(layout): Mist tokens, base layout, head metadata, JSON-LD, CSP and 404 page"
```

---

### Task 7: Page sections

**Files:**
- Create: `src/components/Nav.astro`, `Hero.astro`, `Experience.astro`, `Studio.astro`, `ProjectGroup.astro`, `ProjectCard.astro`, `Footer.astro`, `tests/e2e/home.spec.ts`
- Modify: `src/pages/index.astro` (final)

- [ ] **Step 1: Write the failing test** (`tests/e2e/home.spec.ts`)

```ts
import { test, expect } from '@playwright/test';
import { findPrivateData } from '../../src/privacy.mjs';
import { roles } from '../../src/data/experience';
import { groups, projects } from '../../src/data/projects';
import { site } from '../../src/data/site';
import { studio } from '../../src/data/studio';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('hero names the person, with headline, bio, photo and profile links', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(site.name);
  await expect(page.locator('.hero .headline')).toHaveText(site.headline);
  await expect(page.locator('.hero .bio')).toHaveText(site.bio);
  await expect(page.locator('.hero img')).toHaveAttribute('alt', site.photoAlt);
  await expect(page.locator(`.hero a[href="${site.links.linkedin}"]`)).toHaveText('LinkedIn');
  await expect(page.locator(`.hero a[href="${site.links.github}"]`)).toHaveText('GitHub');
});

test('the résumé button follows site.resumePdf', async ({ page }) => {
  const button = page.getByRole('link', { name: 'Résumé (PDF)' });
  if (site.resumePdf) await expect(button).toHaveAttribute('href', site.resumePdf);
  else await expect(button).toHaveCount(0);
});

test('experience lists every role in order', async ({ page }) => {
  await expect(page.locator('#experience h3')).toHaveText(roles.map((r) => `${r.title} · ${r.org}`));
  await expect(page.locator('#experience .when')).toHaveText(roles.map((r) => r.when));
});

test('the Blindly section links the studio and its game', async ({ page }) => {
  const section = page.locator('#blindly');
  await expect(section.locator('.chip')).toHaveText(studio.role);
  await expect(section.locator(`a[href="${studio.url}"]`)).toHaveCount(1);
  await expect(section.locator(`a[href="${studio.featured.url}"]`)).toHaveCount(1);
  await expect(section.locator('img')).toHaveAttribute('alt', studio.featured.art.alt);
});

test('projects appear in their groups, in order', async ({ page }) => {
  await expect(page.locator('#projects h3')).toHaveText(groups.map((g) => g.title));
  for (const g of groups) {
    await expect(page.locator(`[data-group="${g.id}"] h4`)).toHaveText(projects.filter((p) => p.group === g.id).map((p) => p.name));
  }
});

test('project links name their project for screen readers', async ({ page }) => {
  const feed = projects.find((p) => p.id === 'ai-x-feed')!;
  await expect(page.getByRole('link', { name: 'Live for ai-x-feed' })).toHaveAttribute('href', feed.links.site!);
  await expect(page.getByRole('link', { name: 'Source for ai-x-feed' })).toHaveAttribute('href', feed.links.source!);
});

test('every in-page link points at an element that exists', async ({ page }) => {
  const hrefs = await page.locator('a[href^="#"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) await expect(page.locator(href), href).toHaveCount(1);
});

test('every image has alt text', async ({ page }) => {
  const missing = await page.locator('img').evaluateAll((imgs) =>
    imgs.filter((i) => !(i.getAttribute('alt') ?? '').trim()).map((i) => i.getAttribute('src')),
  );
  expect(missing).toEqual([]);
});

test('no email address or phone number anywhere on the page', async ({ page }) => {
  await expect(page.locator('a[href^="mailto:"], a[href^="tel:"]')).toHaveCount(0);
  expect(findPrivateData(await page.content())).toEqual([]);
});

for (const [width, columns] of [[375, 1], [768, 2], [1280, 3]] as const) {
  test(`project grids use ${columns} column(s) at ${width}px with no horizontal scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const tracks = await page
      .locator('#projects .grid')
      .first()
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(tracks).toBe(columns);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('the hero stacks the photo above the name on phones and beside it on desktop', async ({ page }) => {
  const photo = page.locator('.hero img');
  const name = page.getByRole('heading', { level: 1 });
  await page.setViewportSize({ width: 375, height: 900 });
  expect((await photo.boundingBox())!.y + (await photo.boundingBox())!.height).toBeLessThanOrEqual((await name.boundingBox())!.y);
  await page.setViewportSize({ width: 1280, height: 900 });
  expect((await photo.boundingBox())!.x + (await photo.boundingBox())!.width).toBeLessThanOrEqual((await name.boundingBox())!.x);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm run build && npx playwright test tests/e2e/home.spec.ts`
Expected: FAIL (no hero, sections or projects yet).

- [ ] **Step 3: Write `src/components/Nav.astro`**

```astro
---
// src/components/Nav.astro
import { site } from '../data/site';
---
<header class="site-header">
  <nav class="wrap nav" aria-label="Primary">
    <a class="wordmark" href="#top">{site.name}</a>
    <ul>
      <li><a href="#experience">Experience</a></li>
      <li><a href="#blindly">Blindly</a></li>
      <li><a href="#projects">Projects</a></li>
    </ul>
  </nav>
</header>

<style>
  .site-header {
    position: sticky; top: 0; z-index: 10;
    background: color-mix(in srgb, var(--bg-1) 60%, transparent);
    backdrop-filter: saturate(1.4) blur(12px);
    border-bottom: 1px solid var(--line);
  }
  .nav { display: flex; align-items: center; justify-content: space-between; height: 60px; }
  .wordmark { font-weight: 700; font-size: 1.05rem; letter-spacing: -0.02em; color: var(--ink); text-decoration: none; }
  ul { display: flex; gap: 14px; margin: 0; padding: 0; list-style: none; }
  ul a { color: var(--muted); font-size: 0.92rem; text-decoration: none; }
  ul a:hover { color: var(--ink); }
  @media (min-width: 640px) { ul { gap: 22px; } ul a { font-size: 0.95rem; } }
</style>
```

- [ ] **Step 4: Write `src/components/Hero.astro`**

```astro
---
// src/components/Hero.astro
import { Picture } from 'astro:assets';
import headshot from '../assets/headshot.jpg';
import { site } from '../data/site';
---
<section id="top" class="hero wrap">
  <Picture
    src={headshot}
    formats={['avif', 'webp']}
    widths={[148, 296]}
    sizes="148px"
    alt={site.photoAlt}
    class="photo"
    loading="eager"
    fetchpriority="high"
  />
  <div>
    <h1><span class="hero-blur">{site.name}</span></h1>
    <p class="headline">{site.headline}</p>
    <p class="bio">{site.bio}</p>
    <ul class="actions">
      {site.resumePdf && <li><a class="btn primary" href={site.resumePdf}>Résumé (PDF)</a></li>}
      <li><a class="btn" href={site.links.linkedin}>LinkedIn</a></li>
      <li><a class="btn" href={site.links.github}>GitHub</a></li>
    </ul>
  </div>
</section>

<style>
  .hero { display: grid; grid-template-columns: 1fr; gap: 20px; padding-top: clamp(40px, 8vw, 88px); padding-bottom: 32px; }
  .photo { display: block; width: 112px; height: 112px; border-radius: 50%; object-fit: cover; border: 1px solid var(--line); }
  h1 { margin: 0; font-size: clamp(2.25rem, 6vw, 3rem); font-weight: 800; line-height: 1.05; letter-spacing: -0.04em; }
  .hero-blur { display: inline-block; }
  .headline { margin: 6px 0 14px; font-size: 1.25rem; font-weight: 600; letter-spacing: -0.01em; color: var(--muted); }
  .bio { margin: 0 0 20px; max-width: 60ch; }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 0; padding: 0; list-style: none; }
  .btn {
    display: inline-block; padding: 9px 18px; border-radius: 999px;
    border: 1px solid var(--line); background: var(--card-strong); box-shadow: var(--shadow);
    color: var(--ink); font-weight: 600; text-decoration: none;
  }
  .btn:hover { border-color: var(--accent); }
  .btn.primary { background: var(--accent); color: var(--on-accent); border-color: transparent; }
  @media (min-width: 720px) {
    .hero { grid-template-columns: 148px 1fr; gap: 32px; align-items: center; }
    .photo { width: 148px; height: 148px; }
  }
</style>
```

- [ ] **Step 5: Write `src/components/Experience.astro`**

```astro
---
// src/components/Experience.astro
import { roles } from '../data/experience';
---
<section id="experience" class="wrap section" aria-labelledby="experience-title">
  <h2 id="experience-title" class="section-title">Experience</h2>
  <ol class="card timeline reveal">
    {roles.map((role) => (
      <li class="row">
        <p class="when">{role.when}</p>
        <div>
          <h3>{role.title} · {role.org}</h3>
          {role.summary && <p class="summary">{role.summary}</p>}
        </div>
      </li>
    ))}
  </ol>
</section>

<style>
  .timeline { margin: 0; padding: 4px 20px; list-style: none; }
  .row { display: grid; grid-template-columns: 1fr; gap: 2px; padding: 14px 0; border-top: 1px solid var(--line); }
  .row:first-child { border-top: 0; }
  .when { margin: 0; font-size: 0.9rem; font-variant-numeric: tabular-nums; color: var(--muted); }
  h3 { margin: 0; font-size: 1rem; letter-spacing: -0.01em; }
  .summary { margin: 2px 0 0; font-size: 0.95rem; color: var(--muted); }
  @media (min-width: 640px) { .row { grid-template-columns: 120px 1fr; gap: 16px; } .when { padding-top: 1px; } }
</style>
```

- [ ] **Step 6: Write `src/components/Studio.astro`**

```astro
---
// src/components/Studio.astro
import { studio } from '../data/studio';

const { art } = studio.featured;
const host = new URL(studio.url).host;
---
<section id="blindly" class="wrap section" aria-labelledby="blindly-title">
  <h2 id="blindly-title" class="section-title">{studio.name}</h2>
  <div class="card studio reveal">
    <img class="art" src={art.src} alt={art.alt} width={art.width} height={art.height} loading="lazy" decoding="async" />
    <div>
      <p class="chip">{studio.role}</p>
      <p class="blurb">I run <strong>{studio.name}</strong>, {studio.blurb}</p>
      <ul class="links">
        <li><a class="link" href={studio.url}>{host}<span aria-hidden="true"> →</span></a></li>
        <li><a class="link" href={studio.featured.url}>{studio.featured.name}<span aria-hidden="true"> →</span></a></li>
      </ul>
    </div>
  </div>
</section>

<style>
  .studio { display: grid; grid-template-columns: 1fr; gap: 20px; align-items: center; }
  .art { display: block; width: 100%; height: auto; border-radius: 10px; image-rendering: pixelated; }
  .chip {
    display: inline-block; margin: 0 0 8px; padding: 2px 10px; border-radius: 999px;
    background: var(--chip-bg); color: var(--accent); font-size: 0.8rem; font-weight: 600;
  }
  .blurb { margin: 0 0 12px; }
  @media (min-width: 720px) { .studio { grid-template-columns: 260px 1fr; gap: 24px; } }
</style>
```

- [ ] **Step 7: Write `src/components/ProjectCard.astro`**

```astro
---
// src/components/ProjectCard.astro
import type { Project } from '../data/types';

interface Props { project: Project }

const { project } = Astro.props;
const ORDER = ['site', 'source'] as const;
const LABEL = { site: 'Live', source: 'Source' } as const;
const links = ORDER.flatMap((kind) => (project.links[kind] ? [{ kind, url: project.links[kind]! }] : []));
---
<article class="card project reveal">
  <h4>{project.name}</h4>
  <p class="tagline">{project.tagline}</p>
  <p class="desc">{project.description}</p>
  {links.length > 0 && (
    <ul class="links">
      {links.map((link) => (
        <li><a class="link" href={link.url}>{LABEL[link.kind]}<span class="sr-only"> for {project.name}</span></a></li>
      ))}
    </ul>
  )}
</article>

<style>
  .project { display: flex; flex-direction: column; gap: 6px; }
  h4 { margin: 0; font-size: 1.05rem; letter-spacing: -0.01em; line-height: 1.3; overflow-wrap: anywhere; }
  .tagline { margin: 0; font-weight: 600; font-size: 0.92rem; }
  .desc { margin: 0; color: var(--muted); font-size: 0.92rem; }
  .links { margin-top: auto; padding-top: 6px; }
</style>
```

- [ ] **Step 8: Write `src/components/ProjectGroup.astro`**

```astro
---
// src/components/ProjectGroup.astro
import type { Project, ProjectGroupInfo } from '../data/types';
import ProjectCard from './ProjectCard.astro';

interface Props {
  group: ProjectGroupInfo;
  projects: Project[];
}

const { group, projects } = Astro.props;
---
<div class="group" data-group={group.id}>
  <h3>{group.title}</h3>
  <div class="grid">
    {projects.map((project) => <ProjectCard project={project} />)}
  </div>
</div>

<style>
  .group + .group { margin-top: 28px; }
  h3 { margin: 0 0 12px; font-size: 1.1rem; letter-spacing: -0.01em; }
  .grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
  @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }
</style>
```

- [ ] **Step 9: Write `src/components/Footer.astro`**

```astro
---
// src/components/Footer.astro
import { site } from '../data/site';

const year = new Date().getFullYear();
---
<footer class="site-footer">
  <div class="wrap footer-inner">
    <p>© {year} {site.name}</p>
    <ul class="links">
      <li><a class="link" href={site.links.linkedin}>LinkedIn</a></li>
      <li><a class="link" href={site.links.github}>GitHub</a></li>
    </ul>
  </div>
</footer>

<style>
  .site-footer { margin-top: 32px; padding: 28px 0 40px; border-top: 1px solid var(--line); font-size: 0.9rem; color: var(--muted); }
  .footer-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; }
  p { margin: 0; }
</style>
```

- [ ] **Step 10: Write the final `src/pages/index.astro`**

```astro
---
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Experience from '../components/Experience.astro';
import Footer from '../components/Footer.astro';
import Hero from '../components/Hero.astro';
import Nav from '../components/Nav.astro';
import ProjectGroup from '../components/ProjectGroup.astro';
import Studio from '../components/Studio.astro';
import { content } from '../data/content';
import { assertValidContent } from '../data/validate';
import Base from '../layouts/Base.astro';

assertValidContent(content, (path) => existsSync(join(process.cwd(), 'public', path)));
---
<Base>
  <Nav />
  <main id="main">
    <Hero />
    <Experience />
    <Studio />
    <section id="projects" class="wrap section" aria-labelledby="projects-title">
      <h2 id="projects-title" class="section-title">Projects</h2>
      {content.groups.map((group) => (
        <ProjectGroup group={group} projects={content.projects.filter((p) => p.group === group.id)} />
      ))}
    </section>
  </main>
  <Footer />
</Base>
```

- [ ] **Step 11: Run all tests to see them pass**

Run: `npm run typecheck && npm run build && npx playwright test`
Expected: `0 errors`; all e2e tests PASS.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(page): nav, hero, experience, Blindly and project sections"
```

---

### Task 8: Blur to focus

**Files:**
- Create: `src/scripts/focus.ts` (copied unchanged), `tests/e2e/focus.spec.ts`
- Modify: `src/styles/global.css` (append the focus rules), `src/layouts/Base.astro` (load the script)

- [ ] **Step 1: Write the failing test** (`tests/e2e/focus.spec.ts`, adapted from blindly-site without teasers)

```ts
import { test, expect, type Locator } from '@playwright/test';

const filterOf = (loc: Locator) => loc.evaluate((el) => getComputedStyle(el).filter);
const belowFold = '[data-group="research"] .card';

test('cards below the fold start blurred and sharpen when scrolled into view', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/focus-ready/);
  const card = page.locator(belowFold).first();
  expect(await filterOf(card)).toContain('blur');
  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => filterOf(card), { timeout: 3000 }).toBe('none');
});

test('the name sharpens after load', async ({ page }) => {
  await page.goto('/');
  const name = page.locator('.hero-blur');
  expect(await name.evaluate((el) => el.getAnimations().length)).toBe(1);
  await expect.poll(() => filterOf(name), { timeout: 4000 }).toBe('none');
});

test('print shows below-the-fold cards sharp', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/focus-ready/);
  const card = page.locator(belowFold).first();
  expect(await filterOf(card)).toContain('blur');
  await page.emulateMedia({ media: 'print' });
  expect(await filterOf(card)).toBe('none');
});

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('nothing is blurred or animated', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/focus-ready/);
    expect(await filterOf(page.locator(belowFold).first())).toBe('none');
    expect(await filterOf(page.locator('.hero-blur'))).toBe('none');
    expect(await page.locator('.hero-blur').evaluate((el) => el.getAnimations().length)).toBe(0);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('everything is sharp', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/focus-ready/);
    expect(await filterOf(page.locator(belowFold).first())).toBe('none');
    expect(await filterOf(page.locator('.hero-blur'))).toBe('none');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm run build && npx playwright test tests/e2e/focus.spec.ts`
Expected: FAIL (`focus-ready` never set; no animation).

- [ ] **Step 3: Copy the script and append the CSS rules from blindly-site**

```bash
mkdir -p src/scripts
cp "$BLINDLY/src/scripts/focus.ts" src/scripts/
cat >> src/styles/global.css <<'EOF'

/* Blur to focus: only active once focus.ts has run (html.focus-ready). */
/* Blur only, never opacity: a dimmed card is a contrast failure while it waits off-screen. */
html.focus-ready .reveal { transition: filter 0.7s ease; }
html.focus-ready .reveal:not(.in-view) { filter: blur(3px); }

@media (prefers-reduced-motion: reduce) {
  html.focus-ready .reveal { transition: none; }
  html.focus-ready .reveal:not(.in-view) { filter: none; }
}

@media print {
  html.focus-ready .reveal,
  html.focus-ready .reveal:not(.in-view) { filter: none; transition: none; }
}

/* The name sharpens on load with no motion preference. Keyed on html.js, set
   inline in <head>, so the animation exists from first paint (focus.ts loads later). */
@media (prefers-reduced-motion: no-preference) {
  html.js .hero-blur { animation: unblur 1.4s ease-out 0.2s backwards; }
}
@keyframes unblur {
  from { filter: blur(8px); }
  to { filter: none; }
}
EOF
```

- [ ] **Step 4: Load the script in `src/layouts/Base.astro`**

Replace the end of `<body>`:

```astro
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <slot />
    <script>
      import '../scripts/focus';
    </script>
  </body>
```

- [ ] **Step 5: Run all e2e tests to see them pass** (the CSP test now also covers the bundled focus script)

Run: `npm run build && npx playwright test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(motion): blur-to-focus cards and name, ported from blindly-site"
```

---

### Task 9: Privacy scan of the build

**Files:**
- Create: `scripts/privacy-scan.mjs`, `tests/unit/privacy-scan.test.ts`

- [ ] **Step 1: Write the failing test** (`tests/unit/privacy-scan.test.ts`)

```ts
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { afterEach, expect, test } from 'vitest';

const dirs: string[] = [];
const fixture = (files: Record<string, string | Buffer>) => {
  const dir = mkdtempSync(join(tmpdir(), 'privacy-'));
  dirs.push(dir);
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return dir;
};
const scan = (dir: string) => spawnSync(process.execPath, ['scripts/privacy-scan.mjs', dir], { encoding: 'utf8' });
const pdfOf = async (html: string, title = '') => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage();
    await page.setContent(`<title>${title}</title>${html}`);
    return await page.pdf();
  } finally {
    await browser.close();
  }
};

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

test('passes a clean build', () => {
  const result = scan(fixture({ 'index.html': '<p>Software engineer in Boston.</p>', _headers: '/*\n  X-Frame-Options: DENY\n' }));
  expect(result.status, result.stdout).toBe(0);
  expect(result.stdout).toContain('PASS privacy scan: 2 files');
});

test('fails on an email address in HTML, reporting the count but not the value', () => {
  const result = scan(fixture({ 'index.html': '<a href="mailto:someone@example.com">mail</a>' }));
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('1 email match(es)');
  expect(result.stdout).not.toContain('example.com');
});

test('fails on a phone number in a PDF', async () => {
  const result = scan(fixture({ 'resume.pdf': await pdfOf('<p>Call (617) 555-0123</p>') }));
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('1 phone match(es)');
}, 30_000);

test('fails on an email address in PDF metadata', async () => {
  const result = scan(fixture({ 'resume.pdf': await pdfOf('<p>Clean page</p>', 'someone@example.com') }));
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('email match(es)');
}, 30_000);

test('fails when there is nothing to scan', () => {
  expect(scan(fixture({})).status).toBe(1);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/unit/privacy-scan.test.ts`
Expected: FAIL (`Cannot find module '.../scripts/privacy-scan.mjs'`, exit status 1 for the clean case).

- [ ] **Step 3: Implement `scripts/privacy-scan.mjs`**

```js
// scripts/privacy-scan.mjs: fails if the build ships an email address or a phone number.
// The repo and the site are public, so this runs after every build (npm run check, CI).
// Usage: node scripts/privacy-scan.mjs [dir=dist]. Reports counts per file, never the values.
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { extractText, getDocumentProxy, getMeta } from 'unpdf';
import { findPrivateData } from '../src/privacy.mjs';

// '' covers extensionless files such as _headers.
const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.txt', '.xml', '.svg', '.webmanifest', '']);
const root = process.argv[2] ?? 'dist';

async function textOf(path) {
  if (extname(path) !== '.pdf') return readFile(path, 'utf8');
  const pdf = await getDocumentProxy(new Uint8Array(await readFile(path)));
  try {
    const { text } = await extractText(pdf, { mergePages: true });
    const { info, metadata } = await getMeta(pdf);
    return [text, JSON.stringify(info ?? {}), JSON.stringify(metadata ?? {})].join('\n');
  } finally {
    await pdf.loadingTask.destroy();
  }
}

const files = (await readdir(root, { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => join(entry.parentPath, entry.name))
  .filter((path) => extname(path) === '.pdf' || TEXT.has(extname(path)));

let failed = files.length === 0;
if (failed) console.log(`FAIL no files to scan under ${root}`);
for (const file of files) {
  for (const { kind, count } of findPrivateData(await textOf(file))) {
    failed = true;
    console.log(`FAIL ${file}: ${count} ${kind} match(es)`);
  }
}
if (!failed) console.log(`PASS privacy scan: ${files.length} files, no email addresses or phone numbers`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 4: Run it to see it pass, then scan the real build**

Run: `npx vitest run tests/unit/privacy-scan.test.ts && npm run build && npm run privacy`
Expected: 5 tests PASS; then `PASS privacy scan: N files, no email addresses or phone numbers`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(privacy): post-build scan of dist, including PDF text and metadata"
```

---

### Task 10: Security headers

**Files:**
- Create: `public/_headers`, `tests/unit/headers.test.ts`

- [ ] **Step 1: Write the failing test** (`tests/unit/headers.test.ts`)

```ts
import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

/** Parses Cloudflare's _headers format: a path line, then indented "Name: value" lines. */
function parseHeaders(text: string): Map<string, Map<string, string>> {
  const rules = new Map<string, Map<string, string>>();
  let current: Map<string, string> | undefined;
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = new Map();
      rules.set(line.trim(), current);
      continue;
    }
    const colon = line.indexOf(':');
    current?.set(line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim());
  }
  return rules;
}

const rules = existsSync('public/_headers') ? parseHeaders(readFileSync('public/_headers', 'utf8')) : new Map();

test('every response gets the security headers', () => {
  expect(Object.fromEntries(rules.get('/*') ?? [])).toEqual({
    'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    'cross-origin-opener-policy': 'same-origin',
  });
});

test('hashed build assets are cached for a year', () => {
  expect(rules.get('/_astro/*')?.get('cache-control')).toBe('public, max-age=31536000, immutable');
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/unit/headers.test.ts`
Expected: FAIL (empty rules).

- [ ] **Step 3: Write `public/_headers`**

```
# Applied by Cloudflare Workers static assets (not served as a file). The CSP itself is a <meta> tag from Astro;
# these are the headers a meta tag cannot carry.
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

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run`
Expected: all unit tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(security): HSTS, framing, referrer, permissions and cache headers"
```

---

### Task 11: Accessibility and Lighthouse gates, one check command, CI

**Files:**
- Create: `tests/e2e/a11y.spec.ts`, `scripts/preview-server.mjs`, `scripts/lighthouse.mjs` (copied), `.github/workflows/ci.yml` (copied)

- [ ] **Step 1: Write `tests/e2e/a11y.spec.ts`** (blindly-site's, plus a phone width)

```ts
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
  for (const width of [390, 1280]) {
    test(`no serious or critical accessibility violations (${colorScheme}, ${width}px)`, async ({ page }) => {
      // Reduced motion keeps everything sharp, so axe can measure contrast.
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const blocking = results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
      expect(blocking).toEqual([]);
    });
  }
}
```

- [ ] **Step 2: Run it**

Run: `npm run build && npx playwright test tests/e2e/a11y.spec.ts`
Expected: 4 PASS. If a contrast failure appears, adjust the offending token in `tokens.css` (darker `--muted` or
`--accent` in light mode, lighter in dark mode) and re-run. Never filter the violation out.

- [ ] **Step 3: Copy the Lighthouse gate, its preview helper and CI, then add the browser override**

```bash
mkdir -p scripts .github/workflows
cp "$BLINDLY/scripts/preview-server.mjs" "$BLINDLY/scripts/lighthouse.mjs" scripts/
cp "$BLINDLY/.github/workflows/ci.yml" .github/workflows/
```

In `scripts/lighthouse.mjs`, change the `chromePath` line to:

```js
    chromePath: process.env.CHROMIUM_EXECUTABLE ?? chromium.executablePath(),
```

- [ ] **Step 4: Run the full gate**

Run: `npm run check`
Expected: typecheck `0 errors`; unit PASS; build complete; `PASS privacy scan`; e2e PASS;
`PASS performance ≥95`, `PASS accessibility: 100`, `PASS best-practices ≥95`, `PASS seo ≥95`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: axe and Lighthouse gates, single check command, CI workflow"
```

---

### Task 12: Sign-off screenshots, runbook, live checks and repo docs

**Files:**
- Create: `scripts/screenshots.mjs` (copied), `scripts/verify-live.mjs`, `docs/deploy.md`, `README.md`, `AGENTS.md`, `.claude/CLAUDE.md`

- [ ] **Step 1: Copy the screenshot script and take screenshots**

```bash
cp "$BLINDLY/scripts/screenshots.mjs" scripts/
```

In `scripts/screenshots.mjs`, change `const browser = await chromium.launch();` to:

```js
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
```

```bash
npm run screenshots
```

Expected: `wrote screenshots/` (gitignored), 375/768/1280 px in light and dark, plus one motion shot. Review them
for layout and copy problems before sharing with the owner.

- [ ] **Step 2: Write `scripts/verify-live.mjs`**

```js
// scripts/verify-live.mjs: post-deploy checks for goldenwo.dev, its DNS, and the old goldenwo.github.io URL.
// `npm run verify:live -- --skip-old-url` skips the goldenwo.github.io stub check (before the stub is pushed).
import { Resolver } from 'node:dns/promises';

const skipOldUrl = process.argv.includes('--skip-old-url');
const resolver = new Resolver();
resolver.setServers(['1.1.1.1']);
let failed = false;

async function check(name, fn) {
  try {
    const detail = await fn();
    console.log(`PASS ${name}${detail ? ` (${detail})` : ''}`);
  } catch (error) {
    failed = true;
    console.log(`FAIL ${name}: ${error.message}`);
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await check('apex serves the site over HTTPS with a CSP', async () => {
  const res = await fetch('https://goldenwo.dev/', { redirect: 'manual' });
  assert(res.status === 200, `status ${res.status}`);
  const html = await res.text();
  assert(html.includes('Software engineer in Boston'), 'page content missing');
  assert(html.includes('http-equiv="content-security-policy"'), 'CSP meta missing');
  return 'HTTP 200';
});
await check('security headers are set', async () => {
  const res = await fetch('https://goldenwo.dev/');
  const want = {
    'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'cross-origin-opener-policy': 'same-origin',
  };
  for (const [name, value] of Object.entries(want)) assert(res.headers.get(name) === value, `${name}: ${res.headers.get(name)}`);
  assert(res.headers.get('permissions-policy')?.includes('camera=()'), 'permissions-policy missing');
});
await check('hashed assets are cached immutably', async () => {
  const html = await (await fetch('https://goldenwo.dev/')).text();
  const asset = html.match(/\/_astro\/[^"'\s,]+/)?.[0];
  assert(asset, 'no /_astro/ asset referenced');
  const cache = (await fetch(`https://goldenwo.dev${asset}`)).headers.get('cache-control');
  assert(cache?.includes('immutable'), `cache-control ${cache}`);
  return asset;
});
await check('unknown paths return 404', async () => {
  const res = await fetch('https://goldenwo.dev/does-not-exist', { redirect: 'manual' });
  assert(res.status === 404, `status ${res.status}`);
});
await check('www redirects to the apex with a 301, keeping path and query', async () => {
  const res = await fetch('https://www.goldenwo.dev/some/path?x=1', { redirect: 'manual' });
  const location = res.headers.get('location');
  assert(res.status === 301, `status ${res.status}`);
  assert(location === 'https://goldenwo.dev/some/path?x=1', `location ${location}`);
  return location;
});
await check('http upgrades to https', async () => {
  const res = await fetch('http://goldenwo.dev/', { redirect: 'manual' });
  const location = res.headers.get('location');
  assert([301, 308].includes(res.status), `status ${res.status}`);
  assert(location === 'https://goldenwo.dev/', `location ${location}`);
});
await check('null MX (the domain receives no mail)', async () => {
  const mx = await resolver.resolveMx('goldenwo.dev');
  assert(mx.length === 1 && mx[0].priority === 0 && mx[0].exchange === '', JSON.stringify(mx));
});
await check('SPF allows no senders', async () => {
  const txt = (await resolver.resolveTxt('goldenwo.dev')).map((parts) => parts.join(''));
  assert(txt.includes('v=spf1 -all'), txt.join(' | '));
});
await check('DMARC rejects spoofed mail', async () => {
  const txt = (await resolver.resolveTxt('_dmarc.goldenwo.dev')).map((parts) => parts.join(''));
  assert(txt.some((t) => t.startsWith('v=DMARC1') && /\bp=reject\b/.test(t)), txt.join(' | '));
});
await check('no wildcard record', async () => {
  try {
    const a = await resolver.resolve4('wildcard-probe-7f3a.goldenwo.dev');
    throw new Error(`a random name resolved to ${a.join(', ')}`);
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') return 'random name does not resolve';
    throw error;
  }
});
await check('ai-x-feed still served from goldenwo.github.io', async () => {
  const res = await fetch('https://goldenwo.github.io/ai-x-feed/', { redirect: 'manual' });
  assert(res.status === 200, `status ${res.status}`);
});
if (!skipOldUrl) {
  await check('goldenwo.github.io points to goldenwo.dev', async () => {
    const res = await fetch('https://goldenwo.github.io/', { redirect: 'manual' });
    assert(res.status === 200, `status ${res.status}`);
    const html = await res.text();
    assert(html.includes('url=https://goldenwo.dev/'), 'meta refresh missing');
    assert(html.includes('rel="canonical" href="https://goldenwo.dev/"'), 'canonical missing');
  });
}

process.exit(failed ? 1 : 0);
```

- [ ] **Step 3: Write `docs/deploy.md`**

````markdown
# Deploying goldenwo.dev

Hosting: Cloudflare Workers (static assets only), built by Workers Builds from `goldenwo/goldenwo.dev`.
Config: `wrangler.jsonc`. Build output: `dist/`. Security headers: `public/_headers`. Every step here is the
owner's to do in the Cloudflare dashboard.

## A. Connect the repo (one time, preview only)

1. **Workers & Pages** → **Create** → **Import a repository**.
2. Connect GitHub. When asked which repositories Cloudflare may access, choose **Only select repositories** →
   `goldenwo/goldenwo.dev` (add it to the existing selection that holds `blindly-site`).
3. Settings:
   - Project name: **goldenwo-dev** (must match `name` in `wrangler.jsonc`)
   - Production branch: **main**
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Preview command (non-production branches): `npx wrangler preview`
   - Preview builds: on. Cloudflare Access: off (public site).
   - Advanced: path `/`; let Cloudflare create the API token; no variables.
4. **Deploy**. Open the `*.workers.dev` URL and review the page and copy.

## B. Attach the domain (after visual sign-off)

1. **Apex:** **Workers & Pages** → **goldenwo-dev** → **Domains** → **Add Domain** → `goldenwo.dev`. Do this here,
   not via `routes` in `wrangler.jsonc`: the Workers Builds token cannot create DNS records (code 10013).
2. **www (redirect only):**
   - **DNS** → **Records** → `AAAA`, name `www`, address `100::`, **Proxied**.
   - **Rules** → **Redirect Rules** → template "Redirect from WWW to root", rule name `www to apex`: **Wildcard
     pattern**, request URL `https://www.goldenwo.dev/*` → target `https://goldenwo.dev/${1}`, **301**,
     **Preserve query string** on.
3. **SSL/TLS** → **Edge Certificates** → **Always Use HTTPS**: **On**.
4. **Anti-spoofing** (goldenwo.dev sends and receives no mail):
   - `MX`, name `@`, mail server `.`, priority `0` (null MX, RFC 7505).
   - `TXT`, name `@`, content `v=spf1 -all`.
   - `TXT`, name `_dmarc`, content `v=DMARC1; p=reject; adkim=s; aspf=s;`.
   If the dashboard refuses `.` as a mail server, skip the null MX and tell Claude; SPF and DMARC still block
   spoofing, and `verify-live.mjs` gets its MX check removed.
5. **Domain Registration** → **goldenwo.dev** → confirm **Auto-renew** is on (expires 2027-10-05).
6. Run `npm run verify:live -- --skip-old-url`. All checks must pass.

## C. Old URL (after B passes)

Claude replaces `goldenwo/goldenwo.github.io`'s `gh-pages` and `master` content with a stub pointing to
`https://goldenwo.dev/` (owner's OK first). Then run `npm run verify:live` with no flags. All checks must pass.

## Never

- Add a wildcard record, or any record other than the apex, `www` and `_dmarc` ones above.
- Set a custom domain on `goldenwo/goldenwo.github.io`: it would move project sites such as `/ai-x-feed/`.
````

- [ ] **Step 4: Write `README.md`**

```markdown
# goldenwo.dev

Source of [goldenwo.dev](https://goldenwo.dev), the personal site of Golden Wo.

Astro 7 static site, served by a Cloudflare Worker. All copy lives in `src/data/`. `npm run check` runs the
typecheck, unit tests, build, privacy scan, Playwright with axe, and Lighthouse budgets.

Design: `docs/superpowers/specs/2026-10-05-goldenwo-dev-design.md`. Deploy runbook: `docs/deploy.md`.
```

- [ ] **Step 5: Write `AGENTS.md` and `.claude/CLAUDE.md`** (same content in both)

```markdown
# Project conventions for AI agents

> Universal rules (Always/Never/Ask + C-series conventions) live in
> `~/.claude/CLAUDE.md` and apply automatically to every repo on this
> machine. THIS file is for project-specific framing only.

goldenwo.dev: personal site of Golden Wo (the owner), the counterpart to the studio site blindly.ai.
Design: `docs/superpowers/specs/2026-10-05-goldenwo-dev-design.md`.

## Always do
- Change copy only in `src/data/*.ts`; components only render it.
- Run `npm run check` before calling work done.

## Never do
- Commit an email address, phone number, street address or the private résumé: the repo and the site are public.
  Only the owner's redacted résumé export goes in `public/`. Never weaken or skip the privacy scan.
- Set a custom domain on `goldenwo/goldenwo.github.io` (it would move project sites such as `/ai-x-feed/`).
- Touch DNS records other than the apex, `www` and `_dmarc`. Never create a wildcard record.
- Link blindly.ai to this site; the studio never names the owner.

## Ask first
- Any Cloudflare dashboard, DNS, or deploy change; pushing to GitHub; creating repos.
```

```bash
mkdir -p .claude
cp AGENTS.md .claude/CLAUDE.md
```

- [ ] **Step 6: Run the full gate and commit**

Run: `npm run check`
Expected: all gates PASS.

```bash
git add -A
git commit -m "docs: deploy runbook, live checks, README and agent conventions"
```

---

### Task 13: Publish the repo (owner OK required)

- [ ] **Step 1: Check the history for private data before it goes public**

```bash
git grep -n -i 'gmail\.com' $(git rev-list --all) || echo "no gmail addresses"
git grep -n -P '\(?\b[0-9]{3}\)?[ .-]?[0-9]{3}[ .-][0-9]{4}\b' $(git rev-list --all) -- ':!tests' ':!docs/superpowers/plans' ':!package-lock.json' || echo "no phone numbers"
```

Expected: `no gmail addresses` and `no phone numbers`.

- [ ] **Step 2: Ask the owner, then create the public repo `goldenwo/goldenwo.dev`** (no README, licence or
  .gitignore from GitHub), with the description "Personal site of Golden Wo" and website `https://goldenwo.dev`.

- [ ] **Step 3: Ask the owner, then push**

```bash
git remote add origin https://github.com/goldenwo/goldenwo.dev.git
git push -u origin main
```

- [ ] **Step 4: Confirm CI is green** on the pushed commit. If it is red, fix the cause and push again (with OK).

---

### Task 14: Cloudflare (owner)

- [ ] **Step 1:** Owner follows `docs/deploy.md` section A. Share the `workers.dev` URL and the Task 12 screenshots;
  owner signs off on look and copy. Copy changes go into `src/data/*.ts`, then `npm run check`, commit, push (OK).
- [ ] **Step 2:** Owner follows section B.
- [ ] **Step 3:** Run `npm run verify:live -- --skip-old-url`. Expected: every line `PASS`.

---

### Task 15: Point the old URL at goldenwo.dev (owner OK required)

Only after Task 14 passes. Work in `$OLD_SITE`.

- [ ] **Step 1: Write the stub on `gh-pages`**

```bash
cd "$OLD_SITE"
git fetch origin gh-pages master
git switch gh-pages
git rm -r -q .
cat > index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Golden Wo · moved to goldenwo.dev</title>
    <link rel="canonical" href="https://goldenwo.dev/">
    <meta http-equiv="refresh" content="0; url=https://goldenwo.dev/">
  </head>
  <body>
    <p>This site has moved to <a href="https://goldenwo.dev/">goldenwo.dev</a>.</p>
  </body>
</html>
EOF
touch .nojekyll
git add index.html .nojekyll
git commit -m "Point goldenwo.github.io to goldenwo.dev"
```

Expected: `git ls-files` lists only `.nojekyll` and `index.html`. There is no `CNAME` file.

- [ ] **Step 2: Write the same stub plus a README on `master`**

```bash
git switch master
git rm -r -q .
git checkout gh-pages -- index.html .nojekyll
cat > README.md <<'EOF'
# goldenwo.github.io

This site now lives at [goldenwo.dev](https://goldenwo.dev). Source: [goldenwo/goldenwo.dev](https://github.com/goldenwo/goldenwo.dev).

This repo only serves a redirect stub. Do not set a custom domain here: project sites such as `/ai-x-feed/` are
served under `goldenwo.github.io` and would move.
EOF
git add index.html .nojekyll README.md
git commit -m "Point goldenwo.github.io to goldenwo.dev"
```

- [ ] **Step 3: Ask the owner, then push both branches**

```bash
git push origin gh-pages master
```

- [ ] **Step 4: Verify** (GitHub Pages takes about a minute to rebuild)

Run from the new repo: `npm run verify:live`
Expected: every line `PASS`, including `goldenwo.github.io points to goldenwo.dev` and `ai-x-feed still served`.

- [ ] **Step 5: Owner updates the website field** on LinkedIn and the GitHub profile to `https://goldenwo.dev`.

---

### Task 16: Public résumé PDF (when the owner's redacted export arrives)

- [ ] **Step 1:** Save the export as `public/golden-wo-resume.pdf` and set `resumePdf: '/golden-wo-resume.pdf'` in
  `src/data/site.ts`. If the updated résumé changes roles or dates, update `src/data/experience.ts` to match.
- [ ] **Step 2:** Run `npm run check`. The privacy scan must PASS on the PDF; if it reports a match, the export still
  carries a phone number or email (text or metadata). Ask the owner for a new export; never allowlist it.
- [ ] **Step 3:** Commit `feat(content): public résumé PDF`, then push (owner OK).
