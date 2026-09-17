// Bacapi — kernel Bacium V5.6 (chat/work/codev + plugins + gambar + streaming)
window.addEventListener('error',function(e){ try{ var s=document.getElementById('status'); if(s)s.textContent='[ERR] '+(e.message||'unknown'); }catch(_){} });
const BUILD='V5.6-20260917c';
const $ = function(id){ return document.getElementById(id); };
const KERNEL = 'Bacium V5.6';
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function save(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function load(k,d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } }
function setStatus(t){ $('status').textContent = '[' + KERNEL + '] ' + t; }

// ---------- AKUN (shared cube_users/cube_session) ----------
let authMode='login';
function users(){ return load('cube_users',[]); }
function session(){ return load('cube_session',null); }
async function sha(s){ const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('cube$'+s)); return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''); }
function renderAuth(){ const s=session(); $('btn-auth').textContent=s?s.u+' (keluar?)':'Masuk'; $('who').textContent=s?('Bacapi Desktop • '+s.u):'Bacapi Desktop'; }
$('btn-auth').onclick=function(){ const s=session(); if(s){localStorage.removeItem('cube_session');renderAuth();return;} $('auth-modal').classList.remove('hidden'); };
$('btn-close').onclick=function(){ $('auth-modal').classList.add('hidden'); };
$('t-login').onclick=function(){authMode='login';$('t-login').classList.add('active');$('t-reg').classList.remove('active');$('btn-go').textContent='Masuk';};
$('t-reg').onclick=function(){authMode='reg';$('t-reg').classList.add('active');$('t-login').classList.remove('active');$('btn-go').textContent='Daftar';};
$('btn-go').onclick=async function(){
  const u=$('a-user').value.trim(),p=$('a-pass').value;
  if(u.length<3||p.length<4){$('auth-msg').textContent='Username min 3, password min 4.';return;}
  const h=await sha(u+':'+p); let us=users();
  if(authMode==='reg'){ if(us.find(x=>x.u===u)){$('auth-msg').textContent='Sudah ada, login saja.';return;} us.push({u:u,h:h,at:Date.now()}); save('cube_users',us); save('cube_session',{u:u,at:Date.now()}); }
  else { if(!us.find(x=>x.u===u&&x.h===h)){$('auth-msg').textContent='Salah username/password.';return;} save('cube_session',{u:u,at:Date.now()}); }
  renderAuth(); $('auth-modal').classList.add('hidden');
};
renderAuth();

// ---------- KEY + MODEL ----------
$('api-key').value=localStorage.getItem('cube_key')||'';
$('img-model').value=localStorage.getItem('bacapi_imgmodel')||'';
$('btn-key').onclick=function(){$('keymodal').classList.remove('hidden');};
$('btn-key-close').onclick=function(){$('keymodal').classList.add('hidden');};
$('btn-save-key').onclick=function(){ localStorage.setItem('cube_key',$('api-key').value.trim()); localStorage.setItem('bacapi_imgmodel',$('img-model').value.trim()); $('keymodal').classList.add('hidden'); setStatus('Key tersimpan.'); };
let model=localStorage.getItem('cube_model')||'openrouter/free', modelsCache=[];
$('model-btn').onclick=function(e){e.stopPropagation();$('model-drop').classList.toggle('hidden');if(!modelsCache.length)loadModels();};
document.addEventListener('click',function(e){if(!e.target.closest('#model-drop')&&!e.target.closest('#model-btn'))$('model-drop').classList.add('hidden');});
$('model-search').oninput=renderModelList;
function loadModels(){ $('model-pill').textContent='loading...'; fetch('https://openrouter.ai/api/v1/models').then(r=>r.json()).then(j=>{ modelsCache=(j.data||[]).map(m=>({id:m.id})).sort((a,b)=>a.id.localeCompare(b.id)); $('model-pill').textContent=modelsCache.length+' models'; renderModelList(); $('model-name').textContent=model; }).catch(e=>{$('model-pill').textContent='fail';}); }
function renderModelList(){ const q=($('model-search').value||'').toLowerCase(),el=$('model-list'); el.innerHTML=''; modelsCache.filter(m=>m.id.toLowerCase().indexOf(q)>-1).slice(0,150).forEach(m=>{ const d=document.createElement('button');d.className='m-item';d.textContent=m.id+(m.id===model?' [aktif]':'');d.onclick=function(){model=m.id;localStorage.setItem('cube_model',model);$('model-name').textContent=model;$('model-drop').classList.add('hidden');};el.appendChild(d); }); }
$('model-name').textContent=model; loadModels();

