/* ═══════════════════════════════════════
   APP.JS — Tu me connais ? v4
   Fix : URL courte (seed), hot activé, vrai random
═══════════════════════════════════════ */

var S = {
  lang:'fr', theme:'light', mode:'friends', qty:10,
  spicy:false, intensity:'fun', useTimer:true,
  p1name:'', p2name:'',
  pool:[], p1answers:[], p2answers:[],
  current:0, score:0, skipped:0,
  timerInt:null, timeLeft:30,
  isP2:false, customPool:null,
  seed:0
};

function t(k){ return T[S.lang][k]; }
function esc(s){ var d=document.createElement('div');d.textContent=s;return d.innerHTML; }
function $(id){ return document.getElementById(id); }

function showPage(id){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  $(id).classList.add('active');
  window.scrollTo(0,0);
}

/* ── THÈME ── */
function toggleTheme(){
  S.theme=S.theme==='light'?'dark':'light';
  document.getElementById('html-root').setAttribute('data-theme',S.theme);
  $('theme-btn').textContent=S.theme==='dark'?'☀️':'🌙';
  try{localStorage.setItem('tmc_theme',S.theme);}catch(e){}
}

/* ── LANGUE ── */
function setLang(l){
  S.lang=l;
  document.getElementById('html-root').lang=l;
  $('lb-fr').classList.toggle('on',l==='fr');
  $('lb-en').classList.toggle('on',l==='en');
  if(!S.isP2) renderHome();
}

/* ══════════════════════════════════════
   HOME
══════════════════════════════════════ */
function renderHome(){
  $('t-logo').textContent=t('logo');
  $('t-tag').textContent=t('tag');
  $('t-h1').innerHTML=t('h1');
  $('t-sub').textContent=t('sub');
  $('t-mode-label').textContent=t('modeLabel');
  $('t-format-label').textContent=t('formatLabel');
  $('t-spicy-label').textContent=t('spicyLabel');
  $('t-spicy-sub').textContent=t('spicySub');
  $('t-timer-label').textContent=t('timerLabel');
  $('t-timer-sub').textContent=t('timerSub');
  $('t-name-label').textContent=t('nameLabel');
  $('p1-name').placeholder=t('namePh');
  $('t-start-btn').textContent=t('startBtn');
  $('t-builder-btn').textContent=t('builderBtn');

  // Modes
  var mg=$('mode-grid'); mg.innerHTML='';
  t('modes').forEach(function(m){
    var c=document.createElement('div');
    c.className='mode-card'+(S.mode===m.id?' sel':'');
    c.innerHTML='<div class="mode-icon">'+m.icon+'</div><div class="mode-label">'+m.label+'</div><div class="mode-sub">'+m.sub+'</div>';
    c.onclick=function(){S.mode=m.id;renderHome();};
    mg.appendChild(c);
  });

  // Spicy
  $('spicy-toggle').checked=S.spicy;
  $('intensity-wrap').style.display=S.spicy?'block':'none';
  if(S.spicy){
    var ir=$('intensity-row'); ir.innerHTML='';
    t('intensity').forEach(function(x){
      var b=document.createElement('button');
      b.className='int-btn'+(S.intensity===x.id?' on':'');
      b.innerHTML=x.l+'<br><span style="font-size:10px;font-weight:400">'+x.s+'</span>';
      b.onclick=function(){S.intensity=x.id;renderHome();};
      ir.appendChild(b);
    });
  }

  // Formats
  var fr=$('format-row'); fr.innerHTML='';
  t('formats').forEach(function(f){
    var b=document.createElement('button');
    b.className='fmt-btn'+(S.qty===f.n?' on':'');
    b.innerHTML=f.l+'<span class="fmt-sub">'+f.s+'</span>';
    b.onclick=function(){S.qty=f.n;renderHome();};
    fr.appendChild(b);
  });
}

function onSpicyToggle(){ S.spicy=$('spicy-toggle').checked; renderHome(); }

function goHome(){
  S.isP2=false; S.customPool=null;
  showPage('pg-home'); renderHome();
}

