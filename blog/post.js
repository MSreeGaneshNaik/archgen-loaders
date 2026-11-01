/* Archgen blog post pages: contents rail, reading progress, figure viewer. Everything degrades to a plain article. */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- contents rail: one entry per section, the one being read is lit ---- */
  const prose = document.querySelector('.prose'), toc = document.querySelector('.toc ol');
  if(prose && toc){
    // headings carry their original level as v2/v3/v4 (the tag level is corrected for screen readers)
    let hs = [...prose.querySelectorAll('.v2')];
    if(hs.length < 3) hs = [...prose.querySelectorAll('.v2, .v3')];   // few sections: list the sub-heads too
    const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    const used = new Set();
    hs.forEach(h => { let id = slug(h.textContent) || 'section'; while(used.has(id)) id += '-2'; used.add(id); h.id = id;
      const li = document.createElement('li'), a = document.createElement('a'); a.href = '#' + id; a.textContent = h.textContent; li.appendChild(a); toc.appendChild(li); });
    if(!hs.length) toc.closest('.toc').remove();
    const links = [...toc.querySelectorAll('a')];
    // a contents click glides to its section (the page itself never scrolls on its own)
    links.forEach(a => a.addEventListener('click', e => {
      const t = document.getElementById(a.hash.slice(1)); if(!t) return;
      e.preventDefault(); t.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
      history.replaceState(null, '', a.hash);
    }));
    const light = () => {
      const y = innerHeight * .3; let cur = -1;
      hs.forEach((h, i) => { if(h.getBoundingClientRect().top < y) cur = i; });
      links.forEach((a, i) => { if(i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    };
    let raf = 0; addEventListener('scroll', () => { if(!raf) raf = requestAnimationFrame(() => { raf = 0; light(); progress(); }); }, {passive: true});
    light();
  }

  /* ---- landing ---- */
  // A post always opens at its top (or at the section a #link names), never at a scroll position carried over from the
  // page before; scrollRestoration = "manual" (top of <head>) does most of this. Only inside a preview iframe (claude.ai),
  // which can re-apply an old position after this script runs, is the landing re-pinned at every loading stage until the
  // page settles, letting go the moment the reader scrolls, taps or presses a key. On the real site a scrollbar drag in
  // the first seconds must never be undone (some browsers send no pointer event for it).
  let reader = false;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, () => { reader = true; }, {passive: true, capture: true}));
  const land = () => {
    if(reader) return;
    let id = '';
    try{ id = decodeURIComponent(location.hash.slice(1)); }catch(e){}   // a malformed #fragment (bad copy-paste) is just ignored
    const t = id && document.getElementById(id);
    if(t) t.scrollIntoView({block: 'start', behavior: 'instant'});
    else if(scrollX || scrollY) scrollTo({top: 0, left: 0, behavior: 'instant'});
  };
  land();
  if(window.top !== window){
    requestAnimationFrame(land);
    addEventListener('pageshow', land);
    addEventListener('load', () => { land(); [60, 200, 450, 900, 1500].forEach(ms => setTimeout(land, ms)); });
    // for the first few seconds any scroll the reader did not make is undone at once, so a late jump never shows
    const t0 = performance.now();
    const guard = () => { if(reader || performance.now() - t0 > 4000){ removeEventListener('scroll', guard); return; } land(); };
    addEventListener('scroll', guard, {passive: true});
  }

  /* ---- reading progress along the bar ---- */
  const bar = document.querySelector('.progress');
  function progress(){
    if(!bar || !prose) return;
    const r = prose.getBoundingClientRect(), total = r.height - innerHeight * .6;
    bar.style.setProperty('--p', Math.max(0, Math.min(1, (innerHeight * .4 - r.top) / Math.max(1, total))).toFixed(4));
  }
  progress();

  /* ---- figure viewer: a diagram opens large, Esc or a click puts it back ---- */
  const lb = document.getElementById('lb');
  if(lb && lb.showModal){
    const img = lb.querySelector('img'), cap = lb.querySelector('p');
    document.querySelectorAll('.prose figure img').forEach(im => {
      im.tabIndex = 0; im.setAttribute('role', 'button'); im.setAttribute('aria-label', 'Open figure: ' + (im.alt || 'image'));
      const open = () => { img.src = im.currentSrc || im.src; img.alt = im.alt; const fc = im.closest('figure').querySelector('figcaption'); cap.textContent = fc ? fc.textContent : im.alt; cap.hidden = !cap.textContent; lb.showModal(); };
      im.addEventListener('click', open);
      im.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
    });
    lb.addEventListener('click', () => lb.close());
  } else if(lb) lb.remove();

  /* ---- back to top ---- */
  const top = document.getElementById('totop');
  if(top) top.addEventListener('click', e => { e.preventDefault(); scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'}); });
})();
