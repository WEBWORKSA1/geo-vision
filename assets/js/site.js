/* Geo.Vision — shared site behaviour */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  // Contact address is assembled only at the moment it is needed and never written into the page.
  const K = [122, 120, 116, 57, 123, 126, 118, 122, 112, 87, 38, 118, 100, 124, 101, 120, 96, 117, 114, 96];
  const addr = () => K.map((c) => String.fromCharCode(c ^ 23)).reverse().join('');
  document.documentElement.classList.add('js');
  window.GV = window.GV || {};
  GV.root = document.body.dataset.root || './';

  /* nav */
  const tg = $('.nav-toggle'), nav = $('#nav');
  if (tg && nav) tg.addEventListener('click', () => { const o = nav.classList.toggle('open'); tg.setAttribute('aria-expanded', o); });

  /* cookie notice */
  const ck = $('.cookie');
  let consent = null; try { consent = localStorage.getItem('gv-consent'); } catch {}
  if (ck && !consent) ck.hidden = false;
  $$('[data-cookie]').forEach((b) => b.addEventListener('click', () => {
    try { localStorage.setItem('gv-consent', b.dataset.cookie); } catch {}
    if (b.dataset.cookie === 'min') { (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1; }
    ck.hidden = true;
  }));
  if (consent === 'min') (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;

  /* reveal on scroll */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  } else $$('.reveal').forEach((el) => el.classList.add('in'));
  setTimeout(() => $$('.reveal').forEach((el) => el.classList.add('in')), 2500);

  /* mail links: <a data-mail="Subject"> */
  $$('[data-mail]').forEach((a) => {
    a.setAttribute('href', '#');
    a.addEventListener('click', (e) => { e.preventDefault(); location.href = 'mailto:' + addr() + '?subject=' + encodeURIComponent(a.dataset.mail || 'Geo.Vision inquiry'); });
  });

  /* donations: <button data-donate="25"> */
  $$('[data-donate]').forEach((b) => b.addEventListener('click', () => {
    let amt = b.dataset.donate;
    if (amt === 'custom') { const v = $('#custom-amount'); amt = v && v.value ? Math.max(1, Number(v.value)).toFixed(2) : ''; }
    const purpose = ($('input[name="fund"]:checked') || {}).value || 'General operations';
    const u = new URL('https://www.paypal.com/cgi-bin/webscr');
    u.search = new URLSearchParams({ cmd: '_donations', business: addr(), item_name: 'Geo.Vision support — ' + purpose, currency_code: 'USD', no_shipping: '1', ...(amt ? { amount: amt } : {}) }).toString();
    window.open(u.toString(), '_blank', 'noopener');
  }));

  /* query prefill: ?service=drone&region=France */
  const qp = new URLSearchParams(location.search);
  qp.forEach((v, k) => {
    $$(`form [name="${CSS.escape(k)}"]`).forEach((el) => {
      if (el.type === 'radio' || el.type === 'checkbox') { if (el.value === v) el.checked = true; }
      else if (!el.value) el.value = v;
    });
  });

  /* multi-step forms */
  $$('form[data-steps]').forEach((f) => {
    const steps = $$('.step', f); const bar = $('.steps-bar i', f); let i = 0;
    const show = () => {
      steps.forEach((s, j) => s.classList.toggle('active', j === i));
      if (bar) bar.style.width = ((i + 1) / steps.length) * 100 + '%';
      $$('[data-prev]', f).forEach((b) => (b.style.visibility = i ? 'visible' : 'hidden'));
      $$('[data-next]', f).forEach((b) => (b.hidden = i === steps.length - 1));
      $$('[type=submit]', f).forEach((b) => (b.hidden = i !== steps.length - 1));
      const c = $('.step-count', f); if (c) c.textContent = `Step ${i + 1} of ${steps.length}`;
    };
    const valid = () => {
      const req = $$('input,select,textarea', steps[i]);
      for (const el of req) { if (!el.checkValidity()) { el.reportValidity(); return false; } }
      return true;
    };
    $$('[data-next]', f).forEach((b) => b.addEventListener('click', () => { if (valid()) { i = Math.min(i + 1, steps.length - 1); show(); f.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }));
    $$('[data-prev]', f).forEach((b) => b.addEventListener('click', () => { i = Math.max(i - 1, 0); show(); }));
    show();
  });

  /* form delivery (FormSubmit AJAX; mailto fallback) */
  $$('form[data-form]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('.form-msg', f); const btn = $('[type=submit]:not([hidden])', f) || $('[type=submit]', f);
    if (f.elements._honey && f.elements._honey.value) return;
    const data = {};
    new FormData(f).forEach((v, k) => { if (k === '_honey') return; data[k] = data[k] ? data[k] + ', ' + v : v; });
    data._subject = (f.dataset.subject || 'Geo.Vision form') + (data.name ? ' — ' + data.name : '');
    data._template = 'table'; data._captcha = 'false';
    data.form = f.dataset.form; data.page = location.pathname; data.submitted = new Date().toISOString();
    if (data.email) data._replyto = data.email;
    btn && (btn.disabled = true); msg && (msg.className = 'form-msg', msg.textContent = 'Sending…');
    try {
      const r = await fetch('https://formsubmit.co/ajax/' + addr(), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) === 'false') throw new Error(j.message || r.status);
      msg && (msg.className = 'form-msg ok', msg.textContent = f.dataset.ok || 'Thank you — your message has been received. We reply within 1–2 business days.');
      f.reset();
      if (window.gtag) gtag('event', 'generate_lead', { form: f.dataset.form });
      try { const n = Number(localStorage.getItem('gv-leads') || 0) + 1; localStorage.setItem('gv-leads', n); } catch {}
    } catch (err) {
      const body = Object.entries(data).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `${k}: ${v}`).join('\n');
      msg && (msg.className = 'form-msg err', msg.innerHTML = 'We could not send that automatically. <a href="#" class="mail-fallback">Send it by email instead</a>.');
      const fb = $('.mail-fallback', f);
      fb && fb.addEventListener('click', (ev) => { ev.preventDefault(); location.href = 'mailto:' + addr() + '?subject=' + encodeURIComponent(data._subject) + '&body=' + encodeURIComponent(body); });
    } finally { btn && (btn.disabled = false); }
  }));

  /* click-to-load YouTube (privacy-enhanced) */
  $$('.vid[data-yt]').forEach((v) => {
    const id = v.dataset.yt;
    v.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;
    const go = () => { if (v.querySelector('iframe')) return; v.insertAdjacentHTML('beforeend', `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${(v.dataset.title || 'Video').replace(/"/g, '')}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`); };
    v.addEventListener('click', go);
    v.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  /* shared helpers */
  GV.haversine = (a, b) => { const R = 6371.0088, r = Math.PI / 180; const dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(h))); };
  GV.bearing = (a, b) => { const r = Math.PI / 180; const y = Math.sin((b[1] - a[1]) * r) * Math.cos(b[0] * r); const x = Math.cos(a[0] * r) * Math.sin(b[0] * r) - Math.sin(a[0] * r) * Math.cos(b[0] * r) * Math.cos((b[1] - a[1]) * r); return (Math.atan2(y, x) / r + 360) % 360; };
  GV.arrow = (deg) => ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'][Math.round(deg / 45) % 8];
  // Country facts: mledoze/countries (ODbL) from the world-countries package on jsDelivr, reduced to the fields the site uses.
  const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let countriesP = null;
  const loadCountries = async () => {
    const raw = await fetch('https://cdn.jsdelivr.net/npm/world-countries@5.1.0/dist/countries.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    const used = new Set();
    const list = raw.map((c) => {
      let slug = slugify(c.name.common); if (used.has(slug)) slug += '-' + c.cca3.toLowerCase(); used.add(slug);
      const sfx = (c.idd && c.idd.suffixes) || [];
      return { n: c.name.common, o: c.name.official, a3: c.cca3, a2: c.cca2, num: c.ccn3 || '', slug, cap: (c.capital || []).join(', '), reg: c.region || '', sub: c.subregion || '',
        ll: c.latlng || [0, 0], area: c.area > 0 ? c.area : 0, b: c.borders || [], ld: !!c.landlocked, ind: !!c.independent, un: !!c.unMember, f: c.flag || '',
        lang: Object.values(c.languages || {}), cur: Object.entries(c.currencies || {}).map(([k, v]) => `${v.name} (${k})`), tld: (c.tld || []).join(', '),
        idd: c.idd && c.idd.root ? c.idd.root + (sfx.length === 1 ? sfx[0] : '') : '', dem: c.demonyms && c.demonyms.eng ? c.demonyms.eng.m : '' };
    }).sort((x, y) => x.n.localeCompare(y.n));
    [...list].filter((c) => c.area).sort((x, y) => y.area - x.area).forEach((c, i) => { c.rank = i + 1; });
    return list;
  };
  const getJSON = (p) => (p === 'data/countries.json' ? (countriesP = countriesP || loadCountries()) : fetch(GV.root + p).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }));
  // Country shapes: Natural Earth 1:110m via the world-atlas package on jsDelivr, joined to our country list by ISO numeric code.
  let worldP = null;
  const loadWorld = async () => {
    const [topo, C] = await Promise.all([fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json').then((r) => r.json()), getJSON('data/countries.json')]);
    if (!window.topojson) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    const byNum = {}; C.forEach((c) => { if (c.num) byNum[String(Number(c.num))] = c; });
    const fc = window.topojson.feature(topo, topo.objects.countries);
    return { type: 'FeatureCollection', features: fc.features.filter((f) => f.geometry && byNum[String(Number(f.id))]).map((f) => { const c = byNum[String(Number(f.id))]; return { type: 'Feature', properties: { a3: c.a3, n: c.n }, geometry: f.geometry }; }) };
  };
  GV.json = (p) => (p === 'data/world.geo.json' ? (worldP = worldP || loadWorld()) : getJSON(p));
  GV.store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  GV.gibs = (layer, level, ext, date) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date ? date + '/' : ''}GoogleMapsCompatible_Level${level}/{z}/{y}/{x}.${ext}`;
  GV.yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  GV.baseLayers = () => {
    const att = '<a href="https://www.earthdata.nasa.gov/gibs" target="_blank" rel="noopener">NASA EOSDIS GIBS</a>';
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    const mk = (l, lv, ext, d, extra) => L.tileLayer(GV.gibs(l, lv, ext, d), { maxNativeZoom: lv, maxZoom: 12, attribution: att, ...extra });
    return {
      'Blue Marble (relief)': mk('BlueMarble_ShadedRelief_Bathymetry', 8, 'jpeg'),
      "Yesterday's satellite (MODIS)": mk('MODIS_Terra_CorrectedReflectance_TrueColor', 9, 'jpg', GV.yesterday()),
      'Night lights (VIIRS)': mk('VIIRS_CityLights_2012', 8, 'jpg'),
      'Streets (OpenStreetMap)': osm
    };
  };
  GV.guardTiles = (map, layer, fallback) => { let errs = 0; layer.on('tileerror', () => { if (++errs === 6 && map.hasLayer(layer)) { map.removeLayer(layer); fallback.addTo(map); } }); };
})();