/* ── VALIDATION ── */
function validateName(inputId,errorId,errorText){
  var inp=$(inputId), err=$(errorId), val=inp.value.trim();
  if(!val){
    inp.classList.remove('error');
    setTimeout(function(){inp.classList.add('error');},10);
    err.textContent=errorText; err.classList.add('show');
    inp.focus();
    return false;
  }
  inp.classList.remove('error'); err.classList.remove('show');
  return val;
}

/* ══════════════════════════════════════
   POOL — shuffle déterministe par seed
   Même seed = même ordre de questions
   => J1 et J2 voient exactement les mêmes questions
══════════════════════════════════════ */
function seededRandom(seed){
  // LCG simple, reproductible
  var s=seed;
  return function(){
    s=(s*1664525+1013904223)&0xffffffff;
    return (s>>>0)/0xffffffff;
  };
}

function buildPool(mode, qty, lang, spicy, intensity, seed){
  // 1. Construire la banque complète
  var bank=[];
  var normal=(QDB[lang]&&QDB[lang][mode]&&QDB[lang][mode]['normal'])||[];
  bank=normal.slice();

  if(spicy){
    var level=intensity||'fun';
    // D'abord fun, puis hot si hot sélectionné
    var funQs=(QDB[lang]&&QDB[lang][mode]&&QDB[lang][mode]['fun'])||[];
    var hotQs=(QDB[lang]&&QDB[lang][mode]&&QDB[lang][mode]['hot'])||[];
    if(level==='fun') bank=bank.concat(funQs);
    if(level==='hot') bank=bank.concat(funQs).concat(hotQs);
  }

  // 2. Shuffle avec le seed
  var rand=seededRandom(seed);
  for(var i=bank.length-1;i>0;i--){
    var j=Math.floor(rand()*(i+1));
    var tmp=bank[i]; bank[i]=bank[j]; bank[j]=tmp;
  }

  // 3. Prendre qty questions (avec répétition si besoin)
  var pool=[];
  for(var k=0;k<qty;k++) pool.push(bank[k%bank.length]);
  return pool;
}

/* ══════════════════════════════════════
   J1
══════════════════════════════════════ */
function startP1(){
  var name=validateName('p1-name','p1-error',t('nameError'));
  if(!name) return;
  S.p1name=name;
  S.p1answers=[];
  S.current=0;
  // Générer un seed aléatoire pour cette partie
  S.seed=Math.floor(Math.random()*999999);
  S.pool=S.customPool?S.customPool.slice():buildPool(S.mode,S.qty,S.lang,S.spicy,S.intensity,S.seed);
  showPage('pg-quiz1');
  renderQ('quiz1-body',false);
}

/* ══════════════════════════════════════
   RENDU QUESTION
══════════════════════════════════════ */
function renderQ(bodyId,isP2){
  var q=S.pool[S.current], total=S.pool.length, pct=(S.current/total)*100;
  var html=
    '<div class="q-header">'+
      '<div class="q-progress-bg"><div class="q-progress-fill" id="qpf" style="width:'+pct+'%"></div></div>'+
      '<div class="q-meta">'+
        '<span class="q-num">'+t('qOf')+' '+(S.current+1)+' / '+total+'</span>'+
        (S.useTimer?
          '<div class="q-timer-wrap">'+
            '<svg class="q-timer-svg" viewBox="0 0 30 30">'+
              '<circle cx="15" cy="15" r="12" fill="none" stroke="rgba(128,96,64,.2)" stroke-width="2.5"/>'+
              '<circle id="t-arc" cx="15" cy="15" r="12" fill="none" stroke="var(--a1)" stroke-width="2.5" stroke-dasharray="75.4" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 15 15)" style="transition:stroke-dashoffset 1s linear,stroke .3s"/>'+
            '</svg>'+
            '<span id="t-txt">30</span>'+
          '</div>'
        :'')+
      '</div>'+
    '</div>'+
    (isP2?'<div style="font-size:12px;color:var(--ink2);margin-bottom:.5rem;font-weight:600">👁 '+t('inviteWho')+' <b>'+esc(S.p1name)+'</b></div>':'')+
    '<div class="q-text">'+esc(q.q)+'</div>'+
    '<div class="q-grid" id="q-grid"></div>'+
    '<div class="feedback" id="q-fb"></div>'+
    '<div id="q-actions" style="margin-top:.25rem">'+
      '<button class="btn btn-ghost btn-sm" onclick="'+(isP2?'skipQ2()':'skipQ1()')+'">'+t('skip')+' →</button>'+
    '</div>';

  $(bodyId).innerHTML=html;

  var grid=$('q-grid');
  q.opts.forEach(function(opt,i){
    var btn=document.createElement('button');
    btn.className='q-opt';
    btn.style.animationDelay=(i*.06)+'s';
    btn.innerHTML='<div class="q-opt-img">'+opt.e+'</div><div class="q-opt-label">'+esc(opt.l)+'</div>';
    btn.addEventListener('click',function(){ if(isP2) selectP2(i); else selectP1(i); });
    grid.appendChild(btn);
  });

  if(S.useTimer) startTimer(isP2);
}

