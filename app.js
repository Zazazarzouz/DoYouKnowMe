/* ═══════════════════════════════════════
   APP.JS — Tu me connais ? v3
═══════════════════════════════════════ */

var S = {
  lang:'fr', theme:'light', mode:'friends', qty:10,
  spicy:false, intensity:'fun', useTimer:true,
  p1name:'', p2name:'',
  pool:[], p1answers:[], p2answers:[],
  current:0, score:0, skipped:0,
  timerInt:null, timeLeft:30,
  isP2:false, customPool:null
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
  S.theme = S.theme==='light'?'dark':'light';
  document.getElementById('html-root').setAttribute('data-theme',S.theme);
  $('theme-btn').textContent = S.theme==='dark'?'☀️':'🌙';
  try{ localStorage.setItem('tmc_theme',S.theme); }catch(e){}
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
  $('t-done-chip').textContent=t('doneChip');
  $('t-share-title').textContent=t('shareTitle');
  $('t-share-sub').textContent=t('shareSub');
  $('copy-btn-el').textContent=t('copyBtn');
  $('t-native-share').textContent=t('shareNative');
  $('t-back-home').textContent=t('backHome');

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
    inp.classList.add('error');
    err.textContent=errorText; err.classList.add('show');
    inp.focus();
    inp.classList.remove('error');
    setTimeout(function(){inp.classList.add('error');},20);
    return false;
  }
  inp.classList.remove('error'); err.classList.remove('show');
  return val;
}

/* ── POOL ── */
function buildPool(mode,qty,lang,spicy,intensity){
  var bank=QDB[lang][mode]['normal'].slice();
  if(spicy && QDB[lang][mode][intensity]) bank=bank.concat(QDB[lang][mode][intensity]);
  for(var i=bank.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=bank[i];bank[i]=bank[j];bank[j]=tmp;}
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
  S.p1name=name; S.p1answers=[]; S.current=0;
  S.pool=S.customPool?S.customPool.slice():buildPool(S.mode,S.qty,S.lang,S.spicy,S.intensity);
  showPage('pg-quiz1');
  renderQ('quiz1-body',false);
}

