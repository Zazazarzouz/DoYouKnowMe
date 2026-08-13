/* ═══════════════════════════════════════
   APP.JS — Tu me connais ? v2
   Dépend de : data.js (QDB, T)
═══════════════════════════════════════ */

/* ── ÉTAT GLOBAL ── */
var S = {
  lang: 'fr',
  theme: 'light',
  mode: 'friends',
  qty: 10,
  spicy: false,
  intensity: 'fun',   // 'fun' | 'hot'
  useTimer: true,
  p1name: '',
  p2name: '',
  pool: [],           // questions de la partie
  p1answers: [],
  p2answers: [],
  current: 0,
  score: 0,
  skipped: 0,
  timerInt: null,
  timeLeft: 30,
  isP2: false,
  customPool: null    // si quiz builder utilisé
};

/* ── HELPERS ── */
function t(k) { return T[S.lang][k]; }
function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function $(id) { return document.getElementById(id); }

function showPage(id) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  $(id).classList.add('active');
  window.scrollTo(0, 0);
}

/* ── THÈME ── */
function toggleTheme() {
  S.theme = S.theme === 'light' ? 'dark' : 'light';
  document.getElementById('html-root').setAttribute('data-theme', S.theme);
  $('theme-btn').textContent = S.theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('tmcTheme', S.theme);
}

/* ── LANGUE ── */
function setLang(l) {
  S.lang = l;
  document.getElementById('html-root').lang = l;
  $('lb-fr').classList.toggle('on', l === 'fr');
  $('lb-en').classList.toggle('on', l === 'en');
  if (!S.isP2) renderHome();
}

/* ══════════════════════════════════════
   PAGE ACCUEIL
══════════════════════════════════════ */
function renderHome() {
  $('t-logo').textContent = t('logo');
  $('t-tag').textContent = t('tag');
  $('t-h1').innerHTML = t('h1');
  $('t-sub').textContent = t('sub');
  $('t-mode-label').textContent = t('modeLabel');
  $('t-format-label').textContent = t('formatLabel');
  $('t-spicy-label').textContent = t('spicyLabel');
  $('t-spicy-sub').textContent = t('spicySub');
  $('t-timer-label').textContent = t('timerLabel');
  $('t-timer-sub').textContent = t('timerSub');
  $('t-name-label').textContent = t('nameLabel');
  $('p1-name').placeholder = t('namePh');
  $('t-start-btn').textContent = t('startBtn');
  $('t-builder-btn').textContent = t('builderBtn');

  // Modes
  var mg = $('mode-grid');
  mg.innerHTML = '';
  t('modes').forEach(function(m) {
    var c = document.createElement('div');
    c.className = 'mode-card' + (S.mode === m.id ? ' sel' : '');
    if (m.id === 'spicy') c.classList.add('spicy-card');
    c.innerHTML = '<div class="mode-icon">' + m.icon + '</div><div class="mode-label">' + m.label + '</div><div class="mode-sub">' + m.sub + '</div>';
    c.onclick = function() { S.mode = m.id; renderHome(); };
    mg.appendChild(c);
  });

  // Spicy wrap (show pour tous les modes sauf spicy dédié)
  var spicyWrap = $('spicy-wrap');
  spicyWrap.style.display = 'flex';
  $('spicy-toggle').checked = S.spicy;
  var intWrap = $('intensity-wrap');
  intWrap.style.display = S.spicy ? 'block' : 'none';
  if (S.spicy) {
    var ir = $('intensity-row');
    ir.innerHTML = '';
    t('intensity').forEach(function(x) {
      var b = document.createElement('button');
      b.className = 'int-btn' + (S.intensity === x.id ? ' on' : '');
      b.innerHTML = x.l + '<br><span style="font-size:10px;font-weight:400">' + x.s + '</span>';
      b.onclick = function() { S.intensity = x.id; renderHome(); };
      ir.appendChild(b);
    });
  }

  // Formats
  var fr = $('format-row');
  fr.innerHTML = '';
  t('formats').forEach(function(f) {
    var b = document.createElement('button');
    b.className = 'fmt-btn' + (S.qty === f.n ? ' on' : '');
    b.innerHTML = f.l + '<span class="fmt-sub">' + f.s + '</span>';
    b.onclick = function() { S.qty = f.n; renderHome(); };
    fr.appendChild(b);
  });
}