/* ── TIMER ── */
function startTimer(isP2){
  clearInterval(S.timerInt); S.timeLeft=30; updateTimerUI();
  S.timerInt=setInterval(function(){
    S.timeLeft--; updateTimerUI();
    if(S.timeLeft<=0){ clearInterval(S.timerInt); if(isP2) timeUpP2(); else timeUpP1(); }
  },1000);
}
function updateTimerUI(){
  var arc=$('t-arc'),txt=$('t-txt');
  if(!arc||!txt) return;
  txt.textContent=S.timeLeft;
  arc.setAttribute('stroke-dashoffset',(75.4*(1-S.timeLeft/30)).toFixed(1));
  arc.setAttribute('stroke',S.timeLeft<=8?'#C04040':'var(--a1)');
}

/* ── J1 sélection ── */
function selectP1(idx){
  clearInterval(S.timerInt);
  S.p1answers.push(idx);
  document.querySelectorAll('.q-opt').forEach(function(b,i){
    b.disabled=true;
    if(i===idx) b.classList.add('chosen');
  });
  setTimeout(function(){nextQ1();},550);
}
function timeUpP1(){ S.p1answers.push(-1); nextQ1(); }
function skipQ1(){ clearInterval(S.timerInt); S.p1answers.push(-1); nextQ1(); }
function nextQ1(){
  S.current++;
  if(S.current>=S.pool.length) showShare();
  else renderQ('quiz1-body',false);
}

/* ══════════════════════════════════════
   PARTAGE — URL courte avec seed
   On encode seulement : prénom, mode, langue,
   spicy, intensity, timer, seed, qty, réponses
   → URL ~150 chars au lieu de 3000+
══════════════════════════════════════ */
function showShare(){
  showPage('pg-share');

  // URL courte : seed + réponses seulement
  var payload={
    n: S.p1name,
    m: S.mode,
    l: S.lang,
    sp: S.spicy,
    si: S.intensity,
    ut: S.useTimer,
    sd: S.seed,
    qty: S.pool.length,
    a: S.p1answers
  };

  var encoded;
  try{
    encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }catch(e){
    encoded=btoa(JSON.stringify(payload));
  }

  var base=window.location.origin+window.location.pathname.replace(/\/[^/]*$/,'/');
  // S'assurer que la base pointe vers index.html
  if(base.slice(-1)!=='/') base=base+'/';
  var url=base+'index.html?g='+encoded;

  // Alternative plus propre pour GitHub Pages
  var cleanBase=window.location.href.split('?')[0];
  url=cleanBase+'?g='+encoded;

  $('share-link').value=url;

  // QR Code
  var qrWrap=$('qr-wrap'); qrWrap.innerHTML='';
  try{
    new QRCode(qrWrap,{
      text:url, width:200, height:200,
      colorDark:'#2C2018', colorLight:'#FBF7F0',
      correctLevel:QRCode.CorrectLevel.M
    });
  }catch(e){
    qrWrap.innerHTML='<p style="font-size:12px;color:var(--ink2);text-align:center">QR indisponible — utilise le lien ci-dessous</p>';
  }

  // Mettre à jour textes
  $('t-done-chip').textContent=t('doneChip');
  $('t-share-title').textContent=t('shareTitle');
  $('t-share-sub').textContent=t('shareSub');
  $('copy-btn-el').textContent=t('copyBtn');
  $('t-native-share').textContent=t('shareNative');
  $('t-back-home').textContent=t('backHome');
}

