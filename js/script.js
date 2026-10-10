/* =========================================================
   FARM PULSE — R26-IT-068
   Main JavaScript — vanilla, no frameworks.
   Every page still shows all content without it.
   ========================================================= */

(function () {
  'use strict';

  /* EDIT: project email used by the contact form */
  var CONTACT_EMAIL = 'farmpulse.project@example.com';

  // "" on the home page, "../" on pages/*.html (set via <body data-root>)
  var ROOT = document.body.getAttribute('data-root') || '';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    applyDocumentLinks();
    initClock();
    initDock();
    initSpotlight();
    initPinnedStages();
    initHeroCanvas();
    initRevealObserver();
    initPageTransitions();
    initScrollSpy();
    initMilestones();
    initProfiles();
    initContactForm();
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  /* --- OneDrive links (configured in js/links.js) ----------- */
  function applyDocumentLinks() {
    var cfg = window.FARM_PULSE_LINKS || {};
    var docs = cfg.docs || {};
    var folder = cfg.folder;

    // "Open full folder" buttons
    if (folder) {
      document.querySelectorAll('[data-folder-link]').forEach(function (a) { a.href = folder; });
    }

    // Available items: use the direct file link when one is set, otherwise the folder
    document.querySelectorAll('a[data-doc]').forEach(function (a) {
      var url = docs[a.getAttribute('data-doc')];
      if (url) a.href = url;
      else if (folder) a.href = folder;
    });

    // Coming-soon items become live as soon as a link is added in links.js
    document.querySelectorAll('[data-doc-soon]').forEach(function (el) {
      var url = docs[el.getAttribute('data-doc-soon')];
      if (!url) return;
      var a = document.createElement('a');
      a.className = el.className.replace(/\bdisabled\b/, '').trim();
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = el.getAttribute('data-label') || 'Open in OneDrive ↗';
      el.parentNode.replaceChild(a, el);

      var tile = a.closest('.doc-tile');
      var row = a.closest('li');
      var chipScope = row && row.querySelector('.status-chip') ? row : tile;
      var chip = chipScope && chipScope.querySelector('.status-chip');
      if (chip) { chip.className = 'status-chip available'; chip.textContent = 'Available'; }
      if (tile && !tile.querySelector('[data-doc-soon]')) tile.classList.remove('is-soon');
    });

    // Single-file tiles: clicking anywhere on the card opens that file directly
    document.querySelectorAll('.doc-tile:not(.is-soon)').forEach(function (tile) {
      var links = tile.querySelectorAll('.doc-actions a[href]');
      if (links.length !== 1) return;
      var link = links[0];
      tile.classList.add('is-link');
      tile.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        window.open(link.href, '_blank', 'noopener');
      });
    });

    // Library summary ("3 of 5 available")
    document.querySelectorAll('[data-library-summary]').forEach(function (out) {
      var grid = document.getElementById(out.getAttribute('data-library-summary'));
      if (!grid) return;
      var tiles = grid.querySelectorAll('.doc-tile');
      var live = grid.querySelectorAll('.doc-tile:not(.is-soon)').length;
      out.innerHTML = '<strong>' + live + ' of ' + tiles.length + '</strong> available now · opens in OneDrive';
    });
  }

  /* --- Live clock ------------------------------------------- */
  function initClock() {
    var el = document.getElementById('nav-clock');
    if (!el) return;
    var tick = function () {
      el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* --- Dock magnification ----------------------------------- */
  function initDock() {
    var dock = document.querySelector('.dock');
    var items = Array.prototype.slice.call(document.querySelectorAll('.dock-item'));
    if (!dock || !items.length || prefersReduced) return;

    var base = 48, max = 70, influence = 170;
    var desktop = window.matchMedia('(min-width: 769px) and (hover: hover)');
    var state = items.map(function () { return { cur: base, tgt: base }; });
    var running = false;

    dock.addEventListener('mousemove', function (e) {
      if (!desktop.matches) return;
      items.forEach(function (item, i) {
        var r = item.getBoundingClientRect();
        var d = Math.abs(e.clientX - (r.left + r.width / 2));
        state[i].tgt = d < influence ? base + (max - base) * (1 - d / influence) : base;
      });
      start();
    });
    dock.addEventListener('mouseleave', function () {
      state.forEach(function (s) { s.tgt = base; });
      start();
    });
    desktop.addEventListener && desktop.addEventListener('change', function () {
      items.forEach(function (item) { item.style.width = item.style.height = ''; });
    });

    function start() { if (!running) { running = true; requestAnimationFrame(tick); } }
    function tick() {
      var moving = false;
      items.forEach(function (item, i) {
        var s = state[i];
        s.cur += (s.tgt - s.cur) * 0.2;
        if (Math.abs(s.tgt - s.cur) < 0.3) s.cur = s.tgt; else moving = true;
        if (desktop.matches) item.style.width = item.style.height = s.cur + 'px';
      });
      if (moving) requestAnimationFrame(tick); else running = false;
    }
  }

  /* --- Spotlight search (Ctrl/⌘ + K) ----------------------- */
  function initSpotlight() {
    var overlay = document.querySelector('.spotlight-overlay');
    var input = document.querySelector('.spotlight-input');
    var results = document.querySelector('.spotlight-results');
    if (!overlay || !input || !results) return;
    var lastFocus = null;

    var P = ROOT ? '' : 'pages/';          // path to pages/ from current page
    var H = ROOT + 'index.html';
    var index = [
      { t: 'Home', c: 'Page', b: 'badge-page', d: 'Farm Pulse overview, research components and team.', k: 'home landing farm pulse r26-it-068 sliit', u: H },
      { t: 'Domain & Literature', c: 'Page', b: 'badge-page', d: 'Literature survey, research gap, problem, objectives, methodology and technologies.', k: 'domain literature survey gap problem objectives methodology', u: P + 'domain.html' },
      { t: 'Milestones', c: 'Page', b: 'badge-page', d: 'Assessment timeline: proposal, progress presentations, final assessment and viva.', k: 'milestones timeline assessment marks progress viva', u: P + 'milestones.html' },
      { t: 'Documents', c: 'Page', b: 'badge-page', d: 'Proposals, charter, checklists and final reports — opened from OneDrive.', k: 'documents proposals reports pdf onedrive charter checklist', u: P + 'documents.html' },
      { t: 'Presentations & Slides', c: 'Page', b: 'badge-page', d: 'Proposal, PP1, PP2 and final presentation decks — opened from OneDrive.', k: 'slides presentations pptx decks pp1 pp2 onedrive', u: P + 'slides.html' },
      { t: 'About Us — Research Team', c: 'Page', b: 'badge-page', d: 'Team members, roles and supervisors.', k: 'about team members supervisors', u: P + 'about.html' },
      { t: 'Contact', c: 'Page', b: 'badge-page', d: 'Get in touch with the research team.', k: 'contact email message', u: P + 'contact.html' },

      { t: 'Chamindu Athukorala', c: 'Team', b: 'badge-team', d: 'IT22139962 • Smart Chicken Behavior Alert System', k: 'chamindu athukorala it22139962 cctv chicken behaviour behavior abnormal alert notification', u: P + 'about.html#IT22139962' },
      { t: 'Dewmini Sankalpana', c: 'Team', b: 'badge-team', d: 'IT22540058 • Egg Quality & Yield Prediction', k: 'dewmini sankalpana it22540058 egg grading quality weight load cell cnn', u: P + 'about.html#IT22540058' },
      { t: 'Hashani Dharmarathna', c: 'Team', b: 'badge-team', d: 'IT22220660 • Snake & Scorpion Detection', k: 'hashani dharmarathna it22220660 snake scorpion intruder detection yolo nir uv', u: P + 'about.html#IT22220660' },
      { t: 'Kaveesha Devindi', c: 'Team', b: 'badge-team', d: 'IT22196842 • Poultry Disease Detection', k: 'kaveesha devindi kulasuriya it22196842 disease detection fecal mobilevit grad-cam', u: P + 'about.html#IT22196842' },
      { t: 'Dilani Lunugalage', c: 'Supervisor', b: 'badge-supervisor', d: 'Supervisor • Department of Software Engineering', k: 'dilani lunugalage supervisor', u: P + 'about.html#supervision' },
      { t: 'Poorna Panduwawala', c: 'Supervisor', b: 'badge-supervisor', d: 'Co-Supervisor • Department of Information Technology', k: 'poorna panduwawala co-supervisor', u: P + 'about.html#supervision' },

      { t: 'Research Proposals (×4)', c: 'Document', b: 'badge-docs', d: 'Individual research proposals for each component.', k: 'proposal document pdf onedrive', u: P + 'documents.html#proposals' },
      { t: 'Proposal — Smart Chicken Behavior Alert System', c: 'Document', b: 'badge-docs', d: 'Chamindu Athukorala (IT22139962)', k: 'proposal cctv chicken behaviour behavior alert', u: P + 'documents.html#proposals' },
      { t: 'Proposal — Dual-Stream Poultry Disease Detection', c: 'Document', b: 'badge-docs', d: 'Kaveesha Devindi (IT22196842)', k: 'proposal disease detection deep learning', u: P + 'documents.html#proposals' },
      { t: 'Proposal — Egg Quality & Yield Predictor', c: 'Document', b: 'badge-docs', d: 'Dewmini Sankalpana (IT22540058)', k: 'proposal egg grading quality', u: P + 'documents.html#proposals' },
      { t: 'Proposal — Snake & Scorpion Detection', c: 'Document', b: 'badge-docs', d: 'Hashani Dharmarathna (IT22220660)', k: 'proposal snake scorpion intruder', u: P + 'documents.html#proposals' },
      { t: 'Project Charter', c: 'Document', b: 'badge-docs', d: 'Project scope, stakeholders and plan.', k: 'charter document scope', u: P + 'documents.html' },
      { t: 'Final Research Document', c: 'Document', b: 'badge-docs', d: 'Complete group research report.', k: 'final report thesis document', u: P + 'documents.html' },
      { t: 'Proposal Presentation', c: 'Slides', b: 'badge-slides', d: 'Research proposal presentation deck.', k: 'proposal presentation slides pptx', u: P + 'slides.html' },
      { t: 'Progress Presentation 1 (PP1)', c: 'Slides', b: 'badge-slides', d: 'First progress review deck.', k: 'pp1 progress presentation 1 slides', u: P + 'slides.html' },
      { t: 'Progress Presentation 2 (PP2)', c: 'Slides', b: 'badge-slides', d: 'Second progress review deck.', k: 'pp2 progress presentation 2 slides', u: P + 'slides.html' },
      { t: 'Final Presentation', c: 'Slides', b: 'badge-slides', d: 'Final demonstration and summary.', k: 'final presentation defense viva slides', u: P + 'slides.html' },

      { t: 'Research Gap', c: 'Research', b: 'badge-research', d: 'Why continuous, integrated poultry monitoring is still needed.', k: 'research gap limitations', u: P + 'domain.html#gap' },
      { t: 'Research Objectives', c: 'Research', b: 'badge-research', d: 'Main and specific objectives of Farm Pulse.', k: 'objectives aims goals', u: P + 'domain.html#objectives' },
      { t: 'Methodology', c: 'Research', b: 'badge-research', d: 'Data collection → processing → AI analysis → evaluation → notification.', k: 'methodology pipeline approach', u: P + 'domain.html#methodology' },
      { t: 'Technologies', c: 'Research', b: 'badge-research', d: 'Python, TensorFlow, OpenCV, YOLO, MobileViT, CCTV, Raspberry Pi, Android.', k: 'technologies python computer vision machine learning cctv sensors yolo', u: P + 'domain.html#technologies' }
    ];

    var sel = 0;

    function highlight(text, q) {
      var safe = escapeHtml(text);
      var terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (!terms.length) return safe;
      var pattern = terms.map(function (t) { return escapeHtml(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|');
      return safe.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark class="spotlight-mark">$1</mark>');
    }

    function item(it, q, selected) {
      return '<a class="spotlight-result-item' + (selected ? ' selected' : '') + '" href="' + it.u + '" role="option">' +
        '<div class="spotlight-item-header"><span class="spotlight-item-title">' + highlight(it.t, q) + '</span>' +
        '<span class="spotlight-badge ' + it.b + '">' + escapeHtml(it.c) + '</span></div>' +
        '<div class="spotlight-item-desc">' + highlight(it.d, q) + '</div></a>';
    }

    function render(q) {
      var terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
      sel = 0;
      if (!terms.length) {
        results.innerHTML = '<div class="spotlight-header-label">Quick navigation</div>' +
          index.slice(0, 7).map(function (it, i) { return item(it, '', i === 0); }).join('');
        return;
      }
      var matched = index.map(function (it) {
        var hay = { t: it.t.toLowerCase(), d: it.d.toLowerCase(), k: it.k.toLowerCase(), c: it.c.toLowerCase() };
        var all = terms.every(function (t) { return hay.t.indexOf(t) > -1 || hay.d.indexOf(t) > -1 || hay.k.indexOf(t) > -1 || hay.c.indexOf(t) > -1; });
        if (!all) return null;
        var s = 0;
        terms.forEach(function (t) {
          if (hay.t.indexOf(t) > -1) s += 20;
          if (hay.k.indexOf(t) > -1) s += 15;
          if (hay.c.indexOf(t) > -1) s += 10;
          if (hay.d.indexOf(t) > -1) s += 5;
        });
        if (hay.t.indexOf(terms.join(' ')) === 0) s += 60;
        return { it: it, s: s };
      }).filter(Boolean).sort(function (a, b) { return b.s - a.s; });

      if (!matched.length) {
        results.innerHTML = '<div class="spotlight-empty">No results for “<strong>' + escapeHtml(q) + '</strong>”' +
          '<div class="spotlight-tags">' + ['Proposal', 'PP1', 'Egg', 'Snake', 'Team', 'Objectives'].map(function (t) {
            return '<button type="button" class="spotlight-tag" data-q="' + t + '">' + t + '</button>';
          }).join('') + '</div></div>';
        return;
      }
      results.innerHTML = '<div class="spotlight-header-label">' + matched.length + ' result' + (matched.length === 1 ? '' : 's') + '</div>' +
        matched.map(function (m, i) { return item(m.it, q, i === 0); }).join('');
    }

    function open() {
      lastFocus = document.activeElement;
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      input.value = '';
      render('');
      setTimeout(function () { input.focus(); }, 50);
    }
    function close() {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function hilite(items) {
      items.forEach(function (el, i) { el.classList.toggle('selected', i === sel); });
      if (items[sel]) items[sel].scrollIntoView({ block: 'nearest' });
    }

    document.querySelectorAll('.search-btn').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    results.addEventListener('click', function (e) {
      var tag = e.target.closest('.spotlight-tag');
      if (tag) { input.value = tag.getAttribute('data-q'); render(input.value); input.focus(); return; }
      if (e.target.closest('.spotlight-result-item')) close();
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        overlay.classList.contains('active') ? close() : open();
      } else if (e.key === 'Escape' && overlay.classList.contains('active')) {
        close();
      }
    });
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(results.querySelectorAll('.spotlight-result-item'));
      if (!items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % items.length; hilite(items); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; hilite(items); }
      else if (e.key === 'Enter') { e.preventDefault(); close(); window.location.href = (items[sel] || items[0]).href; }
    });
  }

  /* --- Home: scroll-pinned stages --------------------------- */
  function initPinnedStages() {
    var stages = document.querySelectorAll('.pinned-stage');
    if (!stages.length) return;
    var ticking = false;

    function progress(stage) {
      var rect = stage.getBoundingClientRect();
      var travel = rect.height - window.innerHeight;
      if (travel <= 0) return 0;
      return Math.max(0, Math.min(1, -rect.top / travel));
    }

    function update() {
      ticking = false;
      stages.forEach(function (stage) {
        var p = progress(stage);

        if (stage.id === 'stage-hero') {
          var wm = stage.querySelector('.poster-container');
          var st = stage.querySelector('.poster-statement');
          var hint = stage.querySelector('.scroll-hint');
          if (prefersReduced) { if (st) st.style.opacity = p > 0.4 ? 1 : 0; if (wm) wm.style.opacity = p > 0.4 ? 0 : 1; return; }
          if (wm) { wm.style.transform = 'scale(' + (1 - p * 0.35) + ')'; wm.style.opacity = Math.max(0, 1 - p * 2.2); }
          if (st) st.style.opacity = p > 0.4 ? Math.min(1, (p - 0.4) * 3) : 0;
          if (hint) hint.style.opacity = Math.max(0, 1 - p * 6);
          stage.querySelectorAll('.metadata-left,.metadata-right').forEach(function (m) { m.style.opacity = Math.max(0, 0.6 - p * 1.8); });
        }

        if (stage.id === 'stage-ladder') {
          var rows = stage.querySelectorAll('.ladder-row');
          var i = Math.min(Math.floor(p * rows.length), rows.length - 1);
          rows.forEach(function (row, n) { row.classList.toggle('active', n <= i); row.classList.toggle('current', n === i); });
          var num = stage.querySelector('#ladder-num');
          if (num) num.innerHTML = '0<span class="text-orange">' + (i + 1) + '</span>';
          var cap = stage.querySelector('#ladder-caption');
          if (cap && rows[i]) cap.textContent = rows[i].getAttribute('data-short') || '';
          var meter = stage.querySelector('.progress-meter');
          if (meter) meter.style.width = (p * 100) + '%';
        }

        if (stage.id === 'stage-mission') {
          var h = stage.querySelector('.masked-headline');
          if (h && !prefersReduced) {
            var edge = (p * 1.6 - 0.1) * 100;
            var mask = 'linear-gradient(180deg,#000 ' + edge + '%,transparent ' + (edge + 14) + '%)';
            h.style.webkitMaskImage = mask;
            h.style.maskImage = mask;
          }
        }

        if (stage.id === 'stage-team') {
          var wmc = stage.querySelector('.team-watermark');
          var main = stage.querySelector('.team-wm-main');
          var sub = stage.querySelector('.team-wm-sub');
          var ss = stage.querySelector('.slideshow-bg');
          if (!wmc) return;
          var scale = 1, y = 0, oMain = 0.15, oSub = 0, oSs = 1;
          if (p > 0.3) {
            var m = Math.min(1, (p - 0.3) * 2.5);
            scale = 1 - m * 0.65; y = m * -85; oMain = 0.15 + m * 0.85; oSub = m; oSs = 1 - m * 2;
          }
          wmc.style.transform = 'translate(-50%, calc(-50% + ' + y + 'vh)) scale(' + scale + ')';
          if (main) main.style.opacity = oMain;
          if (sub) sub.style.opacity = oSub;
          if (ss) ss.style.opacity = Math.max(0, oSs);
        }
      });
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* --- Hero canvas: animated "farm pulse" heartbeat line ---- */
  function initHeroCanvas() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var w, h, dpr, pts = [], t0 = performance.now(), visible = true;

    // Heartbeat shape sampled over one beat (0..1) → vertical offset
    function beat(x) {
      if (x < 0.30) return 0;
      if (x < 0.34) return -0.10 * Math.sin((x - 0.30) / 0.04 * Math.PI);
      if (x < 0.38) return 0;
      if (x < 0.41) return 0.12 * ((x - 0.38) / 0.03);
      if (x < 0.45) return 0.12 - 1.12 * ((x - 0.41) / 0.04);
      if (x < 0.49) return -1 + 1.25 * ((x - 0.45) / 0.04);
      if (x < 0.52) return 0.25 - 0.25 * ((x - 0.49) / 0.03);
      if (x < 0.62) return 0;
      if (x < 0.72) return -0.18 * Math.sin((x - 0.62) / 0.10 * Math.PI);
      return 0;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = [];
      var n = Math.round(w * h / 22000);
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + 0.3, s: Math.random() * 0.25 + 0.05 });
    }

    function drawLine(t, yBase, amp, period, speed, color, width, blur) {
      ctx.beginPath();
      for (var x = 0; x <= w; x += 2) {
        var phase = ((x / period) - t * speed) % 1;
        if (phase < 0) phase += 1;
        var y = yBase + beat(phase) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function frame(now) {
      if (!visible) return;
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      // drifting dust
      pts.forEach(function (p) {
        p.y -= p.s; if (p.y < -2) { p.y = h + 2; p.x = Math.random() * w; }
        ctx.fillStyle = 'rgba(155,227,107,' + (0.15 + p.r * 0.15) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });

      var period = Math.max(420, w * 0.55);
      var amp = Math.min(h * 0.22, 170);
      drawLine(t, h * 0.56, amp * 0.55, period * 0.8, 0.18, 'rgba(242,140,40,0.25)', 1.2, 8);
      drawLine(t, h * 0.52, amp, period, 0.25, 'rgba(155,227,107,0.55)', 2, 18);

      if (!prefersReduced) requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        var was = visible; visible = e[0].isIntersecting;
        if (visible && !was) requestAnimationFrame(frame);
      }).observe(canvas);
    }
    requestAnimationFrame(frame);
  }

  /* --- Reveal on scroll ------------------------------------- */
  function initRevealObserver() {
    var els = document.querySelectorAll('[data-rev]');
    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('revealed'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = parseInt(entry.target.getAttribute('data-rev') || '0', 10);
        setTimeout(function () { entry.target.classList.add('revealed'); }, delay);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* --- macOS-style page transitions from the dock ---------- */
  function initPageTransitions() {
    document.querySelectorAll('.dock-item[href]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        if (link.classList.contains('active')) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        var url = link.href;
        if (prefersReduced) { window.location.href = url; return; }
        link.classList.add('dock-bounce');
        var main = document.querySelector('main');
        if (main) main.classList.add('tab-exit');
        setTimeout(function () { window.location.href = url; }, 350);
      });
    });
    // Restore page if it is shown again from the back/forward cache
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      var main = document.querySelector('main');
      if (main) main.classList.remove('tab-exit');
      document.querySelectorAll('.dock-bounce').forEach(function (el) { el.classList.remove('dock-bounce'); });
    });
  }

  /* --- Domain page: sidebar scroll-spy ---------------------- */
  function initScrollSpy() {
    var links = document.querySelectorAll('.spy-link');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (l) { map[l.getAttribute('href').slice(1)] = l; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('active'); });
        var l = map[entry.target.id];
        if (l) l.classList.add('active');
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  /* --- Milestones: inspector + glowing timeline ------------- */
  function initMilestones() {
    var select = document.getElementById('milestone-select');
    var out = document.getElementById('milestone-detail');
    var tl = document.querySelector('.winding-timeline');

    if (select && out) {
      var show = function (id) {
        var node = document.getElementById(id);
        if (!node) return;
        document.querySelectorAll('.wt-node').forEach(function (n) { n.classList.toggle('is-selected', n === node); });
        var desc = node.querySelector('.wt-desc');
        var chip = node.querySelector('.status-chip');
        var actions = node.querySelector('.wt-actions');
        var feedback = node.querySelector('.wt-feedback');
        out.innerHTML =
          '<h3>' + escapeHtml(node.getAttribute('data-title')) + '</h3>' +
          '<p>' + escapeHtml(desc ? desc.textContent : '') + '</p>' +
          '<div class="inspect-meta">' +
            '<div><span>Date</span><strong>' + escapeHtml(node.getAttribute('data-date')) + '</strong></div>' +
            '<div><span>Marks</span><strong>' + escapeHtml(node.getAttribute('data-marks')) + '</strong></div>' +
            '<div><span>Status</span><strong>' + (chip ? chip.outerHTML : '') + '</strong></div>' +
          '</div>' +
          (feedback ? feedback.outerHTML : '') +
          (actions ? '<div class="inspect-actions">' + actions.innerHTML + '</div>' : '');
      };
      select.addEventListener('change', function () {
        show(select.value);
        var n = document.getElementById(select.value);
        if (n) n.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
      });
      show(select.value);
    }

    if (tl) {
      var fill = tl.querySelector('.wt-fill');
      var nodes = tl.querySelectorAll('.wt-node');
      var ticking = false;
      var update = function () {
        ticking = false;
        var r = tl.getBoundingClientRect();
        var mark = window.innerHeight * 0.6;
        var p = Math.max(0, Math.min(1, (mark - r.top) / r.height));
        if (fill) fill.style.height = (p * 100) + '%';
        nodes.forEach(function (n) {
          var dot = n.querySelector('.wt-dot').getBoundingClientRect();
          n.classList.toggle('lit', dot.top < mark);
        });
      };
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      window.addEventListener('resize', update);
      update();
    }
  }

  /* --- About: expandable profile cards ---------------------- */
  function initProfiles() {
    var overlay = document.getElementById('profile-overlay');
    if (!overlay) return;
    var body = overlay.querySelector('.profile-body');
    var closeBtn = overlay.querySelector('.close-profile-btn');
    var lastCard = null;

    function open(card) {
      lastCard = card;
      var tpl = card.querySelector('template');
      body.innerHTML = '';
      if (tpl) body.appendChild(tpl.content.cloneNode(true));
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function close() {
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastCard) lastCard.focus();
    }

    document.querySelectorAll('.profile-card[data-profile]').forEach(function (card) {
      card.addEventListener('click', function () { open(card); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
      });
    });
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('show')) close(); });

    // Deep link: about.html#IT22139962 opens that member's profile
    var hash = decodeURIComponent(location.hash.slice(1));
    var target = hash && document.getElementById(hash);
    if (target && target.matches('.profile-card[data-profile]')) setTimeout(function () { open(target); }, 500);
  }

  /* --- Contact form: validation + mailto -------------------- */
  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var status = document.getElementById('form-status');
    var rules = {
      'cf-name':    function (v) { return v.length >= 2 ? '' : 'Please enter your full name.'; },
      'cf-email':   function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Please enter a valid email address.'; },
      'cf-subject': function (v) { return v.length >= 3 ? '' : 'Please enter a subject.'; },
      'cf-message': function (v) { return v.length >= 10 ? '' : 'Please write a message (at least 10 characters).'; }
    };

    function validate(id) {
      var input = document.getElementById(id);
      var msg = rules[id](input.value.trim());
      input.closest('.field').classList.toggle('has-error', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      document.getElementById(id + '-err').textContent = msg;
      return !msg;
    }

    Object.keys(rules).forEach(function (id) {
      var input = document.getElementById(id);
      input.addEventListener('blur', function () { if (input.value) validate(id); });
      input.addEventListener('input', function () { if (input.closest('.field').classList.contains('has-error')) validate(id); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (id) { if (!validate(id) && !firstBad) firstBad = document.getElementById(id); });
      if (firstBad) {
        status.classList.add('is-error');
        status.textContent = 'Please correct the highlighted fields.';
        firstBad.focus();
        return;
      }
      var v = function (id) { return document.getElementById(id).value.trim(); };
      var body = v('cf-message') + '\n\n— ' + v('cf-name') + ' (' + v('cf-email') + ')';
      window.location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent('[Farm Pulse] ' + v('cf-subject')) +
        '&body=' + encodeURIComponent(body);
      status.classList.remove('is-error');
      status.textContent = 'Your email app should now open with this message prepared. Nothing is sent until you press send there.';
    });
  }
})();
