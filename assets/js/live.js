/* Geo.Vision — Live Earth map */
(() => {
  'use strict';
  const el = document.getElementById('map'); if (!el || !window.L) return;
  const rad = Math.PI / 180;
  const map = L.map(el, { worldCopyJump: true, minZoom: 2, zoomControl: true }).setView([20, 10], 2);
  const bases = GV.baseLayers();
  const start = bases['Blue Marble (relief)'].addTo(map);
  GV.guardTiles(map, start, bases['Streets (OpenStreetMap)']);
  GV.guardTiles(map, bases["Yesterday's satellite (MODIS)"], bases['Blue Marble (relief)']);

  const groups = { quakes: L.layerGroup().addTo(map), events: L.layerGroup().addTo(map), iss: L.layerGroup().addTo(map), night: L.layerGroup().addTo(map), me: L.layerGroup().addTo(map) };
  L.control.layers(bases, { 'Earthquakes': groups.quakes, 'Natural events (NASA EONET)': groups.events, 'ISS live': groups.iss, 'Day / night': groups.night }, { collapsed: true }).addTo(map);
  L.control.scale({ imperial: true }).addTo(map);

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ago = (t) => { const m = Math.round((Date.now() - t) / 6e4); return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };

  /* ---- day/night terminator ---- */
  function sun(d) {
    const n = d / 864e5 + 2440587.5 - 2451545;
    const L0 = (280.46 + 0.9856474 * n) % 360, g = ((357.528 + 0.9856003 * n) % 360) * rad;
    const lam = (L0 + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad, eps = (23.439 - 4e-7 * n) * rad;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) / rad;
    const gmst = (280.46061837 + 360.98564736629 * n) % 360;
    let lon = ra - gmst; lon = ((lon + 540) % 360) - 180;
    return { dec, lat: dec / rad, lon };
  }
  let sunMarker;
  function drawNight() {
    groups.night.clearLayers();
    const s = sun(Date.now()); const pts = [];
    for (let lon = -180; lon <= 180; lon += 2) {
      const lat = Math.atan(-Math.cos((lon - s.lon) * rad) / Math.tan(s.dec)) / rad;
      pts.push([lat, lon]);
    }
    const pole = s.dec > 0 ? -85 : 85;
    const ring = [...pts, [pole, 180], [pole, -180]];
    [-360, 0, 360].forEach((off) => L.polygon(ring.map(([a, b]) => [a, b + off]), { stroke: false, fillColor: '#000814', fillOpacity: 0.45, interactive: false }).addTo(groups.night));
    sunMarker = L.circleMarker([s.lat, s.lon], { radius: 9, color: '#ffb547', fillColor: '#ffd27a', fillOpacity: 0.9, weight: 2 }).bindTooltip('Sub-solar point — the Sun is directly overhead here').addTo(groups.night);
  }
  drawNight(); setInterval(drawNight, 60000);

  /* ---- earthquakes ---- */
  let feed = '2.5_day';
  const qColor = (m) => (m >= 7 ? '#ff3b5c' : m >= 6 ? '#ff6b5b' : m >= 5 ? '#ffb547' : m >= 4 ? '#ffe27a' : '#39f0c8');
  async function loadQuakes() {
    const list = $('#quake-list'); if (list) list.innerHTML = '<li class="muted">Loading USGS feed…</li>';
    try {
      const r = await fetch(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feed}.geojson`);
      const j = await r.json();
      groups.quakes.clearLayers();
      const fs = j.features.filter((f) => f.geometry).sort((a, b) => b.properties.time - a.properties.time);
      fs.forEach((f) => {
        const [lon, lat, depth] = f.geometry.coordinates; const p = f.properties; const m = p.mag ?? 0;
        L.circleMarker([lat, lon], { radius: Math.max(3, m * 2.4), color: qColor(m), weight: 1.5, fillColor: qColor(m), fillOpacity: 0.35 })
          .bindPopup(`<b>M${m.toFixed(1)}</b> — ${esc(p.place)}<br>${new Date(p.time).toUTCString()}<br>Depth ${depth.toFixed(0)} km${p.tsunami ? '<br><b>Tsunami flag issued</b>' : ''}<br><a href="${p.url}" target="_blank" rel="noopener">USGS event page</a>`)
          .addTo(groups.quakes);
      });
      $('#q-count') && ($('#q-count').textContent = fs.length);
      const maxQ = fs.reduce((a, b) => ((b.properties.mag ?? 0) > (a?.properties.mag ?? -9) ? b : a), null);
      $('#q-max') && ($('#q-max').textContent = maxQ ? 'M' + maxQ.properties.mag.toFixed(1) : '—');
      if (list) list.innerHTML = fs.slice(0, 40).map((f, i) => `<li data-i="${i}" tabindex="0"><span class="mag mag-${Math.floor(f.properties.mag ?? 0)}">M${(f.properties.mag ?? 0).toFixed(1)}</span><div>${esc(f.properties.place || 'Unknown')}<small>${ago(f.properties.time)} · ${f.geometry.coordinates[2].toFixed(0)} km deep</small></div></li>`).join('') || '<li class="muted">No events in this window.</li>';
      list && list.querySelectorAll('li[data-i]').forEach((li) => {
        const f = fs[li.dataset.i]; const go = () => map.flyTo([f.geometry.coordinates[1], f.geometry.coordinates[0]], 6);
        li.addEventListener('click', go); li.addEventListener('keydown', (e) => e.key === 'Enter' && go());
      });
      $('#q-updated') && ($('#q-updated').textContent = 'Updated ' + new Date().toLocaleTimeString());
    } catch (e) { if (list) list.innerHTML = '<li class="muted">USGS feed unavailable right now. Retrying in 2 minutes.</li>'; }
  }
  document.querySelectorAll('[data-feed]').forEach((b) => b.addEventListener('click', () => {
    feed = b.dataset.feed; document.querySelectorAll('[data-feed]').forEach((x) => x.classList.toggle('on', x === b)); loadQuakes();
  }));
  loadQuakes(); setInterval(loadQuakes, 120000);

  /* ---- natural events ---- */
  const ICON = { Wildfires: '🔥', 'Severe Storms': '🌀', Volcanoes: '🌋', 'Sea and Lake Ice': '🧊', Floods: '🌊', Drought: '🏜️', 'Dust and Haze': '🌫️', Snow: '❄️', Landslides: '⛰️', 'Temperature Extremes': '🌡️', 'Water Color': '💧', Manmade: '🏭', Earthquakes: '〰️' };
  async function loadEvents() {
    try {
      const r = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30');
      const j = await r.json(); groups.events.clearLayers(); const counts = {};
      j.events.forEach((e) => {
        const cat = e.categories[0]?.title || 'Other'; counts[cat] = (counts[cat] || 0) + 1;
        const g = e.geometry[e.geometry.length - 1]; if (!g) return;
        let ll; if (g.type === 'Point') ll = [g.coordinates[1], g.coordinates[0]]; else if (g.type === 'Polygon') { const c = g.coordinates[0][0]; ll = [c[1], c[0]]; } else return;
        if (cat === 'Severe Storms' && e.geometry.length > 1) {
          L.polyline(e.geometry.filter((x) => x.type === 'Point').map((x) => [x.coordinates[1], x.coordinates[0]]), { color: '#6aa8ff', weight: 2, opacity: 0.8, dashArray: '4 4' }).addTo(groups.events);
        }
        L.marker(ll, { icon: L.divIcon({ className: '', html: `<span style="font-size:20px">${ICON[cat] || '📍'}</span>`, iconSize: [22, 22], iconAnchor: [11, 11] }) })
          .bindPopup(`<b>${esc(e.title)}</b><br>${esc(cat)} · ${g.date ? g.date.slice(0, 10) : ''}${g.magnitudeValue ? `<br>${g.magnitudeValue} ${esc(g.magnitudeUnit || '')}` : ''}<br><a href="${e.sources[0]?.url || e.link}" target="_blank" rel="noopener">Source</a>`).addTo(groups.events);
      });
      const box = $('#event-counts'); if (box) box.innerHTML = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span class="chip">${ICON[k] || '📍'} ${esc(k)} <b>${v}</b></span>`).join('') || '<span class="muted">No open events.</span>';
    } catch (e) { const box = $('#event-counts'); if (box) box.textContent = 'NASA EONET unavailable right now.'; }
  }
  loadEvents(); setInterval(loadEvents, 15 * 60000);

  /* ---- ISS ---- */
  let issMarker, trail = [], follow = false;
  const issIcon = L.divIcon({ className: 'iss-icon', html: '🛰️', iconSize: [26, 26], iconAnchor: [13, 13] });
  const split = (pts) => { const segs = [[]]; pts.forEach((p, i) => { if (i && Math.abs(p[1] - pts[i - 1][1]) > 180) segs.push([]); segs[segs.length - 1].push(p); }); return segs; };
  let predicted = null;
  async function predict() {
    try {
      const now = Math.floor(Date.now() / 1000); const ts = Array.from({ length: 10 }, (_, i) => now + (i + 1) * 540).join(',');
      const r = await fetch(`https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=${ts}&units=kilometers`);
      const j = await r.json(); predicted = j.map((p) => [p.latitude, p.longitude]);
    } catch {}
  }
  async function iss() {
    try {
      const r = await fetch('https://api.wheretheiss.at/v1/satellites/25544'); const p = await r.json();
      const ll = [p.latitude, p.longitude]; trail.push(ll); if (trail.length > 120) trail.shift();
      groups.iss.clearLayers();
      split(trail).forEach((s) => s.length > 1 && L.polyline(s, { color: '#ffb547', weight: 2 }).addTo(groups.iss));
      if (predicted) split([ll, ...predicted]).forEach((s) => s.length > 1 && L.polyline(s, { color: '#ffb547', weight: 1.5, dashArray: '3 6', opacity: 0.7 }).addTo(groups.iss));
      issMarker = L.marker(ll, { icon: issIcon }).bindTooltip('International Space Station').addTo(groups.iss);
      L.circle(ll, { radius: p.footprint * 500, color: '#ffb547', weight: 1, fillOpacity: 0.04 }).addTo(groups.iss);
      const box = $('#iss-box');
      if (box) box.innerHTML = `Lat <b>${p.latitude.toFixed(2)}°</b> · Lon <b>${p.longitude.toFixed(2)}°</b><br>Altitude <b>${p.altitude.toFixed(0)} km</b> · Speed <b>${Math.round(p.velocity).toLocaleString()} km/h</b><br>Currently in <b>${p.visibility === 'daylight' ? 'sunlight ☀️' : 'Earth\'s shadow 🌑'}</b>`;
      if (follow) map.panTo(ll, { animate: true });
    } catch { const box = $('#iss-box'); if (box) box.textContent = 'ISS position service unavailable right now.'; }
  }
  predict(); iss(); setInterval(iss, 5000); setInterval(predict, 5 * 60000);
  const fb = $('#iss-follow'); fb && fb.addEventListener('change', () => { follow = fb.checked; if (follow && issMarker) map.setView(issMarker.getLatLng(), 4); });

  /* ---- toggles in side panel ---- */
  document.querySelectorAll('[data-layer]').forEach((cb) => cb.addEventListener('change', () => { const g = groups[cb.dataset.layer]; cb.checked ? g.addTo(map) : map.removeLayer(g); }));
  document.querySelectorAll('[data-base]').forEach((b) => b.addEventListener('click', () => {
    Object.values(bases).forEach((l) => map.hasLayer(l) && map.removeLayer(l)); bases[b.dataset.base].addTo(map);
    document.querySelectorAll('[data-base]').forEach((x) => x.classList.toggle('on', x === b));
  }));

  /* ---- locate me ---- */
  const lb = $('#locate');
  lb && lb.addEventListener('click', () => {
    if (!navigator.geolocation) return;
    lb.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition((pos) => {
      const ll = [pos.coords.latitude, pos.coords.longitude]; groups.me.clearLayers();
      L.circleMarker(ll, { radius: 8, color: '#fff', fillColor: '#39f0c8', fillOpacity: 1, weight: 2 }).bindPopup(`You are here<br>${ll[0].toFixed(4)}, ${ll[1].toFixed(4)}`).addTo(groups.me).openPopup();
      map.setView(ll, 5); lb.textContent = 'Show my location';
    }, () => { lb.textContent = 'Location unavailable'; }, { enableHighAccuracy: false, timeout: 10000 });
  });
})();