function copyLink(){
  var inp=$('share-link'), btn=$('copy-btn-el');
  navigator.clipboard.writeText(inp.value).then(function(){
    btn.textContent=t('copiedBtn'); btn.classList.add('copied');
    setTimeout(function(){ btn.textContent=t('copyBtn'); btn.classList.remove('copied'); },2200);
  }).catch(function(){ inp.select(); document.execCommand('copy'); });
}

function nativeShare(){
  var url=$('share-link').value;
  var text=S.lang==='fr'
    ? S.p1name+' t\'a envoyé un quiz "Tu me connais ?" ! Peux-tu deviner ses réponses ?'
    : S.p1name+' sent you a "Do you know me?" quiz! Can you guess their answers?';
  if(navigator.share) navigator.share({title:t('logo'), text:text, url:url}).catch(function(){});
  else copyLink();
}

/* ══════════════════════════════════════
   DÉTECTER URL → J2
══════════════════════════════════════ */
function checkInviteURL(){
  var params=new URLSearchParams(window.location.search);
  var g=params.get('g');
  if(!g) return;

  try{
    var raw=decodeURIComponent(escape(atob(g)));
    var data=JSON.parse(raw);

    S.lang  = data.l   || 'fr';
    S.p1name= data.n   || '?';
    S.mode  = data.m   || 'friends';
    S.spicy = data.sp  || false;
    S.intensity=data.si|| 'fun';
    S.useTimer=data.ut!==undefined?data.ut:true;
    S.seed  = data.sd  || 0;
    S.qty   = data.qty || 10;
    S.p1answers=data.a || [];

    // Reconstruire EXACTEMENT le même pool avec le même seed
    S.pool=buildPool(S.mode, S.qty, S.lang, S.spicy, S.intensity, S.seed);

    S.p2answers=[]; S.current=0; S.score=0; S.skipped=0; S.isP2=true;

    // Sync langue dans l'UI
    document.getElementById('html-root').lang=S.lang;
    var lfr=$('lb-fr'), len=$('lb-en');
    if(lfr) lfr.classList.toggle('on',S.lang==='fr');
    if(len) len.classList.toggle('on',S.lang==='en');

    // Nettoyer l'URL
    window.history.replaceState({},'',window.location.pathname);

    // Afficher la page d'invitation J2
    showInviteLanding();

  }catch(e){
    console.warn('URL invalide',e);
  }
}

/* ══════════════════════════════════════
   PAGE D'ACCUEIL J2 — dédiée et claire
══════════════════════════════════════ */
function showInviteLanding(){
  showPage('pg-invite');
  var isFr=S.lang==='fr';
  $('invite-body').innerHTML=
    '<div style="text-align:center;padding:3rem 1rem 2rem">'+
      '<div style="font-size:64px;margin-bottom:1rem">💛</div>'+
      '<div style="font-size:24px;font-weight:800;margin-bottom:.75rem">'+
        esc(S.p1name)+(isFr?' t\'a envoyé un quiz !':' sent you a quiz!')+
      '</div>'+
      '<div style="font-size:15px;color:var(--ink2);line-height:1.7;margin-bottom:2rem;max-width:400px;margin-left:auto;margin-right:auto">'+
        (isFr
          ? '<b>'+esc(S.p1name)+'</b> a répondu à '+(S.pool.length)+' questions sur lui/elle.<br>Ton but : deviner ses réponses !<br><br>Tu vas voir les mêmes questions — réponds comme tu penses qu\'il/elle a répondu.'
          : '<b>'+esc(S.p1name)+'</b> answered '+(S.pool.length)+' questions about themselves.<br>Your goal: guess their answers!<br><br>You\'ll see the same questions — answer as you think they did.'
        )+
      '</div>'+
      '<div style="max-width:360px;margin:0 auto;text-align:left">'+
        '<label class="field-label">'+(isFr?'Ton prénom':'Your name')+'</label>'+
        '<input class="field-input" id="p2-name-inp" type="text" maxlength="20" placeholder="'+(isFr?'Ton prénom...':'Your name...')+'" style="margin-bottom:.5rem"/>'+
        '<div class="field-error" id="p2-name-err"></div>'+
        '<br>'+
        '<button class="btn btn-primary" onclick="startP2()">'+
          (isFr?'C\'est parti, je devine →':'Let\'s go, I\'ll guess →')+
        '</button>'+
      '</div>'+
    '</div>';
}