function onSpicyToggle() {
  S.spicy = $('spicy-toggle').checked;
  renderHome();
}

function goHome() {
  S.isP2 = false;
  S.customPool = null;
  showPage('pg-home');
  renderHome();
}

/* ══════════════════════════════════════
   VALIDATION PRÉNOM
══════════════════════════════════════ */
function validateName(inputId, errorId, errorText) {
  var inp = $(inputId);
  var err = $(errorId);
  var val = inp.value.trim();
  if (!val) {
    inp.classList.add('error');
    err.textContent = errorText;
    err.classList.add('show');
    inp.focus();
    // Animation shake via CSS (la classe error + show déclenche l'animation)
    setTimeout(function() {
      inp.classList.remove('error');
      setTimeout(function() { inp.classList.add('error'); }, 50);
    }, 10);
    return false;
  }
  inp.classList.remove('error');
  err.classList.remove('show');
  return val;
}

/* ══════════════════════════════════════
   POOL DE QUESTIONS
══════════════════════════════════════ */
function buildPool(mode, qty, lang, spicy, intensity) {
  var bank = QDB[lang][mode]['normal'].slice();
  if (spicy && QDB[lang][mode][intensity]) {
    bank = bank.concat(QDB[lang][mode][intensity]);
  }
  // Shuffle Fisher-Yates
  for (var i = bank.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = bank[i]; bank[i] = bank[j]; bank[j] = tmp;
  }
  var pool = [];
  for (var k = 0; k < qty; k++) pool.push(bank[k % bank.length]);
  return pool;
}

/* ══════════════════════════════════════
   DÉMARRER J1
══════════════════════════════════════ */
function startP1() {
  var name = validateName('p1-name', 'p1-error', t('nameError'));
  if (!name) return;
  S.p1name = name;
  S.p1answers = [];
  S.current = 0;
  S.pool = S.customPool ? S.customPool.slice() : buildPool(S.mode, S.qty, S.lang, S.spicy, S.intensity);
  showPage('pg-quiz1');
  renderQ('quiz1-body', false);
}

/* ══════════════════════════════════════
   RENDU QUESTION (générique J1 et J2)
══════════════════════════════════════ */
function renderQ(bodyId, isP2) {
  var q = S.pool[S.current];
  var total = S.pool.length;
  var pct = (S.current / total) * 100;

  var html = '<div class="q-header">' +
    '<div class="q-progress-bg"><div class="q-progress-fill" id="qpf" style="width:' + pct + '%"></div></div>' +
    '<div class="q-meta">' +
      '<span class="q-num">' + t('qOf') + ' ' + (S.current + 1) + ' / ' + total + '</span>' +
      (S.useTimer ?
        '<div class="q-timer-wrap"><svg class="q-timer-svg" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="none" stroke="rgba(128,96,64,.2)" stroke-width="2.5"/><circle id="t-arc" cx="15" cy="15" r="12" fill="none" stroke="var(--a1)" stroke-width="2.5" stroke-dasharray="75.4" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 15 15)" style="transition:stroke-dashoffset 1s linear,stroke .3s"/></svg><span id="t-txt">30</span></div>'
      : '') +
    '</div></div>' +
    (isP2 ? '<div style="font-size:12px;color:var(--ink2);margin-bottom:.5rem;font-weight:600">👁 ' + t('inviteWho') + ' <b>' + esc(S.p1name) + '</b> ?</div>' : '') +
    '<div class="q-text">' + q.q + '</div>' +
    '<div class="q-grid" id="q-grid"></div>' +
    '<div class="feedback" id="q-fb"></div>' +
    '<div id="q-actions" style="display:flex;gap:8px;margin-top:.25rem">' +
      '<button class="btn btn-ghost btn-sm" id="skip-btn" onclick="' + (isP2 ? 'skipQ2()' : 'skipQ1()') + '">' + t('skip') + ' →</button>' +
    '</div>';

  $(bodyId).innerHTML = html;

  // Remplir la grille avec animation décalée
  var grid = $('q-grid');
  q.opts.forEach(function(opt, i) {
    var btn = document.createElement('button');
    btn.className = 'q-opt';
    btn.style.animationDelay = (i * 0.05) + 's';
    btn.innerHTML = '<div class="q-opt-img">' + opt.e + '</div><div class="q-opt-label">' + esc(opt.l) + '</div>';
    btn.addEventListener('click', function() {
      if (isP2) selectP2(i);
      else selectP1(i);
    });
    grid.appendChild(btn);
  });

  if (S.useTimer) startTimer(isP2);
}

