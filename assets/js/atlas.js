/* Geo.Vision — atlas search */
(() => {
  const s = document.getElementById('atlas-search'); if (!s) return;
  const items = [...document.querySelectorAll('.atlas-region li[data-name]')];
  s.addEventListener('input', () => {
    const q = s.value.trim().toLowerCase();
    items.forEach((li) => { li.hidden = q && !li.dataset.name.includes(q); });
    document.querySelectorAll('.atlas-region').forEach((r) => { r.hidden = q && !r.querySelector('li:not([hidden])'); });
  });
})();
