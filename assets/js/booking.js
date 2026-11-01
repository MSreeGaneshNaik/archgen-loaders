(() => {
  const url = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3GdO5MAj7NC8H7irGzqRsY92sptGTAe4dg9l9bMsx0DPiNLEp_Bt_7Peq08vYjxTr9pFyiEKuK?gv=true';
  const dialog = document.createElement('dialog');
  dialog.className = 'booking-dialog';
  dialog.setAttribute('aria-label', 'Book a conversation with Archgen Labs');
  dialog.innerHTML = `<div class="booking-toolbar"><a href="${url}" target="_blank" rel="noopener noreferrer">Open calendar in a new tab ↗</a><button type="button" aria-label="Close booking calendar">Close ×</button></div><iframe title="Google Calendar appointment booking" src="about:blank"></iframe>`;
  document.body.append(dialog);
  const frame = dialog.querySelector('iframe');
  let previous;
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if(e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.documentElement.classList.remove('booking-open'); previous?.focus(); });
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if(!link) return;
    const href = link.getAttribute('href');
    if(!href.endsWith('#contact') && !href.includes('calendar.app.google/') && !href.includes('/appointments/schedules/')) return;
    if(dialog.contains(link)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    previous = link;
    if(frame.getAttribute('src') === 'about:blank') frame.src = url;
    document.documentElement.classList.add('booking-open');
    dialog.showModal();
    document.dispatchEvent(new Event('archgen:booking-open'));
    dialog.querySelector('button').focus();
  }, true);
})();
