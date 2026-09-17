// NimCaal — Chat + Coder + Connect (OpenRouter)
const $ = id => document.getElementById(id);
const chatEl=$('chat'), inputEl=$('input'), statusEl=$('status');
const apiKeyEl=$('api-key'), waNumEl=$('wa-number');
const modelBtn=$('model-btn'), modelDrop=$('model-drop'), modelListEl=$('model-list');
const modelSearch=$('model-search'), modelCustom=$('model-custom'), modelNameEl=$('model-name'), modelStatus=$('model-status');
const prdEl=$('prd'), taskInput=$('task-input'), taskListEl=$('task-list');

let mode = localStorage.getItem('nimcaal_mode') || 'chat';
let model = localStorage.getItem('nimcaal_model') || 'openai/gpt-4o-mini';
let modelsCache = [];
let chats = JSON.parse(localStorage.getItem('nimcaal_chats') || '[]');
let curId = localStorage.getItem('nimcaal_cur') || null;
let tasks = JSON.parse(localStorage.getItem('nimcaal_tasks') || '[]');
let conn = JSON.parse(localStorage.getItem('nimcaal_conn') || '{"whatsapp":{"on":false,"num":""},"word":{"on":true},"telegram":{"on":false},"email":{"on":false}}');
let lastAiRaw = '';

apiKeyEl.value = localStorage.getItem('nimcaal_key') || '';
waNumEl.value = conn.whatsapp.num || '';
if (!curId) newChat(false);

function saveAll(){
  localStorage.setItem('nimcaal_chats', JSON.stringify(chats.slice(-30)));
  localStorage.setItem('nimcaal_cur', curId);
  localStorage.setItem('nimcaal_tasks', JSON.stringify(tasks));
  localStorage.setItem('nimcaal_conn', JSON.stringify(conn));
  localStorage.setItem('nimcaal_mode', mode);
  localStorage.setItem('nimcaal_model', model);
}
function cur(){ return chats.find(c=>c.id===curId); }
function setStatus(t){ statusEl.textContent = t; }

// ---------- MODE ----------
function applyMode(){
  $('tab-chat').classList.toggle('active', mode==='chat');
  $('tab-coder').classList.toggle('active', mode==='coder');
  $('coder-panel').classList.toggle('hidden', mode!=='coder');
  $('btn-dlall').classList.toggle('hidden', mode!=='coder');
}
$('tab-chat').onclick=()=>{mode='chat';saveAll();applyMode();};
$('tab-coder').onclick=()=>{mode='coder';saveAll();applyMode();setStatus('Coder mode aktif. Isi PRD + Tasks lalu Generate.');};
applyMode();

// ---------- HISTORY ----------
function newChat(render=true){
  curId = 'c'+Date.now();
  chats.push({id:curId, title:'Percakapan baru', messages:[]});
  saveAll(); renderHistory();
  if(render) renderChat();
}
function renderHistory(){
  const h=$('history'); h.innerHTML='';
  [...chats].reverse().forEach(c=>{
    const b=document.createElement('button'); b.className='hist'+(c.id===curId?' active':'');
    const s=document.createElement('span'); s.textContent=c.title; s.onclick=()=>{curId=c.id;saveAll();renderHistory();renderChat();};
    const d=document.createElement('small'); d.textContent='x'; d.title='Hapus';
    d.onclick=(e)=>{e.stopPropagation();chats=chats.filter(x=>x.id!==c.id);if(!chats.length)newChat(false);if(curId===c.id)curId=chats[chats.length-1].id;saveAll();renderHistory();renderChat();};
    b.appendChild(s); b.appendChild(d); h.appendChild(b);
  });
}
$('btn-new').onclick=()=>newChat();
$('btn-collapse').onclick=()=>$('sidebar').classList.add('collapsed');
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){modelDrop.classList.add('hidden');$('export-bar').classList.add('hidden');} });