/* ══════════════════════════════════════
   J2 — QUIZ
══════════════════════════════════════ */
function startP2(){
  var isFr=S.lang==='fr';
  var name=validateName('p2-name-inp','p2-name-err',isFr?'⚠ Entre ton prénom !':'⚠ Enter your name!');
  if(!name) return;
  S.p2name=name;
  S.p2answers=[]; S.current=0; S.score=0; S.skipped=0;
  showPage('pg-quiz2');
  renderQ('quiz2-body',true);
}

function selectP2(idx){
  clearInterval(S.timerInt);
  var correct=S.p1answers[S.current];
  var ok=(idx===correct && correct!==-1);
  if(ok) S.score++;
  S.p2answers.push(idx);

  document.querySelectorAll('.q-opt').forEach(function(b,i){
    b.disabled=true;
    if(i===correct && correct!==-1) b.classList.add('correct');
    else if(i===idx && i!==correct) b.classList.add('wrong');
  });

  var fb=$('q-fb');
  var isFr=S.lang==='fr';
  fb.textContent=ok?(isFr?'✓ Bonne réponse !':'✓ Correct!'):(isFr?'✗ Raté !':'✗ Wrong!');
  fb.className='feedback '+(ok?'ok':'ko');
  fb.style.display='block';

  var isLast=S.current>=S.pool.length-1;
  var actions=$('q-actions');
  if(actions) actions.innerHTML=
    '<button class="btn btn-primary" onclick="nextQ2()" style="margin-top:.5rem">'+
      (isLast?(isFr?'Voir le résultat →':'See the result →'):(isFr?'Question suivante →':'Next question →'))+
    '</button>';
}

function timeUpP2(){ S.p2answers.push(-1); S.skipped++; nextQ2(); }
function skipQ2(){ clearInterval(S.timerInt); S.p2answers.push(-1); S.skipped++; nextQ2(); }
function nextQ2(){ S.current++; if(S.current>=S.pool.length) showResult(); else renderQ('quiz2-body',true); }

/* ══════════════════════════════════════
   RÉSULTATS avec niveaux fun
══════════════════════════════════════ */
var LEVELS={
  fr:[
    {min:0,  max:20, emoji:'👀',label:'Inconnus',          color:'#888',   msg:'Vous venez à peine de vous rencontrer... ou pas du tout !'},
    {min:21, max:40, emoji:'🤝',label:'Bons voisins',       color:'#E8622A',msg:'Il y a encore du boulot, mais c\'est un début !'},
    {min:41, max:60, emoji:'😊',label:'Vrais amis',         color:'#4A7A5A',msg:'Pas mal du tout ! Vous vous connaissez vraiment bien.'},
    {min:61, max:80, emoji:'🔥',label:'Vous vous lisez',    color:'#D9622B',msg:'Impressionnant — vous vous connaissez par cœur !'},
    {min:81, max:100,emoji:'💑',label:'Couple / BFF Goals', color:'#C0362A',msg:'Incroyable. Vous lisez dans les pensées l\'un de l\'autre !'}
  ],
  en:[
    {min:0,  max:20, emoji:'👀',label:'Strangers',          color:'#888',   msg:'You barely know each other... or not at all!'},
    {min:21, max:40, emoji:'🤝',label:'Good neighbors',      color:'#E8622A',msg:'Still some work to do — but it\'s a start!'},
    {min:41, max:60, emoji:'😊',label:'Real friends',        color:'#4A7A5A',msg:'Not bad at all! You really know each other.'},
    {min:61, max:80, emoji:'🔥',label:'You read each other', color:'#D9622B',msg:'Impressive — you know each other by heart!'},
    {min:81, max:100,emoji:'💑',label:'Couple / BFF Goals',  color:'#C0362A',msg:'Incredible. You can literally read each other\'s minds!'}
  ]
};

