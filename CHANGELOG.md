# Changelog

## Live-site sync, feedback round, phone polish and fixes (Nov 1)
The repo now matches what is live on archgenlabs.com (which had been edited directly on Vercel), plus the 15-point feedback round and a pass of phone refinements. Desktop looks as before except where a change below says otherwise.

**Synced from the live site**
- Name and line: Archgen Labs, "The future of compute starts with how we design it." in the title, headline, meta tags and JSON-LD; every absolute URL moves to https://archgenlabs.com (sitemap, robots, llms.txt, canonical and Open Graph tags, posts).
- Logo: the ARCHGEN LABS wordmark, traced from the live PNG to one vector path (`assets/logo/archgen-labs-lockup.svg`), used inline in the header (28px tall) and the footer.
- Navigation: desktop shows Blog and a Contact pill; the phone menu has Blog 01 and Contact 02.
- Contact is booking-only: "Let’s talk silicon." and Book a conversation. The old form and its script are gone. `assets/js/booking.js` + `assets/css/booking.css` open the Google appointment calendar in a modal dialog for every `#contact` link and every calendar link, with an "Open calendar in a new tab" fallback, Escape / Close / tap-outside to close, and focus returned to the link that opened it.
- Analytics: `assets/js/analytics.js` loads Microsoft Clarity on production hosts only.
- Y Combinator: every YC link points to https://www.ycombinator.com/companies/archgen-labs (also first in the JSON-LD `sameAs`).

**Feedback round**
- Share card: `assets/social/og-1200x630.png` rebuilt as ARCHGEN LABS (it said Archgen AI), with the site's line and pitch in large type (nothing under 22px) and the die on a steel panel. Its source is `tools/social/og.html`; render with `node tools/social/og.mjs`.
- One "Backed by Y Combinator" only, in the hero: the stats row under "Built for physical design" is removed.
- "Chips went to 3D, EDA should too": the paragraph is cut from 249 to 128 characters.
- Smaller, lighter titles: "Inside a run" (now up to 104px at weight 600), "Blog" and "Let’s talk silicon." (up to 128px at 600). The Contact title wraps instead of running off the screen.
- Blog cards: the hover panel fades in without growing, so the row no longer jitters.
- Footer fits one screen: 656px tall at 1440 × 900 (was 914), so the call to talk is never cut off.
- Domains: `vercel.json` sends archgen.tech, www.archgen.tech and www.archgenlabs.com to https://archgenlabs.com with a permanent 308 redirect, keeping the path.

**Loading screen (Route)**
- Pin one lights, the AG net routes out of it, then the red pin flies to the header and writes ARCHGEN LABS out of itself. About 2.75 s, once per browser tab, on Home and every post. A tap or key skips it; reduced motion gets the finished logo and a 200 ms fade. It fires `archgen:loaded`, and the Home hero's reveal waits for it.
- Sources: `assets/js/archgen-loader-route.js` and `assets/css/archgen-loader.css`. The build inlines both into every page (`#agl-css`, `#agl-js`), so nothing extra is downloaded before first paint.

**Phones (699px wide and below unless noted)**
- Hero: no "Ask the agent" list; a black Contact us button sits under the line, with "Backed by Y Combinator" under it; the agent console is about 15% shorter (4:3 die, tighter metric rows, a 184px log that scrolls inside like a terminal).
- Hero scroll: the card's pin, shrink and dim are a CSS view timeline on the next section, so they move in step with the finger on the compositor instead of trailing a script (the script stays as a fallback). Same positions as before, checked at 360, 390, 820 and 1440px.
- The ASCII horizon fills the whole "Built for physical design" section behind the text.
- 3D stack (860px and below): the model sits right under "Chips went to 3D, EDA should too", then the text. On phones it opens and turns a quarter view as you scroll, through its own springs; drag and tap still work.
- "Inside a run": the poster is 256px tall (was 380), so there is no empty band before the editor.
- Blog: the "Blog" capitals stand exactly as tall as the dot chip's drawing (58.5px) and line up with it.
- No click spark on phones; the spark's full-screen canvas is not set up there.
- Footer links get about 38px tall tap areas on touch screens (were 19–22px), pixel-identical layout.
- The address bar sliding in and out no longer reallocates the ASCII and spark canvases mid-scroll.

