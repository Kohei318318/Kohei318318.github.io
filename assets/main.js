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
    if (reduce) return;
    ch.animate([{ transform: 'none' }, { transform: 'scale(1.25,.75)', offset: .3 }, { transform: 'scale(.85,1.2) translateY(-18px)', offset: .55 }, { transform: 'scale(1.05,.95)', offset: .8 }, { transform: 'none' }], { duration: 700, easing: 'ease-out' });
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

  /* ---------- confetti (shapes or mini characters) ---------- */
  function burst(x, y, count = 26, faces = false) {
    if (reduce) return;
    const kinds = ['tri', 'dot', 'sq'];
    for (let i = 0; i < count; i++) {
      let el;
      if (faces) {
        el = document.createElement('img');
        el.src = 'assets/kopeiking.webp';
        el.alt = '';
        el.className = 'mini-char';
        el.style.width = rand(30, 56) + 'px';
      } else {
        el = document.createElement('i');
        el.className = 'confetti ' + kinds[i % 3];
        el.style.setProperty('--c', PALETTE[i % PALETTE.length]);
        el.style.width = el.style.height = rand(8, 16) + 'px';
      }
      document.body.appendChild(el);
      const ang = rand(0, Math.PI * 2);
      const dist = rand(80, faces ? 300 : 220);
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 80;
      const rot = rand(-540, 540);
      el.animate([
        { transform: `translate(${x}px,${y}px) rotate(0) scale(.4)`, opacity: 1 },
        { transform: `translate(${x + dx}px,${y + dy}px) rotate(${rot / 2}deg) scale(1)`, opacity: 1, offset: .55 },
        { transform: `translate(${x + dx * 1.2}px,${y + dy + 220}px) rotate(${rot}deg) scale(.6)`, opacity: 0 }
      ], { duration: rand(1000, faces ? 2000 : 1500), easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => el.remove();
    }
  }

  /* ---------- tap the character: a different reaction every time ---------- */
  const char = $('#char');
  const hint = $('#charHint');
  let running = null;
  const play = (kf, duration, easing = 'ease-in-out') => {
    if (reduce) return null;
    if (running) running.cancel();
    running = char.animate(kf, { duration, easing });
    return running;
  };
  const center = () => { const r = char.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const ACTIONS = [
    ['ぴょーん！', () => play([
      { transform: 'none' }, { transform: 'translateY(12px) scale(1.12,.86)', offset: .2 },
      { transform: 'translateY(-90px) rotate(-10deg) scale(.95,1.06)', offset: .55 },
      { transform: 'translateY(8px) scale(1.08,.92)', offset: .85 }, { transform: 'none' }], 900)],
    ['くるりん♪', () => play([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(200deg) scale(.8)', offset: .5 }, { transform: 'rotate(360deg) scale(1)' }], 900)],
    ['ぶるぶる…さむい！', () => play([0, -10, 10, -10, 10, -8, 8, -5, 5, 0].map(v => ({ transform: `translateX(${v}px) rotate(${v / 3}deg)` })), 800, 'linear')],
    ['ちょっと散歩してくる！', () => {
      const a = play([
        { transform: 'none' }, { transform: 'translateX(-24px) rotate(-6deg)', offset: .12 },
        { transform: 'translateX(110vw) rotate(12deg)', offset: .45 }, { transform: 'translateX(-110vw) rotate(12deg)', offset: .46 },
        { transform: 'translateX(14px) rotate(-4deg)', offset: .9 }, { transform: 'none' }], 2400);
      if (a) a.onfinish = () => say('ただいま！🧳');
    }],
    ['でっかくなっちゃった！', () => play([{ transform: 'scale(1)' }, { transform: 'scale(1.45)', offset: .25 }, { transform: 'scale(1.4)', offset: .75 }, { transform: 'scale(1)' }], 1500, 'cubic-bezier(.3,1.4,.5,1)')],
    ['分身の術！', () => { play([{ transform: 'scale(1)' }, { transform: 'scale(.8)', offset: .3 }, { transform: 'scale(1)' }], 500); const [x, y] = center(); burst(x, y, 9, true); }],
    ['カラフルモード！', () => play([{ filter: 'hue-rotate(0deg)' }, { filter: 'hue-rotate(360deg) saturate(1.6)' }, { filter: 'hue-rotate(720deg)' }], 1800, 'linear')],
    ['ぺっちゃんこ…', () => { char.style.transformOrigin = '50% 100%'; play([
      { transform: 'none' }, { transform: 'scale(1.3,.35)', offset: .2 }, { transform: 'scale(1.3,.35)', offset: .6 },
      { transform: 'scale(.9,1.15)', offset: .8 }, { transform: 'none' }], 1300); }],
    ['あっちむいて…ほい！', () => play([{ transform: 'scaleX(1)' }, { transform: 'scaleX(-1)', offset: .3 }, { transform: 'scaleX(-1)', offset: .7 }, { transform: 'scaleX(1)' }], 1400)],
    ['ねむい…💤', () => { char.style.transformOrigin = '50% 100%'; play([
      { transform: 'none' }, { transform: 'rotate(-75deg) translateY(10px)', offset: .3 }, { transform: 'rotate(-75deg) translateY(10px)', offset: .75 },
      { transform: 'translateY(-40px) rotate(8deg)', offset: .9 }, { transform: 'none' }], 2400); }]
  ];
  const say = text => {
    hint.textContent = text;
    if (!reduce) hint.animate([{ transform: 'scale(.6) rotate(-8deg)' }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  };
  let taps = 0;
  char.addEventListener('click', e => {
    char.style.transformOrigin = '';
    const [action, fn] = ACTIONS[taps % ACTIONS.length];
    taps++;
    say(action);
    fn();
    if (taps === ACTIONS.length) {
      setTimeout(() => {
        say('🎉 全部見てくれてありがとう！');
        for (let k = 0; k < 6; k++) setTimeout(() => burst(rand(0, innerWidth), rand(0, innerHeight * .6), 24, k % 2 === 0), k * 180);
      }, 1200);
    } else if (taps % 3 === 0) {
      const [x, y] = center(); burst(x, y, 18);
    }
  });

  /* ---------- opening animation ---------- */
  (() => {
    const intro = $('#intro');
    if (!document.documentElement.classList.contains('show-intro')) return;
    const pct = $('#introPct');
    const skip = $('#introSkip');
    const t0 = performance.now();
    let done = false;
    const count = now => {
      const p = clamp((now - t0 - 900) / 1800, 0, 1);
      pct.textContent = Math.round(p * 100);
      if (!done && p < 1) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
    const finish = () => {
      if (done) return;
      done = true;
      try { sessionStorage.setItem('introSeen', '1'); } catch (err) {}
      const [x, y] = center();
      intro.style.setProperty('--ox', x + 'px');
      intro.style.setProperty('--oy', y + 'px');
      pct.textContent = '100';
      intro.classList.add('out');
      document.documentElement.classList.remove('intro-play');
      setTimeout(() => document.documentElement.classList.remove('show-intro'), 950);
    };
    setTimeout(finish, 3200);
    intro.addEventListener('click', finish);
    addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish(); });
    skip.focus({ preventScroll: true });
  })();

  /* ---------- character hiding behind the ticket ---------- */
  const peek = $('#tkPeek');
  peek.addEventListener('click', () => {
    peek.classList.add('shy');
    guideSay('見つかっちゃった…！');
    setTimeout(() => peek.classList.remove('shy'), 1600);
  });

  /* ---------- guide character with tips per section ---------- */
  const guide = $('#guide');
  const gBubble = $('#guideBubble');
  const gBtn = $('#guideBtn');
  const TIPS = {
    about: ['ぼくがこうぺいキング！よろしくね', 'ステッカーはドラッグで動かせるよ', 'チケットの裏にだれか隠れてる…？'],
    journexia: ['JOURNEXIAは、ぼくが代表をしている観光専門のAIコンサルティングだよ', 'EBPMは「証拠に基づく政策立案」のこと！', '「Before / After」を切り替えてみてね', 'ドミノは「もう一度たおす」で何回でも倒せるよ'],
    youtube: ['スクロールすると電車が走るよ🚃', 'ぼくも電車に乗ってるよ！', '知って、行って、考えて、全力で楽しむ！'],
    achievements: ['ボタンを押すと、獲得したスキルが見られるよ', 'カードはマウスを乗せると傾くよ'],
    links: ['チャンネル登録よろしくね！', '最後まで見てくれてありがとう！']
  };
  let gSec = '', gIdx = 0, gTimer;
  function guideSay(text) {
    gBubble.textContent = text;
    gBubble.classList.add('on');
    clearTimeout(gTimer);
    gTimer = setTimeout(() => gBubble.classList.remove('on'), 5200);
  }
  const hop = () => { if (!reduce) $('img', gBtn).animate([{ transform: 'none' }, { transform: 'translateY(-22px) rotate(-10deg)', offset: .4 }, { transform: 'none' }], { duration: 550, easing: 'cubic-bezier(.34,1.56,.64,1)' }); };
  gBubble.addEventListener('click', () => openChat());
  gBtn.addEventListener('click', () => (chat.hidden ? openChat() : closeChat()));

  /* ---------- Q&A chatbot (answers from this site's content, no server) ---------- */
  const chat = $('#chat');
  const chatLog = $('#chatLog');
  const chatQuick = $('#chatQuick');
  const chatForm = $('#chatForm');
  const chatInput = $('#chatInput');
  const go = (label, href) => ({ label, href });
  const KB = [
    { id: 'who', q: 'こうぺいキングって誰？', keys: ['誰', 'だれ', '自己紹介', 'プロフィール', 'こうぺい', 'kopei', 'あなた', 'きみ', '君', '何者', 'について'],
      a: 'ぼくはこうぺいキング（KopeiKing）！\n経営学部で経営学を学ぶ学生で、観光専門AIコンサルティング「JOURNEXIA」の代表をしているよ。旅行・鉄道系YouTuberとしても活動中！', links: [go('About を見る', '#about')] },
    { id: 'jx', q: 'JOURNEXIAって何？', keys: ['journexia', 'ジャーネクシア', '会社', '事業', 'サービス', 'コンサル', '起業', 'スタートアップ', '代表'],
      a: 'JOURNEXIAは、データ統合基盤 × AI伴走支援で、自治体・DMOの意思決定と地域の観光価値再発見を加速する観光専門AIコンサルティングだよ。\nキャッチコピーは「勘に頼る観光政策から、確信のある地域創生へ。」', links: [go('JOURNEXIA を見る', '#journexia')] },
    { id: 'why', q: 'なぜ観光にデータが必要？', keys: ['なぜ', 'なんで', '理由', '課題', '問題', '必要', 'ステークホルダー', '勘', '経験', '失敗', '損失'],
      a: '観光業には、自治体・DMO・宿泊や交通の事業者・地域住民など、たくさんのステークホルダーが関わるんだ。\nだから勘や経験に頼った施策が失敗すると、その損失は関わる全員に広がって、とても大きくなっちゃう。分断されたデータを資産に変えて、根拠のある判断をすることが大事なんだ。', links: [go('ドミノの図を見る', '#domino')] },
    { id: 'ebpm', q: 'EBPMって？', keys: ['ebpm', 'エビデンス', '根拠', '証拠', '政策立案', 'evidence'],
      a: 'EBPMは Evidence-Based Policy Making の略で、「証拠に基づく政策立案」のこと！\n勘や経験だけでなく、データや分析結果を根拠にして政策を決める考え方だよ。JOURNEXIAは観光の分野でこれを実現しようとしているんだ。', links: [go('比較表を見る', '#journexia')] },
    { id: 'how', q: 'JOURNEXIAは何をするの？', keys: ['何をする', 'なにをする', 'どうやって', '仕組み', 'データ統合', '基盤', '伴走', '柱', 'できること'],
      a: 'ふたつの柱があるよ。\n① データ統合基盤：宿泊・人流・交通・消費・口コミ・統計など、組織ごとにバラバラなデータをつないで地域の資産にする\n② AI伴走支援：分析から施策づくり、効果の検証まで、AIを使って自治体・DMOに伴走する', links: [go('Before / After の図を見る', '#dmap')] },
    { id: 'yt', q: 'YouTubeではどんな動画？', keys: ['youtube', 'ユーチューブ', '動画', 'チャンネル', '旅行', '鉄道', '電車', '旅'],
      a: '旅行・鉄道系の動画をつくっているよ🚃\n大事にしているのは「知って、行って、考えて、全力で楽しむ。」\n出発前に調べて知る → 実際に行って確かめる → 現地で考える → 自分なりに全力で楽しむ、という旅のスタイルを動画に込めているんだ。', links: [go('YouTube セクション', '#youtube'), go('チャンネルを開く ↗', 'https://youtube.com/@kopeiking_travel')] },
    { id: 'ach', q: 'これまでの実績は？', keys: ['実績', '成果', '受賞', '賞', 'プログラム', 'gci', '講座', '修了', 'ピッチ', '東大', '松尾'],
      a: '主な実績はこの3つ！\n・AI起業サマープログラム_2026：20チーム中5チームだけが選ばれるファイナルピッチに登壇\n・GCI 2026 Summer：Advanced修了＋模範賞\n・2026年 大規模言語モデル講座 1：修了\n（いずれも東京大学 松尾・岩澤研究室の講座だよ）', links: [go('Achievements を見る', '#achievements')] },
    { id: 'skill', q: 'どんなスキルがある？', keys: ['スキル', '技術', 'できる', 'python', 'プログラミング', 'ai', '機械学習', 'llm', 'sql', '得意'],
      a: '講座やプログラムで身につけたスキルはたとえば…\n・データ分析：Python / NumPy / Pandas / Matplotlib / SQL / 機械学習\n・LLM：Transformer / プロンプティング / ファインチューニング / RLHF など\n・事業づくり：課題発見・事業構想 / 仮説検証 / ビジネスモデル設計 / ピッチ', links: [go('スキルの一覧を見る', '#achievements')] },
    { id: 'study', q: '何を勉強してる？', keys: ['大学', '学部', '専攻', '専門', '勉強', '経営', '学生', 'specialty'],
      a: '経営学部で経営学を学んでいる学生だよ📊\n学生起業家として、JOURNEXIAの代表もしているんだ。', links: [go('About を見る', '#about')] },
    { id: 'contact', q: 'SNS・連絡先は？', keys: ['連絡', 'sns', 'リンク', 'github', 'フォロー', '問い合わせ', 'コンタクト', 'つながる'],
      a: 'YouTube と GitHub で活動しているよ！チャンネル登録やフォローしてくれるとうれしいな。', links: [go('YouTube ↗', 'https://youtube.com/@kopeiking_travel'), go('GitHub ↗', 'https://github.com/Kohei318318')] },
    { id: 'char', q: 'このキャラは？', keys: ['キャラ', 'イラスト', 'ねこ', '猫', 'ゾウ', '象', 'かわいい', '絵'],
      a: 'このキャラクターはぼく、こうぺいキングのイラストだよ！\nトップページのぼくを押すと、押すたびにちがうリアクションをするから試してみてね。', links: [go('トップへ戻る', '#top')] },
    { id: 'site', q: 'このサイトの遊び方', keys: ['遊び', 'サイト', '隠し', 'ひみつ', '秘密', '仕掛け', 'おもしろ', '面白'],
      a: 'いろんな仕掛けがあるよ！\n・トップのぼくを押すと10種類のリアクション\n・About のステッカーはドラッグできる\n・チケットの裏にだれか隠れてる…\n・ドミノは何回でも倒せる\n・YouTube の路線図はスクロールで電車が走る' },
    { id: 'hi', keys: ['こんにちは', 'こんばんは', 'おはよう', 'はじめまして', 'やあ', 'hello', 'hi'],
      a: 'こんにちは！こうぺいキングだよ👋\n気になることを聞いてみてね。' },
    { id: 'thx', keys: ['ありがとう', 'サンキュー', 'thanks', 'thank', '助かる', 'すごい', 'いいね'],
      a: 'どういたしまして！そう言ってもらえるとうれしいな😊' }
  ];
  const QUICK = ['who', 'jx', 'why', 'ebpm', 'yt', 'ach', 'skill', 'contact', 'site'];
  const norm = t => t.toLowerCase().replace(/[\s　？?！!。、,.]/g, '');
  const answer = text => {
    const n = norm(text);
    let best = null, score = 0;
    KB.forEach(item => {
      let s = 0;
      item.keys.forEach(k => { if (n.includes(norm(k))) s += k.length; });
      if (item.q && n === norm(item.q)) s += 100;
      if (s > score) { score = s; best = item; }
    });
    return best || {
      a: 'ごめんね、その質問にはまだ答えられないんだ…🙇\nJOURNEXIA・YouTube・実績・スキルのことなら答えられるよ！下のボタンからも選べるよ。'
    };
  };
  const scrollLog = () => { chatLog.scrollTop = chatLog.scrollHeight; };
  const addMsg = (text, who, links) => {
    const m = document.createElement('div');
    m.className = 'msg ' + who;
    m.textContent = text;
    if (links && links.length) {
      const box = document.createElement('div');
      box.className = 'msg-links';
      links.forEach(l => {
        const a = document.createElement('a');
        a.href = l.href;
        a.textContent = l.label;
        if (/^https?:/.test(l.href)) { a.target = '_blank'; a.rel = 'noopener'; }
        else a.addEventListener('click', () => { if (innerWidth < 760) closeChat(); });
        box.appendChild(a);
      });
      m.appendChild(box);
    }
    chatLog.appendChild(m);
    scrollLog();
  };
  let busy = false;
  const ask = text => {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    addMsg(text, 'me');
    const typing = document.createElement('div');
    typing.className = 'msg bot typing';
    typing.innerHTML = '<i></i><i></i><i></i>';
    chatLog.appendChild(typing);
    scrollLog();
    const res = answer(text);
    setTimeout(() => {
      typing.remove();
      addMsg(res.a, 'bot', res.links);
      busy = false;
      hop();
    }, reduce ? 0 : 500 + Math.min(900, res.a.length * 6));
  };
  chatQuick.innerHTML = '';
  QUICK.forEach(id => {
    const item = KB.find(k => k.id === id);
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.q;
    b.addEventListener('click', () => ask(item.q));
    chatQuick.appendChild(b);
  });
  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    ask(chatInput.value);
    chatInput.value = '';
  });
  let greeted = false;
  function openChat() {
    chat.hidden = false;
    requestAnimationFrame(() => chat.classList.add('open'));
    guide.classList.add('chatting', 'on');
    gBubble.classList.remove('on');
    gBtn.setAttribute('aria-expanded', 'true');
    gBtn.setAttribute('aria-label', 'チャットを閉じる');
    if (!greeted) {
      greeted = true;
      addMsg('やあ！こうぺいキングだよ👋\nぼくのことやJOURNEXIA、YouTubeのことなら何でも聞いてね。下のボタンから選んでもOK！', 'bot');
    }
    hop();
    if (fine) chatInput.focus({ preventScroll: true });
  }
  function closeChat() {
    chat.classList.remove('open');
    guide.classList.remove('chatting');
    gBtn.setAttribute('aria-expanded', 'false');
    gBtn.setAttribute('aria-label', 'こうぺいキングに質問する');
    setTimeout(() => { if (!chat.classList.contains('open')) chat.hidden = true; }, 350);
    guideVis();
  }
  $('#chatClose').addEventListener('click', () => { closeChat(); gBtn.focus(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !chat.hidden) { closeChat(); gBtn.focus(); } });
  const guideIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || !TIPS[e.target.id] || e.target.id === gSec) return;
    gSec = e.target.id; gIdx = 0;
    if (guide.classList.contains('on') && chat.hidden) { guideSay(TIPS[gSec][0] + '（押すと質問できるよ）'); hop(); }
  }), { rootMargin: '-40% 0px -55% 0px' });
  $$('main section[id]').forEach(s => guideIO.observe(s));
  function guideVis() {
    const show = !chat.hidden || (scrollY > innerHeight * .7 && !nav.classList.contains('open'));
    if (show && !guide.classList.contains('on') && gSec) setTimeout(() => guideSay(TIPS[gSec][gIdx] + '（押すと質問できるよ）'), 500);
    guide.classList.toggle('on', show);
  }
  addEventListener('scroll', guideVis, { passive: true });
  guideVis();

  /* ---------- JOURNEXIA: domino ---------- */
  const domino = $('#domino');
  $$('.dom', domino).forEach((d, i) => d.style.setProperty('--i', i));
  const topple = () => domino.classList.add('fall');
  const domIO = new IntersectionObserver(es => {
    if (es[0].isIntersecting) { setTimeout(topple, 900); domIO.disconnect(); }
  }, { threshold: .55 });
  domIO.observe(domino);
  $('#domReplay').addEventListener('click', () => {
    domino.classList.add('reset');
    domino.classList.remove('fall');
    void domino.offsetWidth;
    domino.classList.remove('reset');
    setTimeout(topple, 250);
  });

  /* ---------- JOURNEXIA: scattered data -> integrated ---------- */
  const dmap = $('#dmap');
  const dsvg = $('#dmapLines');
  const dnodes = $$('.dnode', dmap);
  const dcap = $('#dmapCap');
  const segs = $$('.seg');
  const BEFORE = [[22, 15, -10], [78, 12, 8], [17, 58, 6], [82, 54, -12], [30, 87, 10], [72, 85, -6]];
  const CAPS = {
    before: 'データが組織ごとに分断されたまま。判断は担当者の勘と経験に頼りがち。',
    after: 'データを統合してAIで分析。根拠をもって、関係者みんなで意思決定できる！'
  };
  let touched = false;
  const setState = s => {
    dmap.dataset.state = s;
    dnodes.forEach((n, i) => {
      n.style.setProperty('--i', i);
      if (s === 'after') {
        n.style.setProperty('--x', n.dataset.ax + '%');
        n.style.setProperty('--y', n.dataset.ay + '%');
        n.style.removeProperty('--rot');
      } else {
        n.style.setProperty('--x', BEFORE[i][0] + '%');
        n.style.setProperty('--y', BEFORE[i][1] + '%');
        n.style.setProperty('--rot', BEFORE[i][2] + 'deg');
      }
    });
    segs.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.s === s)));
    dcap.textContent = CAPS[s];
  };
  const layout = () => {
    const w = dmap.clientWidth, h = dmap.clientHeight;
    const rx = w < 600 ? 31 : 36, ry = 35;
    dsvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    dnodes.forEach((n, i) => {
      const a = (-90 + i * 60) * Math.PI / 180;
      n.dataset.ax = (50 + rx * Math.cos(a)).toFixed(2);
      n.dataset.ay = (50 + ry * Math.sin(a)).toFixed(2);
    });
    dsvg.innerHTML = dnodes.map((n, i) => {
      const x = n.dataset.ax / 100 * w, y = n.dataset.ay / 100 * h;
      const pts = `x1="${x}" y1="${y}" x2="${w / 2}" y2="${h / 2}"`;
      return `<line class="ln" style="--i:${i}" pathLength="1" ${pts}/><line class="flow" pathLength="1" ${pts}/>`;
    }).join('');
    setState(dmap.dataset.state);
  };
  layout();
  addEventListener('resize', layout);
  segs.forEach(b => b.addEventListener('click', () => { touched = true; setState(b.dataset.s); }));
  const mapIO = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    mapIO.disconnect();
    setTimeout(() => { if (!touched) setState('after'); }, 1800);
  }, { threshold: .5 });
  mapIO.observe(dmap);

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