/* ══════════════════════════════════════
   TIMER
══════════════════════════════════════ */
function startTimer(isP2) {
  clearInterval(S.timerInt);
  S.timeLeft = 30;
  updateTimerUI();
  S.timerInt = setInterval(function() {
    S.timeLeft--;
    updateTimerUI();
    if (S.timeLeft <= 0) {
      clearInterval(S.timerInt);
      if (isP2) timeUpP2();
      else timeUpP1();
    }
  }, 1000);
}

function updateTimerUI() {
  var arc = $('t-arc');
  var txt = $('t-txt');
  if (!arc || !txt) return;
  txt.textContent = S.timeLeft;
  arc.setAttribute('stroke-dashoffset', (75.4 * (1 - S.timeLeft / 30)).toFixed(1));
  arc.setAttribute('stroke', S.timeLeft <= 8 ? '#C04040' : 'var(--a1)');
}

/* ══════════════════════════════════════
   J1 — SÉLECTION / SKIP
══════════════════════════════════════ */
function selectP1(idx) {
  clearInterval(S.timerInt);
  S.p1answers.push(idx);
  highlightChosen(idx, -2); // -2 = juste chosen, pas de feedback bon/mauvais pour J1
  var skipBtn = $('skip-btn');
  if (skipBtn) skipBtn.style.display = 'none';
  setTimeout(function() { nextQ1(); }, 550);
}

function timeUpP1() {
  S.p1answers.push(-1);
  nextQ1();
}

function skipQ1() {
  clearInterval(S.timerInt);
  S.p1answers.push(-1);
  nextQ1();
}

function nextQ1() {
  S.current++;
  if (S.current >= S.pool.length) showShare();
  else renderQ('quiz1-body', false);
}

