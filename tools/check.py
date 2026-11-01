#!/usr/bin/env python3
"""Checks that the built site is whole. Run from the repo root (tools/build.sh runs it last):  python3 tools/check.py

For index.html and every blog/posts/*.html it fails (exit 1) when:
  - a local src / srcset / href, or a url(...) in its styles or in blog/post.css, points to a file that does not exist
    (a renamed image, font, slug or script); a post with a 3D figure also needs assets/vendor/three.min.js
  - a same-page #link has no element with that id
  - a link to index.html#<route> names a route the site does not have
External links (http, https, mailto) are not fetched.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROUTES = {'home', 'blog', 'contact'}
PAGES = ['index.html'] + sorted('blog/posts/' + f for f in os.listdir(os.path.join(ROOT, 'blog', 'posts')) if f.endswith('.html'))
errors = []

def css_urls(css):
    """local files named by url(...) in a style sheet (not data: URIs, not #svg-ids)"""
    urls = [u.strip('\'" ') for u in re.findall(r'url\(([^)]*)\)', css)]
    return [u for u in urls if u and not u.startswith('#') and not re.match(r'(https?:|data:)', u)]

for ref in css_urls(open(os.path.join(ROOT, 'blog', 'post.css'), encoding='utf-8').read()):
    if not os.path.exists(os.path.normpath(os.path.join(ROOT, 'blog', ref))):
        errors.append(f'blog/post.css: {ref} does not exist')

for page in PAGES:
    html = open(os.path.join(ROOT, page), encoding='utf-8').read()
    html = re.sub(r'(<script[^>]*>).*?</script>', r'\1</script>', html, flags=re.S)   # script code is not markup
    ids = set(re.findall(r'\bid="([^"]+)"', html))
    here = os.path.dirname(os.path.join(ROOT, page))
    refs = re.findall(r'\b(?:src|href)="([^"]+)"', html)
    refs += [u.split()[0] for s in re.findall(r'\bsrcset="([^"]+)"', html) for u in s.split(',')]
    refs += css_urls(''.join(re.findall(r'<style[^>]*>(.*?)</style>', html, re.S)))
    if 'three-kit.js' in html and not os.path.exists(os.path.join(ROOT, 'assets', 'vendor', 'three.min.js')):
        errors.append(f'{page}: assets/vendor/three.min.js (loaded by three-kit.js) does not exist')
    for ref in refs:
        if re.match(r'(https?:|mailto:|tel:|data:|javascript:)', ref):
            continue
        path, _, frag = ref.partition('#')
        if not path:                                   # a link within this page
            if frag and frag not in ids and not (page == 'index.html' and frag in ROUTES):
                errors.append(f'{page}: #{frag} has no element with that id')
            continue
        if not os.path.exists(os.path.normpath(os.path.join(here, path))):
            errors.append(f'{page}: {ref} does not exist')
        elif path.endswith('index.html') and frag and frag not in ROUTES:
            errors.append(f'{page}: {ref} names a route index.html does not have')

for e in errors:
    print('check:', e)
print(f'check: {len(PAGES)} pages, {len(errors)} problems')
sys.exit(1 if errors else 0)
