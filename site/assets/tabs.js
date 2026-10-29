// Tabs (Team and Satellite calendar pages): one panel at a time. Arrow keys move between tabs, and a link such as
// team.html#member-b or calendar.html#gauge-days opens that tab. Without JavaScript the tab row stays hidden and every panel shows.
(function () {
  const list = document.querySelector('.tabs[role="tablist"]');
  if (!list) return;
  const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  list.hidden = false;

  function show(i, focus) {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
  }

  function fromHash() {
    const i = panels.findIndex(p => '#' + p.id === location.hash);
    return i < 0 ? null : i;
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => {
      show(i);
      history.replaceState(null, '', '#' + panels[i].id);
    });
    t.addEventListener('keydown', e => {
      const last = tabs.length - 1;
      const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      show(next, true);
      history.replaceState(null, '', '#' + panels[next].id);
    });
  });

  window.addEventListener('hashchange', () => {
    const i = fromHash();
    if (i !== null) { show(i); list.scrollIntoView({ block: 'start' }); }
  });

  const start = fromHash();
  show(start === null ? 0 : start);
  if (start !== null) list.scrollIntoView({ block: 'start' });
})();