// ---------- MODE + DEEP + PLUGINS ----------
let cmode='work', deep=load('bacapi_deep',false), deepSearch=load('bacapi_ds',false);
let plugins=Object.assign({word:true,excel:true,pdf:true,image:true,preview:true},load('bacapi_plugins',{}));
const PLG=[['word','Microsoft Word (.doc)'],['excel','Microsoft Excel (.csv)'],['pdf','Export PDF'],['image','Generate Gambar'],['preview','Pratinjau Akurat']];
function renderModes(){ document.querySelectorAll('#modes button').forEach(b=>b.classList.toggle('active',b.dataset.m===cmode)); const q=$('q'); if(q)q.placeholder=cmode==='work'?'Ide cerita / planning / PRD / mindmap…':cmode==='codev'?'Minta aplikasi + bahasanya…':'Tulis… cth: Bacapi tolong buatkan saya cerita kelinci'; }
document.querySelectorAll('#modes button').forEach(b=>{b.onclick=function(){cmode=b.dataset.m;save('bacapi_mode',cmode);renderModes();};});
function renderPlugins(){ const el=$('plugins'); el.innerHTML=''; PLG.forEach(p=>{ const d=document.createElement('button'); d.className='plg'+(plugins[p[0]]?' on':''); d.innerHTML='<span></span><i class="dot"></i>'; d.firstChild.textContent=p[1]; d.onclick=function(){plugins[p[0]]=!plugins[p[0]];save('bacapi_plugins',plugins);renderPlugins();}; el.appendChild(d); }); }
$('btn-deep').onclick=function(){deep=!deep;save('bacapi_deep',deep);$('btn-deep').classList.toggle('on',deep);};
$('btn-deep').classList.toggle('on',deep);
$('btn-ds').onclick=function(){deepSearch=!deepSearch;save('bacapi_ds',deepSearch);$('btn-ds').classList.toggle('on',deepSearch);setStatus(deepSearch?'Deep Search ON: riset mendalam + animasi otak.':'Deep Search OFF.');};
$('btn-ds').classList.toggle('on',deepSearch); renderModes(); renderPlugins();

// ---------- THREADS + ATTACH ----------
let threads=load('bacapi_threads',[]),cur=null;
try{cur=JSON.parse(sessionStorage.getItem('bacapi_cur')||'null');}catch(e){cur=null;}
function curT(){return threads.find(t=>t.id===cur);}
function persist(){
  try{
    const slim=[];
    threads.slice(-30).forEach(function(t){
      const mm=[];
      t.msgs.slice(-30).forEach(function(m){
        let hasImg=0;
        if(m.imgs&&m.imgs.length)hasImg=1;
        if(m.img)hasImg=1;
        mm.push({q:m.q,a:m.a,img:hasImg});
      });
      slim.push({id:t.id,title:t.title,msgs:mm});
    });
    localStorage.setItem('bacapi_threads',JSON.stringify(slim));
    try{sessionStorage.setItem('bacapi_cur',JSON.stringify(cur));}catch(e){}
  }catch(e){}
}
function showHome(v){ $('view-home').classList.toggle('hidden',!v); $('view-thread').classList.toggle('hidden',v); }
function renderThreads(){ const el=$('threads');el.innerHTML=''; threads.slice().reverse().forEach(t=>{ const b=document.createElement('button');b.className='th'+(t.id===cur?' active':'');b.textContent=t.title;b.onclick=function(){cur=t.id;persist();renderThreads();openThread();};el.appendChild(b); }); }
$('btn-new').onclick=function(){cur=null;showHome(true);renderThreads();};
let atts=[];
$('file').addEventListener('change',function(e){ Array.from(e.target.files||[]).slice(0,3).forEach(f=>{ const r=new FileReader(); r.onload=function(){atts.push({n:f.name,t:f.type,d:r.result});$('att-list').textContent=atts.map(a=>a.n).join(', ');}; r.readAsDataURL(f); }); e.target.value=''; });

