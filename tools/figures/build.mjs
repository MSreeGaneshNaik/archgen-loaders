#!/usr/bin/env node
// Builds the blog figures from tools/figures/:
//   blog/figures/<slug>.html     the figure card (poster, corner labels, keys) that tools/build_posts.py drops into each post
//   blog/figures/fig.css         the card styles
//   blog/figures/three-kit.js    the shared 3D kit, and blog/figures/<slug>.3d.js, each post's scene (from ./three/)
//   assets/vendor/three.min.js   a tree-shaken Three.js r158 with just the classes the scenes use
// Posters (assets/figures/<slug>-wide.webp, -narrow.webp) and each card's first readout come from posters.mjs.
// Run from the repo root: node tools/figures/build.mjs
// Needs esbuild (npm install at the repo root, once; or ESBUILD=/path/to/esbuild/lib/main.js). blog/figures/ is
// rebuilt from empty, so a figure removed from figures.json leaves nothing behind. Rebuilding the three bundle also
// needs three@0.158.0 (THREE_DIR=/path/to/node_modules/three); without it the vendored three.min.js is kept.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const OUT = join(ROOT, "blog", "figures");
let esbuild;
try { esbuild = await import(process.env.ESBUILD || "esbuild"); }
catch (e) { console.error("esbuild not found: run `npm install` at the repo root once (or set ESBUILD=/path/to/esbuild/lib/main.js)"); process.exit(1); }
const min = (code, loader = "js") => esbuild.transformSync(code, { loader, minify: true, target: "es2019", legalComments: "none" }).code;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// ---- styles and scripts ----
writeFileSync(join(OUT, "fig.css"), min(readFileSync(join(HERE, "fig.css"), "utf8"), "css"));
for (const f of readdirSync(join(HERE, "three")).filter((f) => f.endsWith(".js"))) {
  const out = min(readFileSync(join(HERE, "three", f), "utf8"));
  writeFileSync(join(OUT, f), out);
  console.log("3d", f, (out.length / 1024).toFixed(1) + " KB");
}

// ---- three.js, only what the scenes use ----
if (process.env.THREE_DIR && existsSync(join(process.env.THREE_DIR, "package.json"))) {
  const r = esbuild.buildSync({
    stdin: { contents: readFileSync(join(HERE, "three-entry.js"), "utf8"), resolveDir: dirname(dirname(process.env.THREE_DIR)), loader: "js" },
    nodePaths: [dirname(process.env.THREE_DIR)],
    bundle: true, minify: true, format: "iife", globalName: "THREE", target: "es2019", legalComments: "none", write: false,
  });
  const banner = "/* three.js r158 (MIT, https://threejs.org/), tree-shaken for the Archgen blog figures; see three.LICENSE.txt */\n";
  writeFileSync(join(ROOT, "assets", "vendor", "three.min.js"), banner + r.outputFiles[0].text);
  console.log("three", (r.outputFiles[0].text.length / 1024).toFixed(1) + " KB");
}

// ---- the cards ----
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const posters = existsSync(join(HERE, "posters.json")) ? JSON.parse(readFileSync(join(HERE, "posters.json"), "utf8")) : {};
for (const f of JSON.parse(readFileSync(join(HERE, "figures.json"), "utf8"))) {
  const p = posters[f.slug] || {};
  const src = (k) => `../../assets/figures/${f.slug}-${k}.webp`;
  const card = `<div class="ag-fig" id="fig-${f.slug}"><figure class="fig">`
    + `<div class="fig-plate" tabindex="0" role="img" aria-label="${esc(f.label)}">`
    + `<picture class="fig-poster"><source media="(max-width:560px)" srcset="${src("narrow")}" width="${p.narrow ? p.narrow[0] : 720}" height="${p.narrow ? p.narrow[1] : 648}">`
    + `<img src="${src("wide")}" alt="" width="${p.wide ? p.wide[0] : 1280}" height="${p.wide ? p.wide[1] : 880}" decoding="async"></picture>`
    + `<span class="fig-corner" data-corner="fig">${esc(f.fig)}</span><span class="fig-corner" data-corner="title">${esc(f.title)}</span>`
    + `<span class="fig-corner" data-corner="hint"></span><span class="fig-corner" data-corner="readout" data-readout>${esc(p.readout || "")}</span>`
    + `</div><figcaption class="fig-keys">${f.keys.map((k) => `<span class="fig-key" data-mark="${k.mark}">${esc(k.label)}</span>`).join("")}</figcaption>`
    + `</figure></div>`;
  writeFileSync(join(OUT, f.slug + ".html"), card);
  console.log("card", f.slug);
}
