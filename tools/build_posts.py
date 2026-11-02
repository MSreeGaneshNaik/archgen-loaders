#!/usr/bin/env python3
"""Builds blog/posts/<slug>.html from tools/posts.json.

What goes into each post page:
  - the words and images of the post, from tools/posts.json (kept word for word and image for image as on archgen.tech);
    images get their box reserved (width/height, --iw/--ar) and a lossless WebP twin when one exists in assets/blog/
  - the header lockup, footer and file:// font shim, lifted from index.html, so posts always match the site
  - the post's figure card, blog/figures/<slug>.html, its styles inlined from blog/figures/fig.css, and its live 3D scene
    (blog/figures/three-kit.js + <slug>.3d.js); all of these are written by tools/figures/build.mjs
It also writes the Blog page's post list in index.html and refreshes the post entries in sitemap.xml.
Needs Python 3 with Pillow (pip install pillow), used to read each image's size.
Run from the repo root:  python3 tools/build_posts.py      (or tools/build.sh to rebuild everything in order)
"""
import html, json, os, re
from PIL import Image
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.load(open(os.path.join(ROOT, 'tools', 'posts.json'), encoding='utf-8'))
index = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()

lockup = re.search(r'<svg class="lockup".*?</svg>', index, re.S).group(0)
footer = re.search(r'<footer>.*?</footer>', index, re.S).group(0)
footer = re.sub(r'href="#(home|blog|contact)"', lambda m: f'href="../../index.html#{m.group(1)}"', footer)
# the file:// font shim, shared with the site
fonts_head = re.search(r'<!-- fonts:head -->.*?<!-- /fonts:head -->', index, re.S).group(0)
assert '<svg' in lockup and 'foot-grid' in footer
# the loading screen is inlined into every page (no extra requests before first paint); its sources stay in assets/
LOADER_CSS = '<style id="agl-css">\n' + open(os.path.join(ROOT, 'assets', 'css', 'archgen-loader.css'), encoding='utf-8').read().strip() + '\n</style>'
LOADER_JS = '<script id="agl-js">\n' + open(os.path.join(ROOT, 'assets', 'js', 'archgen-loader-route.js'), encoding='utf-8').read().strip() + '\n</script>'

ARROW_L = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 8H3M7 4 3 8l4 4"/></svg>'
e = lambda s: html.escape(s, quote=True)

def iso(d):
    return datetime.strptime(d, '%b %d, %Y').strftime('%Y-%m-%d')

posts = {p['slug']: p for p in data['posts']}

def leveled(body):
    """Heading levels that never skip (h1 title, then h2, h3, ...) for screen readers, while each heading keeps its
    original level as class v2/v3/v4, which sets its look and whether it is listed in the contents rail."""
    stack, out, pos = [], [], 0
    for m in re.finditer(r'<h([2-6])(\s[^>]*)?>(.*?)</h\1>', body, re.S):
        orig, attrs, inner = int(m.group(1)), m.group(2) or '', m.group(3)
        while stack and stack[-1][0] >= orig: stack.pop()
        sem = stack[-1][1] + 1 if stack else 2
        stack.append((orig, sem))
        attrs = re.sub(r'class="([^"]*)"', lambda c: f'class="{c.group(1)} v{orig}"', attrs) if 'class="' in attrs else attrs + f' class="v{orig}"'
        out.append(body[pos:m.start()] + f'<h{sem}{attrs}>{inner}</h{sem}>'); pos = m.end()
    out.append(body[pos:])
    return ''.join(out)

def sized(body):
    """Give every post image its natural size, so the browser reserves its exact box before the (lazy) file arrives
    and nothing below it moves when it loads. The figure gets --iw (natural width) and --ar (width / height)."""
    def one(m):
        attrs, src, rest = m.group(1) or '', m.group(2), m.group(3)
        path = os.path.normpath(os.path.join(ROOT, 'blog', 'posts', src))
        w, h = Image.open(path).size
        cls = re.search(r'class="([^"]*)"', attrs)
        attrs = re.sub(r'class="([^"]*)"', lambda c: f'class="{c.group(1)} sz"', attrs) if cls else attrs + ' class="sz"'
        img = f'<img src="{src}" width="{w}" height="{h}"{rest}'
        webp = os.path.splitext(src)[0] + '.webp'   # a lossless WebP twin (same pixels, smaller file) when one was made
        if os.path.exists(os.path.normpath(os.path.join(ROOT, 'blog', 'posts', webp))):
            img = f'<picture><source type="image/webp" srcset="{webp}">{img}</picture>'
        return f'<figure{attrs} style="--iw:{w}px;--ar:{w / h:.4f}">{img}'
    out, n = re.subn(r'<figure(\s[^>]*)?><img src="([^"]+)"([^>]*>)', one, body)
    assert n == body.count('<img'), (n, body.count('<img'))
    return out

