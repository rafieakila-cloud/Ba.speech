// AI MTsN 10 Banyuwangi — di atas kernel Cube (akun + openrouter + deep + foto)
const $ = function(id){ return document.getElementById(id); };
const chatEl = $('chat'), inputEl = $('input'), statusEl = $('status');
function setStatus(t){ statusEl.textContent = t; }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function save(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function load(k,d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }

// ---------- KERNEL CUBE: akun (shared keys cube_users / cube_session) ----------
let authMode = 'login';
function users(){ return load('cube_users', []); }
function session(){ return load('cube_session', null); }
async function sha(s){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cube$' + s));
  return Array.from(new Uint8Array(b)).map(function(x){ return x.toString(16).padStart(2,'0'); }).join('');
}
function renderAuth(){
  const s = session();
  $('btn-auth').textContent = s ? s.u + ' (keluar?)' : 'Masuk Cube';
  $('who').textContent = s ? 'Kernel Cube • masuk sebagai ' + s.u : 'Kernel Cube • login Cube berlaku di sini';
}
$('btn-auth').onclick = function(){
  const s = session();
  if (s){ localStorage.removeItem('cube_session'); renderAuth(); setStatus('Keluar.'); return; }
  $('auth-modal').classList.remove('hidden');
};
$('btn-close').onclick = function(){ $('auth-modal').classList.add('hidden'); };
$('t-login').onclick = function(){ authMode='login'; $('t-login').classList.add('active'); $('t-reg').classList.remove('active'); $('btn-go').textContent='Masuk'; };
$('t-reg').onclick = function(){ authMode='reg'; $('t-reg').classList.add('active'); $('t-login').classList.remove('active'); $('btn-go').textContent='Daftar'; };
$('btn-go').onclick = async function(){
  const u = $('a-user').value.trim(), p = $('a-pass').value;
  if (u.length < 3 || p.length < 4){ $('auth-msg').textContent = 'Username min 3, password min 4.'; return; }
  const h = await sha(u + ':' + p);
  let us = users();
  if (authMode === 'reg'){
    if (us.find(function(x){ return x.u === u; })){ $('auth-msg').textContent = 'Username ada, login saja.'; return; }
    us.push({ u: u, h: h, at: Date.now() }); save('cube_users', us); save('cube_session', { u: u, at: Date.now() });
    $('auth-msg').textContent = 'Terdaftar + masuk sebagai ' + u + '. Berlaku juga di Cube.';
  } else {
    if (!us.find(function(x){ return x.u === u && x.h === h; })){ $('auth-msg').textContent = 'Salah username/password.'; return; }
    save('cube_session', { u: u, at: Date.now() }); $('auth-msg').textContent = 'Login OK.';
  }
  renderAuth(); setTimeout(function(){ $('auth-modal').classList.add('hidden'); }, 600);
};
renderAuth();

// ---------- FULLSCREEN ----------
$('btn-fs').onclick = async function(){
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch(e){ setStatus('Fullscreen gagal: ' + e.message); }
};
document.addEventListener('fullscreenchange', function(){
  $('btn-fs').textContent = document.fullscreenElement ? 'Keluar FS' : 'Fullscreen';
});
renderAuth();

// ---------- KEY (pakai cube_key bila ada) ----------
if (!localStorage.getItem('mtsn10_key') && localStorage.getItem('cube_key')) localStorage.setItem('mtsn10_key', localStorage.getItem('cube_key'));
$('api-key').value = localStorage.getItem('mtsn10_key') || '';
$('btn-key').onclick = function(){ $('keypanel').classList.toggle('hidden'); };
$('btn-save').onclick = function(){
  const k = $('api-key').value.trim();
  localStorage.setItem('mtsn10_key', k); localStorage.setItem('cube_key', k);
  setStatus('Key tersimpan (berlaku Cube + MTsN10).');
};

// ---------- DEEP + FOTO (kernel Cube) ----------
let deep = load('mtsn10_deep', false);
function renderDeep(){ $('btn-deep').classList.toggle('on', deep); }
$('btn-deep').onclick = function(){ deep = !deep; save('mtsn10_deep', deep); renderDeep(); };
renderDeep();
let photo = null;
$('file').addEventListener('change', function(e){
  const f = (e.target.files || [])[0]; if (!f) return;
  const r = new FileReader();
  r.onload = function(){ photo = r.result; setStatus('Foto terpasang: ' + f.name); };
  r.readAsDataURL(f); e.target.value = '';
});

// ---------- SEKOLAH (info umum, verifikasi ke web resmi) ----------
const SEKOLAH = 'MTsN 10 Banyuwangi (MTs Negeri 10 Banyuwangi). NPSN 20581681, Akreditasi A, Negeri di bawah Kementerian Agama. Alamat: Jl. Songgon KM.02, Pengantigan, Rogojampi, Banyuwangi, Jawa Timur. Web: mtsn10banyuwangi.sch.id. IG/TikTok: @mtsn10banyuwangi. Jenjang MTs setara SMP. Info detail jadwal/guru/PPDB bisa berubah, arahkan cek web resmi atau TU madrasah bila tidak yakin.';
function sys(){
  const lang = $('lang').value, mode = $('mode').value;
  const L = lang === 'ar' ? 'Jawab dalam Bahasa Arab (tambahkan arti Indonesia ringkas bila istilah sulit). ' : lang === 'en' ? 'Answer in English (simple, student-friendly). ' : 'Jawab dalam Bahasa Indonesia yang ramah untuk siswa MTs. ';
  const M = mode === 'pr' ? 'Mode BANTU PR: jelaskan langkah demi langkah, beri contoh, akhiri dengan latihan serupa. Jangan langsung beri jawaban akhir tanpa langkah. ' : 'Mode UMUM: jawab SEMUA pertanyaan (pelajaran, koding, umum, info sekolah, dll). Info MTsN 10 hanya bonus bila relevan, jangan batasi jawaban hanya soal madrasah. ';
  return 'Kamu AI MTsN 10 Banyuwangi, kernel Bacapi Bacium V5.6, asisten umum serba bisa ala AI desktop modern. Tanpa emoji. Identitas: kamu adalah AI MTsN 10 Banyuwangi. '
    + L + M + (deep ? 'Mode DEEP: jawab panjang dan mendalam. ' : '')
    + 'Data umum: ' + SEKOLAH;
}

// ---------- CHAT + OPENROUTER (fallback Cube) ----------
let msgs = load('mtsn10_msgs', []);
const FB = ['openrouter/free', 'z-ai/glm-5.2:free', 'minimax/minimax-m3:free'];
function render(){
  chatEl.innerHTML = '';
  if (!msgs.length){ chatEl.innerHTML = '<div class="msg ai">Assalamualaikum! Saya <b>AI MTsN 10 Banyuwangi</b>.<br>Bisa tanya info sekolah, PPDB, atau minta bantuan PR (matematika, IPA, Arab, Inggris...).<br>Pilih bahasa + mode di atas, tombol Deep untuk jawaban panjang.</div>'; return; }
  msgs.forEach(function(m){
    const d = document.createElement('div'); d.className = 'msg ' + (m.role === 'user' ? 'user' : 'ai');
    if (m.role === 'user'){ d.textContent = m.content; if (m.img){ const im = document.createElement('img'); im.src = m.img; d.appendChild(document.createElement('br')); d.appendChild(im); } }
    else {
      let h = esc(m.content).replace(/```(\w*)\n([\s\S]*?)```/g, function(x, l, c){ return '<div class="codeblock"><div class="codehead"><b>kode</b><span class="sp"></span><button onclick="navigator.clipboard.writeText(this.parentNode.nextElementSibling.innerText)">Salin</button></div><pre>' + esc(c.replace(/^\n+|\n+$/g,'')) + '</pre></div>'; });
      d.innerHTML = h.replace(/\n/g, '<br>');
    }
    chatEl.appendChild(d);
  });
  chatEl.scrollTop = chatEl.scrollHeight;
}
async function send(t){
  const text = (t || inputEl.value).trim(); if (!text) return;
  const key = ($('api-key').value.trim() || localStorage.getItem('mtsn10_key') || localStorage.getItem('cube_key') || '');
  if (!key.startsWith('sk-or-v1-')){ $('keypanel').classList.remove('hidden'); setStatus('Isi OpenRouter key dulu.'); return; }
  localStorage.setItem('mtsn10_key', key);
  msgs.push({ role: 'user', content: text, img: photo }); inputEl.value = ''; render();
  $('think').classList.remove('hidden'); setStatus('Berpikir (buku + kubus)...'); $('btn-send').disabled = true;
  const tries = ['openrouter/free'].concat(FB.filter(function(f){ return f !== 'openrouter/free'; }));
  let rep = '', err = '';
  for (let i = 0; i < tries.length; i++){
    try {
      const content = [{ type: 'text', text: text }];
      if (photo) content.push({ type: 'image_url', image_url: { url: photo } });
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://mtsn10.local', 'X-Title': 'MTSN10-AI' },
        body: JSON.stringify({ model: tries[i], messages: [{ role: 'system', content: sys() }].concat(msgs.slice(-12).map(function(x){ return { role: x.role, content: x.content }; })), temperature: 0.7, max_tokens: deep ? 4000 : 1500 })
      });
      const j = await r.json().catch(function(){ return {}; });
      if (!r.ok){ err = '[' + tries[i] + '] ' + r.status + ' ' + ((j.error && j.error.message) || r.statusText); continue; }
      rep = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (rep) break; err = 'respons kosong';
    } catch(e){ err = e.message; }
  }
  $('think').classList.add('hidden'); $('btn-send').disabled = false;
  msgs.push({ role: 'assistant', content: rep || ('Gagal: ' + err) });
  photo = null; save('mtsn10_msgs', msgs.slice(-60)); render(); setStatus('Siap.');
}
$('btn-send').onclick = function(){ send(); };
inputEl.addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(); } });
document.querySelectorAll('#quick button').forEach(function(b){ b.onclick = function(){ inputEl.value = b.textContent + ' — MTsN 10 Banyuwangi'; send(); }; });
render();