// ---------- TASKS ----------
function renderTasks(){
  taskListEl.innerHTML='';
  tasks.forEach((t,i)=>{
    const li=document.createElement('li'); if(t.done)li.classList.add('done');
    li.innerHTML='<span></span>';
    li.firstChild.textContent=(t.done?'[x] ':'[ ] ')+t.text;
    li.onclick=()=>{tasks[i].done=!tasks[i].done;saveAll();renderTasks();};
    const x=document.createElement('button'); x.textContent='x';
    x.onclick=(e)=>{e.stopPropagation();tasks.splice(i,1);saveAll();renderTasks();};
    li.appendChild(x); taskListEl.appendChild(li);
  });
}
taskInput.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&taskInput.value.trim()){tasks.push({text:taskInput.value.trim(),done:false});taskInput.value='';saveAll();renderTasks();}
});
renderTasks();

// ---------- CONNECT ----------
function renderConn(){
  document.querySelectorAll('.conn').forEach(b=>{
    const app=b.dataset.app;
    b.classList.toggle('on', !!conn[app]?.on);
  });
}
document.querySelectorAll('.conn').forEach(b=>{
  b.onclick=()=>{
    const app=b.dataset.app;
    if(app==='whatsapp'){
      const n=waNumEl.value.trim()||conn.whatsapp.num||'';
      if(!n){ $('key-panel').classList.remove('hidden'); setStatus('Isi nomor WhatsApp dulu di panel API Key.'); waNumEl.focus(); return; }
      conn.whatsapp.num=n; conn.whatsapp.on=!conn.whatsapp.on;
    } else { conn[app].on=!conn[app].on; }
    saveAll(); renderConn();
    setStatus('Connect '+app+': '+(conn[app].on?'aktif':'nonaktif'));
  };
});
renderConn();
$('btn-key').onclick=()=>$('key-panel').classList.toggle('hidden');
$('btn-save-key').onclick=()=>{
  localStorage.setItem('nimcaal_key', apiKeyEl.value.trim());
  conn.whatsapp.num=waNumEl.value.trim(); saveAll(); renderConn();
  setStatus('API key tersimpan.');
};

// ---------- MODELS (auto-detect) ----------
modelBtn.onclick=(e)=>{e.stopPropagation();modelDrop.classList.toggle('hidden');if(!modelsCache.length)loadModels();};
document.addEventListener('click',e=>{if(!e.target.closest('#model-picker'))modelDrop.classList.add('hidden');});
modelSearch.oninput=renderModelList;
modelCustom.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&modelCustom.value.trim()){model=modelCustom.value.trim();saveAll();updateModelBtn();modelDrop.classList.add('hidden');setStatus('Model manual: '+model);}
});
$('model-refresh').onclick=loadModels;

async function loadModels(){
  modelStatus.textContent='memuat…'; modelStatus.classList.remove('ok');
  setStatus('Mengambil daftar model OpenRouter…');
  try{
    const r=await fetch('https://openrouter.ai/api/v1/models');
    const j=await r.json();
    modelsCache=(j.data||[]).map(m=>({id:m.id,ctx:m.context_length||0,price:(m.pricing?.prompt||0)}));
    modelsCache.sort((a,b)=>a.id.localeCompare(b.id));
    modelStatus.textContent=modelsCache.length+' model terdeteksi'; modelStatus.classList.add('ok');
    setStatus(modelsCache.length+' model terdeteksi.');
    renderModelList(); updateModelBtn();
  }catch(e){ modelStatus.textContent='gagal memuat'; setStatus('Gagal memuat model: '+e.message); }
}
function renderModelList(){
  const q=(modelSearch.value||'').toLowerCase();
  const list=modelsCache.filter(m=>m.id.toLowerCase().includes(q)).slice(0,120);
  modelListEl.innerHTML='';
  if(!list.length){modelListEl.innerHTML='<div class="m-item"><small>Tidak ada hasil. Ketik manual di atas.</small></div>';return;}
  list.forEach(m=>{
    const d=document.createElement('div'); d.className='m-item';
    const free=/free$|:free/i.test(m.id);
    d.innerHTML='<b></b><small></small>';
    d.firstChild.textContent=m.id+(m.id===model?'  [aktif]':'');
    d.lastChild.textContent=(free?'gratis • ':'')+'ctx '+(m.ctx||'?');
    d.onclick=()=>{model=m.id;saveAll();updateModelBtn();modelDrop.classList.add('hidden');};
    modelListEl.appendChild(d);
  });
}
function updateModelBtn(){ modelNameEl.textContent=model||'Pilih model…'; }
updateModelBtn(); loadModels();

