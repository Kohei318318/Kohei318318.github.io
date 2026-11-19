/* KopeiKing — interactions */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const PALETTE = ['#f26a1b', '#e5352b', '#2443b5', '#12897b', '#f7c21b', '#f290bd', '#6d3fa6', '#8d94ea'];
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  $('#y').textContent = new Date().getFullYear();

  /* ---------- split text into letters ---------- */
  const split = el => {
    const text = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild.textContent : el.textContent;
    const node = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
    const wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    [...text.trim()].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      s.style.setProperty('--i', i);
      s.style.setProperty('--hc', PALETTE[i % PALETTE.length]);
      s.style.setProperty('--hr', (i % 2 ? 8 : -8) + 'deg');
      wrap.appendChild(s);
    });
    const sr = document.createElement('span');
    sr.className = 'sr';
    sr.textContent = text.trim();
    if (node) { el.replaceChild(wrap, node); el.insertBefore(sr, wrap); }
    else { el.textContent = ''; el.append(sr, wrap); }
    return wrap;
  };
  const title = $('#title');
  title.removeAttribute('aria-label');
  split(title);
  $$('.ch', title).forEach(ch => ch.addEventListener('click', () => {
    ch.classList.remove('boing'); void ch.offsetWidth; ch.classList.add('boing');
  }));
  $$('[data-split]').forEach(split);

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('in');
    io.unobserve(el);
    setTimeout(() => el.classList.add('settled'), 1400);
  }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $$('.rv, .sec-title, .stickers, .ftr').forEach(el => io.observe(el));

  /* ---------- theme toggle ---------- */
  const root = document.documentElement;
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const themeMeta = $('meta[name="theme-color"]');
  const syncMeta = () => themeMeta.setAttribute('content', isDark() ? '#14121c' : '#fbf6ec');
  syncMeta();
  $('#themeBtn').addEventListener('click', e => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (err) {}
    syncMeta();
    burst(e.clientX || innerWidth - 60, e.clientY || 30, 14);
  });

  /* ---------- header: hide on scroll down, show on scroll up ---------- */
  const hdr = $('#hdr');
  const nav = $('#nav');
  const menuBtn = $('#menuBtn');
  let lastY = scrollY;
  const setMenu = open => {
    nav.classList.toggle('open', open);
    hdr.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });

  // current section highlight in nav
  const navLinks = $$('a', nav);
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('cur', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => secIO.observe(s));
  $('#hero') && new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) navLinks.forEach(a => a.classList.remove('cur'));
  }), { rootMargin: '-45% 0px -50% 0px' }).observe($('#hero'));

  $('#logo').addEventListener('click', e => {
    e.preventDefault();
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', location.pathname + location.search);
  });

  /* ---------- scroll-driven bits (rail, header, marquee speed, route) ---------- */
  const railFill = $('#railFill');
  const railTrain = $('#railTrain');
  const mqAnims = [];
  $$('.mq-in').forEach(el => {
    el.parentElement.appendChild(el.cloneNode(true));
  });
  const collectMq = () => $$('.mq-in').forEach(el => el.getAnimations && el.getAnimations().forEach(a => mqAnims.push(a)));
  requestAnimationFrame(collectMq);
  let speed = 1;

  const route = $('#route');
  const routeTrain = $('#routeTrain');
  const stations = $$('.st', route);
  const dots = $$('.st-dot', route);
  const updateRoute = () => {
    const r = route.getBoundingClientRect();
    const vh = innerHeight;
    const p = clamp((vh * .78 - r.top) / (vh * .33 + r.height), 0, 1);
    route.style.setProperty('--p', p.toFixed(4));
    const a = dots[0].getBoundingClientRect();
    const b = dots[dots.length - 1].getBoundingClientRect();
    const ax = a.left + a.width / 2 - r.left, ay = a.top + a.height / 2 - r.top;
    const bx = b.left + b.width / 2 - r.left, by = b.top + b.height / 2 - r.top;
    const vertical = Math.abs(by - ay) > Math.abs(bx - ax);
    // keep the train just above the line on desktop, on the line on phones
    routeTrain.style.setProperty('--tx', (ax + (bx - ax) * p) + 'px');
    routeTrain.style.setProperty('--ty', (ay + (by - ay) * p - (vertical ? 0 : 26)) + 'px');
    const n = stations.length - 1;
    stations.forEach((s, i) => s.classList.toggle('on', p >= i / n - .02));
  };

  const onScroll = () => {
    const y = scrollY;
    const h = document.documentElement;
    const p = y / Math.max(1, h.scrollHeight - h.clientHeight);
    railFill.style.transform = 'scaleX(' + p + ')';
    railTrain.style.left = (p * 100) + '%';
    railTrain.style.opacity = y > 4 ? 1 : 0;
    hdr.classList.toggle('solid', y > 20);
    if (!nav.classList.contains('open')) hdr.classList.toggle('hide', y > lastY && y > 300);
    speed = Math.min(5, 1 + Math.abs(y - lastY) / 12);
    lastY = y;
    updateRoute();
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', updateRoute);
  onScroll();

  // marquee eases back to normal speed after a scroll burst
  if (!reduce) {
    const tick = () => {
      speed += (1 - speed) * .06;
      mqAnims.forEach(a => { a.playbackRate = speed; });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- cursor follower ---------- */
  const cursor = $('#cursor');
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
  if (fine && !reduce) {
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; cursor.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('on'));
    const loop = () => {
      cx += (mx - cx) * .2; cy += (my - cy) * .2;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', e => {
      cursor.classList.toggle('big', !!e.target.closest('a, button, .stk, .ch, .tree'));
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) $$('.magnet').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * .25;
      const y = (e.clientY - r.top - r.height / 2) * .35;
      el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + (x * .15) + 'deg)';
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- 3D tilt cards ---------- */
  if (fine && !reduce) $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      el.classList.add('moving');
      el.style.setProperty('--ry', (px * 10) + 'deg');
      el.style.setProperty('--rx', (-py * 10) + 'deg');
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('moving');
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
    });
  });

  /* ---------- hero: parallax shapes + character looks at the pointer ---------- */
  const hero = $('#hero');
  const shapes = $$('.sh', hero);
  const charImg = $('#char img');
  if (fine && !reduce) hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - .5;
    const py = (e.clientY - r.top) / r.height - .5;
    shapes.forEach(s => {
      const d = Number(s.dataset.depth) || 20;
      s.style.setProperty('--px', (px * d) + 'px');
      s.style.setProperty('--py', (py * d) + 'px');
    });
    charImg.style.setProperty('--tilt', (px * 10) + 'deg');
    charImg.style.setProperty('--tx', (px * 14) + 'px');
    charImg.style.setProperty('--ty', (py * 10) + 'px');
  });

  /* ---------- confetti ---------- */
  function burst(x, y, count = 26) {
    if (reduce) return;
    const kinds = ['tri', 'dot', 'sq'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('i');
      el.className = 'confetti ' + kinds[i % 3];
      el.style.setProperty('--c', PALETTE[i % PALETTE.length]);
      const size = rand(8, 16);
      el.style.width = el.style.height = size + 'px';
      document.body.appendChild(el);
      const ang = rand(0, Math.PI * 2);
      const dist = rand(80, 220);
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 80;
      const rot = rand(-540, 540);
      el.animate([
        { transform: `translate(${x}px,${y}px) rotate(0) scale(1)`, opacity: 1 },
        { transform: `translate(${x + dx}px,${y + dy}px) rotate(${rot / 2}deg) scale(1)`, opacity: 1, offset: .55 },
        { transform: `translate(${x + dx * 1.2}px,${y + dy + 180}px) rotate(${rot}deg) scale(.6)`, opacity: 0 }
      ], { duration: rand(900, 1500), easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => el.remove();
    }
  }

  /* ---------- tap the character ---------- */
  const char = $('#char');
  const hint = $('#charHint');
  const LINES = ['やあ！', '旅に出よう！', 'ガタンゴトン🚃', '知って、行って…', '考えて…', '全力で楽しむ！', 'まだ押す？', 'くすぐったい！', 'もうちょっと…', '🎉 コンプリート！'];
  let taps = 0;
  char.addEventListener('click', e => {
    const r = char.getBoundingClientRect();
    const x = e.clientX || r.left + r.width / 2;
    const y = e.clientY || r.top + r.height / 2;
    char.classList.remove('jump'); void char.offsetWidth; char.classList.add('jump');
    hint.textContent = LINES[taps % LINES.length];
    hint.classList.remove('bump'); void hint.offsetWidth; hint.classList.add('bump');
    taps++;
    if (taps % LINES.length === 0) {
      for (let k = 0; k < 6; k++) setTimeout(() => burst(rand(0, innerWidth), rand(0, innerHeight * .6), 30), k * 160);
    } else burst(x, y);
  });

  /* ---------- draggable stickers ---------- */
  $$('.stk').forEach(el => {
    let sx = 0, sy = 0, ox = 0, oy = 0, id = null;
    el.addEventListener('pointerdown', e => {
      id = e.pointerId; el.setPointerCapture(id);
      sx = e.clientX - ox; sy = e.clientY - oy;
      el.classList.add('drag');
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      ox = e.clientX - sx; oy = e.clientY - sy;
      el.style.setProperty('--dx', ox + 'px');
      el.style.setProperty('--dy', oy + 'px');
    });
    const up = e => { if (e.pointerId !== id) return; id = null; el.classList.remove('drag'); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });

  /* ---------- JOURNEXIA forest scan ---------- */
  const forest = $('#forest');
  const treesBox = $('.trees', forest);
  const scan = $('.scan', forest);
  const riskCount = $('#riskCount');
  const N = innerWidth < 600 ? 9 : 14;
  const RISKY = new Set(innerWidth < 600 ? [2, 6] : [3, 8, 11]);
  const GREENS = ['#2e8a4a', '#12897b', '#3f9d5a', '#1f7a5c'];
  const trees = [];
  for (let i = 0; i < N; i++) {
    const t = document.createElement('div');
    t.className = 'tree';
    const h = rand(.8, 1.2);
    t.style.setProperty('--dl', rand(-3, 0) + 's');
    t.style.setProperty('--tc', GREENS[i % GREENS.length]);
    t.innerHTML = i % 3 === 1
      ? `<svg viewBox="0 0 40 ${70 * h}"><rect class="trunk" x="17" y="${48 * h}" width="6" height="${22 * h}"/><circle class="leaf" cx="20" cy="${30 * h}" r="${18 * h}"/></svg>`
      : `<svg viewBox="0 0 40 ${70 * h}"><rect class="trunk" x="17" y="${50 * h}" width="6" height="${20 * h}"/><path class="leaf" d="M20 0 38 ${30 * h}H28L40 ${54 * h}H0L12 ${30 * h}H2z"/></svg>`;
    treesBox.appendChild(t);
    trees.push(t);
  }
  if (reduce) {
    trees.forEach((t, i) => t.classList.toggle('risk', RISKY.has(i)));
    riskCount.textContent = RISKY.size;
    scan.style.display = 'none';
  } else {
    let visible = false;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(forest);
    const DUR = 4200, HOLD = 1400;
    let start = performance.now();
    const step = now => {
      if (visible) {
        const t = (now - start) % (DUR + HOLD);
        const p = Math.min(1, t / DUR);
        scan.style.setProperty('--sx', (-5 + p * 110) + '%');
        const fr = forest.getBoundingClientRect();
        const sx = fr.left + fr.width * (-0.05 + p * 1.1);
        let found = 0;
        trees.forEach((tr, i) => {
          const b = tr.getBoundingClientRect();
          const passed = sx > b.left + b.width / 2;
          const flag = RISKY.has(i) && passed && t < DUR + HOLD - 80;
          if (tr.classList.contains('risk') !== flag) tr.classList.toggle('risk', flag);
          if (flag) found++;
        });
        riskCount.textContent = found;
      } else start = now;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- latest videos ---------- */
  (() => {
    const CHANNEL = 'https://youtube.com/@kopeiking_travel';
    const box = $('#videos');
    const track = $('#vtrack');
    const vdots = $('#vdots');
    const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmt = d => { const t = new Date(d); return isNaN(t) ? '' : t.getFullYear() + '.' + String(t.getMonth() + 1).padStart(2, '0') + '.' + String(t.getDate()).padStart(2, '0'); };
    const PLAY = '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg>';
    let cards = [], idx = 0, timer = null, hover = false, seen = false;

    const fallback = () => {
      box.classList.add('empty');
      track.innerHTML = '<a class="vcard only" href="' + CHANNEL + '" target="_blank" rel="noopener"><div class="thumb">▶ YouTubeで最新動画を見る ↗</div></a>';
    };
    const mark = () => [...vdots.children].forEach((d, k) => {
      d.classList.toggle('on', k === idx);
      d.setAttribute('aria-current', k === idx ? 'true' : 'false');
    });
    const go = i => {
      if (!cards.length) return;
      const max = track.scrollWidth - track.clientWidth;
      // at the end of the row, "next" loops back to the first video
      if (i > idx && track.scrollLeft >= max - 2) i = cards.length;
      idx = (i + cards.length) % cards.length;
      track.scrollTo({ left: track.scrollLeft + cards[idx].getBoundingClientRect().left - track.getBoundingClientRect().left, behavior: reduce ? 'auto' : 'smooth' });
      mark();
    };
    const auto = () => {
      clearInterval(timer);
      if (reduce || !cards.length) return;
      timer = setInterval(() => { if (!hover && seen && !document.hidden) go(idx + 1); }, 5000);
    };
    const render = list => {
      const vids = (Array.isArray(list) ? list : []).filter(v => v && v.id).slice(0, 5);
      if (!vids.length) return fallback();
      track.innerHTML = vids.map(v =>
        '<a class="vcard" href="https://www.youtube.com/watch?v=' + encodeURIComponent(v.id) + '" target="_blank" rel="noopener">' +
          '<div class="thumb"><img src="https://i.ytimg.com/vi/' + encodeURIComponent(v.id) + '/hqdefault.jpg" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'"><span class="play">' + PLAY + '</span></div>' +
          '<h4>' + esc(v.title || '') + '</h4><time>' + fmt(v.published) + '</time>' +
        '</a>').join('');
      cards = [...track.children];
      vdots.innerHTML = cards.map((_, i) => '<button aria-label="' + (i + 1) + '本目の動画"></button>').join('');
      [...vdots.children].forEach((d, i) => d.addEventListener('click', () => { go(i); auto(); }));
      mark();
      auto();
    };
    $$('.vbtn', box).forEach(b => b.addEventListener('click', () => { go(idx + Number(b.dataset.dir)); auto(); }));
    box.addEventListener('pointerenter', () => { hover = true; });
    box.addEventListener('pointerleave', () => { hover = false; });
    new IntersectionObserver(es => { seen = es[0].isIntersecting; }).observe(box);
    // keep the dots in sync when the user swipes the row by hand
    let st;
    track.addEventListener('scroll', () => {
      clearTimeout(st);
      st = setTimeout(() => {
        if (!cards.length) return;
        const tl = track.getBoundingClientRect().left;
        const off = c => Math.abs(c.getBoundingClientRect().left - tl);
        let best = 0;
        cards.forEach((c, k) => { if (off(c) < off(cards[best])) best = k; });
        idx = best; mark();
      }, 120);
    }, { passive: true });

    fetch('videos.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(render)
      .catch(fallback);
  })();

  /* ---------- achievements: open skills ---------- */
  $$('.more').forEach(btn => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const label = $('span', btn);
    const chips = $$('.chips li', panel);
    btn.addEventListener('click', e => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      label.textContent = open ? '閉じる' : '獲得したスキルを見る';
      chips.forEach((c, i) => { c.style.transitionDelay = open ? (0.12 + i * 0.05) + 's' : '0s'; });
      panel.classList.toggle('open', open);
      // drop the stagger once it has played so hover reacts instantly
      if (open) setTimeout(() => chips.forEach(c => { c.style.transitionDelay = ''; }), 1200);
      const r = btn.getBoundingClientRect();
      if (open) burst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, 12);
    });
  });
})();
