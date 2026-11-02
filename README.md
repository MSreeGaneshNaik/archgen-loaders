# Archgen Labs website

Site for Archgen Labs (archgenlabs.com): **the future of compute starts with how we design it**. Three hash-routed pages (Home, Blog, Contact) live in one self-contained `index.html`; each blog post is its own static page under `blog/posts/`. No framework, no runtime dependencies from the network: the font, Three.js and every image are served from this repo.

## Quick start

```sh
# any static server works; serve the folder (file:// works too, but serving is what Lighthouse and real visitors see)
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` or a post straight from disk also works: the font comes from `assets/fonts/local-fonts.js` there, since browsers refuse to fetch font files on `file://`.

Routes: `#home`, `#blog`, `#contact` on `index.html`; posts at `blog/posts/<slug>.html`.

## Deploy

The site is static, so it runs on GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3 or anything else that serves files.

**GitHub Pages:** Settings → Pages → Build and deployment → *Deploy from a branch* → `main` / `/ (root)` → Save. `.nojekyll` stops Jekyll from touching the files. A **private** repo needs a paid GitHub plan (Pro, Team or Enterprise) for Pages; on the free plan, make the repo public first.

The live site is https://archgenlabs.com, served by Vercel. This copy is also published on GitHub Pages from `main`: https://msreeganeshnaik.github.io/archgen-loaders/

**Vercel (archgenlabs.com):** `vercel.json` sends archgen.tech, www.archgen.tech and www.archgenlabs.com to https://archgenlabs.com with a permanent (308) redirect, so every old link lands on the .com.

## Folder structure

The repo has three parts:
- the **site** that gets served: `index.html`, `blog/`, `assets/` and the root files;
- the **sources** you edit: `tools/`;
- **generated** output that the build writes from those sources.