// ---------- RENDER CHAT ----------
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function parseInfo(info){
  info=(info||'').trim(); let lang='', file='';
  if(info.includes(':')){const p=info.split(':');lang=p[0].trim();file=(p[1]||'').trim();}
  else if(info.includes('.')){file=info;lang=info.split('.').pop();}
  else lang=info;
  return {lang:lang||'txt', file};
}
function downloadFile(name, text){
  const b=new Blob([text],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function renderMarkdown(text){
  let h=esc(text), blocks=[];
  h=h.replace(/```([^\n]*)\n([\s\S]*?)```/g,(m,info,code)=>{
    const {lang,file}=parseInfo(info);
    const idx=blocks.length;
    const fname=file||('file-'+(idx+1)+'.'+(lang==='txt'?'txt':lang));
    blocks.push({fname,code:code.replace(/^\n+|\n+$/g,'')});
    return '\u0000BLOCK'+idx+'\u0000';
  });
  h=h.replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^# (.*)$/gm,'<h1>$1</h1>');
  h=h.replace(/`([^`]+)`/g,'<code class="inline">$1</code>');
  h=h.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  h=h.split('\u0000').map(part=>{
    const m=part.match(/^BLOCK(\d+)\u0000?([\s\S]*)$/);
    if(m){const b=blocks[+m[1]];
      return '<div class="codeblock"><div class="codehead"><b>'+esc(b.fname)+'</b><span>'+esc('')+'</span><span class="sp"></span><button data-dl="'+m[1]+'">Unduh</button><button data-cp="'+m[1]+'">Salin</button></div><pre>'+esc(b.code)+'</pre></div>'+m[2].replace(/\n/g,'<br>');
    }
    return part.replace(/\n/g,'<br>');
  }).join('');
  return {html:h, blocks};
}
let lastBlocks=[];
function renderChat(){
  chatEl.innerHTML='';
  const c=cur(); if(!c)return;
  if(!c.messages.length){
    chatEl.innerHTML='<div class="empty"><h2>Selamat datang di NimCaal</h2><p>Tulis pertanyaan di bawah. Aktifkan tab Coder untuk PRD, tasks, dan unduh file langsung.</p></div>';
    return;
  }
  lastBlocks=[];
  c.messages.forEach(m=>{
    if(m.role==='user'){const d=document.createElement('div');d.className='msg user';d.textContent=m.content;chatEl.appendChild(d);}
    else{const d=document.createElement('div');d.className='msg ai';
      const r=renderMarkdown(m.content);d.innerHTML=r.html;
      r.blocks.forEach(b=>lastBlocks.push(b));
      if(m.content)lastAiRaw=m.content;
      chatEl.appendChild(d);}
  });
  chatEl.querySelectorAll('button[data-dl]').forEach(btn=>{
    btn.onclick=()=>{const b=lastBlocks[+btn.dataset.dl];if(b)downloadFile(b.fname,b.code);};
  });
  chatEl.querySelectorAll('button[data-cp]').forEach(btn=>{
    btn.onclick=()=>{const b=lastBlocks[+btn.dataset.cp];if(b)navigator.clipboard.writeText(b.code);btn.textContent='Tersalin';setTimeout(()=>btn.textContent='Salin',1200);};
  });
  chatEl.scrollTop=chatEl.scrollHeight;
}
renderHistory(); renderChat();

// ---------- SEND ----------
function systemPrompt(){
  if(mode==='coder'){
    const prd=prdEl.value.trim();
    const t=tasks.map(x=>'- ['+(x.done?'x':' ')+'] '+x.text).join('\n');
    return 'Kamu adalah NimCaal, senior software engineer. Bahasa: Indonesia, profesional, tanpa emoji. '
    +'Jika permintaan belum jelas, AJUKAN 3-7 pertanyaan klarifikasi bernomor SEBELUM memberi kode (tujuan, fitur utama, stack, batasan). '
    +'Jika PRD/tasks diberikan, ikuti itu. Output kode WAJIB dalam blok ```bahasa:namafile.ext sehingga tiap file bisa langsung diunduh. '
    +'Contoh: ```html:index.html ... ```. Akhiri dengan ringkasan file + cara menjalankan. Jangan minta API key.'
    +(prd?'\n\nPRD:\n'+prd:'')+(t?'\n\nTASKS:\n'+t:'');
  }
  return 'Kamu adalah NimCaal, asisten AI profesional. Bahasa Indonesia, jelas, tanpa emoji. Jawab langsung ke inti, beri langkah dan contoh kode bila relevan dengan blok ```bahasa. Jangan minta API key.';
}
const FALLBACKS = ['openrouter/free','z-ai/glm-5.2:free','minimax/minimax-m3:free','nvidia/nemotron-3-ultra-550b-a55b:free','google/gemma-4-31b-it:free'];
async function callAI(extraMsgs){
  const key=(apiKeyEl.value.trim()||localStorage.getItem('nimcaal_key')||'');
  if(!key.startsWith('sk-or-v1-')){ $('key-panel').classList.remove('hidden'); throw new Error('Isi API key OpenRouter dulu di panel kiri bawah.'); }
  localStorage.setItem('nimcaal_key',key);
  const c=cur();
  const toTry=[model, ...FALLBACKS.filter(f=>f!==model)];
  let lastErr='';
  for(let i=0;i<toTry.length;i++){
    const m=toTry[i];
    try{
      setStatus('Memproses dengan ' + m + (i > 0 ? ' (fallback ' + i + ')' : '') + '...');
      const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
        method:'POST',
        headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json','HTTP-Referer':'https://nimcaal.local','X-Title':'NimCaal'},
        body:JSON.stringify({
          model:m,
          messages:[{role:'system',content:systemPrompt()},...c.messages.slice(-20),...(extraMsgs||[])],
          provider:{allow_fallbacks:true, sort:'throughput'},
          temperature:0.7, max_tokens:2000
        })
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok){
        const msg=data?.error?.message||data?.message||res.statusText;
        lastErr='['+m+'] '+res.status+' '+msg;
        // jangan fallback untuk key salah / saldo habis
        if(res.status===401) throw new Error('API key salah / tidak valid. Cek ulang di openrouter.ai/settings/keys. Detail: '+msg);
        if(res.status===402) throw new Error('Saldo OpenRouter habis. Top-up di openrouter.ai/settings/credits, atau pakai model :free. Detail: '+msg);
        if(res.status===404) { continue; } // coba fallback
        if(res.status>=500) { continue; } // provider down, coba fallback
        throw new Error(lastErr+'\n\nSolusi: ganti model yang ada label gratis, atau klik Muat di daftar model.');
      }
      const reply=data.choices?.[0]?.message?.content;
      if(!reply){ lastErr='['+m+'] respons kosong dari provider'; continue; }
      if(m!==model){ model=m; saveAll(); updateModelBtn(); }
      return reply;
    }catch(e){
      if(/API key salah|Saldo/.test(e.message)) throw e;
      lastErr=e.message;
    }
  }
  throw new Error('Provider gagal semua. '+lastErr+'\n\nCoba: 1) Ganti model :free 2) Cek https://openrouter.ai/activity 3) Tunggu 1 menit (provider overload).');
}
async function sendText(text){
  text=(text||inputEl.value).trim(); if(!text)return;
  const c=cur();
  c.messages.push({role:'user',content:text});
  if(c.title==='Percakapan baru')c.title=text.slice(0,42);
  inputEl.value=''; inputEl.style.height='auto';
  saveAll(); renderHistory(); renderChat();
  const t=document.createElement('div');t.className='msg ai typing';t.textContent='Mengetik…';chatEl.appendChild(t);chatEl.scrollTop=chatEl.scrollHeight;
  $('btn-send').disabled=true; setStatus('Memproses dengan '+model+'…');
  try{
    const reply=await callAI();
    c.messages.push({role:'assistant',content:reply});
    // auto-parse tasks jika AI mengembalikan checklist dan mode coder
    if(mode==='coder'){ parseTasksFromReply(reply); }
  }catch(e){ c.messages.push({role:'assistant',content:'Gagal: '+e.message}); }
  $('btn-send').disabled=false; saveAll(); renderHistory(); renderChat(); setStatus('Siap. Model: '+model);
}
function parseTasksFromReply(reply){
  const lines=reply.split('\n').filter(l=>/^\s*-\s*\[[ x]\]/i.test(l)).slice(0,20);
  if(lines.length>=2){
    const nt=lines.map(l=>({text:l.replace(/^\s*-\s*\[[ x]\]\s*/i,'').slice(0,120),done:/\[x\]/i.test(l)}));
    const existing=new Set(tasks.map(t=>t.text));
    nt.forEach(t=>{if(!existing.has(t.text))tasks.push(t);});
    saveAll(); renderTasks();
  }
}
$('btn-send').onclick=()=>sendText();
inputEl.addEventListener('input',()=>{inputEl.style.height='auto';inputEl.style.height=Math.min(140,inputEl.scrollHeight)+'px';});
inputEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendText();}});

