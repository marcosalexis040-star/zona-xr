/* =========================================================
   ZONA XR — Capa "visor"
   Galaxia en 3D, HUD del visor, interfaz curva, inclinación de
   paneles y la vista de cada app como ventana holográfica.
   Se carga después de zonaxr.js. Sin dependencias.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('vr')) return;

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var acc = (getComputedStyle(root).getPropertyValue('--accent-rgb') || '139, 92, 246')
    .split(',').map(function (n) { return +n || 0; });
  var accStr = acc.join(',');

  /* Estado compartido: mirada (puntero suavizado) y velocidad de scroll */
  var gaze = { tx: 0, ty: 0, x: 0, y: 0, cx: -100, cy: -100, rx: -100, ry: -100 };
  var scroll = { y: window.scrollY || 0, v: 0 };
  var modalOpen = false;

  /* ---------- Preferencia del HUD ---------- */
  var KEY = 'zonaxr-visor';
  function hudOn() {
    try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; }
  }
  if (!hudOn()) root.classList.add('vr-off');

  /* ---------- Galaxia ---------- */
  var G = null;

  function rng(seed) {
    seed = seed % 2147483647 || 1;
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }

  function galaxy() {
    var cv = document.createElement('canvas');
    cv.className = 'galaxy';
    cv.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(cv, document.body.firstChild);
    var ctx = cv.getContext('2d');
    var W, H, neb, gal, stars = [], shoot = null, nextShoot = 3;

    // Nebulosa y Vía Láctea: se pintan una vez a media resolución
    function nebula() {
      var w = Math.ceil(W * 0.6), h = Math.ceil(H * 0.6);
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var g = c.getContext('2d');
      var R = rng(acc[0] * 7919 + acc[1] * 104729 + acc[2] * 31 + 17);
      var L = Math.hypot(w, h), i;

      var bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#070a1e');
      bg.addColorStop(0.5, '#03040e');
      bg.addColorStop(1, '#020309');
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);

      var cols = [accStr, '104,72,255', '36,92,214', '214,64,160', '24,150,206', accStr];
      function blob(x, y, r, col, a) {
        var gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(' + col + ',' + a + ')');
        gr.addColorStop(0.45, 'rgba(' + col + ',' + (a * 0.35) + ')');
        gr.addColorStop(1, 'rgba(' + col + ',0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }

      g.globalCompositeOperation = 'lighter';
      // Nebulosas sueltas
      for (i = 0; i < 7; i++) {
        blob(R() * w, R() * h, (0.16 + R() * 0.26) * Math.max(w, h), cols[(i + 2) % cols.length], 0.05 + R() * 0.06);
      }
      // Banda de la galaxia en diagonal
      g.save();
      g.translate(w / 2, h / 2);
      g.rotate(-0.42);
      for (i = 0; i < 26; i++) {
        blob((R() - 0.5) * L, (R() - 0.5) * h * 0.12, (0.06 + R() * 0.12) * L, cols[i % cols.length], 0.045 + R() * 0.05);
      }
      var bandGlow = g.createLinearGradient(0, -h * 0.2, 0, h * 0.2);
      bandGlow.addColorStop(0, 'rgba(200,190,255,0)');
      bandGlow.addColorStop(0.5, 'rgba(200,190,255,0.07)');
      bandGlow.addColorStop(1, 'rgba(200,190,255,0)');
      g.fillStyle = bandGlow;
      g.fillRect(-L / 2, -h * 0.2, L, h * 0.4);
      // Polvo de estrellas concentrado en la banda
      var dust = (w * h / 70) | 0;
      for (i = 0; i < dust; i++) {
        var gy = (R() + R() + R() - 1.5) * h * 0.13;
        var s = R() < 0.07 ? 1.3 : 0.65;
        g.fillStyle = 'rgba(255,255,255,' + (R() * 0.4).toFixed(3) + ')';
        g.fillRect((R() - 0.5) * L, gy, s, s);
      }
      // Carriles de polvo oscuro sobre la banda
      g.globalCompositeOperation = 'source-over';
      for (i = 0; i < 16; i++) {
        var dx = (R() - 0.5) * L, dy = (R() - 0.5) * h * 0.05, r = (0.03 + R() * 0.07) * L;
        var gr = g.createRadialGradient(dx, dy, 0, dx, dy, r);
        gr.addColorStop(0, 'rgba(2,3,9,0.5)');
        gr.addColorStop(1, 'rgba(2,3,9,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(dx, dy, r, 0, 7); g.fill();
      }
      g.restore();
      return c;
    }

    // Galaxia espiral lejana, girando despacio
    function spiral() {
      var S = 640, h = S / 2, c = document.createElement('canvas');
      c.width = c.height = S;
      var g = c.getContext('2d'), R = rng(4242), arms = 3;
      g.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 9000; i++) {
        var t = Math.pow(R(), 0.8);
        var a = (i % arms) * 2 * Math.PI / arms + t * 3.3 * Math.PI + (R() - 0.5) * (0.55 * (1 - t) + 0.28);
        var r = t * h * 0.95;
        var col = t < 0.22 ? '255,228,200' : (R() < 0.45 ? accStr : '150,182,255');
        g.fillStyle = 'rgba(' + col + ',' + ((0.18 + R() * 0.5) * (1 - t * 0.55)).toFixed(3) + ')';
        var s = R() < 0.035 ? 2.2 : 0.5 + R() * 1.2;
        g.fillRect(h + Math.cos(a) * r, h + Math.sin(a) * r, s, s);
      }
      var core = g.createRadialGradient(h, h, 0, h, h, S * 0.2);
      core.addColorStop(0, 'rgba(255,244,226,0.95)');
      core.addColorStop(0.18, 'rgba(255,206,170,0.4)');
      core.addColorStop(1, 'rgba(255,190,160,0)');
      g.fillStyle = core;
      g.fillRect(0, 0, S, S);
      return c;
    }

    function star(z) {
      var k = Math.random();
      return {
        x: (Math.random() * 2 - 1) * 1.15 * z,
        y: (Math.random() * 2 - 1) * 1.15 * z,
        z: z,
        c: k < 0.12 ? '255,214,170' : k < 0.3 ? '170,200,255' : k < 0.38 ? accStr : '255,255,255',
        p: Math.random() * 6.28,
        f: 0.8 + Math.random() * 2.6
      };
    }

    function build() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      neb = nebula();
      gal = gal || spiral();
      var n = Math.round(Math.min(1300, Math.max(320, W * H / 1250)));
      stars = [];
      for (var i = 0; i < n; i++) stars.push(star(0.04 + Math.random() * 0.96));
    }

    function draw(t, dt) {
      var mx = gaze.x, my = gaze.y, sy = scroll.y;
      // Al hacer scroll rápido, la nave "acelera": salto al hiperespacio
      var warp = Math.min(Math.max(Math.abs(scroll.v) - 500, 0) / 3200, 0.6);
      var speed = 0.011 + warp;

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      var nx = -W * 0.1 - mx * W * 0.025;
      var ny = -H * 0.1 - my * H * 0.025 - Math.max(-H * 0.07, Math.min(H * 0.07, sy * -0.015)) ;
      ctx.drawImage(neb, nx, ny, W * 1.2, H * 1.2);

      // Galaxia espiral
      var small = W < 700;
      var gs = Math.min(W, H) * (small ? 0.8 : 0.66);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.9;
      ctx.translate(W * (small ? 0.74 : 0.64) - mx * 22, H * (small ? 0.2 : 0.17) - my * 14 - sy * 0.04);
      ctx.rotate(-0.5);
      ctx.scale(1, 0.4);
      ctx.rotate(t * 0.018);
      ctx.drawImage(gal, -gs / 2, -gs / 2, gs, gs);
      ctx.restore();

      // Campo de estrellas en profundidad
      ctx.globalCompositeOperation = 'lighter';
      var cx = W / 2, cy = H / 2, Wm = W + 40, Hm = H + 40;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var pz = s.z;
        s.z -= speed * dt;
        var ux = s.x / s.z, uy = s.y / s.z;
        if (s.z < 0.03 || ux > 1.3 || ux < -1.3 || uy > 1.3 || uy < -1.3) {
          stars[i] = star(1);
          continue;
        }
        var near = 1 - s.z;
        // Paralaje: las estrellas cercanas se mueven más con la mirada y el scroll
        var ox = -mx * (12 + 70 * near);
        var oy = -my * (8 + 50 * near) - sy * (0.02 + 0.22 * near);
        var X = cx + ux * cx + ox, Y = cy + uy * cy + oy;
        X = ((X + 20) % Wm + Wm) % Wm - 20;
        Y = ((Y + 20) % Hm + Hm) % Hm - 20;
        var size = 0.35 + near * near * 2.4;
        var a = (0.18 + 0.82 * near) * (0.72 + 0.28 * Math.sin(t * s.f + s.p));
        if (warp > 0.05) {
          // La estela sale del desplazamiento en profundidad, no de la posición
          // en pantalla (que puede haber dado la vuelta por el borde)
          var k = Math.min(1, warp * 4) * 6;
          var ex = (ux - s.x / pz) * cx * k, ey = (uy - s.y / pz) * cy * k;
          var el = Math.hypot(ex, ey), cap = 40 + near * 140;
          if (el > cap) { ex *= cap / el; ey *= cap / el; }
          ctx.strokeStyle = 'rgba(' + s.c + ',' + (a * 0.55).toFixed(3) + ')';
          ctx.lineWidth = Math.min(size, 1.8);
          ctx.beginPath();
          ctx.moveTo(X - ex, Y - ey);
          ctx.lineTo(X, Y);
          ctx.stroke();
        } else if (size > 1.6) {
          ctx.fillStyle = 'rgba(' + s.c + ',' + (a * 0.22).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(X, Y, size * 2.2, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(X, Y, size * 0.6, 0, 7); ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')';
          ctx.fillRect(X, Y, size, size);
        }
      }

      // Estrella fugaz de vez en cuando
      if (!shoot && t > nextShoot) {
        shoot = { x: W * (0.2 + Math.random() * 0.7), y: H * Math.random() * 0.4, t0: t,
                  a: Math.PI * (0.72 + Math.random() * 0.12), l: 140 + Math.random() * 160 };
      }
      if (shoot) {
        var p = (t - shoot.t0) / 0.9;
        if (p >= 1) { shoot = null; nextShoot = t + 5 + Math.random() * 7; }
        else {
          var hx = shoot.x + Math.cos(shoot.a) * p * 520, hy = shoot.y + Math.sin(shoot.a) * p * 520;
          var tx2 = hx - Math.cos(shoot.a) * shoot.l, ty2 = hy - Math.sin(shoot.a) * shoot.l;
          var sg = ctx.createLinearGradient(hx, hy, tx2, ty2);
          sg.addColorStop(0, 'rgba(255,255,255,' + (1 - p).toFixed(3) + ')');
          sg.addColorStop(1, 'rgba(' + accStr + ',0)');
          ctx.strokeStyle = sg;
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx2, ty2); ctx.stroke();
        }
      }
    }

    build();
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { build(); if (calm) draw(0, 0); }, 160);
    });
    return { draw: draw };
  }

  /* ---------- HUD del visor ---------- */
  var hud = null;

  function visor() {
    var v = document.createElement('div');
    v.className = 'visor';
    v.setAttribute('aria-hidden', 'true');
    v.innerHTML =
      '<div class="visor-lens"></div><div class="visor-frame"></div><div class="visor-scan"></div>' +
      '<i class="vc tl"></i><i class="vc tr"></i><i class="vc bl"></i><i class="vc br"></i>' +
      '<div class="vh vh-tl"><i></i>Rastreo 6DoF activo</div>' +
      '<div class="vh vh-tr" data-h="sec"></div>' +
      '<div class="vh vh-bl" data-h="gaze"></div>' +
      '<div class="vh vh-br" data-h="depth"></div>' +
      '<div class="vh-ladder"></div>';
    document.body.appendChild(v);

    var ret = null;
    if (fine && !calm) {
      ret = document.createElement('div');
      ret.className = 'reticle';
      ret.setAttribute('aria-hidden', 'true');
      document.body.appendChild(ret);
    }

    // Botón para encender/apagar el HUD
    var wrap = document.querySelector('.topbar .wrap');
    if (wrap) {
      var b = document.createElement('button');
      b.className = 'visor-toggle';
      b.type = 'button';
      b.title = 'Mostrar u ocultar el HUD del visor';
      b.setAttribute('aria-pressed', String(!root.classList.contains('vr-off')));
      b.innerHTML = '<span class="vt-dot"></span>Visor';
      b.addEventListener('click', function () {
        var off = root.classList.toggle('vr-off');
        b.setAttribute('aria-pressed', String(!off));
        try { localStorage.setItem(KEY, off ? 'off' : 'on'); } catch (e) {}
        layoutDirty = true;
      });
      wrap.appendChild(b);
    }

    return {
      sec: v.querySelector('[data-h="sec"]'),
      gaze: v.querySelector('[data-h="gaze"]'),
      depth: v.querySelector('[data-h="depth"]'),
      ladder: v.querySelector('.vh-ladder'),
      ret: ret,
      sections: Array.prototype.slice.call(document.querySelectorAll('main > section')),
      fps: 60
    };
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function hudFrame() {
    var y = scroll.y, vh = window.innerHeight, cur = 0;
    hud.sections.forEach(function (s, i) {
      if (s.getBoundingClientRect().top <= vh * 0.5) cur = i;
    });
    hud.sec.textContent = 'Sección ' + pad(cur + 1) + ' / ' + pad(hud.sections.length);
    hud.depth.textContent = 'Prof −' + (y / 100).toFixed(1) + ' m  ·  ' + Math.round(hud.fps) + ' fps';
    hud.gaze.textContent = 'Mirada  x ' + (gaze.x >= 0 ? '+' : '−') + Math.abs(gaze.x).toFixed(2) +
                           '  y ' + (gaze.y >= 0 ? '+' : '−') + Math.abs(gaze.y).toFixed(2);
  }

  /* ---------- Interfaz curva ---------- */
  /* Cada panel se inclina según su lugar en pantalla, como si la página
     estuviera proyectada en una pantalla cilíndrica alrededor tuyo. */
  var SEL3D = '.reveal, .card, .top-card, .hub-card, .step, .school-nav a';
  var curved = [], layoutDirty = true;

  function measure() {
    curved = [];
    document.querySelectorAll(SEL3D).forEach(function (el) {
      if (el.offsetParent === null || el.closest('.hero')) return;
      var x = 0, y = 0, n = el;
      while (n) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      curved.push({ el: el, x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2, on: false });
    });
    layoutDirty = false;
  }

  function curve() {
    var vw = window.innerWidth, vh = window.innerHeight, y = scroll.y;
    var off = root.classList.contains('vr-off');
    var ky = vw < 760 ? 5 : 8, kx = vw < 760 ? 0 : 7;
    for (var i = 0; i < curved.length; i++) {
      var c = curved[i], st = c.el.style;
      var ny = (c.y - y - vh / 2) / (vh / 2);
      if (off || ny < -1.7 || ny > 1.7) {
        if (c.on) { st.removeProperty('--cyr'); st.removeProperty('--cxr'); st.removeProperty('--cz'); c.on = false; }
        continue;
      }
      ny = Math.max(-1.3, Math.min(1.3, ny));
      var nx = (c.x - vw / 2) / (vw / 2);
      st.setProperty('--cyr', (-ny * ky).toFixed(2) + 'deg');
      st.setProperty('--cxr', (nx * kx).toFixed(2) + 'deg');
      st.setProperty('--cz', (-(ny * ny * 70 + nx * nx * 50)).toFixed(1) + 'px');
      c.on = true;
    }
  }

  /* ---------- Paneles: capas holográficas e inclinación ---------- */
  var TILT = '.card, .top-card, .hub-card, .step, .school-nav a';

  function panels() {
    document.querySelectorAll(TILT).forEach(function (el) {
      el.insertAdjacentHTML('beforeend', '<span class="sheen" aria-hidden="true"></span><span class="holo" aria-hidden="true"></span>');
    });
    if (calm || !fine) return;

    var cur = null;
    function rest(el) {
      ['--rx', '--ry', '--px', '--py'].forEach(function (p) { el.style.removeProperty(p); });
    }
    document.addEventListener('pointermove', function (ev) {
      var el = ev.target.closest && ev.target.closest(TILT);
      if (el !== cur) { if (cur) rest(cur); cur = el; }
      if (!el) return;
      var r = el.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width - 0.5;
      var py = (ev.clientY - r.top) / r.height - 0.5;
      var k = el.matches('.step, .school-nav a') ? 0.55 : 1;
      el.style.setProperty('--rx', (-py * 9 * k).toFixed(2) + 'deg');
      el.style.setProperty('--ry', (px * 11 * k).toFixed(2) + 'deg');
      el.style.setProperty('--px', px.toFixed(3));
      el.style.setProperty('--py', py.toFixed(3));
    }, { passive: true });
    document.addEventListener('pointerleave', function () { if (cur) { rest(cur); cur = null; } });
  }

  /* ---------- Vista de cada app: ventana holográfica ---------- */
  function holoModal() {
    var m = document.getElementById('modal');
    if (!m) return;
    var card = m.querySelector('.modal-card');
    var frame = document.createElement('div');
    frame.className = 'holo-frame';
    card.parentNode.insertBefore(frame, card);
    frame.appendChild(card);
    frame.insertAdjacentHTML('afterbegin',
      '<div class="hf-label" aria-hidden="true"><span class="hf-name"></span><b class="hf-bar"></b><span class="hf-esc">Esc · salir</span></div>' +
      '<i class="hf-c tl" aria-hidden="true"></i><i class="hf-c tr" aria-hidden="true"></i>' +
      '<i class="hf-c bl" aria-hidden="true"></i><i class="hf-c br" aria-hidden="true"></i>' +
      '<div class="hf-beam" aria-hidden="true"></div>');

    var shot = card.querySelector('.modal-shot');
    shot.insertAdjacentHTML('afterbegin',
      '<span class="rgb r"></span><span class="rgb g"></span><span class="rgb b"></span><span class="scan"></span>');
    var layers = shot.querySelectorAll('.rgb');
    var name = frame.querySelector('.hf-name');
    var title = card.querySelector('[data-f="title"]');

    // zonaxr.js pone la portada y abre el modal; aquí solo se reparte la imagen en los canales
    new MutationObserver(function () {
      modalOpen = m.classList.contains('open');
      if (vid) vid.sync();
      if (!modalOpen) return;
      layers.forEach(function (l) { l.style.backgroundImage = shot.style.backgroundImage; });
      name.textContent = '◉ Vista de app · ' + (title ? title.textContent : '');
    }).observe(m, { attributes: true, attributeFilter: ['class'] });

    if (calm || !fine) return;
    m.addEventListener('pointermove', function (ev) {
      var px = ev.clientX / window.innerWidth - 0.5;
      var py = ev.clientY / window.innerHeight - 0.5;
      frame.style.setProperty('--mrx', (-py * 7).toFixed(2) + 'deg');
      frame.style.setProperty('--mry', (px * 9).toFixed(2) + 'deg');
      frame.style.setProperty('--mpx', px.toFixed(3));
      frame.style.setProperty('--mpy', py.toFixed(3));
    }, { passive: true });
  }

  /* ---------- Video de fondo del hero ---------- */
  /* Tráiler o gameplay de la experiencia estrella, en silencio y en bucle.
     Solo se muestra cuando de verdad está reproduciendo: si YouTube no carga
     (por ejemplo, al abrir el HTML con doble clic), queda la imagen de siempre. */
  var vid = null;

  function heroVideo() {
    var host = document.querySelector('.hero-video');
    if (!host || calm) return;
    if (navigator.connection && navigator.connection.saveData) return;
    var hero = host.closest('.hero');
    var id = host.dataset.yt, start = +host.dataset.start || 0;
    var slot = document.createElement('div');
    host.appendChild(slot);

    var ui = document.createElement('div');
    ui.className = 'hero-vid-ui';
    ui.innerHTML =
      '<span class="hv-tag"><i></i><span></span></span>' +
      '<button type="button" class="hv-btn" data-a="sound" aria-pressed="false">Sonido</button>' +
      '<button type="button" class="hv-btn" data-a="pause" aria-pressed="false">Pausa</button>';
    ui.querySelector('.hv-tag span').textContent = host.dataset.title || '';
    hero.appendChild(ui);

    var player = null, ready = false, userPaused = false, inView = true;

    function fit() {
      var w = hero.offsetWidth, h = hero.offsetHeight;
      var vw = Math.max(w, h * 16 / 9), vh = Math.max(h, w * 9 / 16);
      host.style.setProperty('--vw', Math.ceil(vw) + 'px');
      host.style.setProperty('--vh', Math.ceil(vh) + 'px');
    }
    fit();
    window.addEventListener('resize', fit);

    function sync() {
      if (!ready) return;
      if (userPaused || !inView || modalOpen) player.pauseVideo();
      else player.playVideo();
    }

    ui.addEventListener('click', function (e) {
      var b = e.target.closest('.hv-btn');
      if (!b || !ready) return;
      if (b.dataset.a === 'sound') {
        var on = player.isMuted();
        if (on) { player.unMute(); player.setVolume(70); } else { player.mute(); }
        b.setAttribute('aria-pressed', String(on));
      } else {
        userPaused = !userPaused;
        b.setAttribute('aria-pressed', String(userPaused));
        b.textContent = userPaused ? 'Reproducir' : 'Pausa';
        sync();
      }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        sync();
      }).observe(hero);
    }

    function make() {
      var vars = {
        autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3,
        modestbranding: 1, playsinline: 1, rel: 0, start: start, loop: 1, playlist: id
      };
      if (/^https?:$/.test(location.protocol)) vars.origin = location.origin;
      player = new YT.Player(slot, {
        videoId: id,
        host: 'https://www.youtube-nocookie.com',
        playerVars: vars,
        events: {
          onReady: function (e) {
            ready = true;
            e.target.mute();
            var f = e.target.getIframe();
            f.setAttribute('tabindex', '-1');
            f.setAttribute('aria-hidden', 'true');
            f.title = host.dataset.title || 'Video de fondo';
            sync();
          },
          onStateChange: function (e) {
            if (e.data === 1) hero.classList.add('has-video');
            if (e.data === 0) { player.seekTo(start, true); sync(); }
          }
        }
      });
    }

    if (window.YT && window.YT.Player) { make(); }
    else {
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) prev(); make(); };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      document.head.appendChild(s);
    }

    vid = { sync: sync };
  }

  /* ---------- Transición entre páginas: cerrar el iris ---------- */
  function leave() {
    if (calm) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      var href = a.getAttribute('href');
      if (!/^[\w.-]+\.html(#.*)?$/.test(href)) return;
      e.preventDefault();
      root.classList.add('vr-leave');
      setTimeout(function () { window.location.href = href; }, 400);
    });
    window.addEventListener('pageshow', function () { root.classList.remove('vr-leave'); });
  }

  /* ---------- Bucle principal ---------- */
  function loop() {
    var hero = document.querySelector('.hero');
    var last = performance.now(), t = 0, n = 0, lastScroll = -1;

    window.addEventListener('pointermove', function (ev) {
      if (ev.pointerType !== 'mouse') return;
      gaze.tx = ev.clientX / window.innerWidth * 2 - 1;
      gaze.ty = ev.clientY / window.innerHeight * 2 - 1;
      gaze.rx = ev.clientX; gaze.ry = ev.clientY;
      if (hud.ret) {
        hud.ret.classList.add('on');
        var hot = ev.target.closest && ev.target.closest('a, button, [role="button"], input');
        hud.ret.classList.toggle('hot', !!hot);
      }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { if (hud.ret) hud.ret.classList.remove('on'); });

    window.addEventListener('resize', function () { layoutDirty = true; });
    window.addEventListener('load', function () { layoutDirty = true; });
    // El buscador y los filtros cambian qué tarjetas existen: volver a medir
    var q = document.getElementById('q');
    if (q) q.addEventListener('input', function () { layoutDirty = true; });
    document.querySelectorAll('.filters button').forEach(function (b) {
      b.addEventListener('click', function () { layoutDirty = true; });
    });

    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now; t += dt; n++;
      hud.fps += ((dt > 0 ? 1 / dt : 60) - hud.fps) * 0.05;

      // Sin ratón, la mirada deriva sola un poco
      if (!fine) { gaze.tx = Math.sin(t * 0.13) * 0.5; gaze.ty = Math.cos(t * 0.1) * 0.35; }
      gaze.x += (gaze.tx - gaze.x) * 0.06;
      gaze.y += (gaze.ty - gaze.y) * 0.06;

      var y = window.scrollY || 0;
      var v = dt > 0 ? (y - scroll.y) / dt : 0;
      scroll.v += (v - scroll.v) * 0.2;
      scroll.y = y;

      if (!modalOpen) G.draw(t, dt);

      if (hero) {
        hero.style.setProperty('--hx', gaze.x.toFixed(3));
        hero.style.setProperty('--hy', gaze.y.toFixed(3));
      }
      if (layoutDirty) { measure(); lastScroll = -1; }
      if (y !== lastScroll) { curve(); lastScroll = y; }

      if (hud.ret) {
        gaze.cx += (gaze.rx - gaze.cx) * 0.3;
        gaze.cy += (gaze.ry - gaze.cy) * 0.3;
        hud.ret.style.transform = 'translate3d(' + gaze.cx.toFixed(1) + 'px,' + gaze.cy.toFixed(1) + 'px,0)';
      }
      hud.ladder.style.setProperty('--ladder', (-y * 0.25).toFixed(1) + 'px');
      if (n % 8 === 0) hudFrame();

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Arranque ---------- */
  function init() {
    G = galaxy();
    hud = visor();
    panels();
    holoModal();
    heroVideo();
    leave();
    if (calm) {
      G.draw(0, 0);
      measure(); curve(); hudFrame();
      return;
    }
    loop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