Never edit a generated file by hand. Change its source in `tools/` and rebuild (see Building). Public URLs (`/`, `/blog/posts/<slug>.html`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`) are fixed: moving those files would break links and search rankings.

`[gen]` marks generated output; `(local)` marks files that are not committed.

```
archgen-loaders/
│
├── index.html                      Home, Blog and Contact in one file (hash routes #home, #blog, #contact); map below
│
├── blog/                           ── the post pages ──
│   ├── post.css                    styles shared by every post page (brand tokens repeated from index.html)
│   ├── post.js                     behaviour shared by every post: contents rail, reading bar, image viewer, back to top
│   ├── posts/                [gen] one page per post, written by tools/build_posts.py
│   │   ├── how-we-ranked-first-in-the-partcl.html     Fig 1
│   │   ├── why-chip-design-takes-18-months.html       Fig 2
│   │   ├── cognitive-agents-next-era-silicon.html     Fig 3
│   │   └── disrupting-semiconductor-ai-agents.html    Fig 4
│   └── figures/              [gen] the 3D figure for each post, written by tools/figures/build.mjs
│       ├── <slug>.html             the figure card dropped into its post (poster, corner labels, key)
│       ├── <slug>.3d.js            that post's 3D scene, minified
│       ├── three-kit.js            the shared 3D kit, minified
│       └── fig.css                 card styles (inlined into each post)
│
├── assets/                         ── everything the pages load ──
│   ├── blog/                       the posts' images, exactly as published (+ lossless .webp twins)
│   ├── css/                        booking.css (the booking-calendar dialog)
│   ├── js/                         booking.js (opens the booking calendar for every Contact link), footer-reveal.js (the footer's
│   │                               slide-up entrance, Home and posts), analytics.js (Microsoft Clarity, production hosts only)
│   ├── figures/              [gen] still posters of the 3D figures: <slug>-wide.webp, <slug>-narrow.webp
│   ├── fonts/                      Cascadia Code (self-hosted woff2, licence in OFL.txt) + local-fonts.js, the file:// fallback
│   ├── logo/                       archgen-labs-lockup.svg (the wordmark), the favicon and raster icons (512px, apple-touch)
│   ├── social/                     og-1200x630.png, the card shown when a link is shared ([gen] by tools/social/og.mjs)
│   └── vendor/                     three.min.js (Three.js r158, trimmed to what the figures use) + its licence
│
├── tools/                          ── sources and build scripts: edit here ──
│   ├── build.sh                    rebuilds everything generated, in order, then runs check.py
│   ├── posts.json                  the posts' text and metadata, word for word as published
│   ├── build_posts.py              posts.json + index.html (header, footer, font shim) → blog/posts/, the Blog list
│   │                               in index.html and the post entries of sitemap.xml; inlines tools/loader/ into every page
│   ├── check.py                    fails the build on a missing file or #anchor, a repeated or off-site sitemap URL,
│   │                               or a page whose canonical tag is not its own archgenlabs.com URL
│   ├── loader/                     the loading screen's sources (inlined by build_posts.py; no page loads these files)
│   │   ├── archgen-loader.css      its styles
│   │   └── archgen-loader-route.js its script: the Route animation and its handoff to the header logo
│   ├── figures/                    the 3D figures
│   │   ├── three/
│   │   │   ├── three-kit.js        shared kit: loading, colours, parts, framing, turning, frame loop
│   │   │   └── <slug>.3d.js        one scene per post: model → timeline → scene → frame
│   │   ├── figures.json            each card's number, title, description and key
│   │   ├── fig.css                 card styles
│   │   ├── build.mjs               writes blog/figures/ from empty (and, with THREE_DIR, the trimmed three.min.js)
│   │   ├── posters.mjs             renders assets/figures/ from the scenes
│   │   ├── posters.json      [gen] poster sizes and each card's first readout
│   │   └── three-entry.js          the Three.js classes the trimmed bundle keeps
│   ├── hairline/
│   │   └── stack.js                the Home page's 3D chip-stack model (the source of index.html's #hl-figure)
│   └── social/
│       ├── og.html                 the share card's layout (words, die, wordmark)
│       └── og.mjs                  renders it to assets/social/og-1200x630.png
│
├── robots.txt                      crawl rules (search and AI crawlers welcome)
├── sitemap.xml                     the URLs to index (post entries [gen] by build_posts.py)
├── llms.txt                        a plain-text brief of the company for AI assistants
├── .nojekyll                       tells GitHub Pages to serve files as they are
├── vercel.json                     redirects archgen.tech and www to archgenlabs.com
├── package.json                    pins esbuild for the build: npm install once
├── package-lock.json               the exact esbuild version installed
├── .gitignore                      keeps node_modules/ out of git
├── node_modules/           (local) esbuild, after npm install
├── README.md                       this file
└── CHANGELOG.md                    what changed, round by round
```

**Inside `index.html`**, top to bottom. The file opens with an overview comment, and the main `<style>` and `<script>` each open with a contents list; every part starts with a `/* ---- name ---- */` line, so search for the name. In the styles, later sections override earlier ones on purpose: add a rule next to the part it styles, not at the end.

| Block | What it holds |
|---|---|
| `<head>` | scroll-to-top-on-open, the file:// font shim (between `fonts:head` markers, shared with the posts), meta tags, Open Graph, JSON-LD |
| `<style>` | brand tokens (`:root`), then one section per part: top bar, content rail, hero and agent console, marquee, poster and editor, Blog list, Contact, footer, mobile menu, ASCII horizon, PixelBlast, news bar, 3D stack labels |
| Loading screen (`#agl-css`, `#agl-js`) | inlined by the build from `tools/loader/archgen-loader.css` and `tools/loader/archgen-loader-route.js`; do not edit here |
| News bar, `<header class="bar">`, `#menu` | the strip above the header, the top bar and the phone menu (Blog 01, Contact 02) |
| `<section data-page="home">` | hero (headline, Contact us on phones, asks on tablet and desktop, agent console in `.stage-pin`), "Built for physical design", chip-flow marquee, 3D stack, "Inside a run" poster and editor |
| `<section data-page="blog">` | the post list `<ol id="posts">` [gen] |
| `<section data-page="contact">` | "Let’s talk silicon." and a "Book a conversation" button (opens the booking dialog) |
| `<footer>` | the call to talk, links, the wordmark (lifted into every post by build_posts.py); its entrance is `assets/js/footer-reveal.js` |
| main `<script>` | scheduler (`defer`, `whenNear`, and `scrollidle`, which holds the canvas effects still while the page scrolls), hero reveal (plays once), router, content rail, mobile menu, ASCII horizon, PixelBlast, news bar, hero scroll stack, the agent console, editor tabs, email copy, Blog/Contact dot-matrix die, scroll-in entrances |
| `#hl-kernel`, `#hl-host`, `#hl-figure` | the Hairline engine, its host for this page, and the chip-stack figure (copy of tools/hairline/stack.js) |

**Where to go for a change**

| To change… | Edit | Then run |
|---|---|---|
| Home or Contact | `index.html` | nothing (posts too if you changed the header or footer: `sh tools/build.sh`) |
| A post's words, title, date or excerpt (also updates the Blog list) | `tools/posts.json` | `sh tools/build.sh` |
| How post pages look or behave | `blog/post.css`, `blog/post.js` | nothing |
| A 3D figure's machine or motion | `tools/figures/three/<slug>.3d.js` | `sh tools/build.sh --posters` |
| What all figures share (colours, light, turning) | `tools/figures/three/three-kit.js` | `sh tools/build.sh --posters` |
| A figure card's title, description or key | `tools/figures/figures.json` | `sh tools/build.sh` |
| Images in a post | `assets/blog/` (keep the file name) | `sh tools/build.sh` (re-reads image sizes) |
| The logo | `assets/logo/archgen-labs-lockup.svg` and the inline copies in the header and footer of `index.html` | `sh tools/build.sh` (posts lift the header and footer) |
| The loading screen | `tools/loader/` | `sh tools/build.sh` (inlines it into every page) |
| The booking calendar link | `assets/js/booking.js` (`url`) | nothing |
| The share card | `tools/social/og.html` | `node tools/social/og.mjs` |

## Building

Everything under `blog/posts/`, `blog/figures/` and `assets/figures/` is generated. Edit the sources in `tools/`, then:

```sh
npm install                   # once: the pinned esbuild the figure build minifies with
sh tools/build.sh             # figures, then posts (the Blog list, the sitemap's post entries), then the page check
sh tools/build.sh --posters   # also re-render the still posters (after any change to a 3D scene)
```

**Requirements:** Node 18+ (with `npm install` run once, for esbuild; the build stops if it is missing rather than ship unminified files) and Python 3 with Pillow (`pip install pillow`; the post builder reads image sizes with it). The build ends with `tools/check.py`, which fails if any page or style sheet points to a file or `#anchor` that does not exist, such as a renamed image, font or slug.

Optional tools, picked up from environment variables: `ESBUILD=/path/to/node_modules/esbuild/lib/main.js` (an esbuild other than the installed one), `THREE_DIR=/path/to/node_modules/three` with three@0.158.0 (a fresh tree-shaken bundle; without it the vendored one is kept), `PLAYWRIGHT=/path/to/playwright` (posters).

## Brand system

Light "ice paper" theme. One committed look; there is no dark mode. All of these are CSS custom properties at the top of the `<style>` block in `index.html` (and repeated in `blog/post.css`); change them there and the site follows. The 3D figures use the same values, set once in `tools/figures/three/three-kit.js` (`mats`).

| Token | Value | Use |
|---|---|---|
| `--ink` | `#E8EDF1` | ice-paper page ground |
| `--paper` | `#0E1317` | ink: text and marks |
| `--slate` | `#435565` | status bars, compute blocks, done states; tool heads and housings in the figures |
| `--steel` / `--graphite` | `#738A9A` / `#636D7D` | the hero stage, secondary strokes; rods, rollers and heads in the figures |
| `--ice` / `--ink-2` | `#CCDBE2` / `#DDE5EA` | light fills; frames, posts and turntables in the figures |
| `--flare` | `#D65148` | the brand red: fills, dots, strokes; in the figures, only the objects each one is about |
| `--signal` | `#A8392F` | the same red deepened for **text** (5.4:1 on the ground); red outlines in the figures |
| `--surface` / `--surface-2` | `#F7FAFB` / `#EDF2F5` | raised panels / their title and tab bars; figure cards and cases |
| `--on-slate` | `#EEF3F6` | text on slate status bars; idle lamps in the figures |
| `--danger` | `#B23A31` | failing metrics in the console |
| `--yc` | `#F26522` | Y Combinator orange, only on the YC mark |
| `--ease` | `cubic-bezier(.2,.9,.3,1)` | the house ease-out for every transition |
| `--mono` | Cascadia Code, falling back to ui-monospace and Consolas | all type |

## Pages

### Home
Product hero with a live agent console (it stays nearly pinned, shrinks and dims as the next section slides over it), the "Built for physical design" band over an ASCII horizon, the chip-flow ticker, the interactive 3D stack (Hairline engine; source in `tools/hairline/stack.js`; on phones it opens and turns as you scroll), the "Inside a run" poster, the agent feed and the feature notes.

### Blog
The page title with the dot-matrix die beside it, then the post list: `<ol class="posts" id="posts">` in `index.html`. Each row links to its post page.

### Contact
"Let’s talk silicon." with the dot-matrix die beside it (hidden on phones), then "Pick a time to meet us." and a Book a conversation button. Every link to `#contact` on the site, and every Google Calendar booking link, opens the booking dialog (`assets/js/booking.js`): the appointment calendar in a modal, with an "Open calendar in a new tab" fallback.

### Post pages
Generated from `tools/posts.json`. The words and images are kept exactly as published; images get their box reserved, so nothing shifts as they load. A contents rail (desktop), a reading-progress line, a figure viewer (click an image), and a live 3D figure card under the title.

## Blog figures (3D)

Each post opens with a figure card: a small machine whose working is the post's idea (a pick-and-place gantry for macro placement, an indexing turntable for the iteration loop, an orchestrator arm for the agent loop, a production line for ChipOS).

How a card loads:
1. The page arrives with a **still poster** of the scene (`assets/figures/<slug>-wide.webp`, `-narrow.webp` on phones), rendered from the 3D scene's own first frame, so the card shows the real design from the first paint.
2. When the card nears the screen, `three-kit.js` fetches Three.js and builds the scene, but only on a real GPU (a software renderer, like a headless test browser, keeps the poster).
3. The live scene draws the same first frame on a canvas over the poster and fades in; nothing moves. The machine runs its loop, turns on its vertical axis toward the pointer, and a click or Space pauses it. If a device can't hold about 30 fps, the card quietly returns to the poster.

To change a figure: edit `tools/figures/three/<slug>.3d.js` (each file is laid out as MODEL, TIMELINE, SCENE, FRAME), or `three-kit.js` for what all four share (colours, lighting, framing, interaction), then `sh tools/build.sh --posters`. Card labels and keys are in `tools/figures/figures.json`.

## Editing content

| What | Where |
|---|---|
| A post's words, title, date, tag, authors, excerpt | `tools/posts.json`, then `sh tools/build.sh` (also rewrites the Blog page's list) |
| Hero headline, pitch, "Ask the agent" questions | `.phero` markup in `index.html` |
| 3D stacking section on Home | `.s3d` markup; the model in `tools/hairline/stack.js` |
| Agent console: blocks, evidence, timing paths, log lines | `.die` markup and `EVIDENCE`, `PATHS`, `linesFor()` in `index.html` |
| Founders, emails, socials | `data-page="contact"` and `<footer>` in `index.html` |
| Blog figures | see Blog figures above |

## Performance and Lighthouse

- Effects start after the page is up or when their section comes near, and every loop stops off-screen and in hidden tabs.
- CSS animates `transform` and `opacity`, apart from the hero's opening wipe (a `clip-path`, 1.1 s), which plays once per visit when the hero is first on screen in a visible page, after the loading screen has handed off.
- The loading screen (Route, about 2.75 s, once per browser tab) is inlined into every page by the build, so nothing extra is downloaded before first paint. It is most of the mobile Speed Index: about 1.1 s without it, 2.4–2.9 s with it.
- The hero card's pin-and-shrink is a CSS view timeline on the next section, so it runs on the compositor in step with the scroll (a script fallback covers browsers without scroll-driven animations). Scroll locks (the loading screen, the booking dialog) go on `<body>`, never `<html>`: a root lock throws that timeline to its end.
- First load does no layout work it doesn't need: the router leaves the page-slide variable and the header's scroll check for real route changes, so the browser lays out Home once instead of twice (this removed a ~100 ms forced re-layout on phones).
- Three.js (127 KB gzipped, tree-shaken) loads only for a figure about to be read, on a GPU; posts carry no figure script cost at load.
- Images have reserved boxes and lossless WebP twins; scroll restoration is manual, so pages always open at the top.

Lighthouse 12.2 (simulated throttling: Moto G Power on slow 4G for mobile, the desktop preset for desktop), headless Chromium, against a local static server with brotli compression. Nov 1, 2026, with the loading screen; Home mobile scored 97–99 over three runs.

**Scores**

| Page | Mobile perf. | Desktop perf. | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|
| Home (`index.html`) | 99 | 100 | 100 | 100 | 100 |
| How We Ranked First (Fig 1) | 97 | 100 | 100 | 100 | 100 |
| Why Chip Design Takes 18 Months (Fig 2) | 99 | 100 | 100 | 100 | 100 |
| Cognitive Agents (Fig 3) | 98 | 100 | 100 | 100 | 100 |
| Disrupting the Semiconductor Industry (Fig 4) | 98 | 100 | 100 | 100 | 100 |

Accessibility, Best Practices and SEO are the same on mobile and desktop.

**Core metrics, mobile**

| Page | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|
| Home | 1.4 s | 1.7 s | 20 ms | 0.001 | 2.9 s |
| Fig 1 post | 1.1 s | 2.0 s | 160 ms | 0 | 2.4 s |
| Fig 2 post | 1.2 s | 2.0 s | 60 ms | 0 | 2.5 s |
| Fig 3 post | 1.1 s | 1.9 s | 150 ms | 0 | 2.5 s |
| Fig 4 post | 1.2 s | 2.0 s | 90 ms | 0 | 2.6 s |

**Core metrics, desktop:** every page FCP 0.3 s, LCP 0.4–0.5 s, TBT 0 ms, CLS 0, Speed Index 0.7–0.8 s.

Scores move a little between runs on the same build. To re-run: serve the folder (`python3 -m http.server 8000`), then `npx lighthouse http://localhost:8000/blog/posts/<slug>.html --view` (add `--preset=desktop` for desktop). A host that compresses files (GitHub Pages, Netlify, Vercel) matches the brotli server used here.

Headless test browsers have no GPU; check motion on real hardware.

## SEO and AI visibility

- Per-page `<title>`, a description, canonical URL, Open Graph and Twitter cards with a 1200×630 image; JSON-LD `Organization` and `WebSite`.
- `robots.txt` welcomes search and AI crawlers; `sitemap.xml`; `llms.txt` gives assistants a factual summary with links to every post.
- Blog and Contact are hash routes on `index.html`, so search engines index one URL for them; the posts are real pages.

## Accessibility

- `prefers-reduced-motion`: the console shows results at once, canvases draw one still frame, the figures keep their poster.
- Keyboard: visible focus rings, a real tablist in the console, figure cards take Space to pause and ←/→ to turn.
- Figure cards carry a full text description (`aria-label`); decorative canvases are `aria-hidden`.

## Logo and loading screen

`assets/logo/archgen-labs-lockup.svg` is the ARCHGEN LABS wordmark from archgenlabs.com, traced to a vector path; the header and footer use the same path inline.

The loading screen is **Route**: pin one lights, the AG net routes out of it, then the red pin flies to the header and writes ARCHGEN LABS out of itself (about 2.75 s). It plays once per browser tab, a tap or key skips it, and reduced motion gets the finished logo and a fade. Its sources are `tools/loader/archgen-loader-route.js` and `tools/loader/archgen-loader.css`; the build inlines them into every page (first thing in `<body>`, and in `<head>`), so edit the sources and run `sh tools/build.sh`. It fires `archgen:loaded` on `<body>` when done, and the Home hero waits for that before its reveal.

To make the share card again: `node tools/social/og.mjs` (edit `tools/social/og.html`).

## Before launch

- [x] **Contact:** booking-only (Google appointment calendar in a dialog); there is no form to store.
- [x] **Name:** Archgen Labs everywhere: logo, copy, share card.

