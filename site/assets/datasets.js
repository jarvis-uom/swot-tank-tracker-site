// Datasets page: show only one member's datasets (cards, table rows and empty groups hide).
// Without JavaScript the buttons stay hidden and every dataset shows.
(function () {
  const bar = document.querySelector('.ds-filter');
  if (!bar) return;
  const buttons = Array.from(bar.querySelectorAll('button'));
  const items = Array.from(document.querySelectorAll('.ds, .ds-matrix tbody tr'));
  const groups = Array.from(document.querySelectorAll('.ds-group'));
  bar.hidden = false;

  function show(member) {
    buttons.forEach(b => b.setAttribute('aria-pressed', b.dataset.member === member ? 'true' : 'false'));
    items.forEach(el => { el.hidden = member !== '' && !el.dataset.members.split(' ').includes(member); });
    groups.forEach(g => {
      const shown = Array.from(g.querySelectorAll('.ds:not([hidden])'));
      g.hidden = shown.length === 0;
      // a card left alone on its row takes the whole width
      g.querySelectorAll('.ds').forEach(c => c.classList.remove('ds-wide'));
      if (shown.length % 2 === 1) shown[shown.length - 1].classList.add('ds-wide');
    });
  }

  buttons.forEach(b => b.addEventListener('click', () => show(b.dataset.member)));
  // a link straight to a card shows it even when a filter would hide it
  window.addEventListener('hashchange', () => {
    const el = document.getElementById(location.hash.slice(1));
    if (el && el.closest('[hidden]')) show('');
  });
})();