// ---------- FULLSCREEN ----------
$('btn-fs').onclick=async function(){ try{ if(!document.fullscreenElement)await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }catch(e){} };
document.addEventListener('fullscreenchange',function(){$('btn-fs').textContent=document.fullscreenElement?'Keluar':'⛶';});

// ---------- RENDER ----------
let lastBlocks=[];
function parseInfo(info){ info=(info||'').trim(); if(info.indexOf(':')>-1){const p=info.split(':');return{lang:p[0].trim()||'txt',file:(p[1]||'').trim()};} if(info.indexOf('.')>-1)return{lang:info.split('.').pop(),file:info}; return{lang:info||'txt',file:''}; }
function dl(name,text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }
function mindSvg(t){ const lines=t.split('\n').filter(l=>l.trim()); let svg='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="'+Math.max(220,lines.length*38+60)+'"><rect width="100%" height="100%" rx="12" fill="#171A21"/><style>text{font-family:Inter,Segoe UI,Arial;font-size:13px;fill:#EDEDEF}</style>'; const cols=['#6E8CFF','#C15F3C','#3DDC84','#EBC02A','#7C3AED']; let y=30; lines.forEach(l=>{ const ind=(l.match(/^ */)||[''])[0].length,d=Math.floor(ind/2),tx=l.trim().replace(/^[-•]\s*/,'').slice(0,42),x=20+d*140; svg+='<rect x="'+x+'" y="'+y+'" rx="8" width="'+Math.min(220,tx.length*7+20)+'" height="24" fill="none" stroke="'+cols[d%cols.length]+'"/><text x="'+(x+10)+'" y="'+(y+16)+'">'+esc(tx)+'</text>'; y+=34; }); return svg+'</svg>'; }
function md(text){
  let h=esc(text),blocks=[];
  h=h.replace(/```([^\n]*)\n([\s\S]*?)```/g,function(m,info,code){
    const p=parseInfo(info),i=blocks.length;
    if((p.lang||'').toLowerCase()==='mindmap'){ const svg=mindSvg(code),url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); blocks.push({fn:'mindmap.svg',lang:'mindmap',code:code,url:url}); return '\u0000B'+i+'\u0000'; }
    const fn=p.file||('file-'+(i+1)+'.'+p.lang); blocks.push({fn:fn,lang:p.lang,code:code.replace(/^\n+|\n+$/g,'')}); return '\u0000B'+i+'\u0000';
  });
  h=h.replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  let html='';
  h.split('\u0000').forEach(function(part){
    const m=part.match(/^B(\d+)\u0000?([\s\S]*)$/);
    if(m){ const b=blocks[+m[1]];
      if(b.lang==='mindmap')html+='<div class="mindmap-wrap"><img src="'+b.url+'"><br><button data-mdl="'+m[1]+'">Download Gambar Mindmap</button></div>'+m[2].replace(/\n/g,'<br>');
      else html+='<div class="codeblock"><div class="codehead"><b>'+esc(b.fn)+'</b><span>'+esc(b.lang)+'</span><span class="sp"></span><button data-p="'+m[1]+'">Preview</button><button data-d="'+m[1]+'">Download</button></div><pre>'+esc(b.code)+'</pre></div>'+m[2].replace(/\n/g,'<br>');
    } else html+=part.replace(/\n/g,'<br>');
  });
  return{html:html,blocks:blocks};
}
function mdSafe(text){ const n=(text.match(/```/g)||[]).length; return md(n%2===1?text+'\n```':text).html; }
function convRender(t){
  lastBlocks=[];
  return t.msgs.map(function(m){
    let ai;
    if(!m.a) ai='<div class="ai-turn"><div class="skel"></div><div class="skel short"></div></div>';
    else if(m.a.indexOf('[gambar] ')===0){ const url=m.a.slice(9); ai='<div class="ai-turn"><div class="img-wrap"><img src="'+url+'"><br><button data-img="'+url+'">Download Gambar</button></div></div>'; }
    else { const r=md(m.a), base=lastBlocks.length; r.blocks.forEach(function(b){lastBlocks.push(b);});
      ai='<div class="ai-turn">'+r.html.replace(/data-(d|mdl|p)="(\d+)"/g,function(x,k,n){return 'data-'+k+'="'+(base+ +n)+'"';})+'</div>'; }
    let uh=esc(m.q);
    if(m.imgs&&m.imgs.length){ uh+='<br>'+m.imgs.slice(0,3).map(function(u){return '<img class="uimg" src="'+u+'">';}).join(''); }
    else if(m.img){ uh+='<br><span style="font-size:12px;opacity:.7">[foto terkirim]</span>'; }
    return '<div class="msg-user">'+uh+'</div>'+ai;
  }).join('');
}
function wireAnswer(){
  $('answer').querySelectorAll('button[data-d]').forEach(b=>{b.onclick=function(){const x=lastBlocks[+b.getAttribute('data-d')];if(x)dl(x.fn,x.code);};});
  $('answer').querySelectorAll('button[data-mdl]').forEach(b=>{b.onclick=function(){const x=lastBlocks[+b.getAttribute('data-mdl')];if(x){const a=document.createElement('a');a.href=x.url;a.download=x.fn;a.click();}};});
  $('answer').querySelectorAll('button[data-p]').forEach(b=>{b.onclick=function(){const x=lastBlocks[+b.getAttribute('data-p')];if(x){const w=window.open('','_blank');w.document.write(x.code);w.document.close();}};});
  $('answer').querySelectorAll('button[data-img]').forEach(b=>{b.onclick=function(){const a=document.createElement('a');a.href=b.getAttribute('data-img');a.download='bacapi-gambar.png';a.target='_blank';a.click();};});
}
function renderAnswer(text){
  const t=curT(); if(!t)return;
  const l=t.msgs[t.msgs.length-1]; if(l&&!l.a)l.a=text;
  $('answer').innerHTML=convRender(t); wireAnswer();
}

// ---------- PLUGIN OUTPUT: word/excel/pdf ----------
function toWord(title,body){
  const html='<html xmlns:o="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>'+esc(title)+'</title></head><body><h1>'+esc(title)+'</h1>'+esc(body).replace(/\n/g,'<br>')+'<p>Bacapi '+KERNEL+'</p></body></html>';
  dl(title.replace(/[^\w\- ]+/g,'').slice(0,40)+'.doc',html);
  setStatus('Plugin Word: file .doc diunduh — buka di Microsoft Word.');
}
function toExcel(title,rows){
  const csv='Judul;Isi\n'+rows.map(r=>'"'+String(r[0]).replace(/"/g,'""')+'";"'+String(r[1]).replace(/"/g,'""')+'"').join('\n');
  dl(title.replace(/[^\w\- ]+/g,'').slice(0,40)+'.csv',csv);
  setStatus('Plugin Excel: file .csv diunduh — buka di Microsoft Excel.');
}
function toPdf(title,body){
  const w=window.open('','_blank'); w.document.write('<html><head><title>'+esc(title)+'</title></head><body style="font-family:Georgia,serif;padding:32px"><h1>'+esc(title)+'</h1><p>'+esc(body).replace(/\n/g,'<br>')+'</p></body></html>'); w.document.close(); w.focus(); w.print();
}

// ---------- IMAGE GEN (OpenRouter berbayar / Pollinations gratis) ----------
async function genImage(prompt){
  $('paint').classList.remove('hidden');
  const key=(localStorage.getItem('cube_key')||'');
  const imgModel=(localStorage.getItem('bacapi_imgmodel')||'').trim();
  // 1) coba OpenRouter bila user set model image + key (hampir semua berbayar)
  if(key.startsWith('sk-or-v1-')&&imgModel){
    try{
      const r=await fetch('https://openrouter.ai/api/v1/images',{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json','HTTP-Referer':'https://bacapi.local','X-Title':'Bacapi'},body:JSON.stringify({model:imgModel,prompt:prompt})});
      const j=await r.json().catch(()=>({}));
      const url=j.data&&j.data[0]&&(j.data[0].url||j.data[0].b64_json&&('data:image/png;base64,'+j.data[0].b64_json));
      if(url){ $('paint').classList.add('hidden'); return {url:url,via:'OpenRouter '+imgModel}; }
    }catch(e){}
  }
  // 2) gratis: Pollinations (tanpa key)
  const url='https://image.pollinations.ai/prompt/'+encodeURIComponent(prompt)+'?width=1024&height=1024&seed='+Math.floor(Math.random()*99999)+'&nologo=true';
  // preload agar animasi melukis terlihat
  await new Promise(function(res){ const im=new Image(); im.onload=res; im.onerror=res; im.src=url; setTimeout(res,4000); });
  $('paint').classList.add('hidden');
  return {url:url,via:'Pollinations (gratis)'};
}

// ---------- AI CORE (streaming + fallback) ----------
let myName=load('bacapi_name','');
function renderGreet(){ const g=$('greet'); if(g)g.textContent=myName?('Halo '+myName+', mau dibantu apa?'):'Mau dibantu apa hari ini?'; }
renderGreet();
function sys(){
  let base='Kamu adalah Bacapi, AI desktop kernel '+KERNEL+'. Bahasa Indonesia, tanpa emoji. Identitas: kamu adalah Bacapi. ';
  if(myName)base+='Nama user: '+myName+'. Ingat namanya, sapa sesekali secara natural. ';
  base+=deep?'Mode DEEP: jawab panjang mendalam. ':'Jawab jelas. ';
  base+='PENTING: jangan keluarkan blok kode/program kecuali user meminta dibuatkan kode/aplikasi. ';
  base+='GAYA JAWAB: langsung ke inti, padat, tidak belibet — tanpa basa-basi, tanpa pengulangan, tanpa kalimat pengisi. Rapi hanya bila perlu (list/heading singkat). ';
  if(deepSearch)base+='MODE DEEP SEARCH: lakukan riset mendalam — analisis pertanyaan, bahas dari beberapa sudut pandang dengan detail konkret dan contoh, tutup dengan ringkasan + langkah lanjutan. ';
  base+='BACAPI WORK (satu-satunya mode): bantu PR semua mapel + tugas umum — cerita natural tidak ketara AI, planning, PRD (tujuan/fitur/alur/kriteria), mindmap via blok ```mindmap hierarki indentasi, dan kode lengkap runnable tiap file ```bahasa:namafile.ext bila diminta. ';
  base+='OTAK: selalu pakai riwayat percakapan + foto terlampir sebagai ingatan. Konsisten dengan jawabanmu sebelumnya; bila user konfirmasi ("bener ...?", "masa?"), tegaskan kesimpulan sebelumnya. JANGAN jawab tidak tahu untuk hal yang sudah dibahas atau terlihat di foto. ';
  return base;
}
const FB=['openrouter/free','z-ai/glm-5.2:free','minimax/minimax-m3:free'];
async function stream(q,onDelta,hist){
  const key=(localStorage.getItem('cube_key')||'');
  if(!key.startsWith('sk-or-v1-'))throw new Error('Isi API Key dulu (tombol API Key).');
  const content=[{type:'text',text:q}];
  atts.forEach(a=>{if(a.t.indexOf('image/')===0)content.push({type:'image_url',image_url:{url:a.d}});});
  const past=[]; let budget=10000;
  ((hist||[]).slice(-12)).forEach(function(m){
    if(!m.a||m.a.indexOf('[gambar] ')===0||m.a.indexOf('Gagal:')===0)return;
    let uq=m.q;
    if((m.imgs&&m.imgs.length)||m.img)uq+=' [pesan ini melampirkan foto perangkat router yang sedang dibahas]';
    const s=uq.length+m.a.length; if(budget-s<0)return; budget-=s;
    past.push({role:'user',content:uq},{role:'assistant',content:m.a});
  });
  try{
    const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json','HTTP-Referer':'https://bacapi.local','X-Title':'Bacapi'},body:JSON.stringify({model:model,stream:true,messages:[{role:'system',content:sys()}].concat(past).concat([{role:'user',content:content}]),temperature:cmode==='codev'?0.25:cmode==='work'?0.9:0.7,max_tokens:6000})});
    if(!r.ok||!r.body)throw new Error('x');
    const rd=r.body.getReader(),dec=new TextDecoder();let buf='',full='';
    while(true){ const c=await rd.read(); if(c.done)break; buf+=dec.decode(c.value,{stream:true}); const ps=buf.split('\n\n'); buf=ps.pop();
      ps.forEach(p=>{ if(p.indexOf('data: ')===0){ const d=p.slice(6).trim(); if(d==='[DONE]')return; try{ const j=JSON.parse(d),t=j.choices&&j.choices[0]&&j.choices[0].delta&&j.choices[0].delta.content; if(t){full+=t;onDelta(full);} }catch(e){} } }); }
    if(full)return full; throw new Error('x');
  }catch(e){
    let err='';
    for(let i=0;i<FB.length;i++){ try{
      const r2=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json','HTTP-Referer':'https://bacapi.local','X-Title':'Bacapi'},body:JSON.stringify({model:FB[i],messages:[{role:'system',content:sys()}].concat(past).concat([{role:'user',content:content}]),temperature:0.7,max_tokens:4000})});
      const j=await r2.json().catch(()=>({})); if(!r2.ok){err=j.error&&j.error.message||r2.statusText;continue;}
      const rep=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content; if(rep){model=FB[i];localStorage.setItem('cube_model',model);$('model-name').textContent=model;return rep;}
    }catch(ex){err=ex.message;} }
    throw new Error('Provider gagal: '+err);
  }
}

// ---------- ASK ----------
function needImage(q){ return /buatkan? (gambar|foto|ilustrasi|lukisan)|generate image|gambar.*(kelinci|kucing|pemandangan|anime)/i.test(q); }
async function ask(first){
  const q=(first||$('q').value||'').trim(); if(!q)return;
  const myAtts=atts.slice(); // tangkap dulu SEBELUM dibersihkan (bug foto hilang)
  $('q').value=''; atts=[]; $('att-list').textContent=''; // langsung bersih begitu kirim
  showHome(false); $('canvas').classList.add('hidden');
  let t=curT(); if(!t){t={id:'t'+Date.now(),title:q.slice(0,42),msgs:[]};threads.push(t);cur=t.id;}
  t.msgs.push({q:q,a:'',imgs:myAtts.filter(a=>a.t.indexOf('image/')===0).map(a=>a.d)}); persist(); renderThreads();
  const nm=q.match(/(?:nama saya|panggil (?:saya|aku)|aku )([a-zA-Z ]{2,20})/i);
  if(nm){
    myName=nm[1].trim().split(' ')[0].replace(/^[a-z]/,c=>c.toUpperCase());
    save('bacapi_name',myName); renderGreet();
    $('memupd').classList.remove('hidden'); setStatus('Menyimpan '+myName+' ke otak…');
    await new Promise(r=>setTimeout(r,1600)); $('memupd').classList.add('hidden');
  }
  const myImg=myAtts.filter(a=>a.t.indexOf('image/')===0).map(a=>a.d);
  if(myImg.length)t.lastImg=myImg[0];
  atts=myAtts.slice();
  if(!atts.some(a=>a.t.indexOf('image/')===0)&&t.lastImg)atts.push({n:'foto-sebelumnya',t:'image/',d:t.lastImg});
  $('answer').innerHTML=convRender(t); // bubble user + foto + skeleton, tidak blank putih
  // 1) generate gambar
  if(plugins.image&&needImage(q)){
    const prompt=q.replace(/^(bacapi[,\s]*tolong\s*)?(buatkan|buatin|generate)\s*(gambar|foto|ilustrasi)?/i,'').trim()||q;
    setStatus('Melukis gambar…');
    const im=await genImage(prompt);
    t.msgs[t.msgs.length-1].a='[gambar] '+im.url; persist(); renderThreads();
    $('answer').innerHTML=convRender(t); wireAnswer();
    setStatus('Siap.'); return;
  }
  // 2) thinking komputer + deep search otak + animasi kode
  const isCode=cmode==='codev'||/buatkan|buatin|aplikasi|program|website|koding/i.test(q);
  if(deepSearch){
    $('brain').classList.remove('hidden'); setStatus('Deep Search: riset mendalam…');
    const seq=['Menganalisis pertanyaan…','Merancang strategi…','Mencari referensi…','Menyusun jawaban…'];
    for(let si=0;si<seq.length;si++){ $('bstep').textContent=seq[si]; await new Promise(r=>setTimeout(r,650)); }
    $('brain').classList.add('hidden');
  } else {
    $('laptop').classList.remove('hidden'); setStatus('Thinking…');
    await new Promise(r=>setTimeout(r,700)); $('laptop').classList.add('hidden');
  }
  if(isCode)$('codeanim').classList.remove('hidden');
  let acc='';
  try{ acc=await stream(q,function(full){ acc=full; const turns=$('answer').querySelectorAll('.ai-turn'); const last=turns[turns.length-1]; if(last)last.innerHTML=mdSafe(full)+'<span style="opacity:.4">▍</span>'; },t.msgs.slice(0,-1)); }
  catch(e){ acc='Gagal: '+e.message; }
  $('codeanim').classList.add('hidden');
  t.msgs[t.msgs.length-1].a=acc; persist(); renderThreads();
  renderAnswer(acc);
  // 3) auto plugin word/excel/pdf bila diminta
  const wantWord=/\bword\b|\.doc|tulis.*word|cerita kelinci/i.test(q)&&plugins.word;
  const wantExcel=/\bexcel\b|\.csv|\.xls/i.test(q)&&plugins.excel;
  const wantPdf=/\bpdf\b/i.test(q)&&plugins.pdf;
  if(wantWord)toWord(q.slice(0,50),acc.replace(/```[\s\S]*?```/g,'').slice(0,6000));
  if(wantExcel)toExcel(q.slice(0,50),[['Hasil',acc.slice(0,2000)]]);
  if(wantPdf)toPdf(q.slice(0,50),acc.slice(0,4000));
  const pv=(plugins.preview!==false)?buildPreview(lastBlocks):null;
  if(pv){$('canvas-frame').srcdoc=pv;$('canvas').classList.remove('hidden');setStatus('Preview akurat: HTML+CSS+JS digabung sesuai request.');}
  else setStatus('Siap.');
  atts=[];
  notifyDone(q);
}
function notifyDone(q){
  try{
    if(window.Notification&&Notification.permission==='granted'){
      let icon='';
      try{icon=location.href.replace(/[^/]+$/,'')+'icon.png';}catch(e){}
      new Notification('Bacapi',{body:'Selesai: '+q.slice(0,120),icon:icon||undefined});
    }
  }catch(e){}
  try{
    const C=window.AudioContext||window.webkitAudioContext; if(!C)return;
    const c=new C(),o=c.createOscillator(),g=c.createGain();
    o.connect(g);g.connect(c.destination);o.frequency.value=880;
    g.gain.setValueAtTime(0.07,c.currentTime);o.start();o.stop(c.currentTime+0.3);
    setTimeout(function(){try{c.close();}catch(e){}},500);
  }catch(e){}
}
if(window.Notification&&Notification.permission==='default'){try{Notification.requestPermission();}catch(e){}}
function buildPreview(blocks){
  const hb=blocks.find(b=>/html?/i.test(b.lang)||/\.html?$/i.test(b.fn));
  if(!hb)return null;
  let code=hb.code;
  const css=blocks.filter(b=>/css/i.test(b.lang)||/\.css$/i.test(b.fn)).map(b=>b.code).join('\n');
  const js=blocks.filter(b=>/^(js|javascript)$/i.test(b.lang)||/\.js$/i.test(b.fn)).map(b=>b.code).join('\n');
  if(css){ if(/<\/head>/i.test(code))code=code.replace(/<\/head>/i,'<style>\n'+css+'\n</style>\n</head>'); else code='<style>\n'+css+'\n</style>\n'+code; }
  if(js){ if(/<\/body>/i.test(code))code=code.replace(/<\/body>/i,'<script>\n'+js+'\n</script>\n</body>'); else code=code+'\n<script>\n'+js+'\n</script>'; }
  return code;
}
function pushThread(q,a){ let t=curT(); if(!t){t={id:'t'+Date.now(),title:q.slice(0,42),msgs:[]};threads.push(t);cur=t.id;} t.msgs.push({q:q,a:a}); persist(); renderThreads(); }
function openThread(){ const t=curT(); if(!t){showHome(true);return;} showHome(false); $('canvas').classList.add('hidden'); $('answer').innerHTML=convRender(t); wireAnswer(); }
$('btn-ask').onclick=function(){ask();};
$('q').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask();}});
$('btn-canvas-close').onclick=function(){$('canvas').classList.add('hidden');};
document.querySelectorAll('#chips button').forEach(function(b){ b.onclick=function(){ $('q').value=b.textContent; showHome(false); ask(b.textContent); }; });
renderThreads(); showHome(true); setStatus('Bacium V5.6 siap. Plugin: Word/Excel/PDF/Gambar. OpenRouter image berbayar; gambar gratis via Pollinations.');
// ---------- SETUP SEKALI (nama akun + API key) ----------
if(!load('bacapi_setup',false)){ const sm=$('setup-modal'); if(sm)sm.classList.remove('hidden'); }
if($('btn-setup-go'))$('btn-setup-go').onclick=function(){
  const n=$('s-name').value.trim();
  let k=$('s-key').value.trim().replace(/^["']+|["']+$/g,'');
  const diag=function(m){ $('setup-msg').textContent=m; setStatus(m); };
  if(n.length<2){diag('Isi nama akun dulu (min 2 huruf).');return;}
  if(!k){diag('Kolom API key masih kosong — paste key dulu (Ctrl+V / klik kanan-Paste).');return;}
  if(!k.startsWith('sk-or-v1-')){diag('Key terbaca '+k.length+' karakter diawali "'+k.slice(0,8)+'…" — harus diawali sk-or-v1-. Ambil yang benar di openrouter.ai/keys.');return;}
  save('cube_session',{u:n,at:Date.now()}); try{localStorage.setItem('cube_key',k);}catch(e){}
  save('bacapi_setup',true); $('api-key').value=k; renderAuth();
  $('setup-modal').classList.add('hidden'); setStatus('Selamat datang, '+n+'. Setup selesai.');
};
