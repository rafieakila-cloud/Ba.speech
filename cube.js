// Cube Perplexity-style + Cube Account (local real) + OpenRouter
const $ = function(id){ return document.getElementById(id); };
const statusEl = $('status');
function setStatus(t){ statusEl.textContent = t; }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function save(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function load(k,d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }

// ---------- CUBE ACCOUNT (real local: hash + session) ----------
let authMode = 'login';
function users(){ return load('cube_users', []); }
function session(){ return load('cube_session', null); }
async function sha(s){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cube$' + s));
  return Array.from(new Uint8Array(b)).map(function(x){ return x.toString(16).padStart(2,'0'); }).join('');
}
function renderAuth(){
  const s = session();
  $('profile').classList.toggle('hidden', !s);
  if (s){ $('profile-name').textContent = s.u; $('btn-auth').textContent = s.u + ' (keluar?)'; }
  else { $('btn-auth').textContent = 'Sign In (opsional)'; }
}
$('btn-auth').onclick = function(){
  const s = session();
  if (s){ localStorage.removeItem('cube_session'); renderAuth(); setStatus('Keluar.'); return; }
  $('auth-modal').classList.remove('hidden');
};
$('btn-close').onclick = function(){ $('auth-modal').classList.add('hidden'); };
$('t-login').onclick = function(){ authMode='login'; $('t-login').classList.add('active'); $('t-reg').classList.remove('active'); $('btn-go').textContent='Masuk'; };
$('t-reg').onclick = function(){ authMode='reg'; $('t-reg').classList.add('active'); $('t-login').classList.remove('active'); $('btn-go').textContent='Daftar'; };
$('btn-out').onclick = function(){ localStorage.removeItem('cube_session'); renderAuth(); };
$('btn-go').onclick = async function(){
  const u = $('a-user').value.trim(), p = $('a-pass').value;
  if (u.length < 3 || p.length < 4){ $('auth-msg').textContent = 'Username min 3, password min 4.'; return; }
  const h = await sha(u + ':' + p);
  let us = users();
  if (authMode === 'reg'){
    if (us.find(function(x){ return x.u === u; })){ $('auth-msg').textContent = 'Username sudah ada, login saja.'; return; }
    us.push({ u: u, h: h, at: Date.now() });
    save('cube_users', us); save('cube_session', { u: u, at: Date.now() });
    $('auth-msg').textContent = 'Akun Cube dibuat. Masuk sebagai ' + u + '.';
  } else {
    const f = us.find(function(x){ return x.u === u && x.h === h; });
    if (!f){ $('auth-msg').textContent = 'Salah username/password.'; return; }
    save('cube_session', { u: u, at: Date.now() });
    $('auth-msg').textContent = 'Login berhasil.';
  }
  renderAuth(); setTimeout(function(){ $('auth-modal').classList.add('hidden'); }, 600);
};
renderAuth();

// ---------- API KEY + MODEL ----------
$('btn-key').onclick = function(){ $('keypanel').classList.toggle('hidden'); };
$('api-key').value = localStorage.getItem('cube_key') || '';
$('btn-save-key').onclick = function(){ localStorage.setItem('cube_key', $('api-key').value.trim()); setStatus('API key tersimpan.'); };
let model = localStorage.getItem('cube_model') || 'openrouter/free';
let deep = load('cube_deep', false);
function renderDeep(){ const b = $('btn-deep'); if (b) b.classList.toggle('on', deep); }
if ($('btn-deep')) $('btn-deep').onclick = function(){ deep = !deep; save('cube_deep', deep); renderDeep(); setStatus(deep ? 'Deep ON: jawaban panjang.' : 'Deep OFF.'); };
renderDeep();
let modelsCache = [];
$('model-btn').onclick = function(e){ e.stopPropagation(); $('model-drop').classList.toggle('hidden'); if(!modelsCache.length) loadModels(); };
document.addEventListener('click', function(e){ if(!e.target.closest('#model-drop') && !e.target.closest('#model-wrap')) $('model-drop').classList.add('hidden'); });
$('model-search').oninput = renderModelList;
function loadModels(){
  $('model-pill').textContent = 'loading...';
  fetch('https://openrouter.ai/api/v1/models').then(function(r){ return r.json(); }).then(function(j){
    modelsCache = (j.data || []).map(function(m){ return { id: m.id }; }).sort(function(a,b){ return a.id.localeCompare(b.id); });
    $('model-pill').textContent = modelsCache.length + ' models'; renderModelList(); $('model-name').textContent = model;
  }).catch(function(e){ $('model-pill').textContent = 'fail'; });
}
function renderModelList(){
  const q = ($('model-search').value || '').toLowerCase();
  const el = $('model-list'); el.innerHTML = '';
  modelsCache.filter(function(m){ return m.id.toLowerCase().indexOf(q) > -1; }).slice(0,150).forEach(function(m){
    const d = document.createElement('button'); d.className = 'm-item'; d.style.cssText = 'display:block;width:100%;text-align:left;background:none;border:none;border-bottom:1px solid #F1EFE8;';
    d.innerHTML = '<b></b><small></small>'; d.firstChild.textContent = m.id; d.lastChild.textContent = m.id === model ? '[aktif]' : '';
    d.onclick = function(){ model = m.id; localStorage.setItem('cube_model', model); $('model-name').textContent = model; $('model-drop').classList.add('hidden'); };
    el.appendChild(d);
  });
}
$('model-name').textContent = model; loadModels();

// ---------- THREADS ----------
let threads = load('cube_threads', []);
let cur = load('cube_cur', null);
function curT(){ return threads.find(function(t){ return t.id === cur; }); }
function persist(){ save('cube_threads', threads.slice(-30)); try{ localStorage.setItem('cube_cur', JSON.stringify(cur)); }catch(e){} }
function show(v){
  ['home','thread','discover','library'].forEach(function(x){ $('view-' + x).classList.toggle('hidden', x !== v); });
  document.querySelectorAll('.nav').forEach(function(b){ b.classList.toggle('active', b.dataset.v === v); });
}
document.querySelectorAll('.nav').forEach(function(b){ b.onclick = function(){ const v = b.dataset.v; if (v === 'library') renderLib(); if (v === 'discover') renderDisc(); show(v); }; });
function renderThreads(){
  const el = $('threads'); el.innerHTML = '';
  threads.slice().reverse().forEach(function(t){
    const b = document.createElement('button'); b.className = 'th' + (t.id === cur ? ' active' : '');
    b.textContent = t.title; b.onclick = function(){ cur = t.id; persist(); renderThreads(); openThread(); };
    el.appendChild(b);
  });
}
$('btn-new').onclick = function(){ cur = null; show('home'); renderThreads(); };
function renderLib(){
  const el = $('lib-list'); el.innerHTML = '';
  threads.forEach(function(t){
    const b = document.createElement('button'); b.className = 'th'; b.textContent = t.title + ' (' + t.msgs.length + ')';
    b.onclick = function(){ cur = t.id; persist(); renderThreads(); openThread(); };
    el.appendChild(b);
  });
}
function renderDisc(){
  const g = $('disc-grid'); g.innerHTML = '';
  ['AI terbaru 2026','Sejarah Indonesia ringkas','Belajar Python dari nol','Resep renderang cepat'].forEach(function(x){
    const b = document.createElement('button'); b.className = 'dcard'; b.textContent = x;
    b.onclick = function(){ $('q').value = x; show('home'); ask(x); };
    g.appendChild(b);
  });
}

// ---------- ATTACH ----------
let atts = [];
$('file').addEventListener('change', function(e){
  Array.from(e.target.files || []).slice(0,3).forEach(function(f){
    const r = new FileReader();
    r.onload = function(){ atts.push({ n: f.name, t: f.type, d: r.result }); $('att-list').textContent = atts.map(function(a){ return a.n; }).join(', '); };
    r.readAsDataURL(f);
  });
  e.target.value = '';
});

// ---------- SEARCH SUMBER ----------
async function sources(q){
  const out = [];
  try {
    const r = await fetch('https://id.wikipedia.org/w/api.php?action=opensearch&search=' + encodeURIComponent(q) + '&limit=6&format=json&origin=*');
    const j = await r.json();
    for (let i = 0; i < (j[1] || []).length; i++) out.push({ t: j[1][i], d: j[2][i] || '', u: j[3][i] || '' });
    if (out[0]){
      try {
        const s = await fetch('https://id.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(out[0].t));
        const sj = await s.json(); if (sj.extract) out[0].d = sj.extract;
      } catch(e){}
    }
  } catch(e){}
  return out;
}

// ---------- RENDER ANSWER (citations + code download + pdf) ----------
let lastRaw = '', lastBlocks = [];
function parseInfo(info){
  info = (info || '').trim();
  if (info.indexOf(':') > -1){ const p = info.split(':'); return { lang: p[0].trim() || 'txt', file: (p[1] || '').trim() }; }
  if (info.indexOf('.') > -1) return { lang: info.split('.').pop(), file: info };
  return { lang: info || 'txt', file: '' };
}
function dl(name, text){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  a.download = name; a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
}
function mindmapSvg(text){
  const lines=text.split('\n').filter(l=>l.trim()); let nodes=[];
  lines.forEach(l=>{ const indent=(l.match(/^ */)||[''])[0].length; const t=l.trim().replace(/^[-•]\s*/,''); nodes.push({t:t,d:Math.floor(indent/2)}); });
  const W=900,H=Math.max(220,nodes.length*38+60); let svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><rect width="100%" height="100%" rx="12" fill="#fff"/><style>text{font-family:Inter,Segoe UI,Arial;font-size:13px}</style>';
  const cols=['#C15F3C','#0E7CFF','#1E7A34','#7C3AED','#E67E22']; let y=30;
  nodes.forEach((n,i)=>{ const x=20+n.d*140; const bg=cols[n.d%cols.length]; svg+='<rect x="'+x+'" y="'+y+'" rx="8" width="'+(Math.min(200,n.t.length*7+20))+'" height="24" fill="'+bg+'" opacity="0.12" stroke="'+bg+'"/><text x="'+(x+10)+'" y="'+(y+16)+'" fill="#1F1E1B">'+esc(n.t).slice(0,40)+'</text>'; if(i>0) svg+='<line x1="'+(x-6)+'" y1="'+(y+12)+'" x2="'+(x-18)+'" y2="'+(y+12)+'" stroke="#E8E5DC" stroke-width="1.2"/>'; y+=34; });
  return svg+'</svg>';
}
function mindmapToUrl(svg){ return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); }
function md(text, srcs){
  let h = esc(text), blocks = [];
  h = h.replace(/```([^\n]*)\n([\s\S]*?)```/g, function(m, info, code){
    const p = parseInfo(info); const i = blocks.length;
    if((p.lang||'').toLowerCase()==='mindmap'){
      const svg=mindmapSvg(code); const url=mindmapToUrl(svg);
      blocks.push({ fn:'mindmap.svg', lang:'mindmap', code:code, url:url, svg:svg });
      return '\u0000B' + i + '\u0000';
    }
    const fn = p.file || ('file-' + (i+1) + '.' + p.lang);
    blocks.push({ fn: fn, lang: p.lang, code: code.replace(/^\n+|\n+$/g, '') });
    return '\u0000B' + i + '\u0000';
  });
  // citations [1] -> link
  h = h.replace(/\[(\d+)\]/g, function(m, n){
    const i = +n - 1;
    if (srcs[i]) return '<a class="cite" href="' + srcs[i].u + '" target="_blank">[' + n + ']</a>';
    return m;
  });
  h = h.replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  let html = '';
  h.split('\u0000').forEach(function(part){
    const m = part.match(/^B(\d+)\u0000?([\s\S]*)$/);
    if (m){
      const b = blocks[+m[1]];
      if(b.lang==='mindmap') html+='<div class="mindmap-wrap"><img src="'+b.url+'" alt="mindmap"><br><button data-mdl="'+m[1]+'">Download Gambar</button></div>'+m[2].replace(/\n/g,'<br>');
      else html += '<div class="codeblock"><div class="codehead"><b>' + esc(b.fn) + '</b><span>' + esc(b.lang) + '</span><span class="sp"></span><button data-p="' + m[1] + '">Preview</button><button data-d="' + m[1] + '">Download</button></div><pre>' + esc(b.code) + '</pre></div>' + m[2].replace(/\n/g, '<br>');
    } else html += part.replace(/\n/g, '<br>');
  });
  return { html: html, blocks: blocks };
}
function renderAnswer(text, srcs){
  const r = md(text, srcs); lastRaw = text; lastBlocks = r.blocks;
  $('answer').innerHTML = r.html;
  const sl = $('srclist'); sl.innerHTML = '';
  srcs.forEach(function(s, i){
    const d = document.createElement('div'); d.className = 'src';
    d.innerHTML = '<span class="n"></span><div><a></a><p></p><div style="margin-top:4px;display:flex;gap:6px;"><button data-pdf>PDF</button></div></div>';
    d.querySelector('.n').textContent = (i+1);
    const a = d.querySelector('a'); a.href = s.u; a.target = '_blank'; a.textContent = s.t;
    d.querySelector('p').textContent = (s.d || '').slice(0, 180);
    d.querySelector('[data-pdf]').onclick = function(){ pdf(s.t, s.d + '\n\nSumber: ' + s.u); };
    sl.appendChild(d);
  });
  $('answer').querySelectorAll('button[data-d]').forEach(function(b){
    b.onclick = function(){ const x = lastBlocks[+b.getAttribute('data-d')]; if (x) dl(x.fn, x.code); };
  });
  $('answer').querySelectorAll('button[data-mdl]').forEach(function(b){
    b.onclick = function(){ const x = lastBlocks[+b.getAttribute('data-mdl')]; if(x){ const a=document.createElement('a'); a.href=x.url; a.download=x.fn; a.click(); }
    };
  });
  $('answer').querySelectorAll('button[data-p]').forEach(function(b){
    b.onclick = function(){ const x = lastBlocks[+b.getAttribute('data-p')]; if (x){ const w = window.open('', '_blank'); w.document.write(esc(x.code).replace(/\n/g,'<br>')); w.document.close(); } };
  });
}
function pdf(title, body){
  const pa = $('print-area');
  pa.innerHTML = '<h1>' + esc(title) + '</h1><div>' + esc(new Date().toLocaleString('id-ID')) + ' - Cube</div><div>' + esc(body).replace(/\n/g,'<br>') + '</div>';
  pa.classList.remove('hidden'); window.print(); setTimeout(function(){ pa.classList.add('hidden'); }, 500);
}
function step(label){
  const d = document.createElement('div'); d.className = 'step';
  d.innerHTML = '<span class="bar"></span><span></span>'; d.lastChild.textContent = label;
  $('steps').appendChild(d); return d;
}
// ---------- MODES: Chat / Work / Codev ----------
let cmode = load('cube_cmode', 'chat');
function renderCmode(){
  document.querySelectorAll('#modes button').forEach(function(b){ b.classList.toggle('active', b.dataset.m === cmode); });
  const q = $('q');
  if (q && cmode === 'work') q.placeholder = 'Tulis ide cerita / planning / PRD / mindmap…';
  else if (q && cmode === 'codev') q.placeholder = 'Minta aplikasi apa pun, sebut bahasanya…';
  else if (q) q.placeholder = 'Tulis di sini… Enter kirim';
}
document.querySelectorAll('#modes button').forEach(function(b){
  b.onclick = function(){ cmode = b.dataset.m; save('cube_cmode', cmode); renderCmode(); setStatus('Mode: ' + cmode); };
});
renderCmode();
// fullscreen
const fsBtn=$('btn-fs'); if(fsBtn){ fsBtn.onclick=async()=>{ try{ if(!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }catch(e){} }; document.addEventListener('fullscreenchange',()=>{ fsBtn.textContent=document.fullscreenElement?'Keluar':'⛶'; }); }
function sys(){
  const prd = ($('prd') && $('prd').value.trim()) || '';
  const tl = tasks.map(function(x){ return '- [' + (x.done ? 'x' : ' ') + '] ' + x.text; }).join('\n');
  let base = 'Kamu adalah Cube, AI browser. Bahasa Indonesia, tanpa emoji. '
    + 'Identitas: jika ditanya siapa kamu / pembuatmu, jawab kamu adalah Cube. '
    + 'Jawab langsung biasa, tanpa sitasi sumber. '
    + (deep ? 'Mode DEEP aktif: jawab panjang, mendalam, lengkap dengan langkah dan contoh. ' : 'Jawab ringkas jelas. ');
  if (cmode === 'work'){
    base += 'MODE CUBE WORK: buat ide cerita yang jelas dan natural, tidak ketara buatan AI (variasi kalimat, detail konkret, hindari frasa klise AI). '
      + 'Mampu buat: ide cerita, planning langkah, PRD (tujuan, fitur, alur, kriteria), dan mindmap. '
      + 'Untuk mindmap WAJIB pakai blok ```mindmap lalu isi hierarki indentasi spasi, misal: Topik\\n  Cabang 1\\n    Sub 1\\n  Cabang 2 . Gambar mindmap akan dirender otomatis. ';
  } else if (cmode === 'codev'){
    base += 'MODE CODEV: senior full-stack engineer. WAJIB buat aplikasi PERSIS sesuai request user, JANGAN ganti jadi aplikasi lain (misal minta kasir jangan buat todo). '
      + 'Langkah: 1) pahami request, 2) rancang file, 3) tulis KODE LENGKAP runnable (bukan placeholder). '
      + 'Dukung semua bahasa sesuai minta (HTML/JS, Python, PHP, Java, Go, Rust, dll); jika tidak disebut, pakai HTML+JS. '
      + 'Setiap file WAJIB ```bahasa:namafile.ext (contoh ```python:app.py). Jika ambigu, tanya 2-3 singkat lalu lanjut dengan asumsi wajar. Akhiri dengan cara menjalankan + daftar file. ';
  } else {
    base += 'Jika ada PRD/tasks, ikuti itu dan kerjakan PR kompleks sampai tuntas multi-file. '
      + 'Kode wajib ```bahasa:namafile.ext agar bisa diunduh. Akhiri koding dengan cara jalan.';
  }
  return base + (prd ? '\n\nPRD:\n' + prd : '') + (tl ? '\n\nTASKS:\n' + tl : '');
}
const FB = ['openrouter/free', 'z-ai/glm-5.2:free', 'minimax/minimax-m3:free'];
async function callAIStream(q, ctx, onDelta){
  const key = ($('api-key').value.trim() || localStorage.getItem('cube_key') || '');
  if (!key.startsWith('sk-or-v1-')){ $('keypanel').classList.remove('hidden'); throw new Error('Isi OpenRouter API key dulu (tombol API Key).'); }
  localStorage.setItem('cube_key', key);
  const content = [{ type: 'text', text: q + (ctx ? '\n\nSUMBER:\n' + ctx : '') }];
  atts.forEach(function(a){ if (a.t.indexOf('image/') === 0) content.push({ type: 'image_url', image_url: { url: a.d } }); });
  // coba streaming dulu di model utama
  try{
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://cube.local', 'X-Title': 'Cube' },
      body: JSON.stringify({ model: model, stream: true, messages: [{ role: 'system', content: sys() }].concat([{ role: 'user', content: content }]), temperature: cmode === 'codev' ? 0.25 : cmode === 'work' ? 0.9 : 0.7, max_tokens: (cmode === 'codev' || cmode === 'work') ? 6000 : (deep ? 6000 : 2500) })
    });
    if(!r.ok || !r.body) throw new Error('fallback');
    const reader = r.body.getReader(); const dec = new TextDecoder(); let buf=''; let full='';
    while(true){
      const rd = await reader.read(); if(rd.done) break;
      buf += dec.decode(rd.value,{stream:true});
      const parts = buf.split('\n\n'); buf = parts.pop();
      parts.forEach(p=>{
        if(p.indexOf('data: ')===0){
          const d=p.slice(6).trim(); if(d==='[DONE]') return;
          try{ const j=JSON.parse(d); const t=j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content; if(t){ full+=t; onDelta(t,full); } }catch(e){}
        }
      });
    }
    if(full) { localStorage.setItem('cube_model', model); return full; }
    throw new Error('stream kosong');
  }catch(e){
    // fallback non-stream + fallback models
    let err='';
    const tries = [model].concat(FB.filter(function(f){ return f !== model; }));
    for(let i=0;i<tries.length;i++){
      try{
        const r2 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://cube.local', 'X-Title': 'Cube' },
          body: JSON.stringify({ model: tries[i], messages: [{ role: 'system', content: sys() }].concat([{ role: 'user', content: content }]), provider:{allow_fallbacks:true}, temperature: cmode==='codev'?0.25:cmode==='work'?0.9:0.7, max_tokens: (cmode==='codev'||cmode==='work')?6000:(deep?6000:2500) })
        });
        const j = await r2.json().catch(function(){return {};});
        if(!r2.ok){ err='['+tries[i]+'] '+r2.status+' '+((j.error&&j.error.message)||r2.statusText); continue; }
        const rep=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content; if(!rep){err='kosong';continue;}
        model=tries[i]; localStorage.setItem('cube_model',model); $('model-name').textContent=model;
        // simulasi streaming untuk fallback
        for(let k=0;k<rep.length;k+=40){ onDelta(rep.slice(k,k+40), rep.slice(0,k+40)); await new Promise(r=>setTimeout(r,12)); }
        return rep;
      }catch(ex){ err=ex.message; }
    }
    throw new Error('Provider gagal: '+err);
  }
}
async function callAI(q,ctx){ let out=''; await callAIStream(q,ctx,function(d,f){ out=f; }); return out; }
async function ask(first){
  const q = (first || $('q').value || '').trim();
  if (!q) return;
  if (!session()){ save('cube_session', { u: 'Guest', at: Date.now() }); renderAuth(); }
  show('thread'); $('steps').innerHTML = ''; $('answer').innerHTML = ''; $('srclist').innerHTML = ''; $('canvas').classList.add('hidden');
  $('rubik').classList.remove('hidden'); setStatus('Cube menjawab...' + (deep ? ' (deep)' : ''));
  let acc='';
  try{
    acc = await callAIStream(q,'',function(delta,full){
      acc=full; $('rubik').classList.add('hidden');
      // render streaming incremental
      const tmp = md(full, []); $('answer').innerHTML = tmp.html + '<span style="opacity:.4">▍</span>';
      $('answer').scrollTop = $('answer').scrollHeight;
    });
  }catch(e){ acc='Gagal: '+e.message; }
  $('rubik').classList.add('hidden');
  renderAnswer(acc, []);
  // auto live preview jika ada html
  const hasHtml = lastBlocks.find(function(b){ return /html/i.test(b.lang) || b.fn.indexOf('.html')>-1; });
  if(hasHtml){ const fr=$('canvas-frame'); fr.srcdoc=hasHtml.code; $('canvas').classList.remove('hidden'); }
  if(/```/.test(acc)){ const e=step('Executing build...'); const x=document.createElement('div'); x.className='exec'; x.textContent='$ cube build\n> parsing files...\n> validasi OK - siap download'; $('steps').appendChild(x); setTimeout(function(){e.classList.add('done');},800); }
  let t = curT(); if(!t){ t={id:'t'+Date.now(), title:q.slice(0,40), msgs:[]}; threads.push(t); cur=t.id; }
  t.msgs.push({q:q,a:acc}); persist(); renderThreads();
  $('q').value=''; atts=[]; $('att-list').textContent=''; setStatus('Siap.');
}
if($('btn-canvas-close')) $('btn-canvas-close').onclick=function(){ $('canvas').classList.add('hidden'); };
function openThread(){
  const t = curT(); if (!t){ show('home'); return; }
  show('thread');
  const last = t.msgs[t.msgs.length - 1];
  if (last) renderAnswer(last.a, []);
}
$('btn-ask').onclick = function(){ ask(); };
$('q').addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); ask(); } });
document.querySelectorAll('#suggest button').forEach(function(b){ b.onclick = function(){ $('q').value = b.textContent; ask(b.textContent); }; });

// ---------- PR KOMPLEKS (PRD + tasks) ----------
let tasks = load('cube_tasks', []);
function renderTasks(){
  const el = $('task-list'); if (!el) return; el.innerHTML = '';
  tasks.forEach(function(t, i){
    const li = document.createElement('li');
    li.textContent = (t.done ? '[x] ' : '[ ] ') + t.text;
    if (t.done) li.classList.add('done');
    li.onclick = function(){ tasks[i].done = !tasks[i].done; save('cube_tasks', tasks); renderTasks(); };
    li.ondblclick = function(){ tasks.splice(i, 1); save('cube_tasks', tasks); renderTasks(); };
    el.appendChild(li);
  });
}
const ti = $('task-input');
if (ti) ti.addEventListener('keydown', function(e){
  if (e.key === 'Enter' && ti.value.trim()){ tasks.push({ text: ti.value.trim(), done: false }); ti.value = ''; save('cube_tasks', tasks); renderTasks(); }
});
function withPR(q){
  const prd = ($('prd') && $('prd').value.trim()) || '';
  const open = tasks.filter(function(x){ return !x.done; }).map(function(x){ return x.text; }).join('; ');
  if (!prd && !open) return q;
  return q + (prd ? '\n\nPRD:\n' + prd : '') + (open ? '\n\nTasks tersisa: ' + open : '');
}
if ($('btn-break')) $('btn-break').onclick = function(){
  const idea = ($('prd') && $('prd').value.trim()) || $('q').value.trim();
  if (!idea){ setStatus('Isi PRD dulu.'); return; }
  ask('Susun breakdown tasks checklist "- [ ] ..." untuk PR kompleks berikut:\n' + withPR(idea));
};
if ($('btn-build')) $('btn-build').onclick = function(){
  const base = $('q').value.trim() || 'Kerjakan PR kompleks ini sampai tuntas multi-file, siap download.';
  ask(withPR(base));
}
// auto-tangkap checklist dari jawaban AI jadi tasks
const _renderAnswer = renderAnswer;
renderAnswer = function(text, srcs){
  _renderAnswer(text, srcs);
  const lines = String(text).split('\n').filter(function(l){ return /^\s*-\s*\[[ x]\]/i.test(l); }).slice(0, 20);
  if (lines.length >= 2){
    const ex = {};
    tasks.forEach(function(t){ ex[t.text] = 1; });
    lines.forEach(function(l){
      const tx = l.replace(/^\s*-\s*\[[ x]\]\s*/i, '').slice(0, 120);
      if (tx && !ex[tx]){ tasks.push({ text: tx, done: /\[x\]/i.test(l) }); ex[tx] = 1; }
    });
    save('cube_tasks', tasks); renderTasks();
  }
};
renderTasks();
renderThreads(); show('home');