function getLevel(pct){
  var lvls=LEVELS[S.lang]||LEVELS['fr'];
  for(var i=lvls.length-1;i>=0;i--){ if(pct>=lvls[i].min) return lvls[i]; }
  return lvls[0];
}

function showResult(){
  showPage('pg-result');
  var pct=S.pool.length>0?Math.round((S.score/S.pool.length)*100):0;
  var level=getLevel(pct);
  var isFr=S.lang==='fr';

  var reviewHTML='';
  S.pool.forEach(function(q,i){
    var p1a=S.p1answers[i], p2a=S.p2answers[i];
    var ok=(p1a===p2a && p1a!==-1 && p2a!==-1);
    var p1l=p1a!==-1&&p1a!==undefined&&q.opts[p1a]?q.opts[p1a].e+' '+q.opts[p1a].l:'—';
    var p2l=p2a!==-1&&p2a!==undefined&&q.opts[p2a]?q.opts[p2a].e+' '+q.opts[p2a].l:'—';
    reviewHTML+=
      '<div class="ar-row">'+
        '<div class="ar-icon">'+(ok?'✅':'❌')+'</div>'+
        '<div class="ar-q">'+esc(q.q)+
          '<div class="ar-ans">'+esc(S.p1name)+' : '+esc(p1l)+' · '+esc(S.p2name)+' : '+esc(p2l)+'</div>'+
        '</div>'+
      '</div>';
  });

  $('result-body').innerHTML=
    '<div class="result-hero">'+
      '<span class="result-emoji">'+level.emoji+'</span>'+
      '<div class="result-pct">'+pct+'%</div>'+
      '<div class="result-name">'+esc(S.p2name)+' → '+esc(S.p1name)+'</div>'+
      '<div class="result-level" style="background:'+level.color+'22;color:'+level.color+';border-radius:99px;padding:.4rem 1.2rem;display:inline-block;font-size:18px;font-weight:800;margin-top:.5rem">'+
        level.emoji+' '+level.label+
      '</div>'+
      '<div class="result-msg">'+esc(level.msg)+'</div>'+
    '</div>'+
    '<div class="result-bar-wrap">'+
      '<div class="result-bar-label">'+
        '<span>'+(isFr?'Score de connaissance':'Knowledge score')+'</span>'+
        '<span>'+S.score+' / '+S.pool.length+'</span>'+
      '</div>'+
      '<div class="result-bar-bg"><div class="result-bar-fill" id="r-bar" style="width:0%"></div></div>'+
    '</div>'+
    '<div class="result-grid">'+
      '<div class="rg-card"><div class="rg-val" style="color:var(--a2)">'+S.score+'</div><div class="rg-lbl">'+(isFr?'Correctes':'Correct')+'</div></div>'+
      '<div class="rg-card"><div class="rg-val" style="color:#C04040">'+(S.pool.length-S.score-S.skipped)+'</div><div class="rg-lbl">'+(isFr?'Ratées':'Wrong')+'</div></div>'+
      '<div class="rg-card"><div class="rg-val">'+S.skipped+'</div><div class="rg-lbl">'+(isFr?'Passées':'Skipped')+'</div></div>'+
    '</div>'+
    '<hr class="div"/>'+
    '<div style="font-weight:800;font-size:15px;margin-bottom:.75rem">'+(isFr?'Récap des réponses':'Answer recap')+'</div>'+
    reviewHTML+
    '<hr class="div"/>'+
    '<div style="background:var(--a2t);border:1.5px solid var(--a2);border-radius:var(--r);padding:1rem;margin-bottom:1rem;font-size:14px;line-height:1.6">'+
      '↔ '+(isFr?'Et si on inversait ? Laisse <b>'+esc(S.p1name)+'</b> deviner tes réponses maintenant !':'What if you switched? Let <b>'+esc(S.p1name)+'</b> guess your answers now!')+
    '</div>'+
    '<button class="btn btn-primary" onclick="invertRoles()">'+(isFr?'↔ Inverser les rôles':'↔ Switch roles')+'</button>'+
    '<button class="btn btn-secondary" onclick="goHome()">'+(isFr?'← Nouvelle partie':'← New game')+'</button>';

  setTimeout(function(){ var bar=$('r-bar'); if(bar) bar.style.width=pct+'%'; },200);
}

