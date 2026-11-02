/* Footer entrance, shared by Home and every post (after React Bits AnimatedContent, the same motion as the page's
   sections): when the footer reaches the screen, the call to talk, the link columns and the bottom line slide up and
   fade in one after another; when the wordmark reaches the screen it rises out of a mask (.wordmark clips it).
   Plays once. Anything already on screen at load is left alone. Off with reduced motion. */
(() => {
  const foot = document.querySelector('footer');
  if (!foot || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const EASE = 'cubic-bezier(.215,.61,.355,1)';   // GSAP power3.out, as AnimatedContent
  const MASK = 'cubic-bezier(.16,1,.3,1)';        // the site's arrive curve, for the rise out of the mask

  // watch one element; hide its targets if it starts off screen, play them as soon as any of it is on screen (a
  // trigger line above the bottom edge would never be crossed by a wordmark at the foot of a page too short to scroll)
  function once(el, hide, play) {
    if (!el) return;
    let first = true;
    const io = new IntersectionObserver(([e]) => {
      if (first) { first = false; if (e.isIntersecting) io.disconnect(); else hide(); return; }
      if (e.isIntersecting) { io.disconnect(); play(); }
    });
    io.observe(el);
  }

  const parts = [...foot.querySelectorAll('.foot-cta > *, .foot-grid > div, .foot-base')];
  once(foot, () => parts.forEach(p => { p.style.opacity = '0'; }), () => {
    const d = innerWidth < 700 ? 56 : 100;
    parts.forEach((p, i) => {
      p.animate([{ opacity: 0, transform: `translateY(${d}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 800, delay: i * 70, easing: EASE, fill: 'backwards' });
      p.style.opacity = '';
    });
  });

  const mark = foot.querySelector('.wordmark svg');
  once(mark && mark.parentNode, () => { mark.style.transform = 'translateY(105%)'; }, () => {
    mark.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 1100, easing: MASK, fill: 'backwards' });
    mark.style.transform = '';
  });
})();
