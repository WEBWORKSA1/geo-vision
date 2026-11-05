/* Geo.Vision — Earth Today blocks, filled live from USGS and NASA EONET */
(() => {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fill = (id, html) => { const el = document.getElementById(id); if (el && el.parentNode) el.parentNode.innerHTML = html; };
  const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  set('et-when', new Date().toUTCString().replace(' GMT', ' UTC'));
  fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson').then((r) => r.json()).then((j) => {
    set('et-qcount', j.features.length);
    const top = j.features.filter((f) => f.geometry).sort((a, b) => b.properties.mag - a.properties.mag).slice(0, 10);
    fill('et-quakes', top.map((f) => { const p = f.properties, g = f.geometry.coordinates; return `<li><span class="mag mag-${Math.floor(p.mag)}">M${p.mag.toFixed(1)}</span><div><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.place || 'Unknown location')}</a><small>${new Date(p.time).toUTCString().slice(5, 22)} UTC · depth ${Math.round(g[2])} km${p.tsunami ? ' · tsunami flag' : ''}</small></div></li>`; }).join('') || '<li class="muted">No M4.5+ earthquakes in the past week.</li>');
  }).catch(() => fill('et-quakes', '<li class="muted">USGS feed unavailable right now — try the <a href="/live.html">live map</a>.</li>'));
  fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30').then((r) => r.json()).then((j) => {
    const counts = {}; j.events.forEach((e) => { const c = e.categories[0]?.title || 'Other'; counts[c] = (counts[c] || 0) + 1; });
    fill('et-cats', Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span class="chip">${esc(k)} <b>${v}</b></span>`).join('') || '<span class="chip">No open events</span>');
    fill('et-events', j.events.slice(0, 15).map((e) => { const g = e.geometry[e.geometry.length - 1] || {}; return `<li><span class="chip chip-sm">${esc(e.categories[0]?.title || 'Other')}</span> <a href="${esc(e.sources[0]?.url || e.link)}" target="_blank" rel="noopener">${esc(e.title)}</a>${g.date ? `<small>${g.date.slice(0, 10)}</small>` : ''}</li>`; }).join(''));
  }).catch(() => { fill('et-cats', '<span class="chip">NASA EONET unavailable</span>'); fill('et-events', ''); });
})();