/* ── INVERSION ── */
function invertRoles(){
  var prevP1=S.p1name, prevP2=S.p2name;
  var prevP2answers=S.p2answers.slice();
  // P2 devient le nouveau P1, on garde le même pool
  S.p1name=prevP2; S.p2name=prevP1;
  S.p1answers=prevP2answers;
  S.p2answers=[]; S.current=0; S.score=0; S.skipped=0;
  S.isP2=true;
  showInviteLanding();
}

/* ══════════════════════════════════════
   BUILDER
══════════════════════════════════════ */
var builderQuestions=[];

function showBuilder(){
  showPage('pg-builder'); builderQuestions=[];
  renderBuilder();
}

function renderBuilder(){
  var isFr=S.lang==='fr';
  var presets=(QDB[S.lang]&&QDB[S.lang]['friends']&&QDB[S.lang]['friends']['normal']||[]).slice(0,8);
  var presetsHTML=presets.map(function(q,i){
    var isAdded=builderQuestions.some(function(bq){return bq.q===q.q;});
    return '<div class="ar-row" style="cursor:pointer" onclick="togglePreset('+i+','+isAdded+')">'+
      '<div class="ar-icon">'+(isAdded?'✅':'➕')+'</div>'+
      '<div class="ar-q">'+esc(q.q)+'</div>'+
    '</div>';
  }).join('');

  $('builder-body').innerHTML=
    '<br><b style="font-size:18px;font-weight:800">'+(isFr?'Crée ton quiz perso':'Create your quiz')+'</b>'+
    '<p style="font-size:13px;color:var(--ink2);margin:.5rem 0 1.25rem;line-height:1.5">'+
      (isFr?'Ajoute des questions prédéfinies ou écris les tiennes. Minimum 1.':'Add preset questions or write your own. Minimum 1.')+
    '</p>'+
    '<div class="builder-section">'+
      '<div class="builder-section-title">'+(isFr?'Questions prédéfinies':'Preset questions')+'</div>'+
      presetsHTML+
    '</div>'+
    '<div class="builder-section">'+
      '<div class="builder-section-title">'+(isFr?'Question personnalisée':'Custom question')+'</div>'+
      '<div id="custom-form"></div>'+
      '<button class="add-q-btn" onclick="showCustomForm()">'+(isFr?'+ Ajouter une question':'+ Add a question')+'</button>'+
    '</div>'+
    '<hr class="div"/>'+
    '<p style="font-size:13px;color:var(--ink2);margin-bottom:1rem">'+builderQuestions.length+' question(s)</p>'+
    '<button class="btn btn-primary" onclick="launchBuilder()">'+(isFr?'Lancer ce quiz →':'Launch this quiz →')+'</button>'+
    '<button class="btn btn-secondary" onclick="goHome()">'+(isFr?'← Retour':'← Back')+'</button>';
}

function togglePreset(idx,isAdded){
  var q=(QDB[S.lang]&&QDB[S.lang]['friends']&&QDB[S.lang]['friends']['normal']||[])[idx];
  if(!q) return;
  if(isAdded) builderQuestions=builderQuestions.filter(function(bq){return bq.q!==q.q;});
  else builderQuestions.push({q:q.q,opts:q.opts});
  renderBuilder();
}