/* ══════════════════════════════════════
   PAGE PARTAGE + QR CODE
══════════════════════════════════════ */
function showShare() {
  showPage('pg-share');
  $('t-done-chip').textContent = t('doneChip');
  $('t-share-title').textContent = t('shareTitle');
  $('t-share-sub').textContent = t('shareSub');
  $('copy-btn-el').textContent = t('copyBtn');
  $('t-native-share').textContent = t('shareNative');
  $('t-back-home').textContent = t('backHome');

  // Encoder les données dans l'URL
  var payload = {
    n: S.p1name,
    m: S.mode,
    l: S.lang,
    sp: S.spicy,
    si: S.intensity,
    ut: S.useTimer,
    a: S.p1answers,
    // On stocke les questions par leur contenu pour être indépendant de l'ordre
    qs: S.pool.map(function(q, i) {
      return { q: q.q, opts: q.opts, a: S.p1answers[i] };
    })
  };

  var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  // URL de la page GitHub Pages — REMPLACE par ton URL réelle
  var base = window.location.origin + window.location.pathname.replace(/\/$/, '');
  var url = base + '?g=' + encoded;

  $('share-link').value = url;

  // QR Code
  var qrWrap = $('qr-wrap');
  qrWrap.innerHTML = '';
  try {
    new QRCode(qrWrap, {
      text: url,
      width: 180,
      height: 180,
      colorDark: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#2C2018',
      colorLight: getComputedStyle(document.documentElement).getPropertyValue('--paper').trim() || '#FBF7F0',
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch(e) {
    qrWrap.innerHTML = '<p style="font-size:12px;color:var(--ink2)">QR code non disponible — utilise le lien</p>';
  }
}

function copyLink() {
  var inp = $('share-link');
  var btn = $('copy-btn-el');
  navigator.clipboard.writeText(inp.value).then(function() {
    btn.textContent = t('copiedBtn');
    btn.classList.add('copied');
    setTimeout(function() {
      btn.textContent = t('copyBtn');
      btn.classList.remove('copied');
    }, 2200);
  }).catch(function() {
    inp.select();
    document.execCommand('copy');
  });
}

function nativeShare() {
  var url = $('share-link').value;
  var text = S.p1name + (S.lang === 'fr'
    ? ' t\'a envoyé un quiz "Tu me connais ?" !'
    : ' sent you a "Do you know me?" quiz!');
  if (navigator.share) {
    navigator.share({ title: t('logo'), text: text, url: url }).catch(function() {});
  } else {
    copyLink();
  }
}

/* ══════════════════════════════════════
   DÉTECTER L'URL D'INVITATION (J2)
══════════════════════════════════════ */
function checkInviteURL() {
  var params = new URLSearchParams(window.location.search);
  var g = params.get('g');
  if (!g) return;
  try {
    var data = JSON.parse(decodeURIComponent(escape(atob(g))));
    S.lang = data.l || 'fr';
    S.p1name = data.n || '?';
    S.mode = data.m || 'friends';
    S.spicy = data.sp || false;
    S.intensity = data.si || 'fun';
    S.useTimer = data.ut !== undefined ? data.ut : true;
    // Reconstruire le pool depuis les données encodées
    S.pool = data.qs.map(function(item) {
      return { q: item.q, opts: item.opts };
    });
    S.p1answers = data.qs.map(function(item) { return item.a; });
    S.p2answers = [];
    S.current = 0;
    S.score = 0;
    S.skipped = 0;
    S.isP2 = true;

    // Sync UI
    document.getElementById('html-root').lang = S.lang;
    $('lb-fr').classList.toggle('on', S.lang === 'fr');
    $('lb-en').classList.toggle('on', S.lang === 'en');

    // Nettoyer l'URL sans recharger
    window.history.replaceState({}, '', window.location.pathname);

    showP2Intro();
  } catch(e) {
    console.warn('URL invalide', e);
  }
}

/* ══════════════════════════════════════
   J2 — INTRO + QUIZ
══════════════════════════════════════ */
function showP2Intro() {
  showPage('pg-quiz2');
  $('quiz2-body').innerHTML =
    '<br>' +
    '<div class="invite-banner">' +
      '<div class="invite-who">' + t('inviteWho') + ' <b>' + esc(S.p1name) + '</b> ?</div>' +
      '<div class="invite-sub">' + t('inviteSub') + '</div>' +
    '</div>' +
    '<div class="field-wrap">' +
      '<label class="field-label">' + t('p2nameLabel') + '</label>' +
      '<input class="field-input" id="p2-name-inp" type="text" maxlength="20" placeholder="' + t('p2namePh') + '"/>' +
      '<div class="field-error" id="p2-name-err"></div>' +
    '</div>' +
    '<button class="btn btn-primary" onclick="startP2()">' + t('startGuess') + '</button>';
}

function startP2() {
  var name = validateName('p2-name-inp', 'p2-name-err', t('p2nameError'));
  if (!name) return;
  S.p2name = name;
  S.p2answers = [];
  S.current = 0;
  S.score = 0;
  S.skipped = 0;
  renderQ('quiz2-body', true);
}

/* ══════════════════════════════════════
   J2 — SÉLECTION / SKIP
══════════════════════════════════════ */
function selectP2(idx) {
  clearInterval(S.timerInt);
  var correct = S.p1answers[S.current];
  var ok = (idx === correct && correct !== -1);
  if (ok) S.score++;
  S.p2answers.push(idx);

  highlightChosen(idx, correct);

  var fb = $('q-fb');
  fb.textContent = ok ? t('correct') : t('wrong');
  fb.className = 'feedback ' + (ok ? 'ok' : 'ko');
  fb.style.display = 'block';

  var isLast = S.current >= S.pool.length - 1;
  var actions = $('q-actions');
  if (actions) {
    actions.innerHTML = '<button class="btn btn-primary" onclick="nextQ2()" style="flex:1">' +
      (isLast ? t('seeResult') : t('nextQ')) + '</button>';
  }
}

function highlightChosen(chosen, correct) {
  document.querySelectorAll('.q-opt').forEach(function(b, i) {
    b.disabled = true;
    if (correct === -2) {
      // J1 : juste marquer le choix
      if (i === chosen) b.classList.add('chosen');
    } else {
      // J2 : montrer bon/mauvais
      if (i === correct && correct !== -1) b.classList.add('correct');
      else if (i === chosen && i !== correct) b.classList.add('wrong');
    }
  });
}

function timeUpP2() {
  S.p2answers.push(-1);
  S.skipped++;
  nextQ2();
}

function skipQ2() {
  clearInterval(S.timerInt);
  S.p2answers.push(-1);
  S.skipped++;
  nextQ2();
}

function nextQ2() {
  S.current++;
  if (S.current >= S.pool.length) showResult();
  else renderQ('quiz2-body', true);
}

/* ══════════════════════════════════════
   RÉSULTATS
══════════════════════════════════════ */
function showResult() {
  showPage('pg-result');
  var pct = S.pool.length > 0 ? Math.round((S.score / S.pool.length) * 100) : 0;
  var msg = t('resultMsgs')[0];
  t('resultMsgs').forEach(function(m) { if (pct >= m[0] && pct <= m[1]) msg = m; });

  var reviewHTML = '';
  S.pool.forEach(function(q, i) {
    var p1a = S.p1answers[i];
    var p2a = S.p2answers[i];
    var ok = (p1a === p2a && p1a !== -1 && p2a !== -1);
    var p1label = p1a >= 0 ? q.opts[p1a].e + ' ' + q.opts[p1a].l : '—';
    var p2label = p2a >= 0 ? q.opts[p2a].e + ' ' + q.opts[p2a].l : '—';
    reviewHTML += '<div class="ar-row">' +
      '<div class="ar-icon">' + (ok ? '✅' : '❌') + '</div>' +
      '<div class="ar-q">' + esc(q.q) +
        '<div class="ar-ans">' + esc(S.p1name) + ' : ' + esc(p1label) + ' · ' + esc(S.p2name) + ' : ' + esc(p2label) + '</div>' +
      '</div></div>';
  });

  $('result-body').innerHTML =
    '<div class="result-hero">' +
      '<span class="result-emoji">' + msg[2] + '</span>' +
      '<div class="result-pct">' + pct + '%</div>' +
      '<div class="result-name">' + esc(S.p2name) + ' → ' + esc(S.p1name) + '</div>' +
      '<div class="result-msg">' + esc(msg[3]) + '</div>' +
    '</div>' +
    '<div class="result-bar-wrap">' +
      '<div class="result-bar-label"><span>' + t('knowledgeScore') + '</span><span>' + S.score + ' / ' + S.pool.length + '</span></div>' +
      '<div class="result-bar-bg"><div class="result-bar-fill" id="r-bar" style="width:0%"></div></div>' +
    '</div>' +
    '<div class="result-grid">' +
      '<div class="rg-card"><div class="rg-val" style="color:var(--a2)">' + S.score + '</div><div class="rg-lbl">' + t('correct2') + '</div></div>' +
      '<div class="rg-card"><div class="rg-val" style="color:#C04040">' + (S.pool.length - S.score - S.skipped) + '</div><div class="rg-lbl">' + t('wrong2') + '</div></div>' +
      '<div class="rg-card"><div class="rg-val">' + S.skipped + '</div><div class="rg-lbl">' + t('skipped2') + '</div></div>' +
    '</div>' +
    '<hr class="div"/>' +
    '<div style="margin-bottom:.75rem;font-weight:800;font-size:15px">' + t('reviewTitle') + '</div>' +
    reviewHTML +
    '<hr class="div"/>' +
    '<div style="background:var(--a2t);border:1.5px solid var(--a2);border-radius:var(--r);padding:1rem;margin-bottom:1rem;font-size:14px;line-height:1.5">' +
      '↔ ' + t('invertNote') + ' <b>' + esc(S.p1name) + '</b> ' + t('invertNote2') +
    '</div>' +
    '<button class="btn btn-primary" onclick="invertRoles()">' + t('invertBtn') + '</button>' +
    '<button class="btn btn-secondary" onclick="goHome()">' + t('restartBtn') + '</button>';

  setTimeout(function() {
    var bar = $('r-bar');
    if (bar) bar.style.width = pct + '%';
  }, 200);
}

/* ══════════════════════════════════════
   INVERSION DES RÔLES
══════════════════════════════════════ */
function invertRoles() {
  var prevP1 = S.p1name, prevP2 = S.p2name;
  var prevP2answers = S.p2answers.slice();
  var prevPool = S.pool.slice();

  // P2 devient P1 : ses réponses deviennent les "vraies"
  S.p1name = prevP2;
  S.p2name = prevP1;
  S.p1answers = prevP2answers;
  S.pool = prevPool;
  S.p2answers = [];
  S.current = 0;
  S.score = 0;
  S.skipped = 0;
  S.isP2 = true;

  showPage('pg-quiz2');
  $('quiz2-body').innerHTML =
    '<br>' +
    '<div class="invite-banner">' +
      '<div class="invite-who">' + t('inviteWho') + ' <b>' + esc(S.p1name) + '</b> ?</div>' +
      '<div class="invite-sub">' + t('inviteSub') + '</div>' +
    '</div>' +
    '<div class="field-wrap">' +
      '<label class="field-label">' + t('yourNameFor') + ' : <b>' + esc(S.p2name) + '</b></label>' +
      '<input class="field-input" id="p2-name-inp" type="text" value="' + esc(S.p2name) + '" maxlength="20"/>' +
      '<div class="field-error" id="p2-name-err"></div>' +
    '</div>' +
    '<button class="btn btn-primary" onclick="startP2()">' + t('startGuess') + '</button>';
}

/* ══════════════════════════════════════
   BUILDER — QUIZ PERSONNALISÉ
══════════════════════════════════════ */
var builderQuestions = [];

function showBuilder() {
  showPage('pg-builder');
  builderQuestions = [];
  renderBuilder();
}

function renderBuilder() {
  var presets = QDB[S.lang]['friends']['normal'].slice(0, 8);
  var presetsHTML = presets.map(function(q, i) {
    var isAdded = builderQuestions.some(function(bq) { return bq.q === q.q; });
    return '<div class="ar-row" style="cursor:pointer" onclick="togglePreset(' + i + ',' + JSON.stringify(isAdded) + ')" id="preset-' + i + '">' +
      '<div class="ar-icon">' + (isAdded ? '✅' : '➕') + '</div>' +
      '<div class="ar-q">' + esc(q.q) + '</div>' +
    '</div>';
  }).join('');

  var customHTML = builderQuestions.filter(function(q) { return q._custom; }).map(function(q, ci) {
    return '<div class="custom-q-card" id="cq-' + ci + '">' +
      '<div class="custom-q-header">' +
        '<div class="custom-q-num">' + (ci + 1) + '</div>' +
        '<div class="custom-q-text">' + (q.q || t('builderQ') + '...') + '</div>' +
        '<button class="custom-q-remove" onclick="removeCustomQ(' + ci + ')">✕</button>' +
      '</div>' +
      '<div class="custom-opts-grid">' +
        q.opts.map(function(o) {
          return '<div class="custom-opt-chip"><span>' + o.e + ' ' + esc(o.l) + '</span></div>';
        }).join('') +
      '</div>' +
    '</div>';
  }).join('');

  $('builder-body').innerHTML =
    '<br><b style="font-size:18px;font-weight:800">' + t('builderTitle') + '</b>' +
    '<p style="font-size:13px;color:var(--ink2);margin:.5rem 0 1.25rem;line-height:1.5">' + t('builderSub') + '</p>' +

    '<div class="builder-section">' +
      '<div class="builder-section-title">' + t('builderPreset') + '</div>' +
      presetsHTML +
    '</div>' +

    '<div class="builder-section">' +
      '<div class="builder-section-title">' + t('builderCustom') + '</div>' +
      customHTML +
      '<div id="custom-q-form"></div>' +
      '<button class="add-q-btn" onclick="showCustomQForm()">' + t('builderAddQ') + '</button>' +
    '</div>' +

    '<hr class="div"/>' +
    '<div style="margin-bottom:1rem;font-size:13px;color:var(--ink2)">' +
      builderQuestions.length + ' question(s) sélectionnée(s)' +
    '</div>' +
    '<button class="btn btn-primary" onclick="launchBuilderQuiz()">' + t('builderStart') + '</button>' +
    '<button class="btn btn-secondary" onclick="goHome()">' + t('builderBack') + '</button>';
}

function togglePreset(idx, isAdded) {
  var q = QDB[S.lang]['friends']['normal'][idx];
  if (isAdded) {
    builderQuestions = builderQuestions.filter(function(bq) { return bq.q !== q.q; });
  } else {
    builderQuestions.push({ q: q.q, opts: q.opts });
  }
  renderBuilder();
}

function removeCustomQ(ci) {
  var customs = builderQuestions.filter(function(q) { return q._custom; });
  var toRemove = customs[ci];
  builderQuestions = builderQuestions.filter(function(q) { return q !== toRemove; });
  renderBuilder();
}

function showCustomQForm() {
  var form = $('custom-q-form');
  if (!form) return;
  // Générer 4 champs de réponse par défaut
  var optsHTML = [0,1,2,3].map(function(i) {
    var emojis = ['🔵','🟢','🟡','🔴'];
    return '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">' +
      '<span style="font-size:18px">' + emojis[i] + '</span>' +
      '<input class="field-input" id="copt-' + i + '" style="padding:8px 10px;font-size:13px" placeholder="' + t('customOptPh') + '"/>' +
    '</div>';
  }).join('');

  form.innerHTML =
    '<div style="background:var(--paper2);border:1.5px solid var(--line2);border-radius:var(--r);padding:1rem;margin-bottom:.75rem">' +
      '<input class="field-input" id="cq-input" style="margin-bottom:.75rem" placeholder="' + t('customQPh') + '"/>' +
      optsHTML +
      '<div id="extra-opts"></div>' +
      '<button type="button" class="add-q-btn" style="margin-bottom:.75rem" onclick="addExtraOpt()">' + t('addOpt') + '</button>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="btn btn-primary" onclick="saveCustomQ()" style="flex:1;padding:10px">✓ Ajouter</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="cancelCustomQ()">Annuler</button>' +
      '</div>' +
    '</div>';
}

var extraOptCount = 0;
function addExtraOpt() {
  var extras = $('extra-opts');
  var emojis = ['⭐','🔥','💎','🎯','🌈','🚀'];
  var e = document.createElement('div');
  e.style = 'display:flex;gap:6px;align-items:center;margin-bottom:6px';
  e.innerHTML = '<span style="font-size:18px">' + (emojis[extraOptCount % emojis.length]) + '</span>' +
    '<input class="field-input" id="copt-extra-' + extraOptCount + '" style="padding:8px 10px;font-size:13px" placeholder="' + t('customOptPh') + '"/>';
  extras.appendChild(e);
  extraOptCount++;
}

function saveCustomQ() {
  var qText = ($('cq-input') && $('cq-input').value.trim()) || '';
  if (!qText) { $('cq-input') && $('cq-input').classList.add('error'); return; }
  var opts = [];
  var emojis = ['🔵','🟢','🟡','🔴','⭐','🔥','💎','🎯','🌈','🚀'];
  [0,1,2,3].forEach(function(i) {
    var inp = $('copt-' + i);
    if (inp && inp.value.trim()) opts.push({ l: inp.value.trim(), e: emojis[i] });
  });
  for (var x = 0; x < extraOptCount; x++) {
    var inp = $('copt-extra-' + x);
    if (inp && inp.value.trim()) opts.push({ l: inp.value.trim(), e: emojis[(x + 4) % emojis.length] });
  }
  if (opts.length < 2) { alert('Ajoute au moins 2 réponses !'); return; }
  extraOptCount = 0;
  builderQuestions.push({ q: qText, opts: opts, _custom: true });
  renderBuilder();
}

function cancelCustomQ() {
  extraOptCount = 0;
  renderBuilder();
}

function launchBuilderQuiz() {
  if (builderQuestions.length < 1) { alert('Ajoute au moins une question !'); return; }
  S.customPool = builderQuestions.slice();
  goHome();
  setTimeout(function() {
    $('p1-name').focus();
  }, 200);
}

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  // Restaurer le thème
  var savedTheme = localStorage.getItem('tmcTheme') || 'light';
  S.theme = savedTheme;
  document.getElementById('html-root').setAttribute('data-theme', savedTheme);
  $('theme-btn').textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  // Lier le timer toggle
  $('timer-toggle').addEventListener('change', function() { S.useTimer = this.checked; });

  renderHome();
  checkInviteURL();
});
