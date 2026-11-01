#!/bin/sh
# Rebuilds everything generated, in order. Run from the repo root:  sh tools/build.sh [--posters]
#   1. tools/figures/build.mjs   figure cards, fig.css, the 3D kit and scenes (minified if esbuild is found), three bundle
#   2. tools/build_posts.py      blog/posts/*.html from tools/posts.json, with each post's figure card
#   3. --posters only: tools/figures/posters.mjs re-renders the still posters from the 3D scenes (needs Playwright),
#      then steps 1 and 2 run again so the cards pick up the new poster sizes and first readouts
#   4. tools/check.py            fails the build if any page points to a file or #anchor that does not exist
# Needs Node 18+ and Python 3 with Pillow (pip install pillow).
# Optional tools: ESBUILD=/path/to/esbuild/lib/main.js and THREE_DIR=/path/to/node_modules/three (three@0.158.0)
# for minified scripts and a fresh tree-shaken three.min.js; PLAYWRIGHT=/path/to/playwright for the posters.
set -e
node tools/figures/build.mjs
python3 tools/build_posts.py
if [ "$1" = "--posters" ]; then
  node tools/figures/posters.mjs
  node tools/figures/build.mjs
  python3 tools/build_posts.py
fi
python3 tools/check.py