// PRD buttons
$('btn-prd').onclick=async()=>{
  const idea=prdEl.value.trim()||inputEl.value.trim();
  if(!idea){setStatus('Isi PRD / ide dulu.');return;}
  await sendText('Susunkan PRD ringkas + daftar tasks checklist untuk ide berikut:\n'+idea+'\n\nFormat: 1) Tujuan 2) Fitur utama 3) Tasks sebagai "- [ ] ..."');
};
$('btn-gen').onclick=async()=>{
  const prd=prdEl.value.trim();
  const t=tasks.filter(x=>!x.done).map(x=>x.text).join('; ');
  const base=inputEl.value.trim()||'Buatkan aplikasinya sesuai PRD dan tasks.';
  await sendText(base+(prd?'\n\nPRD:\n'+prd:'')+(t?'\n\nTasks yang belum selesai: '+t:''));
};

// ---------- EXPORT / CONNECT ----------
$('btn-export').onclick=()=>$('export-bar').classList.toggle('hidden');
document.querySelectorAll('#export-bar button').forEach(b=>{
  b.onclick=()=>{
    const app=b.dataset.go;
    if(!lastAiRaw){setStatus('Belum ada jawaban AI untuk dikirim.');return;}
    if(app==='whatsapp'){
      if(!conn.whatsapp.on){setStatus('Aktifkan Connect WhatsApp di panel kiri dulu.');return;}
      window.open('https://wa.me/'+conn.whatsapp.num+'?text='+encodeURIComponent(lastAiRaw.slice(0,3000)),'_blank');
    }else if(app==='word'){
      const html='<html xmlns:o="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>'+esc(lastAiRaw).replace(/\n/g,'<br>')+'</body></html>';
      downloadFile('nimcaal-hasil.doc',html);
    }else if(app==='md'){ downloadFile('nimcaal-hasil.md',lastAiRaw); }
    else if(app==='telegram'){ window.open('https://t.me/share/url?url=&text='+encodeURIComponent(lastAiRaw.slice(0,2000)),'_blank'); }
    else if(app==='email'){ location.href='mailto:?subject='+encodeURIComponent('Hasil NimCaal')+'&body='+encodeURIComponent(lastAiRaw.slice(0,3000)); }
  };
});
$('btn-dlall').onclick=()=>{
  if(!lastBlocks.length){setStatus('Tidak ada file kode di jawaban terakhir.');return;}
  lastBlocks.forEach((b,i)=>setTimeout(()=>downloadFile(b.fname,b.code),i*400));
  setStatus(lastBlocks.length+' file diunduh.');
};
