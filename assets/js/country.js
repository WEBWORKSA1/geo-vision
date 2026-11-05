/* Geo.Vision — country page: mini map + live conditions */
(() => {
  'use strict';
  const el = document.getElementById('country-map');
  if (el && window.L) {
    const lat = +el.dataset.lat, lon = +el.dataset.lon, area = +el.dataset.area, a3 = el.dataset.a3;
    const z = area > 5e6 ? 2 : area > 1e6 ? 3 : area > 2e5 ? 4 : area > 3e4 ? 5 : area > 3e3 ? 7 : 9;
    const m = L.map(el, { scrollWheelZoom: false, worldCopyJump: true }).setView([lat, lon], z);
    const b = GV.baseLayers(); const s = b['Blue Marble (relief)'].addTo(m); GV.guardTiles(m, s, b['Streets (OpenStreetMap)']); L.control.layers(b).addTo(m);
    GV.json('data/world.geo.json').then((g) => {
      const f = g.features.filter((x) => x.properties.a3 === a3);
      if (f.length) { const lyr = L.geoJSON({ type: 'FeatureCollection', features: f }, { style: { color: '#39f0c8', weight: 2, fillOpacity: 0.12 } }).addTo(m); if (area > 3e3) {
          // fit to the main landmass (largest polygon) so overseas territories don't zoom the map out
          let best = null, bestA = -1;
          f.forEach((x) => (x.geometry.type === 'Polygon' ? [x.geometry.coordinates] : x.geometry.coordinates).forEach((p) => { const r = p[0]; let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); a = Math.abs(a); if (a > bestA) { bestA = a; best = r; } }));
          if (best) m.fitBounds(L.latLngBounds(best.map(([x, y]) => [y, x])), { maxZoom: 7, padding: [20, 20] });
        } }
      else L.circleMarker([lat, lon], { radius: 9, color: '#39f0c8' }).addTo(m);
    }).catch(() => L.circleMarker([lat, lon], { radius: 9, color: '#39f0c8' }).addTo(m));
  }
  const box = document.getElementById('country-live');
  const btn = box && box.querySelector('[data-load-weather]');
  const WMO = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers', 85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm, hail', 99: 'Thunderstorm, hail' };
  btn && btn.addEventListener('click', async () => {
    btn.textContent = 'Loading…'; btn.disabled = true;
    try {
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${box.dataset.lat}&longitude=${box.dataset.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
      const j = await (await fetch(u)).json(); const c = j.current;
      const local = new Date().toLocaleString([], { timeZone: j.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit' });
      box.innerHTML = `<div class="wx"><div><span class="muted small">Local time</span><b>${local}</b><span class="small">${j.timezone}</span></div><div><span class="muted small">Now</span><b>${Math.round(c.temperature_2m)}°C</b><span class="small">${WMO[c.weather_code] || '—'} ${c.is_day ? '☀️' : '🌙'}</span></div><div><span class="muted small">Today</span><b>${Math.round(j.daily.temperature_2m_min[0])}° / ${Math.round(j.daily.temperature_2m_max[0])}°</b><span class="small">min / max</span></div><div><span class="muted small">Humidity · wind</span><b>${c.relative_humidity_2m}%</b><span class="small">${Math.round(c.wind_speed_10m)} km/h</span></div><div><span class="muted small">Sunrise · sunset</span><b>${j.daily.sunrise[0].slice(11)} · ${j.daily.sunset[0].slice(11)}</b></div></div><p class="muted small">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a> (CC BY 4.0).</p>`;
    } catch { btn.textContent = 'Weather unavailable — try again'; btn.disabled = false; }
  });
})();
