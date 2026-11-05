/* Geo.Vision — games: outline, flags, capitals, bigger, pin */
(() => {
  'use strict';
  const root = document.getElementById('game'); if (!root) return;
  const mode = root.dataset.mode;
  const $ = (s, el = root) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (a, rnd = Math.random) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mulberry = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const flagImg = (c, w = 320) => `<img src="https://flagcdn.com/w${w}/${c.a2.toLowerCase()}.png" alt="Flag" loading="eager" style="max-height:160px;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.5)" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${c.f}',className:'big-emoji'}))">`;
  const fmt = (n) => Math.round(n).toLocaleString();
  const share = async (text, btn) => { try { if (navigator.share && /Mobi/i.test(navigator.userAgent)) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); btn.textContent = 'Copied!'; setTimeout(() => (btn.textContent = 'Share result'), 1800); } } catch {} };

  Promise.all([GV.json('data/countries.json'), mode === 'outline' || mode === 'pin' ? GV.json('data/world.geo.json') : null]).then(([C, G]) => {
    const byA3 = Object.fromEntries(C.map((c) => [c.a3, c]));
    const sovereign = C.filter((c) => c.ind && c.area > 0);
    ({ outline, flags, capitals, bigger, pin })[mode]?.(C, G, byA3, sovereign);
  }).catch(() => { root.innerHTML = '<p class="notice">The game data could not be loaded. Please refresh the page.</p>'; });

  /* ---------- Daily Outline ---------- */
  function outline(C, G, byA3) {
    const pool = G.features.filter((f) => byA3[f.properties.a3] && byA3[f.properties.a3].area >= 20000);
    const order = shuffle(pool, mulberry(20261105));
    const epoch = Date.UTC(2026, 0, 1); const today = new Date(); const dayN = Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - epoch) / 864e5);
    let practice = false, target, key, state;
    const stats = GV.store.get('gv-outline-stats', { played: 0, wins: 0, streak: 0, best: 0, last: null, dist: [0, 0, 0, 0, 0, 0] });
    const dl = document.getElementById('country-names'); dl.innerHTML = C.map((c) => `<option value="${esc(c.n)}">`).join('');
    const names = Object.fromEntries(C.map((c) => [c.n.toLowerCase(), c]));

    function draw(f) {
      let polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      const lons = polys.flat(2).filter((_, i) => i % 2 === 0);
      const wrap = Math.max(...lons) - Math.min(...lons) > 180;
      const P = (p) => [wrap && p[0] < 0 ? p[0] + 360 : p[0], p[1]];
      const pts = polys.flatMap((poly) => poly.flatMap((ring) => ring.map(P)));
      const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0])), minY = Math.min(...pts.map((p) => p[1])), maxY = Math.max(...pts.map((p) => p[1]));
      const k = Math.cos(((minY + maxY) / 2) * Math.PI / 180);
      const w = (maxX - minX) * k || 1, h = maxY - minY || 1;
      const d = polys.map((poly) => poly.map((ring) => 'M' + ring.map(P).map((p) => `${((p[0] - minX) * k).toFixed(2)},${(maxY - p[1]).toFixed(2)}`).join('L') + 'Z').join('')).join('');
      $('.outline-stage').innerHTML = `<svg viewBox="${-w * 0.05} ${-h * 0.05} ${w * 1.1} ${h * 1.1}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Country outline"><path d="${d}"/></svg>`;
    }
    function start(feat, isPractice) {
      practice = isPractice; target = byA3[feat.properties.a3];
      key = practice ? null : 'gv-outline-' + dayN;
      state = (key && GV.store.get(key, null)) || { guesses: [], done: false, won: false };
      draw(feat); $('#puzzle-no').textContent = practice ? 'Practice round' : `Puzzle #${dayN + 1}`;
      render();
    }
    function render() {
      $('.guesses').innerHTML = state.guesses.map((g) => {
        const c = byA3[g]; const d = GV.haversine(c.ll, target.ll); const win = g === target.a3; const pct = Math.max(0, Math.round(100 - (d / 20015) * 100));
        return `<li class="${win ? 'win' : ''}"><span>${c.f} ${esc(c.n)}</span><span class="d">${win ? '🎯' : fmt(d) + ' km'}</span><span class="dir">${win ? '✅' : GV.arrow(GV.bearing(c.ll, target.ll))}</span><span class="p">${win ? 100 : pct}%</span></li>`;
      }).join('') + Array.from({ length: Math.max(0, 6 - state.guesses.length) }, () => '<li style="opacity:.35"><span>—</span><span></span><span></span><span></span></li>').join('');
      const res = $('.result');
      $('.guess-form input').disabled = state.done; $('.guess-form button').disabled = state.done;
      if (state.done) {
        res.hidden = false;
        $('#res-title').textContent = state.won ? `Solved in ${state.guesses.length}/6!` : `It was ${target.n}`;
        $('#res-link').innerHTML = `<a href="${GV.root}atlas/${target.slug}.html">${target.f} Explore ${esc(target.n)} in the atlas &rarr;</a>`;
        $('#stats').innerHTML = `Played <b>${stats.played}</b> · Win rate <b>${stats.played ? Math.round((stats.wins / stats.played) * 100) : 0}%</b> · Streak <b>${stats.streak}</b> · Best <b>${stats.best}</b>`;
      } else res.hidden = true;
    }
    $('.guess-form').addEventListener('submit', (e) => {
      e.preventDefault(); const inp = $('.guess-form input'); const c = names[inp.value.trim().toLowerCase()];
      const m = $('.guess-msg');
      if (!c) { m.textContent = 'Pick a country from the list.'; return; }
      if (state.guesses.includes(c.a3)) { m.textContent = 'Already guessed.'; return; }
      m.textContent = ''; inp.value = ''; state.guesses.push(c.a3);
      if (c.a3 === target.a3 || state.guesses.length >= 6) {
        state.done = true; state.won = c.a3 === target.a3;
        if (!practice) {
          stats.played++; if (state.won) { stats.wins++; stats.dist[state.guesses.length - 1]++; stats.streak = stats.last === dayN - 1 || stats.last === null ? stats.streak + 1 : 1; } else stats.streak = 0;
          stats.best = Math.max(stats.best, stats.streak); stats.last = dayN; GV.store.set('gv-outline-stats', stats);
        }
      }
      if (key) GV.store.set(key, state); render();
    });
    $('#share').addEventListener('click', (e) => {
      const sq = state.guesses.map((g) => { if (g === target.a3) return '🟩🟩🟩🟩🟩'; const p = Math.max(0, 100 - (GV.haversine(byA3[g].ll, target.ll) / 20015) * 100); const n = Math.floor(p / 20); return '🟩'.repeat(n) + '⬜'.repeat(5 - n) + GV.arrow(GV.bearing(byA3[g].ll, target.ll)); }).join('\n');
      share(`Geo.Vision Outline ${practice ? '(practice)' : '#' + (dayN + 1)} ${state.won ? state.guesses.length : 'X'}/6\n${sq}\nhttps://geo.vision/play/outline.html`, e.target);
    });
    $('#practice').addEventListener('click', () => start(pool[Math.floor(Math.random() * pool.length)], true));
    start(order[dayN % order.length], false);
  }

  /* ---------- Flag Frenzy (60 s) ---------- */
  function flags(C, G, byA3, S) { timedQuiz(S, (c, opts) => ({ q: flagImg(c), opts: opts.map((o) => o.n), ans: c.n, sub: 'Which country flies this flag?' }), 'gv-best-flags'); }
  /* ---------- Capital Quest (60 s) ---------- */
  function capitals(C, G, byA3, S) { timedQuiz(S.filter((c) => c.cap), (c, opts) => ({ q: `<div class="q-text">${c.f} ${esc(c.n)}</div>`, opts: opts.map((o) => o.cap.split(',')[0]), ans: c.cap.split(',')[0], sub: 'What is the capital?' }), 'gv-best-capitals'); }

  function timedQuiz(pool, make, bestKey) {
    let score = 0, n = 0, t = 60, timer = null, best = GV.store.get(bestKey, 0);
    const stage = $('.quiz-stage'); const sc = $('#score'); const bestEl = $('#best'); bestEl.textContent = best;
    const next = () => {
      const c = pool[Math.floor(Math.random() * pool.length)];
      const same = pool.filter((x) => x.reg === c.reg && x.a3 !== c.a3);
      const opts = shuffle([c, ...shuffle(same.length >= 3 ? same : pool.filter((x) => x.a3 !== c.a3)).slice(0, 3)]);
      const Q = make(c, opts);
      stage.innerHTML = `<p class="muted" style="text-align:center;margin:0">${Q.sub}</p><div style="text-align:center;margin:1rem 0">${Q.q}</div><div class="options">${Q.opts.map((o) => `<button type="button">${esc(o)}</button>`).join('')}</div>`;
      stage.querySelectorAll('.options button').forEach((b) => b.addEventListener('click', () => {
        if (!timer) return; n++;
        const ok = b.textContent === Q.ans; b.classList.add(ok ? 'right' : 'wrong');
        if (ok) score++; else stage.querySelectorAll('.options button').forEach((x) => x.textContent === Q.ans && x.classList.add('right'));
        sc.textContent = score; stage.querySelectorAll('.options button').forEach((x) => (x.disabled = true));
        setTimeout(next, ok ? 350 : 900);
      }));
    };
    const end = () => {
      clearInterval(timer); timer = null;
      if (score > best) { best = score; GV.store.set(bestKey, best); bestEl.textContent = best; }
      stage.innerHTML = `<div class="result"><h2>Time! You scored ${score}</h2><p>${n} answered · accuracy ${n ? Math.round((score / n) * 100) : 0}% · personal best ${best}</p><button class="btn btn-accent" id="again">Play again</button> <button class="btn btn-ghost" id="share">Share result</button></div>`;
      $('#again').addEventListener('click', go);
      $('#share').addEventListener('click', (e) => share(`I scored ${score} in 60 seconds on Geo.Vision ${document.title.split('|')[0].trim()}! Beat me: ${location.href}`, e.target));
    };
    const go = () => { score = 0; n = 0; t = 60; sc.textContent = 0; $('.timer i').style.width = '100%'; clearInterval(timer); timer = setInterval(() => { t--; $('.timer i').style.width = (t / 60) * 100 + '%'; $('#time').textContent = t; if (t <= 0) end(); }, 1000); next(); };
    $('#start').addEventListener('click', () => { $('#start').hidden = true; go(); });
  }

  /* ---------- Bigger or Smaller ---------- */
  function bigger(C, G, byA3, S) {
    let streak = 0, best = GV.store.get('gv-best-bigger', 0), a, b; $('#best').textContent = best;
    const pick = () => S[Math.floor(Math.random() * S.length)];
    const card = (c, side) => `<button class="card vs-card" data-side="${side}" type="button">${flagImg(c, 160)}<h3 style="margin-top:.8rem">${esc(c.n)}</h3><p class="muted small reveal-area" hidden>${fmt(c.area)} km²</p></button>`;
    const round = () => {
      a = b && Math.random() < 0.6 ? b : pick(); do { b = pick(); } while (b.a3 === a.a3 || Math.abs(a.area - b.area) / Math.max(a.area, b.area) < 0.04);
      $('.vs').innerHTML = card(a, 'a') + '<span class="or">vs</span>' + card(b, 'b');
      root.querySelectorAll('.vs-card').forEach((el) => el.addEventListener('click', () => {
        const chosen = el.dataset.side === 'a' ? a : b; const other = chosen === a ? b : a; const ok = chosen.area > other.area;
        root.querySelectorAll('.reveal-area').forEach((x) => (x.hidden = false)); root.querySelectorAll('.vs-card').forEach((x) => (x.disabled = true));
        el.style.borderColor = ok ? 'var(--accent)' : 'var(--hot)';
        if (ok) { streak++; if (streak > best) { best = streak; GV.store.set('gv-best-bigger', best); } $('#score').textContent = streak; $('#best').textContent = best; setTimeout(round, 1100); }
        else { $('.vs-msg').innerHTML = `<div class="result"><h2>Streak over at ${streak}</h2><p>${esc(other.n)} is ${(other.area / chosen.area).toFixed(1)}× larger than ${esc(chosen.n)}.</p><button class="btn btn-accent" id="again">Try again</button> <button class="btn btn-ghost" id="share">Share result</button></div>`; $('#again').addEventListener('click', () => { streak = 0; $('#score').textContent = 0; $('.vs-msg').innerHTML = ''; b = null; round(); }); $('#share').addEventListener('click', (e) => share(`My Bigger-or-Smaller streak on Geo.Vision: ${streak}. ${location.href}`, e.target)); }
      }));
    };
    round();
  }

  /* ---------- Pin the Country ---------- */
  function pin(C, G, byA3) {
    const m = L.map('pin-map', { worldCopyJump: true, minZoom: 1, maxZoom: 7, attributionControl: true }).setView([20, 10], 2);
    m.attributionControl.addAttribution('Boundaries: Natural Earth');
    const pool = G.features.filter((f) => byA3[f.properties.a3] && byA3[f.properties.a3].area > 25000);
    let order, idx, score, tries, target, layer, done;
    const base = { color: '#1d3b6b', weight: 0.8, fillColor: '#16305a', fillOpacity: 1 };
    layer = L.geoJSON(G, { style: () => base, onEachFeature: (f, l) => l.on('click', () => clickF(f, l)) }).addTo(m);
    const prompt = $('#pin-prompt');
    const setStyle = (a3, st) => layer.eachLayer((l) => l.feature.properties.a3 === a3 && l.setStyle(st));
    function next() {
      if (idx >= 10) { done = true; prompt.innerHTML = `Finished — <b>${score}/10</b>`; $('.result').hidden = false; $('#res-title').textContent = `You found ${score} of 10 countries`; const b = GV.store.get('gv-best-pin', 0); if (score > b) GV.store.set('gv-best-pin', score); $('#best').textContent = Math.max(b, score); return; }
      target = order[idx]; tries = 0; const c = byA3[target.properties.a3];
      prompt.innerHTML = `Find <b>${c.f} ${esc(c.n)}</b> <span class="muted small">(${idx + 1}/10)</span>`;
    }
    function clickF(f, l) {
      if (done || !target) return; const a3 = f.properties.a3; const t = byA3[target.properties.a3];
      if (a3 === target.properties.a3) { setStyle(a3, { fillColor: tries ? '#c99a2e' : '#39f0c8' }); if (!tries) score++; $('#score').textContent = score; idx++; setTimeout(next, 600); return; }
      tries++; l.setStyle({ fillColor: '#ff6b5b' }); setTimeout(() => l.setStyle(base), 700);
      const d = GV.haversine(byA3[a3].ll, t.ll);
      $('#pin-hint').textContent = `That's ${byA3[a3].n} — ${fmt(d)} km ${['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(GV.bearing(byA3[a3].ll, t.ll) / 45) % 8]} of it.`;
      if (tries >= 3) { setStyle(target.properties.a3, { fillColor: '#ffb547' }); m.flyTo([t.ll[0], t.ll[1]], 4); $('#pin-hint').textContent = `Here it is. ${t.n} is highlighted in amber.`; idx++; setTimeout(() => { m.setView([20, 10], 2); next(); }, 1800); }
    }
    const reset = () => { order = shuffle(pool).slice(0, 10); idx = 0; score = 0; done = false; $('#score').textContent = 0; $('.result').hidden = true; layer.setStyle(base); m.setView([20, 10], 2); $('#pin-hint').textContent = ''; next(); };
    $('#best').textContent = GV.store.get('gv-best-pin', 0);
    $('#again').addEventListener('click', reset);
    $('#share').addEventListener('click', (e) => share(`I found ${score}/10 countries on a blank map at Geo.Vision! ${location.href}`, e.target));
    reset();
  }
})();
