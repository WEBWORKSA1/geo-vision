/* Geo.Vision — home: dotted globe + live stats */
(() => {
  'use strict';
  const cv = document.getElementById('globe'); const r2 = Math.PI / 180;
  let quakes = [], iss = null;
  if (cv) {
    const ctx = cv.getContext('2d'); let W, R, dots = [], rot = -20; const tilt = -18 * r2;
    const size = () => { const s = cv.clientWidth * (window.devicePixelRatio || 1); cv.width = cv.height = s; W = s; R = s * 0.44; };
    size(); addEventListener('resize', size);
    const inRing = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    GV.json('data/world.geo.json').then((g) => {
      const polys = []; g.features.forEach((f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).forEach((p) => { const r = p[0]; let a = 180, b = -180, c = 90, d = -90; r.forEach(([x, y]) => { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); }); polys.push({ r, a, b, c, d }); }));
      for (let lat = -84; lat <= 84; lat += 2.2) { const step = 2.2 / Math.max(0.2, Math.cos(lat * r2)); for (let lon = -180; lon < 180; lon += step) { for (const p of polys) if (lon >= p.a && lon <= p.b && lat >= p.c && lat <= p.d && inRing(lon, lat, p.r)) { dots.push([lat, lon]); break; } } }
    }).catch(() => {});
    const proj = (lat, lon) => { const φ = lat * r2, λ = (lon + rot) * r2; const cosc = Math.sin(tilt) * Math.sin(φ) + Math.cos(tilt) * Math.cos(φ) * Math.cos(λ); return [W / 2 + R * Math.cos(φ) * Math.sin(λ), W / 2 - R * (Math.cos(tilt) * Math.sin(φ) - Math.sin(tilt) * Math.cos(φ) * Math.cos(λ)), cosc]; };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = (t) => {
      ctx.clearRect(0, 0, W, W);
      const grd = ctx.createRadialGradient(W * 0.42, W * 0.4, R * 0.1, W / 2, W / 2, R); grd.addColorStop(0, '#13305e'); grd.addColorStop(1, '#060f26');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(W / 2, W / 2, R, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(106,168,255,.14)'; ctx.lineWidth = 1;
      for (let lon = -180; lon < 180; lon += 30) { ctx.beginPath(); let pen = false; for (let lat = -90; lat <= 90; lat += 4) { const [x, y, c] = proj(lat, lon); if (c > 0) { pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } else pen = false; } ctx.stroke(); }
      for (let lat = -60; lat <= 60; lat += 30) { ctx.beginPath(); let pen = false; for (let lon = -180; lon <= 180; lon += 4) { const [x, y, c] = proj(lat, lon); if (c > 0) { pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } else pen = false; } ctx.stroke(); }
      const s = Math.max(1.6, W / 330);
      for (const [la, lo] of dots) { const [x, y, c] = proj(la, lo); if (c > 0) { ctx.fillStyle = `rgba(57,240,200,${0.25 + c * 0.7})`; ctx.fillRect(x - s / 2, y - s / 2, s, s); } }
      quakes.forEach((q) => { const [x, y, c] = proj(q[0], q[1]); if (c > 0) { const p = (Math.sin(t / 400 + q[1]) + 1) / 2; ctx.strokeStyle = `rgba(255,107,91,${0.4 + p * 0.5})`; ctx.lineWidth = 1.5 * (W / 500); ctx.beginPath(); ctx.arc(x, y, (q[2] - 3) * (W / 260) * (0.6 + p * 0.6), 0, 7); ctx.stroke(); } });
      if (iss) { const [x, y, c] = proj(iss[0], iss[1]); if (c > 0) { ctx.fillStyle = '#ffb547'; ctx.beginPath(); ctx.arc(x, y, W / 110, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,181,71,.25)'; ctx.beginPath(); ctx.arc(x, y, W / 40, 0, 7); ctx.fill(); } }
      if (!reduce) rot += 0.12;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson').then((r) => r.json()).then((j) => {
    set('st-quakes', j.features.length);
    const big = j.features.reduce((a, f) => Math.max(a, f.properties.mag || 0), 0); set('st-max', 'M' + big.toFixed(1));
    quakes = j.features.filter((f) => f.properties.mag >= 4).map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0], f.properties.mag]);
  }).catch(() => {});
  const issTick = () => fetch('https://api.wheretheiss.at/v1/satellites/25544').then((r) => r.json()).then((p) => { iss = [p.latitude, p.longitude]; set('st-iss', Math.round(p.velocity).toLocaleString() + ' km/h'); set('hud-iss', `ISS ${p.latitude.toFixed(1)}°, ${p.longitude.toFixed(1)}°`); }).catch(() => {});
  issTick(); setInterval(issTick, 10000);
  fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30').then((r) => r.json()).then((j) => set('st-events', j.events.length)).catch(() => {});
})();
