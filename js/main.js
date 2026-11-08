/* Sol Volta ao Mundo · interactions */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* ---------------- WhatsApp ---------------- */
  const PHONES = { br: '556294889374', pt: '351961425870' };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } })();
  let region = store.get('svm-region') || (tz.startsWith('Europe/') ? 'pt' : 'br');

  const wa = (reg, text) => `https://wa.me/${PHONES[reg] || PHONES.br}?text=${encodeURIComponent(text)}`;
  const MSG_GENERAL = 'Olá, Solange! Vim pelo site da Sol Volta ao Mundo e gostaria de atendimento. ✈️';
  const msgService = (s) => `Olá, Solange! Vim pelo site da Sol Volta ao Mundo e tenho interesse em ${s}. Pode me ajudar? ✈️`;

  function refreshLinks() {
    $$('[data-wa-region]').forEach(a => { a.href = wa(a.dataset.waRegion, MSG_GENERAL); });
    $$('[data-wa-service]').forEach(a => { a.href = wa(region, msgService(a.dataset.waService)); });
    $$('[data-region]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.region === region)));
    updatePass && updatePass();
    updateDocsLink && updateDocsLink();
  }
  function setRegion(r) { region = r; store.set('svm-region', r); refreshLinks(); }

  /* contact dialog */
  const dlg = $('#contact');
  $$('[data-open-contact]').forEach(b => b.addEventListener('click', () => {
    closeMenu();
    if (dlg.showModal) dlg.showModal(); else location.hash = '#embarque';
  }));
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
    if (e.target.closest('.contact__opt')) setTimeout(() => dlg.close(), 150);
  });

  /* ---------------- split-flap ---------------- */
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÃÂÁÉÍÓÚÇ0123456789-';
  function makeFlap(el) {
    const len = +el.dataset.len || el.textContent.trim().length;
    const initial = el.textContent.trim().toUpperCase().padEnd(len).slice(0, len);
    el.textContent = '';
    el._cells = [];
    for (let i = 0; i < len; i++) {
      const c = document.createElement('span');
      c.className = 'flap__c';
      c.textContent = initial[i] === ' ' ? ' ' : initial[i];
      el.appendChild(c);
      el._cells.push(c);
    }
    return el;
  }
  function setFlap(el, text, instant) {
    if (!el._cells) makeFlap(el);
    const len = el._cells.length;
    const t = String(text).toUpperCase().padEnd(len).slice(0, len);
    if (!el.hasAttribute('aria-hidden')) el.setAttribute('aria-label', text);
    el._cells.forEach((c, i) => {
      const target = t[i] === ' ' ? ' ' : t[i];
      clearInterval(c._t);
      if (instant || reduce) { c.textContent = target; return; }
      if (c.textContent === target && Math.random() < .5) return;
      let steps = 2 + Math.floor(Math.random() * 5) + i;
      c._t = setInterval(() => {
        steps--;
        c.textContent = steps <= 0 ? target : CHARS[(Math.random() * CHARS.length) | 0];
        c.classList.remove('is-flip'); void c.offsetWidth; c.classList.add('is-flip');
        if (steps <= 0) clearInterval(c._t);
      }, 55);
    });
  }
  $$('.flap').forEach(makeFlap);

  /* ---------------- nav + menu ---------------- */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  function openMenu() {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
    nav.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fechar menu');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.classList.remove('is-open');
    nav.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 550);
  }
  burger.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
  $$('a', menu).forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------------- hero ---------------- */
  const hero = $('#topo');
  const heroFlap = $('#heroFlap');
  const HERO_DEST = ['PARIS', 'LISBOA', 'ROMA', 'ORLANDO', 'NOVA YORK', 'PORTO', 'CANCÚN', 'MADRI', 'DUBAI', 'LONDRES'];
  let heroIdx = 0;
  if (!reduce) setInterval(() => {
    if (scrollY > hero.offsetHeight) return;
    heroIdx = (heroIdx + 1) % HERO_DEST.length;
    setFlap(heroFlap, HERO_DEST[heroIdx]);
  }, 3200);

  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  if (finePointer && !reduce) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = 0; mouse.y = 0; });
  }

  /* ---------------- routes board + globe ---------------- */
  const ORIGINS = {
    br: { name: 'Brasil', code: 'BR', coord: [-47.9, -15.8] },
    pt: { name: 'Portugal', code: 'PT', coord: [-9.14, 38.72] }
  };
  const DESTS = {
    br: [
      ['PARIS', 'FR', 'CDG', [2.35, 48.86], 'Paris'],
      ['LISBOA', 'PT', 'LIS', [-9.14, 38.72], 'Lisboa'],
      ['PORTO', 'PT', 'OPO', [-8.61, 41.15], 'Porto'],
      ['ROMA', 'IT', 'FCO', [12.5, 41.9], 'Roma'],
      ['ORLANDO', 'EUA', 'MCO', [-81.38, 28.54], 'Orlando'],
      ['NOVA YORK', 'EUA', 'JFK', [-74.0, 40.71], 'Nova York'],
      ['CANCÚN', 'MX', 'CUN', [-86.85, 21.16], 'Cancún'],
      ['DUBAI', 'EAU', 'DXB', [55.27, 25.2], 'Dubai']
    ],
    pt: [
      ['SÃO PAULO', 'BR', 'GRU', [-46.63, -23.55], 'São Paulo'],
      ['GOIÂNIA', 'BR', 'GYN', [-49.25, -16.68], 'Goiânia'],
      ['RIO', 'BR', 'GIG', [-43.17, -22.91], 'Rio de Janeiro'],
      ['FORTALEZA', 'BR', 'FOR', [-38.54, -3.73], 'Fortaleza'],
      ['PARIS', 'FR', 'CDG', [2.35, 48.86], 'Paris'],
      ['LONDRES', 'UK', 'LHR', [-0.13, 51.51], 'Londres'],
      ['ROMA', 'IT', 'FCO', [12.5, 41.9], 'Roma'],
      ['NOVA YORK', 'EUA', 'JFK', [-74.0, 40.71], 'Nova York']
    ]
  };
  let origin = region;
  let destIdx = 0;
  const board = $('#board');
  const rows = DESTS.br.map((d, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'board__row';
    b.setAttribute('role', 'option');
    b.innerHTML = `<span class="flap" data-len="9" aria-hidden="true">${d[0]}</span><span class="board__cc"></span><span class="board__code"></span><span class="board__status">CONSULTE</span>`;
    b.addEventListener('click', () => selectDest(i));
    board.appendChild(b);
    makeFlap($('.flap', b));
    return b;
  });

  function renderBoard(instant) {
    DESTS[origin].forEach((d, i) => {
      const r = rows[i];
      const f = $('.flap', r);
      const go = () => setFlap(f, d[0], instant);
      instant ? go() : setTimeout(go, i * 70);
      $('.board__cc', r).textContent = d[1];
      $('.board__code', r).textContent = d[2];
      r.setAttribute('aria-label', `${d[4]}, ${d[1]}, código ${d[2]}`);
    });
    $$('[data-origin]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.origin === origin)));
  }

  function selectDest(i, skipGlobe) {
    destIdx = i;
    rows.forEach((r, k) => {
      r.setAttribute('aria-selected', String(k === i));
      $('.board__status', r).textContent = k === i ? 'EMBARQUE' : 'CONSULTE';
    });
    const o = ORIGINS[origin], d = DESTS[origin][i];
    $('#rcFrom').textContent = o.code;
    $('#rcTo').textContent = d[2];
    $('#rcName').textContent = `${o.name} para ${d[4]}`;
    $('#rcWa').href = wa(origin, `Olá, Solange! Vim pelo site da Sol Volta ao Mundo e quero cotar uma viagem: ${o.name} → ${d[4]} (${d[2]}). Pode me ajudar? ✈️`);
    if (!skipGlobe && globe) globe.setRoute(o.coord, d[3]);
  }

  $$('[data-origin]').forEach(b => b.addEventListener('click', () => {
    if (origin === b.dataset.origin) return;
    origin = b.dataset.origin;
    setRegion(origin);
    renderBoard();
    selectDest(0);
  }));

  $('#rcPass').addEventListener('click', () => {
    const d = DESTS[origin][destIdx];
    if (origin === 'pt') fFrom.value = 'Lisboa';
    fTo.value = d[4];
    setRegion(origin);
    updatePass(true);
    $('#cotacao').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => (fFrom.value ? fName : fFrom).focus({ preventScroll: true }), reduce ? 0 : 900);
  });

  /* Globe (d3 orthographic on canvas) */
  let globe = null;
  function createGlobe(canvas) {
    const d3 = window.d3;
    const ctx = canvas.getContext('2d');
    const proj = d3.geoOrthographic().clipAngle(90).precision(0.4);
    const path = d3.geoPath(proj, ctx);
    const grat = d3.geoGraticule10();
    const planePath = new Path2D('M21.5 15.5v-2l-8-5V3.2c0-.9-.7-1.7-1.5-1.7s-1.5.8-1.5 1.7v5.3l-8 5v2l8-2.5v5.2l-2 1.5v1.8l3.5-1 3.5 1v-1.8l-2-1.5V13z');
    let W = 0, dpr = 1, rot = [50, -10, 0], dots = [];
    let route = null, anim = null, arcStart = 0, visible = false, raf = 0;
    let drag = null, lastInteract = 0;

    function resize() {
      const r = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(W * dpr);
      proj.scale(W * 0.43).translate([W / 2, W / 2]);
      draw(performance.now());
    }

    function buildDots(land) {
      const w = 720, h = 360;
      const off = document.createElement('canvas');
      off.width = w; off.height = h;
      const o = off.getContext('2d', { willReadFrequently: true });
      const eq = d3.geoEquirectangular().scale(w / (2 * Math.PI)).translate([w / 2, h / 2]);
      o.beginPath(); d3.geoPath(eq, o)(land); o.fillStyle = '#000'; o.fill();
      const data = o.getImageData(0, 0, w, h).data;
      const out = [];
      const step = 1.7;
      for (let lat = -82; lat <= 82; lat += step) {
        const ls = step / Math.max(0.2, Math.cos(lat * Math.PI / 180));
        for (let lon = -180; lon < 180; lon += ls) {
          const p = eq([lon, lat]);
          const idx = ((p[1] | 0) * w + (p[0] | 0)) * 4 + 3;
          if (data[idx] > 128) out.push([lon, lat]);
        }
      }
      dots = out;
      draw(performance.now());
    }

    function project(ll, c, center, lift) {
      const dist = d3.geoDistance(ll, center);
      const p = proj(ll);
      const k = 1 + lift;
      return { x: c + (p[0] - c) * k, y: c + (p[1] - c) * k, vis: dist < Math.PI / 2 + lift * 0.9 };
    }

    function draw(now) {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, W);
      proj.rotate(rot);
      const R = proj.scale(), c = W / 2;
      const center = [-rot[0], -rot[1]];

      const g = ctx.createRadialGradient(c - R * .35, c - R * .45, R * .05, c, c, R);
      g.addColorStop(0, '#2364b8'); g.addColorStop(.55, '#0f2c6b'); g.addColorStop(1, '#071a45');
      ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); path(grat); ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; ctx.stroke();

      // land dots
      ctx.fillStyle = '#a9d0f5';
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dist = d3.geoDistance(d, center);
        if (dist > 1.53) continue;
        const p = proj(d);
        const k = Math.cos(dist);
        const s = 0.8 + k * 1.6;
        ctx.globalAlpha = 0.18 + k * 0.7;
        ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s);
      }
      ctx.globalAlpha = 1;

      // rim light
      const rim = ctx.createRadialGradient(c, c, R * .82, c, c, R);
      rim.addColorStop(0, 'rgba(106,174,224,0)'); rim.addColorStop(1, 'rgba(106,174,224,.35)');
      ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = rim; ctx.fill();

      // destination pins
      const list = DESTS[origin];
      list.forEach((d, i) => {
        const p = project(d[3], c, center, 0);
        if (!p.vis) return;
        const sel = i === destIdx;
        ctx.beginPath(); ctx.arc(p.x, p.y, sel ? 4.5 : 2.6, 0, Math.PI * 2);
        ctx.fillStyle = sel ? '#F6B81A' : 'rgba(255,255,255,.85)'; ctx.fill();
        if (sel && !reduce) {
          const pulse = (now % 1600) / 1600;
          ctx.beginPath(); ctx.arc(p.x, p.y, 4 + pulse * 16, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(246,184,26,${0.7 * (1 - pulse)})`; ctx.lineWidth = 1.5; ctx.stroke();
        }
        if (sel) label(d[4], p.x, p.y, '#fff');
      });
      // origin
      const op = project(ORIGINS[origin].coord, c, center, 0);
      if (op.vis) {
        ctx.beginPath(); ctx.arc(op.x, op.y, 5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.beginPath(); ctx.arc(op.x, op.y, 9, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
        label(ORIGINS[origin].name, op.x, op.y, '#FFE3A1', true);
      }

      // route arc
      if (route) {
        const t = reduce ? 1 : clamp((now - arcStart) / 1300);
        const n = 80, pts = [];
        for (let i = 0; i <= n; i++) {
          const s = (i / n) * t;
          pts.push(project(route.interp(s), c, center, route.h * Math.sin(Math.PI * s)));
        }
        ctx.beginPath();
        let pen = false;
        for (const p of pts) {
          if (!p.vis) { pen = false; continue; }
          pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
          pen = true;
        }
        ctx.strokeStyle = '#F6B81A'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.stroke();

        // plane: draws the line, then keeps commuting along it
        let ps = t;
        if (t >= 1 && !reduce) ps = ((now - arcStart - 1300) % 3600) / 3600;
        if (!reduce || t < 1) {
          const a = project(route.interp(clamp(ps)), c, center, route.h * Math.sin(Math.PI * ps));
          const b = project(route.interp(clamp(ps + 0.01)), c, center, route.h * Math.sin(Math.PI * (ps + 0.01)));
          if (a.vis) {
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2);
            ctx.scale(0.95, 0.95);
            ctx.translate(-12, -12);
            ctx.fillStyle = '#fff';
            ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
            ctx.fill(planePath);
            ctx.restore();
          }
        }
      }
    }

    function label(text, x, y, color, below) {
      ctx.font = '700 12px "JetBrains Mono", monospace';
      const w = ctx.measureText(text.toUpperCase()).width + 14;
      const lx = Math.min(W - w - 4, Math.max(4, x + 10)), ly = below ? y + 8 : y - 26;
      ctx.fillStyle = 'rgba(6,22,55,.82)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(lx, ly, w, 20, 6); else ctx.rect(lx, ly, w, 20);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillText(text.toUpperCase(), lx + 7, ly + 14);
    }

    function tick(now) {
      raf = 0;
      if (anim) {
        const e = clamp((now - anim.start) / anim.dur);
        const k = e < .5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2;
        rot = [lerp(anim.from[0], anim.to[0], k), lerp(anim.from[1], anim.to[1], k), 0];
        if (e >= 1) { anim = null; arcStart = now; }
      } else if (!drag && !route && !reduce && now - lastInteract > 2000) {
        rot[0] += 0.12;
      }
      draw(now);
      if (visible && !reduce) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    function setRoute(o, d) {
      const interp = d3.geoInterpolate(o, d);
      const mid = interp(0.5);
      const dist = d3.geoDistance(o, d);
      route = { interp, h: Math.min(0.22, 0.04 + dist * 0.09) };
      const from = rot.slice();
      const dl = ((-mid[0] - from[0] + 540) % 360) - 180;
      const to = [from[0] + dl, clamp(-mid[1], -40, 40), 0];
      if (reduce) { rot = to; anim = null; arcStart = 0; draw(performance.now()); return; }
      anim = { from, to, start: performance.now(), dur: 1100 };
      kick();
    }

    // drag to spin
    canvas.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
      anim = null;
      if (route && !arcStart) arcStart = performance.now();
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      rot[0] += dx * 0.35;
      rot[1] = clamp(rot[1] - dy * 0.35, -60, 60);
      lastInteract = performance.now();
      if (reduce) draw(lastInteract); else kick();
    });
    const end = () => { drag = null; lastInteract = performance.now(); };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); }).observe(canvas);
    new ResizeObserver(resize).observe(canvas.parentElement);

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json')
      .then(r => r.json())
      .then(topo => buildDots(window.topojson.feature(topo, topo.objects.land)))
      .catch(() => { /* globe still works without land dots */ });

    return { setRoute };
  }

  if (window.d3) {
    try { globe = createGlobe($('#globe')); } catch (e) { globe = null; }
  }
  if (!globe) $('#globeWrap').classList.add('is-fallback');

  /* ---------------- boarding pass ---------------- */
  const pass = $('#pass');
  const fFrom = $('#fFrom'), fTo = $('#fTo'), fName = $('#fName'), fGo = $('#fGo'), fBack = $('#fBack'), fPax = $('#fPax');
  const CITIES = {
    'Goiânia': 'GYN', 'São Paulo': 'GRU', 'Rio de Janeiro': 'GIG', 'Brasília': 'BSB', 'Belo Horizonte': 'CNF', 'Salvador': 'SSA',
    'Recife': 'REC', 'Fortaleza': 'FOR', 'Curitiba': 'CWB', 'Porto Alegre': 'POA', 'Florianópolis': 'FLN', 'Natal': 'NAT',
    'Maceió': 'MCZ', 'Manaus': 'MAO', 'Belém': 'BEL', 'Lisboa': 'LIS', 'Porto': 'OPO', 'Faro': 'FAO', 'Funchal': 'FNC',
    'Ponta Delgada': 'PDL', 'Paris': 'CDG', 'Roma': 'FCO', 'Milão': 'MXP', 'Madri': 'MAD', 'Barcelona': 'BCN', 'Londres': 'LHR',
    'Amsterdã': 'AMS', 'Frankfurt': 'FRA', 'Zurique': 'ZRH', 'Dublin': 'DUB', 'Nova York': 'JFK', 'Orlando': 'MCO', 'Miami': 'MIA',
    'Cancún': 'CUN', 'Punta Cana': 'PUJ', 'Buenos Aires': 'EZE', 'Santiago': 'SCL', 'Dubai': 'DXB', 'Tóquio': 'HND',
    'Istambul': 'IST', 'Cidade do Cabo': 'CPT', 'Luanda': 'LAD', 'Toronto': 'YYZ', 'Las Vegas': 'LAS'
  };
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const IATA = Object.fromEntries(Object.entries(CITIES).map(([k, v]) => [norm(k), v]));
  Object.assign(IATA, { rio: 'GIG', 'new york': 'JFK', amsterdam: 'AMS', madrid: 'MAD', bsb: 'BSB', sp: 'GRU' });
  $('#cities').innerHTML = Object.keys(CITIES).map(c => `<option value="${c}">`).join('');
  const code = s => {
    const n = norm(s || '');
    if (!n) return '---';
    if (IATA[n]) return IATA[n];
    if (/^[a-z]{3}$/.test(n)) return n.toUpperCase();
    return n.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, '-');
  };
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const fmtDate = v => { if (!v) return ''; const [y, m, d] = v.split('-'); return `${d}/${m}/${y}`; };

  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  fGo.min = fBack.min = today.toISOString().slice(0, 10);

  let pax = 1;
  const choice = g => $(`[data-group="${g}"] [aria-checked="true"]`).textContent.trim();
  $$('.chips').forEach(group => group.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', group).forEach(x => x.setAttribute('aria-checked', String(x === b)));
    updatePass();
  }));
  $$('.stepper button').forEach(b => b.addEventListener('click', () => {
    pax = clamp(pax + +b.dataset.step, 1, 20);
    fPax.textContent = pax;
    updatePass();
  }));
  $$('[data-region]').forEach(b => b.addEventListener('click', () => setRegion(b.dataset.region)));

  const barcode = $('#barcode');
  function drawBarcode(seed) {
    let s = seed || 1, x = 0, html = '';
    const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
    while (x < 200) {
      const w = 1 + Math.floor(rnd() * 3.2);
      html += `<rect x="${x}" y="0" width="${w}" height="48"/>`;
      x += w + 1 + Math.floor(rnd() * 2.5);
    }
    barcode.innerHTML = html;
  }

  let lastFrom = null, lastTo = null;
  var updatePass = function (forceFlap) {
    const from = fFrom.value.trim(), to = fTo.value.trim();
    const cf = code(from), ct = code(to);
    if (cf !== lastFrom || forceFlap) { setFlap($('#pFromCode'), cf); lastFrom = cf; }
    if (ct !== lastTo || forceFlap) { setFlap($('#pToCode'), ct); lastTo = ct; }
    const h = hash(cf + ct + fGo.value);
    $('#pFlight').textContent = `SVM ${1000 + (h % 9000)}`;
    drawBarcode(h);
    if (fGo.value) fBack.min = fGo.value;

    const lines = [
      'Olá, Solange! ✈️ Vim pelo site da Sol Volta ao Mundo e quero uma cotação:',
      ''
    ];
    if (fName.value.trim()) lines.push(`• Passageiro: ${fName.value.trim()}`);
    lines.push(`• De: ${from ? `${from} (${cf})` : 'a combinar'}`);
    lines.push(`• Para: ${to ? `${to} (${ct})` : 'a definir'}`);
    lines.push(`• Ida: ${fmtDate(fGo.value) || 'datas flexíveis'}`);
    lines.push(`• Volta: ${fmtDate(fBack.value) || (fGo.value ? 'só ida ou a definir' : 'datas flexíveis')}`);
    lines.push(`• Passageiros: ${pax}`);
    lines.push(`• Classe: ${choice('classe')}`);
    lines.push(`• Procuro: ${choice('interesse')}`);
    lines.push('', 'Pode me ajudar?');
    $('#passSend').href = wa(region, lines.join('\n'));
  };
  [fFrom, fTo, fName, fGo, fBack].forEach(i => i.addEventListener('input', () => updatePass()));
  pass.addEventListener('submit', e => e.preventDefault());

  const hint = $('#passHint');
  let sentTimer;
  $('#passSend').addEventListener('click', e => {
    updatePass();
    if (!fTo.value.trim()) {
      e.preventDefault();
      pass.classList.remove('is-shake'); void pass.offsetWidth; pass.classList.add('is-shake');
      hint.textContent = 'Primeiro diga para onde quer ir ✈';
      fTo.focus();
      return;
    }
    hint.textContent = 'Mensagem pronta no WhatsApp. É só enviar!';
    pass.classList.add('is-sent');
    clearTimeout(sentTimer);
    sentTimer = setTimeout(() => { pass.classList.remove('is-sent'); hint.textContent = ''; }, 3600);
  });

  /* ---------------- documents passport ---------------- */
  const DOCS = {
    turismo: { label: 'Turismo', items: [
      ['Passaporte válido', 'Com pelo menos 6 meses de validade além da data de volta.'],
      ['Visto ou autorização eletrônica', 'Quando o destino exigir. A Solange confere para você.'],
      ['Passagem de ida e volta', 'Muitos países pedem o retorno comprovado na imigração.'],
      ['Reserva de hospedagem', 'Ou carta-convite de quem vai receber você.'],
      ['Seguro viagem', 'Exigido em vários destinos e recomendado em todos.'],
      ['Comprovante de meios financeiros', 'Extratos ou cartões para cobrir a estadia.'],
      ['Autorização de viagem para menores', 'Se viaja com crianças sem um dos pais.']
    ] },
    morar: { label: 'Morar em Portugal', items: [
      ['Passaporte válido', 'Com validade para todo o processo.'],
      ['Visto de residência adequado', 'Trabalho, rendimentos, estudo ou procura de trabalho, conforme o seu perfil.'],
      ['Certidão de antecedentes criminais', 'Emitida no país de origem, normalmente apostilada.'],
      ['NIF português', 'O número de contribuinte, pedido para quase tudo.'],
      ['Comprovante de meios de subsistência', 'Renda, contrato de trabalho ou poupança.'],
      ['Comprovante de alojamento', 'Contrato de arrendamento ou termo de responsabilidade.'],
      ['Seguro de saúde', 'Para o período inicial da estadia.']
    ] },
    estudar: { label: 'Estudar fora', items: [
      ['Carta de aceitação da instituição', 'Matrícula ou admissão confirmada.'],
      ['Visto de estudante', 'Quando o país e a duração do curso exigirem.'],
      ['Passaporte válido', 'Com validade para todo o curso, de preferência.'],
      ['Documentos escolares apostilados', 'Diplomas e históricos com Apostila de Haia.'],
      ['Comprovante de meios financeiros', 'Próprios ou de um responsável.'],
      ['Seguro saúde', 'Com cobertura no país de destino.'],
      ['Alojamento garantido', 'Residência estudantil, quarto ou contrato.']
    ] },
    trabalhar: { label: 'Trabalhar fora', items: [
      ['Passaporte válido', 'Com validade folgada.'],
      ['Contrato, promessa de trabalho ou visto adequado', 'Cada país tem o seu caminho legal.'],
      ['Antecedentes criminais apostilados', 'Emitidos no país de origem.'],
      ['Diplomas e certificados apostilados', 'E traduzidos, quando necessário.'],
      ['Currículo no formato do país', 'Faz diferença na hora da entrevista.'],
      ['Comprovante de meios para o início', 'Para os primeiros meses.'],
      ['Seguro saúde', 'Até ter acesso ao sistema local.']
    ] }
  };
  const STAMPS = [
    { t: 'LISBOA', s: 'ENTRADA', c: '#C0392B', x: 6, y: 4, r: -12 },
    { t: 'PARIS', s: 'APROVADO', c: '#1E5BB8', x: 44, y: 0, r: 9, rect: true },
    { t: 'ROMA', s: 'OK', c: '#1E8E4E', x: 70, y: 30, r: -6 },
    { t: 'GYN', s: 'GOIÂNIA', c: '#8E44AD', x: 22, y: 46, r: 14, rect: true },
    { t: 'NYC', s: 'ADMITTED', c: '#D35400', x: 52, y: 50, r: -16 },
    { t: 'PORTO', s: 'CHEGADA', c: '#0F2C6B', x: 0, y: 66, r: 6 },
    { t: 'SOL', s: 'VIP', c: '#B7950B', x: 72, y: 70, r: -20, rect: true }
  ];
  let purpose = 'turismo';
  const checked = { turismo: new Set(), morar: new Set(), estudar: new Set(), trabalhar: new Set() };
  const list = $('#checklist'), stampsEl = $('#stamps');

  function renderDocs() {
    const d = DOCS[purpose];
    list.innerHTML = d.items.map((it, i) => `
      <li style="--i:${i}">
        <label class="check">
          <input type="checkbox" data-i="${i}" ${checked[purpose].has(i) ? 'checked' : ''}>
          <span class="check__box" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5"/></svg></span>
          <span class="check__txt">${it[0]}<small>${it[1]}</small></span>
        </label>
      </li>`).join('');
    stampsEl.innerHTML = '';
    checked[purpose].forEach(i => addStamp(i, true));
    updateProgress();
  }
  function addStamp(i, instant) {
    const s = STAMPS[i % STAMPS.length];
    const el = document.createElement('div');
    el.className = 'stamp' + (s.rect ? ' stamp--rect' : '');
    el.dataset.i = i;
    el.style.cssText = `--c:${s.c};--r:${s.r}deg;left:${s.x}%;top:${s.y}%;transform:rotate(${s.r}deg)`;
    if (instant) el.style.animation = 'none';
    el.innerHTML = `<span>${s.s}<b>${s.t}</b>${new Date().getFullYear()}</span>`;
    stampsEl.appendChild(el);
  }
  function updateProgress() {
    const n = checked[purpose].size, total = DOCS[purpose].items.length;
    $('#progBar').style.strokeDashoffset = 119.4 * (1 - n / total);
    $('#progText').textContent = `${n} de ${total}`;
    updateDocsLink();
  }
  var updateDocsLink = function () {
    const d = DOCS[purpose];
    const have = d.items.filter((_, i) => checked[purpose].has(i)).map(x => `• ${x[0]}`);
    const miss = d.items.filter((_, i) => !checked[purpose].has(i)).map(x => `• ${x[0]}`);
    const lines = [`Olá, Solange! Vim pelo site da Sol Volta ao Mundo e quero revisar minha documentação para: ${d.label}.`, ''];
    if (have.length) lines.push('✅ Já tenho:', ...have, '');
    if (miss.length) lines.push('⏳ Ainda falta ou tenho dúvida:', ...miss, '');
    lines.push('Pode me orientar?');
    $('#docsWa').href = wa(region, lines.join('\n'));
  };
  list.addEventListener('change', e => {
    const i = +e.target.dataset.i;
    if (e.target.checked) { checked[purpose].add(i); addStamp(i); }
    else { checked[purpose].delete(i); const st = $(`.stamp[data-i="${i}"]`, stampsEl); st && st.remove(); }
    updateProgress();
  });
  $$('#purpose [data-purpose]').forEach(b => b.addEventListener('click', () => {
    purpose = b.dataset.purpose;
    $$('#purpose [data-purpose]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    renderDocs();
  }));

  /* ---------------- services belt (pinned horizontal on desktop) ---------------- */
  const bags = $('#servicos'), track = $('#bagsTrack');
  let beltOn = false, beltDist = 0, lastBeltX = 0, swing = 0;
  function measureBelt() {
    beltOn = innerWidth >= 900 && !reduce;
    if (!beltOn) {
      bags.style.height = '';
      track.style.transform = '';
      $('.bags__belt').style.setProperty('--belt-w', track.scrollWidth + 'px');
      return;
    }
    beltDist = Math.max(0, track.scrollWidth - innerWidth);
    bags.style.height = (innerHeight + beltDist + innerHeight * 0.2) + 'px';
  }

  /* ---------------- flight path ---------------- */
  const flight = $('#flight'), fsvg = $('#flightSvg'), fTrack = $('#flightTrack'), fDraw = $('#flightDraw'), fPlane = $('#flightPlane');
  let fLen = 0;
  function measureFlight() {
    const r = fsvg.getBoundingClientRect();
    const w = r.width, h = r.height;
    fsvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    fsvg.setAttribute('preserveAspectRatio', 'none');
    let d;
    if (innerWidth >= 900) {
      d = `M ${w / 2} 0 C ${w * .12} ${h * .12}, ${w * .12} ${h * .24}, ${w / 2} ${h * .333} S ${w * .88} ${h * .55}, ${w / 2} ${h * .666} S ${w * .12} ${h * .88}, ${w / 2} ${h}`;
    } else {
      const c = w / 2;
      d = `M ${c} 0 C ${c - 12} ${h * .15}, ${c + 12} ${h * .3}, ${c} ${h * .5} S ${c - 12} ${h * .85}, ${c} ${h}`;
    }
    fTrack.setAttribute('d', d);
    fDraw.setAttribute('d', d);
    fLen = fDraw.getTotalLength();
    fDraw.style.strokeDasharray = fLen;
  }

  /* ---------------- reveal ---------------- */
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------------- main loop ---------------- */
  const waFloat = $('.wa-float');
  let ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  function frame() {
    ticking = false;
    const y = scrollY, vh = innerHeight;

    nav.classList.toggle('is-solid', y > 40);
    waFloat.classList.toggle('is-on', y > vh * 0.5);

    // hero parallax
    const hh = hero.offsetHeight;
    if (y < hh + 50) {
      hero.style.setProperty('--hp', clamp(y / hh).toFixed(4));
    }

    // belt
    if (beltOn) {
      const r = bags.getBoundingClientRect();
      const total = bags.offsetHeight - vh;
      const p = clamp(-r.top / total);
      const x = -p * beltDist;
      const v = x - lastBeltX;
      lastBeltX = x;
      swing = clamp(lerp(swing, v * 0.25, 0.3), -8, 8);
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      track.style.setProperty('--swing', `${(-swing).toFixed(2)}deg`);
    }

    // flight path
    if (fLen) {
      const r = flight.getBoundingClientRect();
      const sr = fsvg.getBoundingClientRect();
      const p = clamp((vh * 0.62 - sr.top) / sr.height);
      fDraw.style.strokeDashoffset = (fLen * (1 - p)).toFixed(1);
      const L = fLen * p;
      const a = fDraw.getPointAtLength(L);
      const b = fDraw.getPointAtLength(Math.min(fLen, L + 2));
      const ang = (L >= fLen - 2) ? 180 : Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
      const ox = sr.left - r.left, oy = sr.top - r.top;
      fPlane.style.transform = `translate3d(${(ox + a.x - 17).toFixed(1)}px, ${(oy + a.y - 17).toFixed(1)}px, 0) rotate(${ang.toFixed(1)}deg)`;
    }
  }
  function pointerLoop() {
    mouse.sx = lerp(mouse.sx, mouse.x, 0.08);
    mouse.sy = lerp(mouse.sy, mouse.y, 0.08);
    hero.style.setProperty('--mx', mouse.sx.toFixed(4));
    hero.style.setProperty('--my', mouse.sy.toFixed(4));
    requestAnimationFrame(pointerLoop);
  }
  if (finePointer && !reduce) requestAnimationFrame(pointerLoop);

  function measureAll() { measureBelt(); measureFlight(); frame(); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { clearTimeout(measureAll._t); measureAll._t = setTimeout(measureAll, 120); });
  addEventListener('load', measureAll);

  /* ---------------- init ---------------- */
  $('#year').textContent = new Date().getFullYear();
  renderBoard(true);
  selectDest(0);
  renderDocs();
  refreshLinks();
  updatePass(true);
  measureAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAll);
})();