order = data['order']
os.makedirs(os.path.join(ROOT, 'blog', 'posts'), exist_ok=True)

for i, slug in enumerate(order):
    p = posts[slug]
    newer = posts[order[i - 1]] if i > 0 else None
    older = posts[order[i + 1]] if i + 1 < len(order) else None
    authors = [a.strip() for a in p['authors'].split('&')]
    url = f'https://archgenlabs.com/blog/posts/{slug}.html'
    ld = {
        '@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': p['title'], 'description': p['desc'],
        'datePublished': iso(p['date']), 'url': url, 'mainEntityOfPage': url,
        'author': [{'@type': 'Person', 'name': a} for a in authors],
        'publisher': {'@type': 'Organization', 'name': 'Archgen Labs', 'url': 'https://archgenlabs.com/',
                      'logo': {'@type': 'ImageObject', 'url': 'https://archgenlabs.com/assets/logo/archgen-ai-icon-512.png'}},
        'image': 'https://archgenlabs.com/assets/social/og-1200x630.png',
    }
    more = []
    if newer: more.append(f'<a class="prev" href="{newer["slug"]}.html"><span class="dir">← Newer</span><span class="t">{e(newer["title"])}</span></a>')
    else: more.append('<span aria-hidden="true"></span>')
    if older: more.append(f'<a class="next" href="{older["slug"]}.html"><span class="dir">Older →</span><span class="t">{e(older["title"])}</span></a>')
    more.append('<a class="pill all" href="../../index.html#blog">All posts</a>')

    fig_path = os.path.join(ROOT, 'blog', 'figures', slug + '.html')
    fig = open(fig_path, encoding='utf-8').read() if os.path.exists(fig_path) else ''
    # the figure card's few styles go inline (one request fewer); its poster shows at once, and the live 3D scene (three.js,
    # fetched only as the figure nears the screen, on a capable GPU) takes over the same card without moving anything
    fig_css = open(os.path.join(ROOT, 'blog', 'figures', 'fig.css'), encoding='utf-8').read() if fig else ''
    fig_head = f'<style>{fig_css}</style>\n' if fig else ''
    fig_html = f'\n        <div class="post-fig">{fig}</div>' if fig else ''
    fig_js = (f'<script defer src="../figures/three-kit.js"></script>\n'
              f'<script defer src="../figures/{slug}.3d.js"></script>\n') if fig else ''
    page = f'''<!doctype html>
<html lang="en">
<head>
<script>/* every page opens at its top: no restored scroll position, so nothing slides or lands mid-page on open or reload */if("scrollRestoration" in history)history.scrollRestoration="manual";</script>
<meta charset="utf-8">
{fonts_head}
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(p['title'])} | Archgen Labs</title>
<meta name="description" content="{e(p['desc'])}">
<link rel="canonical" href="{url}">
<meta name="author" content="{e(p['authors'])}">
<meta name="theme-color" content="#E8EDF1">
<link rel="icon" type="image/svg+xml" href="../../assets/logo/archgen-ai-favicon-red.svg">
<link rel="apple-touch-icon" href="../../assets/logo/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Archgen Labs">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{e(p['title'])}">
<meta property="og:description" content="{e(p['desc'])}">
<meta property="og:image" content="https://archgenlabs.com/assets/social/og-1200x630.png">
<meta property="article:published_time" content="{iso(p['date'])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@archgen_">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False).replace('</', '<\\/')}</script>
<link rel="preload" as="font" type="font/woff2" href="../../assets/fonts/cascadia-code-latin.woff2" crossorigin>
<link rel="stylesheet" href="../post.css">
{fig_head}<link rel="stylesheet" href="../../assets/css/booking.css">
{LOADER_CSS}
<script src="../../assets/js/analytics.js" defer></script>
<script src="../../assets/js/booking.js" defer></script>
<script src="../../assets/js/footer-reveal.js" defer></script>
</head>
<body>
{LOADER_JS}
<header class="bar">
  <div class="wrap bar-in">
    <a class="brand" href="../../index.html#home"><span class="sr-only">Archgen Labs, home. </span>{lockup}</a>
    <nav class="nav" aria-label="Primary"><a href="../../index.html#blog" aria-current="page">Blog</a></nav>
    <a class="pill" href="../../index.html#contact">Contact <span aria-hidden="true">→</span></a>
  </div>
  <div class="progress" aria-hidden="true"></div>
</header>

<main id="main">
  <div class="wrap">
    <div class="post">
      <header class="post-head">
        <a class="back" href="../../index.html#blog">{ARROW_L}All posts</a>
        <p class="tag">{e(p['tag'])}</p>
        <h1>{e(p['title'])}</h1>
        <p class="meta"><time datetime="{iso(p['date'])}">{e(p['date'])}</time><span>{e(p['read'])}</span><span>{e(p['authors'])}</span></p>{fig_html}
      </header>
      <nav class="toc" aria-label="On this page"><h2>On this page</h2><ol></ol></nav>
      <article class="prose">
<p class="dek">{p['dek']}</p>
{sized(leveled(p['body']))}
      </article>
    </div>

    <nav class="more" aria-label="More posts">{''.join(more)}</nav>
  </div>
</main>

{footer}

<dialog class="lb" id="lb" aria-label="Figure"><img alt=""><p></p><button class="lb-x" type="button" aria-label="Close figure">×</button></dialog>
<script src="../post.js" defer></script>
{fig_js}</body>
</html>
'''
    open(os.path.join(ROOT, 'blog', 'posts', slug + '.html'), 'w', encoding='utf-8').write(page)
    print('wrote blog/posts/%s.html  %d bytes' % (slug, len(page)))

