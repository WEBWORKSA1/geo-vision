/* Geo.Vision — tools: distance, coords, sun, clock, antipode */
(() => {
  'use strict';
  const root = document.getElementById('tool'); if (!root) return;
  const $ = (s) => root.querySelector(s);
  const r2 = Math.PI / 180;
  const fmt = (n, d = 0) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
  const parseLL = (s) => { const m = String(s).trim().match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/); if (!m) return null; const a = +m[1], b = +m[2]; return Math.abs(a) <= 90 && Math.abs(b) <= 180 ? [a, b] : null; };
  const locate = (cb, btn) => { if (!navigator.geolocation) return; btn && (btn.textContent = 'Locating…'); navigator.geolocation.getCurrentPosition((p) => { btn && (btn.textContent = 'Use my location'); cb([+p.coords.latitude.toFixed(5), +p.coords.longitude.toFixed(5)]); }, () => { btn && (btn.textContent = 'Location blocked'); }, { timeout: 10000 }); };
  const mkMap = (id, view = [20, 0], z = 2) => { const m = L.map(id, { worldCopyJump: true }).setView(view, z); const b = GV.baseLayers(); const s = b['Streets (OpenStreetMap)'].addTo(m); L.control.layers(b).addTo(m); return m; };
  const gc = (a, b, n = 96) => { // great-circle points
    const [la1, lo1, la2, lo2] = [a[0] * r2, a[1] * r2, b[0] * r2, b[1] * r2];
    const d = 2 * Math.asin(Math.sqrt(Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2)); if (!d) return [a, b];
    const out = []; for (let i = 0; i <= n; i++) { const f = i / n; const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
      const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2), y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2), z = A * Math.sin(la1) + B * Math.sin(la2);
      out.push([Math.atan2(z, Math.hypot(x, y)) / r2, Math.atan2(y, x) / r2]); }
    for (let i = 1; i < out.length; i++) { while (out[i][1] - out[i - 1][1] > 180) out[i][1] -= 360; while (out[i][1] - out[i - 1][1] < -180) out[i][1] += 360; }
    return out;
  };

  const tools = {
    distance() {
      const m = mkMap('tool-map'); let A = null, B = null, line, ma, mb;
      const ia = $('#pt-a'), ib = $('#pt-b');
      const q = new URLSearchParams(location.search).get('to'); if (q && parseLL(q)) { B = parseLL(q); ib.value = B.join(', '); }
      const run = () => {
        A = parseLL(ia.value) || A; B = parseLL(ib.value) || B;
        [line, ma, mb].forEach((x) => x && m.removeLayer(x));
        if (A) ma = L.marker(A).addTo(m).bindTooltip('A');
        if (B) mb = L.marker(B).addTo(m).bindTooltip('B');
        if (!A || !B) { $('.tool-out').textContent = 'Set point A and point B — type coordinates or click the map.'; return; }
        const pts = gc(A, B); line = L.polyline(pts, { color: '#39f0c8', weight: 3 }).addTo(m); m.fitBounds(line.getBounds(), { padding: [40, 40] });
        const km = GV.haversine(A, B); const brg = GV.bearing(A, B); const mid = pts[Math.floor(pts.length / 2)];
        $('.tool-out').textContent = `Great-circle distance\n  ${fmt(km, 1)} km  ·  ${fmt(km * 0.621371, 1)} mi  ·  ${fmt(km * 0.539957, 1)} nmi\nInitial bearing  ${fmt(brg, 1)}° ${GV.arrow(brg)}\nMidpoint         ${mid[0].toFixed(4)}, ${(((mid[1] + 540) % 360) - 180).toFixed(4)}\nFlight time      ~${fmt(km / 850 + 0.5, 1)} h at 850 km/h cruise (+30 min taxi/climb)\nDriving (if road) ~${fmt((km * 1.3) / 80, 1)} h at 80 km/h with 1.3× detour factor`;
      };
      m.on('click', (e) => { const ll = [+e.latlng.lat.toFixed(5), +(((e.latlng.lng + 540) % 360) - 180).toFixed(5)]; if (!A) A = ll; else if (!B) B = ll; else { A = ll; B = null; }
        ia.value = A ? A.join(', ') : ''; ib.value = B ? B.join(', ') : ''; run(); });
      [ia, ib].forEach((i) => i.addEventListener('change', run));
      $('#me-a').addEventListener('click', (e) => locate((ll) => { ia.value = ll.join(', '); run(); }, e.target));
      $('#swap').addEventListener('click', () => { [ia.value, ib.value] = [ib.value, ia.value]; [A, B] = [B, A]; run(); });
      run();
    },
    coords() {
      const m = mkMap('tool-map'); let mk;
      const toDMS = (v, pos, neg) => { const s = v < 0 ? neg : pos; v = Math.abs(v); const d = Math.floor(v), mm = Math.floor((v - d) * 60), ss = ((v - d) * 60 - mm) * 60; return `${d}° ${mm}′ ${ss.toFixed(2)}″ ${s}`; };
      const toDDM = (v, pos, neg) => { const s = v < 0 ? neg : pos; v = Math.abs(v); const d = Math.floor(v); return `${d}° ${((v - d) * 60).toFixed(4)}′ ${s}`; };
      const geohash = (lat, lon, p = 9) => { const b32 = '0123456789bcdefghjkmnpqrstuvwxyz'; let la = [-90, 90], lo = [-180, 180], h = '', bit = 0, ch = 0, even = true; while (h.length < p) { const r = even ? lo : la, v = even ? lon : lat, mid = (r[0] + r[1]) / 2; if (v >= mid) { ch |= 16 >> bit; r[0] = mid; } else r[1] = mid; even = !even; if (bit < 4) bit++; else { h += b32[ch]; bit = 0; ch = 0; } } return h; };
      const utm = (lat, lon) => {
        if (lat < -80 || lat > 84) return 'Outside UTM range (use UPS)';
        const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
        let zone = Math.floor((lon + 180) / 6) + 1; if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
        if (lat >= 72) { if (lon >= 0 && lon < 9) zone = 31; else if (lon >= 9 && lon < 21) zone = 33; else if (lon >= 21 && lon < 33) zone = 35; else if (lon >= 33 && lon < 42) zone = 37; }
        const lon0 = ((zone - 1) * 6 - 180 + 3) * r2, φ = lat * r2, λ = lon * r2;
        const N = a / Math.sqrt(1 - e2 * Math.sin(φ) ** 2), T = Math.tan(φ) ** 2, Cc = ep2 * Math.cos(φ) ** 2, A = Math.cos(φ) * (λ - lon0);
        const M = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * φ - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * φ) + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * φ) - (35 * e2 ** 3 / 3072) * Math.sin(6 * φ));
        const E = k0 * N * (A + (1 - T + Cc) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * Cc - 58 * ep2) * A ** 5 / 120) + 500000;
        let Nn = k0 * (M + N * Math.tan(φ) * (A ** 2 / 2 + (5 - T + 9 * Cc + 4 * Cc ** 2) * A ** 4 / 24 + (61 - 58 * T + T ** 2 + 600 * Cc - 330 * ep2) * A ** 6 / 720)); if (lat < 0) Nn += 1e7;
        const band = 'CDEFGHJKLMNPQRSTUVWXX'[Math.floor((lat + 80) / 8)];
        return `${zone}${band} ${Math.round(E)}E ${Math.round(Nn)}N`;
      };
      const parseAny = (s) => {
        const dd = parseLL(s); if (dd) return dd;
        const re = /(\d+(?:\.\d+)?)\s*[°d\s]\s*(\d+(?:\.\d+)?)?\s*['′m\s]?\s*(\d+(?:\.\d+)?)?\s*["″s]?\s*([NSEW])/gi; const parts = [...String(s).matchAll(re)];
        if (parts.length === 2) { const v = parts.map((p) => { let x = +p[1] + (+p[2] || 0) / 60 + (+p[3] || 0) / 3600; if (/[SW]/i.test(p[4])) x = -x; return { x, ax: /[NS]/i.test(p[4]) ? 'lat' : 'lon' }; }); const lat = v.find((o) => o.ax === 'lat'), lon = v.find((o) => o.ax === 'lon'); if (lat && lon) return [lat.x, lon.x]; }
        return null;
      };
      const show = (ll) => {
        const [la, lo] = ll; mk && m.removeLayer(mk); mk = L.marker(ll).addTo(m); m.setView(ll, Math.max(m.getZoom(), 6));
        $('.tool-out').textContent = `Decimal degrees   ${la.toFixed(6)}, ${lo.toFixed(6)}\nDMS               ${toDMS(la, 'N', 'S')}, ${toDMS(lo, 'E', 'W')}\nDegrees-minutes   ${toDDM(la, 'N', 'S')}, ${toDDM(lo, 'E', 'W')}\nUTM (WGS84)       ${utm(la, lo)}\nGeohash           ${geohash(la, lo)}\nAntipode          ${(-la).toFixed(5)}, ${(lo > 0 ? lo - 180 : lo + 180).toFixed(5)}`;
        $('#osm').href = `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=12/${la}/${lo}`;
      };
      $('#coord-form').addEventListener('submit', (e) => { e.preventDefault(); const ll = parseAny($('#coord-in').value); ll ? show(ll) : ($('.tool-out').textContent = 'Could not read that. Try "48.8584, 2.2945" or "48°51′30″N 2°17′40″E".'); });
      m.on('click', (e) => { const ll = [+e.latlng.lat.toFixed(6), +(((e.latlng.lng + 540) % 360) - 180).toFixed(6)]; $('#coord-in').value = ll.join(', '); show(ll); });
      $('#me').addEventListener('click', (e) => locate((ll) => { $('#coord-in').value = ll.join(', '); show(ll); }, e.target));
      show([48.8584, 2.2945]);
    },
    sun() {
      const lat = $('#lat'), lon = $('#lon'), dt = $('#date'); dt.value = new Date().toISOString().slice(0, 10);
      const calc = () => {
        const φ = +lat.value, lw = +lon.value; if (isNaN(φ) || isNaN(lw) || Math.abs(φ) > 90) return;
        const d = new Date(dt.value + 'T12:00:00Z'); const Jd = d / 864e5 + 2440587.5;
        const n = Math.ceil(Jd - 2451545 + 0.0008); const Js = n - lw / 360;
        const M = (357.5291 + 0.98560028 * Js) % 360; const Mr = M * r2;
        const C = 1.9148 * Math.sin(Mr) + 0.02 * Math.sin(2 * Mr) + 0.0003 * Math.sin(3 * Mr);
        const lam = ((M + C + 180 + 102.9372) % 360) * r2;
        const Jt = 2451545 + Js + 0.0053 * Math.sin(Mr) - 0.0069 * Math.sin(2 * lam);
        const dec = Math.asin(Math.sin(lam) * Math.sin(23.4397 * r2));
        const ha = (h) => { const c = (Math.sin(h * r2) - Math.sin(φ * r2) * Math.sin(dec)) / (Math.cos(φ * r2) * Math.cos(dec)); return c < -1 ? 'day' : c > 1 ? 'night' : Math.acos(c) / r2; };
        const J2D = (J) => new Date((J - 2440587.5) * 864e5);
        const t = (x) => `${x.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} your time · ${x.toISOString().slice(11, 16)} UTC`;
        const w = ha(-0.833), cv = ha(-6);
        let out = `Solar noon        ${t(J2D(Jt))}\nSun's max height  ${(90 - Math.abs(φ - dec / r2)).toFixed(1)}° above horizon\nDeclination       ${(dec / r2).toFixed(2)}°\n`;
        if (typeof w === 'number') {
          out += `Sunrise           ${t(J2D(Jt - w / 360))}\nSunset            ${t(J2D(Jt + w / 360))}\nDay length        ${Math.floor((w / 180) * 24)} h ${Math.round(((w / 180) * 24 % 1) * 60)} min\n`;
          if (typeof cv === 'number') out += `Civil dawn        ${t(J2D(Jt - cv / 360))}\nCivil dusk        ${t(J2D(Jt + cv / 360))}\n`;
        } else out += w === 'day' ? 'Midnight sun — the Sun does not set on this date.\n' : 'Polar night — the Sun does not rise on this date.\n';
        out += `Approx. golden hour begins ~1 h before sunset.`;
        $('.tool-out').textContent = out;
      };
      [lat, lon, dt].forEach((i) => i.addEventListener('input', calc));
      $('#me').addEventListener('click', (e) => locate((ll) => { lat.value = ll[0]; lon.value = ll[1]; calc(); }, e.target));
      calc();
    },
    clock() {
      const def = ['America/Los_Angeles', 'America/New_York', 'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Africa/Lagos', 'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney'];
      let zones = GV.store.get('gv-zones', def); const grid = $('.clock-grid'); const sel = $('#zone');
      const all = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : def;
      sel.innerHTML = all.map((z) => `<option>${z}</option>`).join('');
      const offset = (z) => { const n = new Date(); const s = n.toLocaleString('en-US', { timeZone: z }); return Math.round((new Date(s) - new Date(n.toLocaleString('en-US'))) / 36e5 * 2) / 2; };
      const draw = () => {
        const now = new Date(); const mine = Intl.DateTimeFormat().resolvedOptions().timeZone;
        grid.innerHTML = [mine, ...zones.filter((z) => z !== mine)].map((z) => {
          const h = +now.toLocaleString('en-US', { timeZone: z, hour: 'numeric', hour12: false }) % 24; const o = offset(z);
          return `<div class="card"><span class="muted small">${z.split('/').pop().replace(/_/g, ' ')}${z === mine ? ' · you' : ''}</span><b>${now.toLocaleTimeString([], { timeZone: z, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</b><span class="small">${now.toLocaleDateString([], { timeZone: z, weekday: 'short', month: 'short', day: 'numeric' })} · ${h >= 6 && h < 18 ? '☀️' : '🌙'} ${z === mine ? '' : (o >= 0 ? '+' : '') + o + ' h'}</span>${z === mine ? '' : ` <button class="btn btn-sm btn-ghost" data-rm="${z}" style="padding:.2em .6em;margin-top:.4rem">Remove</button>`}</div>`;
        }).join('');
        grid.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { zones = zones.filter((z) => z !== b.dataset.rm); GV.store.set('gv-zones', zones); draw(); }));
      };
      $('#add').addEventListener('click', () => { if (!zones.includes(sel.value)) { zones.push(sel.value); GV.store.set('gv-zones', zones); draw(); } });
      draw(); setInterval(draw, 1000);
    },
    antipode() {
      const m = mkMap('tool-map'); let a, b, ln; let world = null; GV.json('data/world.geo.json').then((g) => (world = g)).catch(() => {});
      const inRing = (pt, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };
      const where = (lat, lon) => { if (!world) return null; for (const f of world.features) { const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates; for (const p of polys) if (inRing([lon, lat], p[0])) return f.properties.n; } return 'the ocean'; };
      const set = (ll) => {
        const an = [-ll[0], ll[1] > 0 ? ll[1] - 180 : ll[1] + 180];
        [a, b, ln].forEach((x) => x && m.removeLayer(x));
        a = L.circleMarker(ll, { radius: 8, color: '#39f0c8', fillOpacity: 0.9 }).addTo(m); b = L.circleMarker(an, { radius: 8, color: '#ffb547', fillOpacity: 0.9 }).addTo(m);
        const w1 = where(ll[0], ll[1]), w2 = where(an[0], an[1]);
        $('.tool-out').textContent = `Your point   ${ll[0].toFixed(4)}, ${ll[1].toFixed(4)}${w1 ? '  (' + w1 + ')' : ''}\nAntipode     ${an[0].toFixed(4)}, ${an[1].toFixed(4)}${w2 ? '  (' + w2 + ')' : ''}\nDistance through the Earth ≈ 12,742 km · along the surface ≈ 20,015 km\n${w2 === 'the ocean' ? 'Like most places on Earth, your antipode is in the ocean — only about 15% of the world’s land has land on the opposite side.' : w2 ? 'Lucky — you are one of the rare land-to-land antipodes!' : ''}`;
      };
      m.on('click', (e) => set([e.latlng.lat, ((e.latlng.lng + 540) % 360) - 180]));
      $('#me').addEventListener('click', (e) => locate(set, e.target));
      setTimeout(() => set([40.4168, -3.7038]), 600);
    }
  };
  tools[root.dataset.tool]?.();
})();