var extraCount=0;
function showCustomForm(){
  var isFr=S.lang==='fr';
  var form=$('custom-form'); if(!form) return;
  var emojis=['🔵','🟢','🟡','🔴'];
  var optsHTML=emojis.map(function(e,i){
    return '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">'+
      '<span style="font-size:18px">'+e+'</span>'+
      '<input class="field-input" id="co-'+i+'" style="padding:8px 10px;font-size:13px" placeholder="'+(isFr?'Réponse...':'Answer...')+'"/>'+
    '</div>';
  }).join('');
  form.innerHTML=
    '<div style="background:var(--paper2);border:1.5px solid var(--line2);border-radius:var(--r);padding:1rem;margin-bottom:.75rem">'+
      '<input class="field-input" id="cq-inp" style="margin-bottom:.75rem" placeholder="'+(isFr?'Ta question...':'Your question...')+'"/>'+
      optsHTML+
      '<div id="extra-opts"></div>'+
      '<button type="button" class="add-q-btn" style="margin-bottom:.75rem" onclick="addExtra()">'+(isFr?'+ Ajouter une réponse':'+ Add answer')+'</button>'+
      '<div style="display:flex;gap:8px">'+
        '<button class="btn btn-primary" onclick="saveCustomQ()" style="flex:1;padding:10px">✓ '+(isFr?'Ajouter':'Add')+'</button>'+
        '<button class="btn btn-ghost btn-sm" onclick="renderBuilder()">'+(isFr?'Annuler':'Cancel')+'</button>'+
      '</div>'+
    '</div>';
  extraCount=0;
}

function addExtra(){
  var extras=$('extra-opts'); if(!extras) return;
  var moreEmojis=['⭐','🔥','💎','🎯','🌈','🚀'];
  var isFr=S.lang==='fr';
  var div=document.createElement('div');
  div.style='display:flex;gap:6px;align-items:center;margin-bottom:6px';
  div.innerHTML='<span style="font-size:18px">'+moreEmojis[extraCount%moreEmojis.length]+'</span>'+
    '<input class="field-input" id="ce-'+extraCount+'" style="padding:8px 10px;font-size:13px" placeholder="'+(isFr?'Réponse...':'Answer...')+'"/>';
  extras.appendChild(div); extraCount++;
}

function saveCustomQ(){
  var isFr=S.lang==='fr';
  var qText=$('cq-inp')&&$('cq-inp').value.trim();
  if(!qText){ if($('cq-inp')) $('cq-inp').classList.add('error'); return; }
  var opts=[]; var emojis=['🔵','🟢','🟡','🔴','⭐','🔥','💎','🎯'];
  [0,1,2,3].forEach(function(i){ var inp=$('co-'+i); if(inp&&inp.value.trim()) opts.push({l:inp.value.trim(),e:emojis[i]}); });
  for(var x=0;x<extraCount;x++){ var inp=$('ce-'+x); if(inp&&inp.value.trim()) opts.push({l:inp.value.trim(),e:emojis[(x+4)%emojis.length]}); }
  if(opts.length<2){ alert(isFr?'Minimum 2 réponses !':'At least 2 answers!'); return; }
  builderQuestions.push({q:qText,opts:opts,_custom:true});
  extraCount=0; renderBuilder();
}

function launchBuilder(){
  var isFr=S.lang==='fr';
  if(builderQuestions.length<1){ alert(isFr?'Ajoute au moins une question !':'Add at least one question!'); return; }
  S.customPool=builderQuestions.slice();
  goHome();
  setTimeout(function(){ var inp=$('p1-name'); if(inp) inp.focus(); },200);
}

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',function(){
  // Restaurer thème
  try{
    var th=localStorage.getItem('tmc_theme');
    if(th){
      S.theme=th;
      document.getElementById('html-root').setAttribute('data-theme',th);
      $('theme-btn').textContent=th==='dark'?'☀️':'🌙';
    }
  }catch(e){}

  // Timer toggle
  var timerToggle=$('timer-toggle');
  if(timerToggle) timerToggle.addEventListener('change',function(){ S.useTimer=this.checked; });

  // Vérifier si on est J2 (URL avec ?g=)
  checkInviteURL();

  // Si pas J2, afficher l'accueil normal
  if(!S.isP2) renderHome();
});