# the Blog page's list in index.html (between the <ol id="posts"> tags), newest first, from the same posts.json
ARROW_R = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>'
items = ''.join(f'''
      <li><a class="pr" href="blog/posts/{slug}.html" aria-label="Read: {e(posts[slug]['title'])}">
        <div class="pr-meta"><span class="pr-tag">{e(posts[slug]['tag'])}</span><time datetime="{iso(posts[slug]['date'])}">{e(posts[slug]['date'])}</time><span>{e(posts[slug]['read'])}</span></div>
        <div class="pr-main"><h2>{e(posts[slug]['title'])}</h2><p>{e(posts[slug]['excerpt'])}</p></div>
        <span class="pr-read">Read{ARROW_R}</span>
      </a></li>''' for slug in order)
idx_path = os.path.join(ROOT, 'index.html')
idx, n = re.subn(r'(<ol class="posts" id="posts">).*?(\n    </ol>)', lambda m: m.group(1) + items + m.group(2), index, count=1, flags=re.S)
assert n == 1, 'index.html: <ol class="posts" id="posts"> not found'
# refresh the inlined loading screen from its sources
for block, rx in ((LOADER_CSS, r'<style id="agl-css">.*?</style>'), (LOADER_JS, r'<script id="agl-js">.*?</script>')):
    idx, n = re.subn(rx, lambda m: block, idx, count=1, flags=re.S)
    assert n == 1, 'index.html: inlined loader block not found: ' + rx
open(idx_path, 'w', encoding='utf-8').write(idx)
print('wrote index.html  blog list, %d posts' % len(order))

# sitemap.xml: the entries for posts are rewritten from posts.json (date published as lastmod); every other entry is kept
sm_path = os.path.join(ROOT, 'sitemap.xml')
sm = open(sm_path, encoding='utf-8').read()
sm = re.sub(r'\s*<url>\s*<loc>https://archgen\.tech/blog/posts/[^<]*</loc>.*?</url>', '', sm, flags=re.S)
entries = ''.join(f'\n  <url>\n    <loc>https://archgenlabs.com/blog/posts/{slug}.html</loc>\n    <lastmod>{iso(posts[slug]["date"])}</lastmod>\n  </url>'
                  for slug in order)
sm = sm.replace('\n</urlset>', entries + '\n</urlset>')
open(sm_path, 'w', encoding='utf-8').write(sm)
print('wrote sitemap.xml  %d posts' % len(order))