/* ══════════════════════════════════════
   RENDU QUESTION
══════════════════════════════════════ */
function renderQ(bodyId,isP2){
  var q=S.pool[S.current], total=S.pool.length, pct=(S.current/total)*100;
  var html='<div class="q-header">'+
    '<div class="q-progress-bg"><div class="q-progress-fill" id="qpf" style="width:'+pct+'%"></div></div>'+
    '<div class="q-meta">'+
      '<span class="q-num">'+t('qOf')+' '+(S.current+1)+' / '+total+'</span>'+
      (S.useTimer?'<div class="q-timer-wrap"><svg class="q-timer-svg" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="none" stroke="rgba(128,96,64,.2)" stroke-width="2.5"/><circle id="t-arc" cx="15" cy="15" r="12" fill="none" stroke="var(--a1)" stroke-width="2.5" stroke-dasharray="75.4" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 15 15)" style="transition:stroke-dashoffset 1s linear,stroke .3s"/></svg><span id="t-txt">30</span></div>':'')+
    '</div></div>'+
    (isP2?'<div style="font-size:12px;color:var(--ink2);margin-bottom:.5rem;font-weight:600">👁 '+t('inviteWho')+' <b>'+esc(S.p1name)+'</b></div>':'')+
    '<div class="q-text">'+esc(q.q)+'</div>'+
    '<div class="q-grid" id="q-grid"></div>'+
    '<div class="feedback" id="q-fb"></div>'+
    '<div id="q-actions" style="margin-top:.25rem">'+
      '<button class="btn btn-ghost btn-sm" id="skip-btn" onclick="'+(isP2?'skipQ2()':'skipQ1()')+'">'+t('skip')+' →</button>'+
    '</div>';
  $(bodyId).innerHTML=html;
  var grid=$('q-grid');
  q.opts.forEach(function(opt,i){
    var btn=document.createElement('button');
    btn.className='q-opt'; btn.style.animationDelay=(i*.05)+'s';
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
  clearInterval(S.timerInt); S.p1answers.push(idx);
  document.querySelectorAll('.q-opt').forEach(function(b,i){b.disabled=true;if(i===idx)b.classList.add('chosen');});
  var sb=$('skip-btn'); if(sb) sb.style.display='none';
  setTimeout(function(){nextQ1();},550);
}
function timeUpP1(){ S.p1answers.push(-1); nextQ1(); }
function skipQ1(){ clearInterval(S.timerInt); S.p1answers.push(-1); nextQ1(); }
function nextQ1(){ S.current++; if(S.current>=S.pool.length) showShare(); else renderQ('quiz1-body',false); }

/* ══════════════════════════════════════
   PARTAGE
══════════════════════════════════════ */
function showShare(){
  showPage('pg-share');
  var payload={
    n:S.p1name, m:S.mode, l:S.lang,
    sp:S.spicy, si:S.intensity, ut:S.useTimer,
    qs:S.pool.map(function(q,i){ return {q:q.q,opts:q.opts,a:S.p1answers[i]}; })
  };
  var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  var base=window.location.origin+window.location.pathname.replace(/\/$/,'');
  var url=base+'?g='+encoded;
  $('share-link').value=url;
  var qrWrap=$('qr-wrap'); qrWrap.innerHTML='';
  try{
    new QRCode(qrWrap,{text:url,width:180,height:180,
      colorDark:getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()||'#2C2018',
      colorLight:getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()||'#FBF7F0',
      correctLevel:QRCode.CorrectLevel.M});
  }catch(e){ qrWrap.innerHTML='<p style="font-size:12px;color:var(--ink2)">QR indisponible — utilise le lien</p>'; }
}

function copyLink(){
  var inp=$('share-link'), btn=$('copy-btn-el');
  navigator.clipboard.writeText(inp.value).then(function(){
    btn.textContent=t('copiedBtn'); btn.classList.add('copied');
    setTimeout(function(){btn.textContent=t('copyBtn');btn.classList.remove('copied');},2200);
  }).catch(function(){inp.select();document.execCommand('copy');});
}
function nativeShare(){
  var url=$('share-link').value;
  if(navigator.share) navigator.share({title:t('logo'),text:S.p1name+' t\'a envoyé un quiz !',url:url}).catch(function(){});
  else copyLink();
}

/* ══════════════════════════════════════
   DÉTECTER URL INVITE → PAGE ACCUEIL J2
══════════════════════════════════════ */
function checkInviteURL(){
  var params=new URLSearchParams(window.location.search);
  var g=params.get('g');
  if(!g) return;
  try{
    var data=JSON.parse(decodeURIComponent(escape(atob(g))));
    S.lang=data.l||'fr'; S.p1name=data.n||'?'; S.mode=data.m||'friends';
    S.spicy=data.sp||false; S.intensity=data.si||'fun'; S.useTimer=data.ut!==undefined?data.ut:true;
    S.pool=data.qs.map(function(item){ return {q:item.q,opts:item.opts}; });
    S.p1answers=data.qs.map(function(item){ return item.a; });
    S.p2answers=[]; S.current=0; S.score=0; S.skipped=0; S.isP2=true;
    document.getElementById('html-root').lang=S.lang;
    $('lb-fr').classList.toggle('on',S.lang==='fr');
    $('lb-en').classList.toggle('on',S.lang==='en');
    window.history.replaceState({},'',window.location.pathname);
    showInviteLanding(); // ← Page d'accueil dédiée J2
  }catch(e){ console.warn('URL invalide',e); }
}

/* ══════════════════════════════════════
   PAGE ACCUEIL J2 — interface dédiée
══════════════════════════════════════ */
function showInviteLanding(){
  showPage('pg-invite');
  var d=T[S.lang];
  $('invite-body').innerHTML=
    '<div class="invite-page">'+
      '<span class="invite-avatar">💛</span>'+
      '<div class="invite-title">'+esc(S.p1name)+' '+(S.lang==='fr'?'t\'a envoyé un quiz !':'sent you a quiz!')+' </div>'+
      '<div class="invite-sub">'+(S.lang==='fr'?'Tu vas répondre aux mêmes questions.<br>Le but : deviner les réponses de <b>'+esc(S.p1name)+'</b> !':'You\'ll answer the same questions.<br>Goal: guess <b>'+esc(S.p1name)+'</b>\'s answers!')+'</div>'+
      '<div class="invite-name-wrap">'+
        '<label class="field-label">'+(S.lang==='fr'?'Ton prénom':'Your name')+'</label>'+
        '<input class="field-input" id="p2-name-inp" type="text" maxlength="20" placeholder="'+(S.lang==='fr'?'Ton prénom...':'Your name...')+'"/>'+
        '<div class="field-error" id="p2-name-err"></div>'+
      '</div>'+
      '<button class="btn btn-primary" style="max-width:340px;margin:0 auto" onclick="startP2()">'+
        (S.lang==='fr'?'À moi de jouer →':'Let\'s go →')+
      '</button>'+
    '</div>';
}

/* ══════════════════════════════════════
   J2 — QUIZ
══════════════════════════════════════ */
function startP2(){
  var name=validateName('p2-name-inp','p2-name-err',T[S.lang].p2nameError);
  if(!name) return;
  S.p2name=name; S.p2answers=[]; S.current=0; S.score=0; S.skipped=0;
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
  fb.textContent=ok?t('correct'):t('wrong');
  fb.className='feedback '+(ok?'ok':'ko');
  fb.style.display='block';
  var isLast=S.current>=S.pool.length-1;
  var actions=$('q-actions');
  if(actions) actions.innerHTML='<button class="btn btn-primary" onclick="nextQ2()" style="margin-top:.5rem">'+(isLast?t('seeResult'):t('nextQ'))+'</button>';
}
function timeUpP2(){ S.p2answers.push(-1); S.skipped++; nextQ2(); }
function skipQ2(){ clearInterval(S.timerInt); S.p2answers.push(-1); S.skipped++; nextQ2(); }
function nextQ2(){ S.current++; if(S.current>=S.pool.length) showResult(); else renderQ('quiz2-body',true); }

/* ══════════════════════════════════════
   RÉSULTATS avec niveaux
══════════════════════════════════════ */
var LEVELS = {
  fr:[
    {min:0,max:20,emoji:'👀',label:'Inconnus',color:'#888',msg:'Vous venez à peine de vous rencontrer... ou pas du tout !'},
    {min:21,max:40,emoji:'🤝',label:'Bons voisins',color:'#E8622A',msg:'Il y a encore du boulot, mais c\'est un bon début !'},
    {min:41,max:60,emoji:'😊',label:'Vrais amis',color:'#4A7A5A',msg:'Pas mal ! Vous vous connaissez vraiment bien.'},
    {min:61,max:80,emoji:'🔥',label:'Vous vous lisez',color:'#D9622B',msg:'Impressionnant — vous vous connaissez par cœur !'},
    {min:81,max:100,emoji:'💑',label:'Couple / BFF Goals',color:'#C0362A',msg:'Incroyable. Vous lisez dans les pensées de l\'autre !'}
  ],
  en:[
    {min:0,max:20,emoji:'👀',label:'Strangers',color:'#888',msg:'You just met... or not at all!'},
    {min:21,max:40,emoji:'🤝',label:'Good neighbors',color:'#E8622A',msg:'Still some work to do — but it\'s a start!'},
    {min:41,max:60,emoji:'😊',label:'Real friends',color:'#4A7A5A',msg:'Not bad! You really know each other well.'},
    {min:61,max:80,emoji:'🔥',label:'You read each other',color:'#D9622B',msg:'Impressive — you know each other by heart!'},
    {min:81,max:100,emoji:'💑',label:'Couple / BFF Goals',color:'#C0362A',msg:'Incredible. You can read each other\'s minds!'}
  ]
};

function getLevel(pct){
  var levels=LEVELS[S.lang];
  for(var i=levels.length-1;i>=0;i--){ if(pct>=levels[i].min) return levels[i]; }
  return levels[0];
}

function showResult(){
  showPage('pg-result');
  var pct=S.pool.length>0?Math.round((S.score/S.pool.length)*100):0;
  var level=getLevel(pct);

  var reviewHTML='';
  S.pool.forEach(function(q,i){
    var p1a=S.p1answers[i], p2a=S.p2answers[i];
    var ok=(p1a===p2a && p1a!==-1 && p2a!==-1);
    var p1l=p1a>=0?q.opts[p1a].e+' '+q.opts[p1a].l:'—';
    var p2l=p2a>=0?q.opts[p2a].e+' '+q.opts[p2a].l:'—';
    reviewHTML+='<div class="ar-row"><div class="ar-icon">'+(ok?'✅':'❌')+'</div>'+
      '<div class="ar-q">'+esc(q.q)+'<div class="ar-ans">'+esc(S.p1name)+' : '+esc(p1l)+' · '+esc(S.p2name)+' : '+esc(p2l)+'</div></div></div>';
  });

  $('result-body').innerHTML=
    '<div class="result-hero">'+
      '<span class="result-emoji">'+level.emoji+'</span>'+
      '<div class="result-pct">'+pct+'%</div>'+
      '<div class="result-name">'+esc(S.p2name)+' → '+esc(S.p1name)+'</div>'+
      '<div class="result-level" style="background:'+level.color+'22;color:'+level.color+'">'+level.emoji+' '+level.label+'</div>'+
      '<div class="result-msg">'+esc(level.msg)+'</div>'+
    '</div>'+
    '<div class="result-bar-wrap">'+
      '<div class="result-bar-label"><span>'+(S.lang==='fr'?'Score de connaissance':'Knowledge score')+'</span><span>'+S.score+' / '+S.pool.length+'</span></div>'+
      '<div class="result-bar-bg"><div class="result-bar-fill" id="r-bar" style="width:0%"></div></div>'+
    '</div>'+
    '<div class="result-grid">'+
      '<div class="rg-card"><div class="rg-val" style="color:var(--a2)">'+S.score+'</div><div class="rg-lbl">'+(S.lang==='fr'?'Correctes':'Correct')+'</div></div>'+
      '<div class="rg-card"><div class="rg-val" style="color:#C04040">'+(S.pool.length-S.score-S.skipped)+'</div><div class="rg-lbl">'+(S.lang==='fr'?'Ratées':'Wrong')+'</div></div>'+
      '<div class="rg-card"><div class="rg-val">'+S.skipped+'</div><div class="rg-lbl">'+(S.lang==='fr'?'Passées':'Skipped')+'</div></div>'+
    '</div>'+
    '<hr class="div"/>'+
    '<div style="margin-bottom:.75rem;font-weight:800;font-size:15px">'+(S.lang==='fr'?'Récap des réponses':'Answer recap')+'</div>'+
    reviewHTML+
    '<hr class="div"/>'+
    '<div style="background:var(--a2t);border:1.5px solid var(--a2);border-radius:var(--r);padding:1rem;margin-bottom:1rem;font-size:14px;line-height:1.5">'+
      '↔ '+(S.lang==='fr'?'Envie d\'inverser les rôles ?':'Want to switch roles?')+' <b>'+(S.lang==='fr'?'Laisse ':'')+esc(S.p1name)+(S.lang==='fr'?' deviner maintenant !':' can now guess your answers!')+' </b>'+
    '</div>'+
    '<button class="btn btn-primary" onclick="invertRoles()">'+(S.lang==='fr'?'↔ Inverser les rôles':'↔ Switch roles')+'</button>'+
    '<button class="btn btn-secondary" onclick="goHome()">'+(S.lang==='fr'?'← Nouvelle partie':'← New game')+'</button>';

  setTimeout(function(){ var bar=$('r-bar'); if(bar) bar.style.width=pct+'%'; },200);
}

/* ── INVERSION ── */
function invertRoles(){
  var prevP1=S.p1name, prevP2=S.p2name;
  var prevP2answers=S.p2answers.slice(), prevPool=S.pool.slice();
  S.p1name=prevP2; S.p2name=prevP1;
  S.p1answers=prevP2answers; S.pool=prevPool;
  S.p2answers=[]; S.current=0; S.score=0; S.skipped=0; S.isP2=true;
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
  var presets=QDB[S.lang]['friends']['normal'].slice(0,8);
  var presetsHTML=presets.map(function(q,i){
    var isAdded=builderQuestions.some(function(bq){return bq.q===q.q;});
    return '<div class="ar-row" style="cursor:pointer" onclick="togglePreset('+i+','+isAdded+')">'+
      '<div class="ar-icon">'+(isAdded?'✅':'➕')+'</div>'+
      '<div class="ar-q">'+esc(q.q)+'</div></div>';
  }).join('');

  $('builder-body').innerHTML=
    '<br><b style="font-size:18px;font-weight:800">'+(S.lang==='fr'?'Crée ton quiz perso':'Create your quiz')+'</b>'+
    '<p style="font-size:13px;color:var(--ink2);margin:.5rem 0 1.25rem;line-height:1.5">'+(S.lang==='fr'?'Ajoute des questions prédéfinies ou écris les tiennes.':'Add preset questions or write your own.')+'</p>'+
    '<div class="builder-section"><div class="builder-section-title">'+(S.lang==='fr'?'Questions prédéfinies':'Preset questions')+'</div>'+presetsHTML+'</div>'+
    '<div class="builder-section">'+
      '<div class="builder-section-title">'+(S.lang==='fr'?'Question personnalisée':'Custom question')+'</div>'+
      '<div id="custom-form"></div>'+
      '<button class="add-q-btn" onclick="showCustomForm()">'+(S.lang==='fr'?'+ Ajouter une question':'+ Add a question')+'</button>'+
    '</div>'+
    '<hr class="div"/>'+
    '<p style="font-size:13px;color:var(--ink2);margin-bottom:1rem">'+builderQuestions.length+' question(s)</p>'+
    '<button class="btn btn-primary" onclick="launchBuilder()">'+(S.lang==='fr'?'Lancer ce quiz →':'Launch this quiz →')+'</button>'+
    '<button class="btn btn-secondary" onclick="goHome()">'+(S.lang==='fr'?'← Retour':'← Back')+'</button>';
}

function togglePreset(idx,isAdded){
  var q=QDB[S.lang]['friends']['normal'][idx];
  if(isAdded) builderQuestions=builderQuestions.filter(function(bq){return bq.q!==q.q;});
  else builderQuestions.push({q:q.q,opts:q.opts});
  renderBuilder();
}

var extraCount=0;
function showCustomForm(){
  var form=$('custom-form'); if(!form) return;
  var emojis=['🔵','🟢','🟡','🔴'];
  var optsHTML=emojis.map(function(e,i){
    return '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">'+
      '<span style="font-size:18px">'+e+'</span>'+
      '<input class="field-input" id="co-'+i+'" style="padding:8px 10px;font-size:13px" placeholder="'+(S.lang==='fr'?'Réponse...':'Answer...')+'"/></div>';
  }).join('');
  form.innerHTML='<div style="background:var(--paper2);border:1.5px solid var(--line2);border-radius:var(--r);padding:1rem;margin-bottom:.75rem">'+
    '<input class="field-input" id="cq-inp" style="margin-bottom:.75rem" placeholder="'+(S.lang==='fr'?'Ta question...':'Your question...')+'"/>'+
    optsHTML+'<div id="extra-opts"></div>'+
    '<button type="button" class="add-q-btn" style="margin-bottom:.75rem" onclick="addExtra()">'+(S.lang==='fr'?'+ Ajouter une réponse':'+ Add answer')+'</button>'+
    '<div style="display:flex;gap:8px">'+
      '<button class="btn btn-primary" onclick="saveCustomQ()" style="flex:1;padding:10px">✓ '+(S.lang==='fr'?'Ajouter':'Add')+'</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="renderBuilder()">'+(S.lang==='fr'?'Annuler':'Cancel')+'</button>'+
    '</div></div>';
  extraCount=0;
}

function addExtra(){
  var extras=$('extra-opts'); if(!extras) return;
  var moreEmojis=['⭐','🔥','💎','🎯','🌈','🚀'];
  var div=document.createElement('div');
  div.style='display:flex;gap:6px;align-items:center;margin-bottom:6px';
  div.innerHTML='<span style="font-size:18px">'+moreEmojis[extraCount%moreEmojis.length]+'</span>'+
    '<input class="field-input" id="ce-'+extraCount+'" style="padding:8px 10px;font-size:13px" placeholder="'+(S.lang==='fr'?'Réponse...':'Answer...')+'"/>';
  extras.appendChild(div); extraCount++;
}

function saveCustomQ(){
  var qText=$('cq-inp')&&$('cq-inp').value.trim();
  if(!qText){if($('cq-inp'))$('cq-inp').classList.add('error');return;}
  var opts=[]; var emojis=['🔵','🟢','🟡','🔴','⭐','🔥','💎','🎯'];
  [0,1,2,3].forEach(function(i){var inp=$('co-'+i);if(inp&&inp.value.trim()) opts.push({l:inp.value.trim(),e:emojis[i]});});
  for(var x=0;x<extraCount;x++){var inp=$('ce-'+x);if(inp&&inp.value.trim()) opts.push({l:inp.value.trim(),e:emojis[(x+4)%emojis.length]});}
  if(opts.length<2){alert(S.lang==='fr'?'Minimum 2 réponses !':'At least 2 answers!');return;}
  builderQuestions.push({q:qText,opts:opts,_custom:true}); extraCount=0;
  renderBuilder();
}

function launchBuilder(){
  if(builderQuestions.length<1){alert(S.lang==='fr'?'Ajoute au moins une question !':'Add at least one question!');return;}
  S.customPool=builderQuestions.slice(); goHome();
  setTimeout(function(){$('p1-name')&&$('p1-name').focus();},200);
}

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',function(){
  try{ var th=localStorage.getItem('tmc_theme'); if(th){S.theme=th;document.getElementById('html-root').setAttribute('data-theme',th);$('theme-btn').textContent=th==='dark'?'☀️':'🌙';} }catch(e){}
  $('timer-toggle').addEventListener('change',function(){S.useTimer=this.checked;});
  renderHome();
  checkInviteURL();
});
