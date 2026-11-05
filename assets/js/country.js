/* Geo.Vision — country page: facts, neighbours, map and live conditions (data: mledoze/countries via jsDelivr) */
(() => {
  'use strict';
  const root = document.getElementById('country'); if (!root) return;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const link = (x) => `<li><a href="${x.slug}.html">${x.f} ${esc(x.n)}</a></li>`;
  const WMO = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers', 85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm, hail', 99: 'Thunderstorm, hail' };

  GV.json('data/countries.json').then((C) => {
    const c = C.find((x) => x.slug === root.dataset.slug); if (!c) return;
    const byA3 = Object.fromEntries(C.map((x) => [x.a3, x]));
    const ranked = C.filter((x) => x.rank).length;
    const nb = c.b.map((a) => byA3[a]).filter(Boolean);
    const status = c.ind ? (c.un ? 'an independent state and member of the United Nations' : 'an independent state that is not a UN member') : 'a territory or dependency rather than a fully independent state';
    let cmp = '';
    if (c.area) { const [nm, ar] = c.n === 'France' ? ['Texas', 695662] : ['France', 551695]; const r = c.area / ar; cmp = r >= 1 ? `roughly ${r.toFixed(1)}× the size of ${nm}` : `about ${(r * 100).toFixed(r < 0.01 ? 2 : 1)}% the size of ${nm}`; }
    $('c-intro').innerHTML = `${esc(c.n)} (officially ${esc(c.o)}) is ${status}, located in ${esc(c.sub || c.reg)}${c.reg && c.sub ? ` within ${esc(c.reg)}` : ''}. ${c.cap ? `Its capital is ${esc(c.cap)}. ` : ''}${c.area ? `It covers about ${fmt(c.area)} km², ${cmp}, ranking #${c.rank} of ${ranked} by area in our atlas. ` : ''}${c.ld ? `${esc(c.n)} is landlocked, with no coastline on the open ocean.` : nb.length ? `It shares land borders with ${nb.length} ${nb.length === 1 ? 'country' : 'countries'}.` : 'It has no land borders with other countries.'}`;
    const facts = [['Official name', c.o], ['Capital', c.cap || '—'], ['Region', c.reg], ['Subregion', c.sub || '—'],
      ['Area', c.area ? `${fmt(c.area)} km² (${fmt(c.area * 0.386102)} mi²)` : '—'], ['Area rank', c.rank ? '#' + c.rank : '—'],
      ['Languages', c.lang.join(', ') || '—'], ['Currency', c.cur.join(', ') || '—'], ['Demonym', c.dem || '—'], ['Calling code', c.idd || '—'],
      ['Internet TLD', c.tld || '—'], ['ISO codes', `${c.a2} / ${c.a3}${c.num ? ' / ' + c.num : ''}`],
      ['Centroid', `${Math.abs(c.ll[0]).toFixed(2)}°${c.ll[0] >= 0 ? 'N' : 'S'}, ${Math.abs(c.ll[1]).toFixed(2)}°${c.ll[1] >= 0 ? 'E' : 'W'}`],
      ['Hemispheres', `${c.ll[0] >= 0 ? 'Northern' : 'Southern'} & ${c.ll[1] >= 0 ? 'Eastern' : 'Western'}`], ['Landlocked', c.ld ? 'Yes' : 'No'], ['UN member', c.un ? 'Yes' : 'No']];
    $('c-facts').innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    const lg = C.find((x) => x.rank === c.rank - 1), sm = C.find((x) => x.rank === c.rank + 1);
    $('c-neighbours').innerHTML = (nb.length ? `<ul class="link-grid">${nb.map(link).join('')}</ul>` : `<p>${esc(c.n)} has no land neighbours${c.ld ? '' : ' — its borders are entirely maritime'}.</p>`)
      + (c.rank ? `<p>By area, ${esc(c.n)} sits between ${lg ? `<a href="${lg.slug}.html">${esc(lg.n)}</a> (larger)` : 'no larger country'} and ${sm ? `<a href="${sm.slug}.html">${esc(sm.n)}</a> (smaller)` : 'no smaller entry'}.</p>` : '');
    const peers = C.filter((x) => c.sub && x.sub === c.sub && x.a3 !== c.a3).slice(0, 12);
    if (peers.length) $('c-more').innerHTML = `<h2>More in ${esc(c.sub)}</h2><ul class="link-grid">${peers.map(link).join('')}</ul>`;
    const lang = $('c-lang'); lang.classList.remove('muted');
    lang.innerHTML = `${c.lang.length > 1 ? `The languages recorded as official or widely used in ${esc(c.n)} are ${esc(c.lang.join(', '))}.` : c.lang.length ? `The main language recorded in ${esc(c.n)} is ${esc(c.lang[0])}.` : 'Language data is not available for this entry.'} ${c.cur.length ? `Everyday prices are set in ${esc(c.cur.join(' and '))}.` : ''} ${c.idd ? `To phone ${esc(c.n)} from abroad, dial ${esc(c.idd)} followed by the local number; websites registered there commonly end in ${esc(c.tld || 'the national domain')}.` : ''}`;
    $('c-dist').href = `/tools/distance.html?to=${c.ll[0]},${c.ll[1]}`;

    /* map */
    const el = $('country-map');
    if (el && window.L) {
      const [lat, lon] = c.ll, area = c.area;
      const z = area > 5e6 ? 2 : area > 1e6 ? 3 : area > 2e5 ? 4 : area > 3e4 ? 5 : area > 3e3 ? 7 : 9;
      const m = L.map(el, { scrollWheelZoom: false, worldCopyJump: true }).setView([lat, lon], z);
      const b = GV.baseLayers(); const s = b['Blue Marble (relief)'].addTo(m); GV.guardTiles(m, s, b['Streets (OpenStreetMap)']); L.control.layers(b).addTo(m);
      GV.json('data/world.geo.json').then((g) => {
        const f = g.features.filter((x) => x.properties.a3 === c.a3);
        if (!f.length) { L.circleMarker([lat, lon], { radius: 9, color: '#39f0c8' }).addTo(m); return; }
        L.geoJSON({ type: 'FeatureCollection', features: f }, { style: { color: '#39f0c8', weight: 2, fillOpacity: 0.12 } }).addTo(m);
        if (area > 3e3) { // fit the main landmass so overseas territories don't zoom the map out
          let best = null, bestA = -1;
          f.forEach((x) => (x.geometry.type === 'Polygon' ? [x.geometry.coordinates] : x.geometry.coordinates).forEach((p) => { const r = p[0]; let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); a = Math.abs(a); if (a > bestA) { bestA = a; best = r; } }));
          if (best) m.fitBounds(L.latLngBounds(best.map(([x, y]) => [y, x])), { maxZoom: 7, padding: [20, 20] });
        }
      }).catch(() => L.circleMarker([lat, lon], { radius: 9, color: '#39f0c8' }).addTo(m));
    }

    /* live weather */
    const box = $('country-live'); const btn = box && box.querySelector('[data-load-weather]');
    btn && btn.addEventListener('click', async () => {
      btn.textContent = 'Loading…'; btn.disabled = true;
      try {
        const u = `https://api.open-meteo.com/v1/forecast?latitude=${c.ll[0]}&longitude=${c.ll[1]}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
        const j = await (await fetch(u)).json(); const w = j.current;
        const local = new Date().toLocaleString([], { timeZone: j.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit' });
        box.innerHTML = `<div class="wx"><div><span class="muted small">Local time</span><b>${local}</b><span class="small">${j.timezone}</span></div><div><span class="muted small">Now</span><b>${Math.round(w.temperature_2m)}°C</b><span class="small">${WMO[w.weather_code] || '—'} ${w.is_day ? '☀️' : '🌙'}</span></div><div><span class="muted small">Today</span><b>${Math.round(j.daily.temperature_2m_min[0])}° / ${Math.round(j.daily.temperature_2m_max[0])}°</b><span class="small">min / max</span></div><div><span class="muted small">Humidity · wind</span><b>${w.relative_humidity_2m}%</b><span class="small">${Math.round(w.wind_speed_10m)} km/h</span></div><div><span class="muted small">Sunrise · sunset</span><b>${j.daily.sunrise[0].slice(11)} · ${j.daily.sunset[0].slice(11)}</b></div></div><p class="muted small">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a> (CC BY 4.0) for ${c.ll[0]}, ${c.ll[1]}.</p>`;
      } catch { btn.textContent = 'Weather unavailable — try again'; btn.disabled = false; }
    });
  }).catch(() => { const n = $('c-neighbours'); if (n) n.innerHTML = '<p class="muted">Country details could not be loaded. Please refresh.</p>'; });
})();
