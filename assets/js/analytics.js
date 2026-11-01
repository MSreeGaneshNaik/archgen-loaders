/* Clarity: production hosts only, so local and preview visits stay out of reports. */
(() => {
  const hosts = ['archgen.tech', 'www.archgen.tech', 'archgenlabs.com', 'www.archgenlabs.com'];
  if (!hosts.includes(location.hostname)) return;

  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.clarity.ms/tag/z60wocpqfc';
  document.head.append(script);

  const event = name => window.clarity('event', name);
  document.addEventListener('archgen:booking-open', () => event('calendar_opened'));
  const route = () => {
    if (location.pathname.includes('/blog/posts/')) event('blog_post_viewed');
    else if (location.hash === '#blog') event('blog_index_viewed');
  };
  route();
  window.addEventListener('hashchange', route);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        event(entry.target.matches('.bnext') ? 'newton_viewed' : 'eda_3d_viewed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.bnext, #three-d').forEach(section => observer.observe(section));
  }
})();
