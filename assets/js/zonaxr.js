/* =========================================================
   ZONA XR — Biblioteca Tec
   Interacciones: reveal, parallax, filtros, modal, contadores
   Sin dependencias. Funciona abriendo el HTML directamente.
   ========================================================= */
(function () {
  'use strict';

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Campo de estrellas ---------- */
  function stars() {
    var host = document.querySelector('.stars');
    if (!host || calm) return;
    var n = window.innerWidth < 700 ? 44 : 92;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      var size = Math.random() < 0.18 ? 3 : Math.random() < 0.5 ? 2 : 1;
      s.style.cssText =
        'left:' + (Math.random() * 100).toFixed(2) + '%;' +
        'top:' + (Math.random() * 100).toFixed(2) + '%;' +
        'width:' + size + 'px;height:' + size + 'px;' +
        '--dur:' + (2.6 + Math.random() * 5).toFixed(2) + 's;' +
        '--delay:' + (Math.random() * 5).toFixed(2) + 's;' +
        'opacity:' + (0.25 + Math.random() * 0.6).toFixed(2);
      frag.appendChild(s);
    }
    host.appendChild(frag);
  }

  /* ---------- Aparición escalonada al hacer scroll ---------- */
  function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (calm || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var sibs = Array.prototype.slice.call(e.target.parentNode.children);
        var i = sibs.indexOf(e.target);
        e.target.style.setProperty('--d', Math.min(i, 9) * 0.055 + 's');
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Parallax del hero + estado del header ---------- */
  function parallax() {
    var bg = document.querySelector('.hero-bg');
    var bar = document.querySelector('.topbar');
    var field = document.querySelector('.stars');
    var hint = document.querySelector('.scroll-hint');
    var tick = false;

    function frame() {
      var y = window.scrollY || 0;
      if (bar) bar.classList.toggle('scrolled', y > 18);
      if (hint) hint.classList.toggle('gone', y > 90);
      if (!calm) {
        if (bg && y < window.innerHeight * 1.3) {
          bg.style.setProperty('--hero-y', (y * 0.26).toFixed(1) + 'px');
        }
        if (field) field.style.transform = 'translate3d(0,' + (y * -0.07).toFixed(1) + 'px,0)';
      }
      tick = false;
    }
    window.addEventListener('scroll', function () {
      if (!tick) { tick = true; requestAnimationFrame(frame); }
    }, { passive: true });
    frame();
  }

  /* ---------- Contadores ---------- */
  function counters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    if (calm || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.textContent = el.dataset.count; });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, end = +el.dataset.count, t0 = null, dur = 1250;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { el.textContent = '0'; io.observe(el); });
  }

  /* ---------- Luz que sigue al cursor en las tarjetas ---------- */
  function spotlight() {
    if (calm || window.matchMedia('(hover: none)').matches) return;
    document.addEventListener('pointermove', function (ev) {
      var card = ev.target.closest && ev.target.closest('.card');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
      card.style.setProperty('--my', (ev.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* La inclinación 3D de los paneles vive en zonaxr-vr.js */

  /* ---------- Buscador y filtros ---------- */
  function catalog() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
    var input = document.getElementById('q');
    var btns = Array.prototype.slice.call(document.querySelectorAll('.filters button'));
    var out = document.getElementById('count');
    var empty = document.getElementById('empty');
    var filter = 'todas';

    function strip(s) {
      return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }

    function apply() {
      var q = strip(input ? input.value.trim() : '');
      var shown = 0;
      cards.forEach(function (c) {
        var okF = filter === 'todas' || c.dataset.lic === filter;
        var okQ = !q || strip(c.dataset.search).indexOf(q) !== -1;
        var ok = okF && okQ;
        c.classList.toggle('hidden', !ok);
        if (ok) shown++;
      });
      if (out) out.innerHTML = '<b>' + shown + '</b> de ' + cards.length;
      if (empty) empty.style.display = shown ? 'none' : 'block';
    }

    if (input) {
      input.addEventListener('input', apply);
      // "/" enfoca el buscador
      document.addEventListener('keydown', function (e) {
        if (e.key === '/' && document.activeElement !== input) {
          e.preventDefault();
          input.focus();
        }
      });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        filter = b.dataset.filter;
        btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        apply();
      });
    });
    apply();
  }

  /* ---------- Modal de detalle ---------- */
  function modal() {
    var m = document.getElementById('modal');
    if (!m) return;
    var shot = m.querySelector('.modal-shot');
    var title = m.querySelector('[data-f="title"]');
    var desc = m.querySelector('[data-f="desc"]');
    var chips = m.querySelector('[data-f="chips"]');
    var meta = m.querySelector('[data-f="meta"]');
    var store = m.querySelector('[data-f="store"]');
    var last = null;

    function open(card) {
      last = card;
      var d = card.dataset;
      shot.style.backgroundImage = d.img ? 'url("' + d.img + '")' : 'none';
      title.textContent = d.name;
      desc.textContent = d.desc;

      chips.innerHTML = '';
      var lic = document.createElement('span');
      lic.className = 'chip ' + (d.lic === 'completa' ? 'lic-completa' : 'lic-demo');
      lic.textContent = 'Licencia ' + (d.lic === 'completa' ? 'completa' : 'demo');
      chips.appendChild(lic);
      (d.tags ? d.tags.split('|') : []).forEach(function (t) {
        if (!t) return;
        var s = document.createElement('span');
        s.className = 'chip';
        s.textContent = t;
        chips.appendChild(s);
      });
      if (d.rating) {
        var r = document.createElement('span');
        r.className = 'chip rating';
        r.textContent = '★ ' + d.rating + (d.reviews ? ' (' + d.reviews + ')' : '');
        chips.appendChild(r);
      }

      meta.innerHTML = '';
      [['Escuela', d.escuela],
       ['Licencia', d.lic === 'completa' ? 'Completa' : 'Demo'],
       ['Disponible en', 'Zona XR · Biblioteca']].forEach(function (p) {
        var div = document.createElement('div');
        div.innerHTML = '<small>' + p[0] + '</small><strong></strong>';
        div.querySelector('strong').textContent = p[1];
        meta.appendChild(div);
      });

      if (d.store) { store.href = d.store; store.style.display = ''; }
      else { store.style.display = 'none'; }

      m.classList.add('open');
      document.body.style.overflow = 'hidden';
      m.querySelector('.x-close').focus();
    }

    function close() {
      m.classList.remove('open');
      document.body.style.overflow = '';
      if (last) last.focus();
    }

    document.addEventListener('click', function (e) {
      var card = e.target.closest && e.target.closest('[data-name]');
      if (card && !m.contains(card)) { open(card); return; }
      if (e.target.closest && e.target.closest('.x-close')) { close(); return; }
      // Un enlace interno dentro del modal debe cerrarlo para que se vea el destino
      var jump = e.target.closest && e.target.closest('.modal a[href^="#"]');
      if (jump) { close(); return; }
      if (e.target === m) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && m.classList.contains('open')) close();
    });
  }

  /* ---------- Arranque ---------- */
  function init() {
    stars(); reveal(); parallax(); counters();
    spotlight(); catalog(); modal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