**Tablet and desktop**
- "Inside a run": the poster is shorter (clamp(280px, 30vw + 40px, 480px)), so the band before the sample-session caption is about halved: 188 → 100px at 1440 wide.
- The Contact pill's hover keeps its glass light, now tinted with the brand red (#D65148), instead of washing out to pink.

**Fixes**
- Hero card stuck after Contact: scroll locks (booking dialog, loading screen) were on `<html>`, which threw the card's scroll timeline to its end, shrunk and pushed down out of the hero; some phone browsers kept it there after the dialog closed. The locks are on `<body>` now, and the card's animation restarts when either lock lifts.
- The phone menu closes when Contact opens the booking dialog, and focus lands on the menu button when the dialog closes.

**Checked**
- A scripted walk of every section at 390, 820 and 1440px (loader, news bar, header, menu, hero console, booking dialog, 3D stack, editor, footer, Blog, Contact, back/forward, every post's reading bar, image viewer and figure, keyboard order): no page errors, no missing files.
- Lighthouse (mobile / desktop): Home 99 / 100, posts 97–99 / 100; Accessibility, Best Practices and SEO 100 everywhere.
- `sh tools/build.sh`: 5 pages, 0 problems.

## Review fixes (Oct 28)
The design is unchanged: a before/after screenshot of every page at eight widths matches pixel for pixel, apart from the fixes listed (stack labels at 861–950px, the reading trace at 768px, one memory row).
- Hero: the opening slide reveal is exactly as before (the steel panel wipes open from its cut corner, then the console rises in), but it plays once per visit, when the hero is first on screen in a visible page. Resizing across 760px or hiding and showing the page (the Claude preview does both) used to replay it seconds later; a page that loads hidden still opens with it.
- 3D figures: the floor shadow is back (lost in the Oct 27 audit), so the live scene matches its poster again; the fade-in from the poster actually runs; if the browser takes the GPU away, or a slow device falls back, the card returns to its poster and lets go of every listener and the GPU context; a paused figure stops redrawing once still.
- Agent console: metrics from a finished run no longer bleed into the next; a re-checked block moves to the top of memory instead of repeating; the fake log is no longer a live region for screen readers.
- Keyboard and screen readers: focus moves to the page heading on every route change and "back to top"; the open phone menu makes the page behind it unreachable; editor tabs, the news-bar close and "Prepare email" keep focus somewhere sensible; ARIA labels sit on real groups.
- Small fixes: the console no longer jumps when returning Home; the copy button can't stick on "Copied"; a drag held still before release no longer flings the 3D stack; on phones the stack no longer covers the paragraph above it, and its box is reserved before it loads; stack labels no longer wrap at 861–950px; a malformed #link no longer breaks a post's script.
- Build: `npm install` pins esbuild and the build stops without it (no more silently unminified files); blog/figures/ is rebuilt from empty; the Blog page's list is generated from posts.json; check.py also checks fonts and other url(...) files and three.min.js; JSON-LD is safe against "</".
- Performance: first load no longer restyles the whole Home page or forces a second layout from the header's scroll check (about 100 ms of main-thread work on a mid-range phone). Lighthouse mobile on Home went from 88–98 (spiky) to 98–99 across eight runs.
- About 60 lines of dead CSS and JS removed (old burger menu, removed sections, unused options).

## Loading screen removed (Oct 28)
- The 1.5 s intro is gone from Home and every post: its markup, styles and driver script, the `agAfterBoot` / `ag-boot` start-up gate and the paused-until-booted rule. Pages show their content on first paint; Home's deferred effects start on `load`, figures on approach.
- `build_posts.py` now lifts only the file:// font shim (`fonts:head` markers) from `index.html`.

## Audit fixes (Oct 27)
No change to how anything looks.
- Footer "Backed by Y Combinator" removal and the README folder tree, which missed PR #9's merge, are in.
- Contact: editing the form after "Prepare email" hides the prepared note, so the mail app never opens an older version.
- Reduced motion: figures keep their still poster; Three.js is never fetched.
- The first-seconds scroll guard runs only inside a preview iframe, so a scrollbar drag on the real site is never undone.
- `sitemap.xml` lists the four posts (written by `build_posts.py`); `llms.txt` uses one host, archgen.tech.
- `tools/check.py` runs at the end of every build and fails on a missing file or #anchor.
- README: requirements (Node 18+, Python 3 with Pillow). Cascadia Code's licence added as `assets/fonts/OFL.txt`.
- 3D kit: unused options and exports removed; scenes point to `sh tools/build.sh --posters`.

## Blog pages, 3D figures and the loading screen (Oct 26)

### Live 3D figures (Three.js)
- Each post opens with a figure card: a small machine whose working is the post's idea, now a real-time Three.js scene with light and shadow (macro placement gantry, iteration-loop turntable, PD orchestrator arm, ChipOS production line). The objects each figure is about (dies, macros, run cards) are in the brand red; everything else uses the ice-paper, slate and steel tokens.
- The machine turns on its vertical axis toward the pointer; a click or Space pauses it; ←/→ turn it from the keyboard.
- Cards load a still poster of the scene's own first frame, so the real design shows from the first paint; the live scene fades in over it without moving anything. Three.js (tree-shaken, 127 KB gzipped) loads only when a card nears the screen, and only on a real GPU; a device that can't hold ~30 fps keeps the poster.
- The older 2D drawings, their kit and their scripts are removed (posts are about 65% smaller). Figure captions are removed; the keys stay.
- Sources and build: `tools/figures/` (`three/` scenes and kit, `figures.json`, `build.mjs`, `posters.mjs`), `tools/build.sh` to rebuild everything.

### Loading screen
- A 1.5 s intro once per visit (never with reduced motion): ink walls part on the AG mark, which flies into the header logo. Compositor-only, 60 fps; page work waits for it (`agAfterBoot`).

### Post pages
- No more jumping on open: images have reserved boxes, entrances are fade-only, scroll restoration is manual, and pages always open at the top (or at the #section linked).
- Tighter spacing above the title and around the figure.
- Pages also work opened straight from disk (font fallback in `assets/fonts/local-fonts.js`).
- Images optimised losslessly (identical pixels), with lossless WebP twins.

### Home, Blog, Contact
- "Get early access" removed from the hero; the dot-matrix die added beside the Blog title; the Blog and Contact titles stay on one line while they decode.

### Lighthouse (local brotli server, Lighthouse 12)
- Home 98 mobile / 99 desktop; posts 98–99 mobile / 100 desktop; Accessibility, Best Practices and SEO 100 everywhere.

## Interactive 3D stack and polish (after PR #4)

### Turnable 3D model, one ending, a hero that does something
- **3D model:** richer and turnable. It now has two thin memory dies (HBM-style) over the logic die, and a PHY strip on the base die. Drag to turn it: it follows the pointer, keeps the drag's speed when let go, and settles on the nearest 2:1 view. Lines are darker and slightly heavier. Five labels follow the tiers as the stack turns and opens.
- **"Working on chips? Let's talk."** now opens the footer on every page, so the page has one ending. The separate band and its WebGL threads are gone. The curtain reveal is off too: the footer simply follows the page instead of sliding out from under it.
- **Hero:** Reads / Writes / Keeps is replaced by three "Ask the agent" questions. Clicking one runs that block in the live console.
- **Copy:**
  - tighter lines in "Built for physical design", the 3D section and the three feature notes
  - "Get early access" replaces "Join the channel"
  - the Blog intro drops the last stealth-era phrasing ("allowed to publish", "transmissions")

### Lighthouse: layout shift fixed
- The footer is pinned under the page (curtain reveal). While it was out of sight its size still settled as the web font loaded, which Lighthouse counted as a layout shift (mobile CLS up to 0.32 on some runs, desktop 0.1). The pinned footer is now unpainted until the page starts to lift off it, and the decision to pin it no longer flips once fonts arrive. After merging the Lighthouse work from PR #5: mobile 95–96 / 100 / 100 / 100 (CLS 0.001), desktop 100 / 100 / 100 / 100 (CLS 0).

### Contact (and About) open cleanly
- Opening Contact looked glitchy: the page transition, the title's glyph decode, a second rise-in on the header and form, and the dot chip flying in as a noisy cloud all ran at once. The page header and the form no longer get the extra rise (the page transition already brings them in), and the dot chip now grows in place, dot by dot, in a wave from one corner (about 1.1 s). About's header gets the same treatment.

### 3D section: interactive stack model
- The static drawing is replaced by an interactive model built with the Hairline engine (`tools/hairline/stack.js`, a figure for the @lucasmarkes/hairline kernel, inlined at the end of `index.html`): a 3D chip on its package with a base die (TSV field), a logic die (four placed macros between standard-cell rows) and a memory die (eight banks). Moving across opens the stack on a spring; up or down picks a die, which takes the red edge. At rest the logic die's front macro is the red mark.
- Mapped to the site palette: ice-paper plates, slate edges, the brand red for the highlight, red-tinted TSV dots and package pads.
- On phones the model takes the full width and tucks up into its own headroom, the labels become a legend of dots under it (the picked die's dot turns red), and the caption is centred. A finger drag works the same as the mouse.
- Labels sit in a column beside the model (memory die · eight banks, logic die · placed macros, base die · TSV field, package · substrate + pads), joined to each tier by a leader that follows the stack as it opens; the picked tier's label and leader turn red. A caption says how to use it and names the picked die.

### 3D stack drawing, redrawn
- Every element now sits on the dies' own isometric grid. The old bump dots were placed on the wrong edge and floated across the base die; they are now solder balls on pads along the two front edges, landing on a package substrate. Also new: an I/O pad ring on the base die, solid TSVs and finer-pitch hybrid bonds with landing pads, a soft radial hot spot, and a cleaner cross-die route (base → TSV → logic → bond → memory) that draws segment by segment, with its pins popping in. Labels sit in an evenly spaced column with dot-tipped leaders.

### Agent console: LatticeLoader status
- The status pill in the console header is now a LatticeLoader (vanilla port of the React Bits micro component): a 3×3 orbit of red dots brightens in a wave beside "Checking CORE2" and a live stopwatch, then every dot turns green, popping in corner to corner, with the frozen time ("CORE2 closed in 3.4s"). Idle shows the same green grid. The label stays a live region for screen readers; reduced motion slows the wave to one gentle pulse.

### Editor explorer: branched tree
- The mock editor's file list is now a folder tree: `top_ctrl/` branches into `rtl/`, `flow/`, `logs/`, `memory/` and `reports/`, joined by guide lines. Folders fold open and shut with a chevron (native `<details>`, keyboard friendly); the open file's branch lights red.

## Lighthouse 95+ on mobile and desktop
Mobile performance 62 → 96–98, desktop 94 → 100 (Lighthouse 12, simulated Moto G Power / desktop presets). Accessibility, Best Practices and SEO stay at 100. Nothing visible changes on desktop; on phones the hero demo card no longer plays its wipe-in intro.

- Effects start after the page is up: the specular buttons, YC dollars, click sparks, scroll stack, footer reveal, agent demo, About/Contact dot die and scroll entrances each start in their own idle slot after `load`, instead of in one ~900 ms startup task.
- The ASCII horizon, the WebGL threads and the footer PixelBlast start only when their section comes within about a screen of the viewport. The footer is fixed behind the page, so it now wakes on a sentinel at the end of `main`, not its own box.
- The headline is no longer faded in on first load. The page entrance now plays only on navigation, so the largest paint lands at once.
- Cascadia Code is self-hosted (`assets/fonts`, SIL OFL), with the latin subset preloaded and `font-display: optional`, so text lays out once and never swaps. The fallback list is shorter, so it does fewer font lookups.
- No forced layouts during startup: no sync `scrollY` read, `document.fonts.ready` waits for idle, scroll entrances use the observer's first report instead of `getBoundingClientRect`, and blog tiles paint in idle time.
- The closed mobile menu is `display: none` until it is opened (same staggered animation), and the demo card uses `contain: layout paint`.
- Phones: below-the-fold home sections use `content-visibility: auto`.

## Version 2 becomes the site (PR #3)
Design B replaces Design A as `index.html`. Design A (the dark cinematic dot-matrix hero) is removed; it stays in git history at PR #2 (`bc6b9e6`).

### Look
- Light "ice paper" theme: ink text on `#E8EDF1`, slate and steel greys, fluorescent red as the only strong colour.

### Home
- New product hero: headline, pitch, spec sheet, the #1 IBM macro-placement proof card, and a live agent console on a steel stage. Pick a block on the die and the agent checks it, with an animated log, metrics, timing report and patch diff, and stores the fix in memory.
- "Built for physical design" section over an animated ASCII horizon.
- "Let's talk" closing band over WebGL threads. On phones it is now compact: 572px down to about 400px, with the threads tucked under the buttons.
- Staggered full-screen mobile menu.
### Footer (every page)
- A faint PixelBlast dither field (plain-JS WebGL port of React Bits PixelBlast) in steel and slate, fading in toward the bottom. The cursor brings up a little red under it and a click sends a ripple through it. It only animates while the footer is on screen, runs at 30 fps on touch screens, shows a still frame with reduced motion, and is hidden in high-contrast mode.
- Fixed a stray `footer:hover` selector that left the bottom bar unstyled until you hovered the footer.

### Hero
- "Backed by Y Combinator": the Y is now YC's orange mark. Hovering it pops a few tiny orange dollar signs that float up and fade (off with reduced motion).
- The link's hover colour was the near-invisible ice grey from the old dark theme; it now turns signal red.
- No underline on the link; the text is centred on the YC mark, with a 44px tap height on phones.

### Dot-matrix die: fixes
- The floorplan was sampled from fractional coordinates onto a lattice whose size changed with the box, so pads, SRAM columns and buses came out uneven and the layout broke at some widths. It is now drawn on a fixed 40 × 40 cell grid with every dot snapped to whole device pixels: crisp and identical at 280px on desktop and 76px on phones.
- The cursor push was strong enough to pile dots into smeared bands; it is now a gentle, eased lean.
- The opening gather starts from a loose cloud instead of a dense blob; the scan touches only the floorplan (not the faint background dots) and rests between sweeps; ripples and offsets reset when the page is reopened; the pointer is released on scroll; a resize or zoom rebuilds the grid at the new pixel ratio.

### Copy: 3D stacking, no stealth
- New Home section after the flow ticker: "Chips went 3D. The tools stayed flat." Four problem rows (partitioning, cross-die timing, heat and power, bonds and TSVs) beside an exploded memory / logic / base die stack drawn in SVG; its cross-die timing path draws itself in when the drawing scrolls into view.
- Hero has less text: a one-line pitch ("An AI agent for chip physical design, from a single die to a 3D stack."), a shorter spec sheet, and no proof card (the news bar already carries the #1 result).
- Every stealth, launch and "classified" mention is gone: share descriptions, the stats row (Stage and Launch out, "Built for: 2D and 3D-stacked chips" in), editor title and status, the agent console's root cause, feed answers, the About layer stack (layers 3 and 4 now named), About status bar, the Contact HQ row, the footer dictionary entry, llms.txt and the README. The "Classified" poster is now "Inside a run", captioned as a sample session on a demo block. The unused redaction styles are removed.
- About manifesto gains a line on 3D: dies stacked and bonded, tools still built for one flat die.
- The footer wordmark keeps the original #FF2A1F red.

### About and Contact: dot-matrix die
- The chip from the Design A hero returns on its own (no horizon, glow or ring), beside the page title: the same floorplan sampled onto a dot lattice in ink, slate and steel, with red kept to the core hot spots, a few NPU tiles, a slow scan and the press ripple. Dots grow in place, in a wave from one corner, each time the page opens, and part around the cursor. Hidden on Contact on phones. Paused off-screen and on other pages; one still frame with reduced motion; hidden in high-contrast mode.

### Softer red
- The signal red is toned down on every page: `#FF2A1F` → `#D65148` (fills, dots, canvases, logo mark) and red text `#C21B12` → `#A8392F`, with matching glows, metrics, code colours and chart bars. All text pairs still pass contrast (4.56–6.34:1).

### Scroll-in entrances (AnimatedContent)
- Plain-JS port of React Bits AnimatedContent (no GSAP): every section's blocks rise ~100px (56px on phones) and fade in once as they reach 90% of the viewport, power3.out over 0.8s, with a short stagger between siblings. Applied on Home, About, Blog and Contact; the hero and footer keep their own scroll effects.
- On phones stacked items (cards, rows, founders) enter one by one as each reaches the screen.
- Nothing already on screen is hidden, content stays visible if the script fails, and reduced motion turns it off.

### Hero scroll stack
- As you scroll past the hero, the console card stays nearly pinned, shrinks to 90% and dims, while "Built for physical design" slides over it as the next card, with rounded top corners and a soft shadow (after React Bits ScrollStack). Off with reduced motion.

### Header
- Removed the "Stealth ’26" tag beside the logo.

### Footer reveal
- On every page the content lifts like a curtain (rounded bottom edge, soft shadow) and uncovers the footer pinned beneath it; the footer's contents rise and fade in with the scroll.
- Only where the footer fits on screen; on very short screens and with reduced motion the footer scrolls normally.
- The footer's PixelBlast only animates while the footer is actually uncovered.

### News bar
- A slim ink bar above the header on every page: "Ranked #1 on the IBM macro-placement benchmarks", linking to the write-up (opens in a new tab). Idea from the YC design research (Diode, Hardware Intelligence).
- Phones get a short line that fits whole ("#1 on IBM macro-placement →"); tablets drop the challenge name so nothing is cut off.
- The × closes it with a short collapse (instant with reduced motion) and it stays closed in that browser. To announce something new, change the text and the `archgen:news:` key in the script.

### Design, SEO and AI-visibility pass
Reviewed with five playbooks (Apple fluid design, design-system audit, design taste, impeccable, SearchFit SEO + AI visibility). The brand (monospace, ice palette, glass header) is kept on purpose; everything below is a fix within it.
- **Lighthouse:** mobile 71 → 95–96 performance and 97 → 100 accessibility; desktop 100 across the board.
- **Dead code removed:** Design A's hero, ring, boot screen and trace field (about 54 KB, 23% of the file). A computed-style diff of every element on all four pages at 390 and 1440px confirmed nothing visible changed.
- **Design tokens:** `--signal`, `--surface`, `--surface-2`, `--on-slate`, `--danger`, `--yc` and `--ease` replace hard-coded values.
- **Contrast:** red text now uses `--signal` (5.1:1); detector contrast warnings 18 → 0. A redacted bar in the About status strip no longer turns invisible on hover.
- **Type:** body 15 → 16px, lede 16–18px, longer copy (features, feed, blog cards) up a step; headings tighten as they grow (−0.015 to −0.035em); phone h1 22 → 24px; nothing readable under 11px outside the console.
- **Headings:** removed the labels above "About", "Contact", "Let's talk", the feed and the blog title; the closing band now reads "Working on chips? Let's talk."; About's section labels and the blog cards are real h2s, so no page skips a heading level.
- **Browser surfaces:** scrollbar, caret and form accents follow the palette.
- **Console log:** lines appear at once like a terminal (a small rise, no fade) and stay hidden from screen readers until they appear.
- **SEO:** per-page titles, 156-character description, canonical, Open Graph and Twitter cards with a 1200×630 social image, apple-touch icon, `robots.txt`, `sitemap.xml`.
- **AI visibility:** Organization + WebSite JSON-LD, `llms.txt`, and AI crawlers explicitly allowed.

### Phone hero
- About a third shorter on phones: 1,822px down to about 1,250px on a 390px screen. Tablet and desktop are unchanged.
- Tighter copy column and a compact Reads / Writes / Keeps sheet.
- Agent console reorganised: the die and the four metrics share a row, legend and progress follow, memory is one line, the log is denser without timestamps, and the status bar fits one line.
- The file pane has a steady 232px height on phones, so switching tabs or blocks no longer makes the page jump.

### Email addresses
- Clicking any email address (About founders, Contact direct lines, footer "Write to us") copies it instead of opening a mail app. A small "✓ Copied" chip rises from the address and screen readers hear "… copied to clipboard". Contact's "Open in mail app" button still opens the mail app.
- Copy now falls back to a hidden-textarea copy where the clipboard API is blocked, so the Copy buttons work there too.

### Page changes
- Removed the red scan line that swept down the screen when switching pages. Pages still slide in from the side.

### Header
- Header nav drops "Home"; the logo takes you home. About, Blog and Contact are now numbered 01 to 03 on desktop and in the phone menu.

### Accessibility
- The header logo link's accessible name now includes its visible text, and the proof card's red "#1" is large enough to pass contrast.

### Repo
- README updated for version 2: brand tokens, home page, how to edit the agent console, performance notes and fresh Lighthouse numbers.

## Cinematic hero, blog bento, interactions (PR #2)

### Home
- New full-screen dot-matrix hero: a silicon die on a wafer floor under a red horizon, about 26k dots on a strict grid with bloom. The dots swarm in from the centre on load.
- "Silicon" on a draggable 3D ring with momentum; letters facing away dim.
- "Backed by Y Combinator" badge in the hero, plus a Shopify Editions–style tagline and a three-column link index.
- Scrolling transforms the hero into the next section: the dots stream across and rebuild as a flat die on a wafer while the headline, email capture and stats row fade in. Normal scrolling resumes afterwards.
- Click ripples in the hero; a timed signal wave; dots scatter around the cursor.
- The header goes see-through over the hero; the background trace field pauses while the hero is on screen.

### Blog
- Rebuilt after memorable.sh/case-studies: centred light title and a bento grid of dithered cards. The dots grow out of each card's bottom-left corner and stop under the text.
- "( let's talk )" CTA over an animated wireframe tunnel.

### Site-wide
- Red click sparks on every click outside the hero.
- Apple fluid-interface pass: press feedback on pointer-down, glass header with scroll-edge shadow, a mobile menu that grows from and returns to the burger, direction-aware page transitions, inline form validation, and reduced-motion, reduced-transparency and high-contrast modes.
- Numbered nav, glyph-decode titles, and a dictionary-style "archgen" entry in the footer.

### Lighthouse pass
- Accessibility 100 on mobile and desktop: brightened the dim text token (contrast 3.5:1 → over 4.5:1) and fixed footer heading order.
- Mobile Performance 81 → 94: non-blocking font stylesheet, shorter intro (2.1 s → 1.4 s), hero scene built in yielding slices (TBT 330 ms → 50 ms), and a two-pass lattice estimate instead of a 14-step search.

### Repo
- `README.md` rewritten: run, deploy, structure, brand tokens, how to edit content, performance, accessibility and a launch checklist.
- `tools/logo/build_logo.py` and the reference screenshot, so the vector logo can be regenerated.

## Stealth-mode site and logo set (PR #1)
- Four-page stealth teaser (Home, About, Blog, Contact) in one `index.html`, in Cascadia Code with the black, cream and two-red palette.
- ARCHGEN AI logo rebuilt as outlined SVGs: lockup, mark and app tiles in cream, black and red.
