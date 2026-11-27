// Sınıf Pusulası · kendi adresli sürüm köprüsü
// claude.ai'deki claude.use('db'|'user'|'downloads') arayüzünü Firebase ile sağlar.
import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, sendEmailVerification
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentSingleTabManager,
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, waitForPendingWrites
} from 'firebase/firestore';
import { PKEY, PCACHE, portalId, portalSession, portalLogin, renderPortal } from './portal_view.js';

const CFG = window.SP_FIREBASE && window.SP_FIREBASE.apiKey ? window.SP_FIREBASE : null;
// Site yöneticisi (üyelik onaylarını veren hesap) — firestore.rules içindeki adresle aynı olmalı
const ADMIN = String(window.SP_ADMIN || '').trim().toLocaleLowerCase('en-US');
const ADMINS = ADMIN.split(/[,;\s]+/).filter(Boolean);
const isAdmin = u => !!(u && ADMINS.length && ADMINS.includes(String(u.email || '').toLocaleLowerCase('en-US')));
const SKIP = 'sp-local-only';
const ACCT = 'sp-acct';
const APPKEYS = ['ogrenci-takip-v1', 'ogrenci-takip-foto', 'sp-moo', 'sp-sim', 'sp-tour-seen', 'sp-base', 'sp-supimg', 'sp-supvid', 'sp-ok', SKIP];
function wipeLocal() { try { APPKEYS.forEach(k => localStorage.removeItem(k)); } catch (e) {} }
// Hesapla giriş yapılmamış (misafir/tanıtım) kullanımda her açılış sıfırdan başlar
if (CFG) { try { if (!localStorage.getItem(ACCT)) wipeLocal(); } catch (e) {} }
const PS = CFG ? portalSession() : null; // veli/öğrenci oturumu
let auth = null, fs = null, curUser = null, authReady, resolveReady;
authReady = new Promise(r => (resolveReady = r));

if (CFG) {
  try {
    const app = initializeApp(CFG);
    auth = getAuth(app);
    try { auth.languageCode = 'tr'; } catch (e) {}
    try {
      fs = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }) });
    } catch (e) {
      fs = initializeFirestore(app, {});
    }
    onAuthStateChanged(auth, u => {
      curUser = u;
      try {
        const prev = localStorage.getItem(ACCT);
        if (u && prev && prev !== u.uid) { wipeLocal(); localStorage.setItem(ACCT, u.uid); location.reload(); return; }
        if (u) localStorage.setItem(ACCT, u.uid);
        else if (prev) { localStorage.removeItem(ACCT); wipeLocal(); location.reload(); return; }
      } catch (e) {}
      if (!u || PS) { resolveReady(u); refreshPanel(); return; }
      gate(u).then(ok => { if (ok) { closeGate(); resolveReady(u); refreshPanel(); if (isAdmin(u)) adminCount(); } });
    });
  } catch (e) {
    console.warn('Firebase başlatılamadı', e);
    resolveReady(null);
  }
} else resolveReady(null);

// ---- e-posta doğrulama ve yönetici onayı ----
const OKK = 'sp-ok';
async function gate(u) {
  if (isAdmin(u)) { try { localStorage.setItem(OKK, u.uid); } catch (e) {} return true; }
  // Onay sisteminden önce verisi olan öğretmenler (eski üyeler) doğrudan devam eder
  try {
    const m = await getDoc(doc(fs, 'data/users/' + u.uid, 'main'));
    if (m.exists()) {
      let rj = false;
      try { const a = await getDoc(doc(fs, 'accounts', u.uid)); rj = a.exists() && a.data().status === 'rejected'; } catch (x) {}
      if (!rj) { try { localStorage.setItem(OKK, u.uid); } catch (e) {} return true; }
      showGate('rej', u); return false;
    }
  } catch (e) {}
  if (!u.emailVerified) { showGate('verify', u); return false; }
  let st = null;
  try {
    const r = doc(fs, 'accounts', u.uid), s = await getDoc(r);
    if (s.exists()) { st = s.data().status; if (!s.data().ver) setDoc(r, { ver: true }, { merge: true }).catch(() => {}); }
    else { await setDoc(r, { email: u.email || '', at: Date.now(), status: 'pending', ver: true }); st = 'pending'; }
  } catch (e) {
    try { if (localStorage.getItem(OKK) === u.uid) return true; } catch (x) {}
    showGate('err', u); return false;
  }
  if (st === 'approved') { try { localStorage.setItem(OKK, u.uid); } catch (e) {} return true; }
  try { localStorage.removeItem(OKK); } catch (e) {}
  showGate(st === 'rejected' ? 'rej' : 'pend', u); return false;
}
const GCSS = `#spG{position:fixed;inset:0;z-index:9990;background:linear-gradient(160deg,#BFE0FA,#FFF7D9);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Nunito,system-ui,sans-serif;color:#25406B;overflow:auto;color-scheme:light}
#spG .spgb{background:#fff;border:3px solid #25406B;border-radius:26px;box-shadow:0 6px 0 #25406B;padding:26px 22px;width:100%;max-width:400px;text-align:center}
#spG .spgi{font-size:52px;line-height:1}#spG h2{margin:10px 0 6px;font-size:22px;font-weight:900}#spG p{margin:0 0 12px;color:#5E7598;font-weight:600;font-size:14.5px;line-height:1.5}#spG p b{color:#25406B}
#spG button{display:block;width:100%;font:inherit;font-weight:900;font-size:16px;border-radius:14px;padding:12px;cursor:pointer;margin-top:8px}
#spG .gy{background:#FFE08A;color:#25406B;border:2px solid #25406B;box-shadow:0 3px 0 #25406B}#spG .gg{background:#fff;color:#25406B;border:2px solid #D5E5F8}#spG .gl{background:none;border:0;color:#4F6A95;font-size:14px;text-decoration:underline;width:auto;margin:10px auto 0}
#spG .gm{min-height:20px;font-size:13.5px;font-weight:800;color:#2E8B6A;margin-top:8px}#spG .gm.e{color:#C4503F}`;
function closeGate() { const g = document.getElementById('spG'); if (g) g.remove(); }
function showGate(kind, u) {
  if (!document.getElementById('spGcss')) { const s = document.createElement('style'); s.id = 'spGcss'; s.textContent = GCSS; document.head.appendChild(s); }
  let g = document.getElementById('spG'); if (!g) { g = document.createElement('div'); g.id = 'spG'; document.body.appendChild(g); }
  const em = String(u.email || '').replace(/[<>&"]/g, '');
  const T = {
    verify: ['📧', 'E-postanı doğrula', `<b>${em}</b> adresine bir doğrulama bağlantısı gönderdik. E-postadaki bağlantıya dokun, sonra buraya dönüp “Doğruladım” de. Gelen kutunda yoksa <b>Spam / Gereksiz</b> klasörüne bak.`, '<button class="gy" data-g="chk">✓ Doğruladım, devam et</button><button class="gg" data-g="resend">📨 Bağlantıyı tekrar gönder</button>'],
    pend: ['⏳', 'Onay bekleniyor', `Hesabın (<b>${em}</b>) oluşturuldu ve e-postan doğrulandı. Site yöneticisi üyeliğini onayladığında Sınıf Pusulası’nı kullanmaya başlayabilirsin.`, '<button class="gy" data-g="re">⟳ Tekrar kontrol et</button>'],
    rej: ['🚫', 'Üyelik onaylanmadı', `<b>${em}</b> hesabı için üyelik onaylanmadı. Bir yanlışlık olduğunu düşünüyorsan site yöneticisiyle iletişime geç.`, ''],
    err: ['📴', 'Bağlanılamadı', 'Üyelik durumun kontrol edilemedi. İnternet bağlantını kontrol edip tekrar dene.', '<button class="gy" data-g="re">⟳ Tekrar dene</button>']
  }[kind];
  g.innerHTML = `<div class="spgb" role="dialog" aria-modal="true"><div class="spgi">${T[0]}</div><h2>${T[1]}</h2><p>${T[2]}</p>${T[3]}<div class="gm" id="spGm"></div><button class="gl" data-g="out">Çıkış yap</button></div>`;
  g.onclick = async ev => {
    const b = ev.target.closest('[data-g]'); if (!b) return; const a = b.dataset.g, msg = (t, e) => { const m = document.getElementById('spGm'); if (m) { m.textContent = t; m.className = 'gm' + (e ? ' e' : ''); } };
    if (a === 'out') { try { await signOut(auth); } catch (x) {} wipeLocal(); try { localStorage.removeItem(ACCT); localStorage.removeItem(OKK); } catch (x) {} location.reload(); return; }
    if (a === 'resend') { if (b.dataset.t && Date.now() - +b.dataset.t < 60000) return msg('Bir dakika bekleyip tekrar deneyebilirsin.', true); b.dataset.t = Date.now(); try { await sendEmailVerification(auth.currentUser); msg('Bağlantı yeniden gönderildi ✓'); } catch (x) { msg(x && x.code === 'auth/too-many-requests' ? 'Çok fazla deneme oldu. Biraz sonra tekrar dene.' : 'Gönderilemedi. Biraz sonra tekrar dene.', true); } return; }
    if (a === 'chk' || a === 're') {
      b.disabled = true; msg('Kontrol ediliyor…');
      try { await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); } catch (x) {}
      const cu = auth.currentUser; b.disabled = false;
      if (a === 'chk' && cu && !cu.emailVerified) return msg('E-posta henüz doğrulanmamış görünüyor. Bağlantıya dokundun mu?', true);
      const ok = await gate(cu); if (ok) { closeGate(); resolveReady(cu); refreshPanel(); }
    }
  };
}
// ---- yönetici: üyelik onayları ----
let PENDN = 0;
async function adminCount() { try { const qs = await getDocs(collection(fs, 'accounts')); PENDN = qs.docs.filter(d => (d.data().status || 'pending') === 'pending').length; acctBtn(); } catch (e) {} }
const ACSS = `#spA{position:fixed;inset:0;z-index:9600;background:rgba(5,20,50,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Nunito,system-ui,sans-serif;color:#25406B}
#spA .spab2{background:#fff;border:3px solid #25406B;border-radius:24px;box-shadow:0 6px 0 #25406B;padding:18px;width:100%;max-width:560px;max-height:calc(100vh - 32px);display:flex;flex-direction:column}
#spA h3{margin:0 0 4px;font-size:20px;font-weight:900}#spA .sub{margin:0 0 10px;color:#5E7598;font-weight:600;font-size:13.5px}
#spA .tabs{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}#spA .tabs button{font:inherit;font-weight:900;font-size:13.5px;border-radius:99px;padding:6px 12px;border:2px solid #D5E5F8;background:#fff;color:#25406B;cursor:pointer}#spA .tabs button.on{background:#FFE08A;border-color:#25406B}
#spA .lst{overflow:auto;flex:1;min-height:80px;border-top:1.5px solid #EAF2FC}
#spA .rw{display:flex;align-items:center;gap:10px;padding:10px 2px;border-bottom:1.5px solid #EAF2FC}#spA .rw .t{flex:1;min-width:0}#spA .rw b{display:block;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#spA .rw small{display:block;font-size:12px;font-weight:700;color:#5E7598}
#spA .rw button{font:inherit;font-weight:900;font-size:13px;border-radius:12px;padding:7px 10px;cursor:pointer;border:2px solid #D5E5F8;background:#fff;color:#25406B;white-space:nowrap}#spA .rw .ok{background:#2E8B6A;border-color:#2E8B6A;color:#fff}#spA .rw .no{color:#C4503F;border-color:#F0C9C2}
#spA .pl{display:inline-block;font-size:11px;font-weight:900;border-radius:99px;padding:1px 8px;margin-left:4px}#spA .pl.p{background:#FCEBCF;color:#B9741F}#spA .pl.a{background:#DDF3E9;color:#2E8B6A}#spA .pl.r{background:#F9DED9;color:#C4503F}
#spA .emp{padding:24px 6px;text-align:center;color:#5E7598;font-weight:700}#spA .cl{margin-top:12px;font:inherit;font-weight:900;font-size:15px;border-radius:14px;padding:11px;border:2px solid #D5E5F8;background:#fff;color:#25406B;cursor:pointer}
.spab .spdot{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:99px;background:#C4503F;color:#fff;font-size:11px;line-height:18px;padding:0 4px;border:2px solid #fff}.spab{position:relative}`;
async function adminOpen(tab) {
  if (!document.getElementById('spAcss')) { const s = document.createElement('style'); s.id = 'spAcss'; s.textContent = ACSS; document.head.appendChild(s); }
  let o = document.getElementById('spA'); if (!o) { o = document.createElement('div'); o.id = 'spA'; document.body.appendChild(o); }
  tab = tab || 'pending';
  o.innerHTML = '<div class="spab2"><h3>🛡️ Üyelik onayları</h3><p class="sub">Yükleniyor…</p></div>';
  let L = [];
  try { const qs = await getDocs(collection(fs, 'accounts')); L = qs.docs.map(d => Object.assign({ id: d.id }, d.data())); }
  catch (e) { o.innerHTML = '<div class="spab2"><h3>🛡️ Üyelik onayları</h3><p class="sub">Liste alınamadı. Firestore kurallarının güncel olduğundan emin olun.</p><button class="cl" data-ad="x">Kapat</button></div>'; o.onclick = ev => { if (ev.target === o || ev.target.closest('[data-ad="x"]')) o.remove(); }; return; }
  L.forEach(a => { a.status = a.status || 'pending'; });
  PENDN = L.filter(a => a.status === 'pending').length; acctBtn();
  const cnt = k => L.filter(a => a.status === k).length, F = L.filter(a => a.status === tab).sort((a, b) => (b.at || 0) - (a.at || 0));
  const lab = { pending: ['p', 'Bekliyor'], approved: ['a', 'Onaylı'], rejected: ['r', 'Reddedildi'] };
  const esc = x => String(x == null ? '' : x).replace(/[<>&"]/g, '');
  o.innerHTML = `<div class="spab2"><h3>🛡️ Üyelik onayları</h3><p class="sub">Yeni öğretmen hesapları e-postalarını doğruladıktan sonra burada görünür. Onaylamadığınız hesaplar uygulamayı kullanamaz.</p>
    <div class="tabs">${['pending', 'approved', 'rejected'].map(k => `<button class="${k === tab ? 'on' : ''}" data-ad="t" data-k="${k}">${lab[k][1]} (${cnt(k)})</button>`).join('')}</div>
    <div class="lst">${F.length ? F.map(a => `<div class="rw"><div class="t"><b>${esc(a.email || a.id)}</b><small>${a.at ? new Date(a.at).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}${a.ver ? ' · e-posta doğrulandı ✓' : ''}<span class="pl ${lab[a.status][0]}">${lab[a.status][1]}</span></small></div>${a.status !== 'approved' ? `<button class="ok" data-ad="s" data-id="${a.id}" data-v="approved">✓ Onayla</button>` : ''}${a.status === 'pending' ? `<button class="no" data-ad="s" data-id="${a.id}" data-v="rejected">Reddet</button>` : ''}${a.status === 'approved' ? `<button class="no" data-ad="s" data-id="${a.id}" data-v="pending">Onayı kaldır</button>` : ''}</div>`).join('') : `<div class="emp">${tab === 'pending' ? '🎉 Bekleyen üyelik yok.' : 'Bu listede hesap yok.'}</div>`}</div>
    <button class="cl" data-ad="x">Kapat</button></div>`;
  o.onclick = async ev => {
    if (ev.target === o) { o.remove(); return; }
    const b = ev.target.closest('[data-ad]'); if (!b) return;
    if (b.dataset.ad === 'x') { o.remove(); return; }
    if (b.dataset.ad === 't') { adminOpen(b.dataset.k); return; }
    if (b.dataset.ad === 's') { b.disabled = true; try { await setDoc(doc(fs, 'accounts', b.dataset.id), { status: b.dataset.v, by: Date.now() }, { merge: true }); } catch (e) { b.disabled = false; alert('Kaydedilemedi. Firestore kurallarını kontrol edin.'); return; } adminOpen(tab); }
  };
}

// ---- db adaptörü (claude.ai db arayüzünün kullanılan kısmı) ----
function wrapSnap(s) { return { id: s.id, exists: s.exists(), data: () => s.data() }; }
const dbAdapter = {
  collection(path) {
    const c = collection(fs, path);
    return {
      doc(id) {
        const r = doc(fs, path, id);
        // Firestore belge sınırı 1 MB: büyük "data" metni parçalara bölünür
        const PART = 400000;
        return {
          get: async () => {
            const s = wrapSnap(await getDoc(r)), d = s.exists ? s.data() : null;
            if (!d || !d.parts) return s;
            let txt = '';
            for (let i = 0; i < d.parts; i++) { const p = await getDoc(doc(fs, path, id + '__' + i)); txt += (p.exists() && p.data().t) || ''; }
            return { id: s.id, exists: true, data: () => ({ data: txt }) };
          },
          set: async o => {
            if (o && typeof o.data === 'string' && o.data.length > PART) {
              const n = Math.ceil(o.data.length / PART);
              for (let i = 0; i < n; i++) await setDoc(doc(fs, path, id + '__' + i), { t: o.data.slice(i * PART, (i + 1) * PART) });
              return setDoc(r, { parts: n, at: Date.now() });
            }
            return setDoc(r, o);
          },
          delete: () => deleteDoc(r)
        };
      },
      get: async () => {
        const qs = await getDocs(c);
        return { docs: qs.docs.map(d => ({ id: d.id, data: () => d.data() })) };
      }
    };
  }
};

let loginWait = null;
const userAdapter = {
  async id() {
    const u = await authReady;
    if (u) return u.uid;
    if (PS) return null;
    try { if (localStorage.getItem(SKIP)) return null; } catch (e) {}
    return new Promise(res => { loginWait = res; showLogin(); });
  }
};

// ---- indirme ----
const dl = {
  async save({ filename, data }) {
    const blob = data instanceof Blob ? data : new Blob([data]);
    try {
      const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return;
      }
    } catch (e) { if (e && e.name === 'AbortError') { const x = new Error('declined'); x.code = 'declined'; throw x; } }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  }
};

window.claude = {
  use: async name => {
    if (name === 'db') return CFG && fs && !PS ? dbAdapter : null;
    if (name === 'user') return CFG && auth && !PS ? userAdapter : null;
    if (name === 'downloads') return dl;
    return null; // sample vb. bu sürümde yok; uygulama kendi yedek yoluna geçer
  }
};

// ---- giriş ekranı ----
const ERR = {
  'auth/invalid-email': 'E-posta adresi geçersiz.',
  'auth/missing-password': 'Şifre yazın.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
  'auth/email-already-in-use': 'Bu e-postayla zaten bir hesap var. “Giriş yap”ı deneyin.',
  'auth/invalid-credential': 'E-posta ya da şifre yanlış.',
  'auth/wrong-password': 'E-posta ya da şifre yanlış.',
  'auth/user-not-found': 'Bu e-postayla bir hesap yok. “Hesap oluştur”u deneyin.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin.',
  'auth/network-request-failed': 'İnternet bağlantısı yok gibi görünüyor.'
};
const css = `
#spL{position:fixed;inset:0;z-index:9999;background:linear-gradient(160deg,#BFE0FA,#FFF7D9);display:flex;align-items:center;justify-content:center;padding:calc(20px + env(safe-area-inset-top,0px)) 20px calc(20px + env(safe-area-inset-bottom,0px));font-family:Nunito,system-ui,sans-serif;color:#25406B;overflow:auto}
#spL .sptabs{display:flex;gap:4px;background:#EEF4FC;border-radius:14px;padding:4px;margin:12px 0 14px}#spL .sptabs button{flex:1;margin:0;padding:9px 4px;border:0;border-radius:11px;background:none;color:#4F6A95;font-size:15px}#spL .sptabs button.on{background:#fff;color:#25406B;box-shadow:0 1px 0 #25406B,0 0 0 2px #25406B}
#spL form[hidden]{display:none}
#spL .spbx{position:relative;inset:auto;margin:auto;transform:none;background:#fff;border:3px solid #25406B;border-radius:26px;box-shadow:0 6px 0 #25406B;padding:26px 22px;width:100%;max-width:380px;text-align:center}
#spL img{width:84px;height:84px;border-radius:22px;box-shadow:0 4px 12px rgba(37,64,107,.25)}
#spL h2{margin:12px 0 2px;font-size:22px;font-weight:900}
#spL p{margin:0 0 16px;color:#62789B;font-weight:600;font-size:14px}
#spL{color-scheme:light}
#spL input{width:100%;box-sizing:border-box;font:inherit;font-size:17px;font-weight:700;color:#25406B!important;-webkit-text-fill-color:#25406B!important;caret-color:#25406B;border:2px solid #B9CDE8!important;border-radius:14px!important;padding:13px 14px;margin:0 0 10px;background:#FFFFFF!important;box-shadow:none!important;outline:none;opacity:1}
#spL input::placeholder{color:#7D90AE!important;-webkit-text-fill-color:#7D90AE!important;opacity:1;font-weight:700}
#spL input:-webkit-autofill{-webkit-box-shadow:0 0 0 40px #fff inset!important;-webkit-text-fill-color:#25406B!important}
#spL input:focus{border-color:#25406B!important;box-shadow:0 0 0 3px #FFE08A!important}
#spL button{font:inherit;font-weight:900;font-size:16px;border-radius:14px;padding:12px;width:100%;cursor:pointer;margin-top:4px}
#spL .spy{background:#FFE08A;color:#25406B;border:2px solid #25406B;box-shadow:0 3px 0 #25406B}
#spL .spg{background:#fff;color:#25406B;border:2px solid #D5E5F8}
#spL .spln{background:none;border:0;color:#4F6A95;font-size:14px;font-weight:800;text-decoration:underline;padding:8px;width:auto}
#spL .sper{min-height:20px;color:#C0392B;font-weight:800;font-size:14px;margin:4px 0 6px}
#spL .spok{color:#1E8E5A}
`;
function showLogin() {
  if (document.getElementById('spL')) return;
  if (!document.getElementById('spLcss')) { const s = document.createElement('style'); s.id = 'spLcss'; s.textContent = css; document.head.appendChild(s); }
  const ic = (document.querySelector('link[rel="apple-touch-icon"]') || {}).href || '';
  const d = document.createElement('div'); d.id = 'spL';
  d.innerHTML = `<div class="spbx">
    ${ic ? `<img src="${ic}" alt="">` : ''}
    <h2>Sınıf Pusulası</h2>
    <div class="sptabs" role="tablist"><button type="button" data-tab="t" class="on">Öğretmen</button><button type="button" data-tab="v">Veli</button><button type="button" data-tab="o">Öğrenci</button></div>
    <form id="spPF" hidden autocomplete="on">
    <p id="spPT">Öğretmeninizin verdiği kullanıcı adı ve şifreyle girin.</p>
    <input id="spU" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Kullanıcı adı" required>
    <input id="spW" type="password" autocomplete="current-password" autocapitalize="off" placeholder="Şifre" required>
    <div class="sper" id="spPEr"></div>
    <button type="submit" class="spy" id="spPIn">Giriş yap</button>
    </form>
    <form id="spTF" autocomplete="on">
    <p>Verileriniz bütün cihazlarınızda aynı olsun diye hesabınızla giriş yapın.</p>
    <input id="spE" type="email" inputmode="email" autocomplete="username" placeholder="E-posta" required>
    <input id="spP" type="password" autocomplete="current-password" placeholder="Şifre (en az 6 karakter)" required>
    <div class="sper" id="spEr"></div>
    <button type="submit" class="spy" id="spIn">Giriş yap</button>
    <button type="button" class="spg" id="spUp">Hesap oluştur</button>
    <button type="button" class="spln" id="spFg">Şifremi unuttum</button><br>
    <button type="button" class="spln" id="spSk">Giriş yapmadan dene (tanıtım sınıfıyla)</button>
  </form></div>`;
  document.body.appendChild(d);
  const $ = id => document.getElementById(id), er = (m, ok) => { $('spEr').textContent = m; $('spEr').className = 'sper' + (ok ? ' spok' : ''); };
  const busy = b => { ['spIn', 'spUp'].forEach(i => ($(i).disabled = b)); };
  const go = async fn => {
    const e = $('spE').value.trim(), p = $('spP').value;
    if (!e) return er('E-posta adresinizi yazın.');
    busy(true); er('');
    try { await fn(auth, e, p); try { localStorage.removeItem(SKIP); } catch (x) {} done(); }
    catch (x) { er(ERR[x.code] || 'Olmadı: ' + (x.code || x.message)); }
    busy(false);
  };
  $('spTF').addEventListener('submit', ev => { ev.preventDefault(); go(signInWithEmailAndPassword); });
  let prole = 'v';
  d.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    d.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b));
    const t = b.dataset.tab; $('spTF').hidden = t !== 't'; $('spPF').hidden = t === 't';
    if (t !== 't') { prole = t; $('spPT').textContent = t === 'v' ? 'Öğretmenin verdiği veli kullanıcı adı ve şifresiyle girin.' : 'Öğretmeninin verdiği öğrenci kullanıcı adı ve şifresiyle gir.'; setTimeout(() => $('spU').focus(), 30); }
  });
  $('spPF').addEventListener('submit', async ev => {
    ev.preventDefault(); const u = $('spU').value.trim(), p = $('spW').value.trim(), pe = m => { $('spPEr').textContent = m; };
    if (!u || !p) return pe('Kullanıcı adı ve şifreyi yazın.');
    $('spPIn').disabled = true; pe('');
    try { await portalLogin(fs, u, p, prole); location.reload(); }
    catch (x) { pe(x.code === 'nf' ? 'Kullanıcı adı ya da şifre yanlış.' : x.code === 'role' ? (x.role === 'v' ? 'Bu bilgiler veli girişi için. Üstten “Veli”yi seçin.' : 'Bu bilgiler öğrenci girişi için. Üstten “Öğrenci”yi seçin.') : 'Bağlanılamadı. İnternet bağlantınızı kontrol edin.'); }
    $('spPIn').disabled = false;
  });
  $('spUp').onclick = () => go(async (a, e, p) => { const c = await createUserWithEmailAndPassword(a, e, p); if (!isAdmin(c.user)) { try { await sendEmailVerification(c.user); } catch (x) {} try { await setDoc(doc(fs, 'accounts', c.user.uid), { email: c.user.email || e, at: Date.now(), status: 'pending', ver: false }); } catch (x) {} } return c; });
  $('spFg').onclick = async () => {
    const e = $('spE').value.trim(); if (!e) return er('Önce e-posta adresinizi yazın.');
    try { await sendPasswordResetEmail(auth, e); er('Şifre yenileme bağlantısı e-postanıza gönderildi.', true); }
    catch (x) { er(ERR[x.code] || 'Gönderilemedi.'); }
  };
  $('spSk').onclick = () => { try { localStorage.setItem(SKIP, '1'); } catch (x) {} d.remove(); if (loginWait) { loginWait(null); loginWait = null; } };
  function done() {
    // misafirken girilenler hesaba taşınmasın: temizle, hesabı işaretle, baştan yükle
    wipeLocal();
    try { localStorage.setItem(ACCT, auth.currentUser.uid); } catch (x) {}
    location.reload();
  }
}

// ---- Ayarlar › Yedek içindeki hesap kutusu ----
function panel() {
  if (!CFG) return '';
  const u = curUser;
  return `<div class="card" id="spAcct" style="margin:10px 0;padding:12px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
    <span style="font-size:22px">👤</span>
    <span style="flex:1;min-width:150px">${u ? `<b>${(u.email || '').replace(/[<>&"]/g, '')}</b><br><small class="mut">Bütün cihazlarınızla eşitleniyor</small>` : `<b>Giriş yapılmadı</b><br><small class="mut">Veriler sadece bu cihazda</small>`}</span>
    <button class="btn s ${u ? 'g' : 'y'}" data-sp="${u ? 'out' : 'in'}">${u ? 'Çıkış yap' : 'Giriş yap'}</button>
  </div>`;
}
function refreshPanel() { const p = document.getElementById('spAcct'); if (p) p.outerHTML = panel(); acctBtn(); }
document.addEventListener('click', async ev => {
  const b = ev.target.closest && ev.target.closest('[data-sp]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  if (b.dataset.sp === 'in') { try { localStorage.removeItem(SKIP); } catch (x) {} showLogin(); }
  if (b.dataset.sp === 'out') askOut();
}, true);

// ---- hesap menüsü (başlıktaki yuvarlak düğme) ----
const MCSS = `
.spab{flex:none;width:40px;height:40px;border-radius:50%;border:2px solid #25406B;background:#FFE08A;color:#25406B;display:grid;place-items:center;font:900 17px/1 Nunito,system-ui,sans-serif;cursor:pointer;margin-left:auto;align-self:center;box-shadow:0 2px 0 #25406B;padding:0}
.spab.g{background:#fff}.spab svg{width:20px;height:20px}
.hd .spab+.fsb{margin-left:8px!important}
@media(max-width:599px){.spab{width:36px;height:36px;font-size:15px}}
#spM{position:fixed;inset:0;z-index:9500}
#spM .spm-mn{position:fixed;width:min(300px,calc(100vw - 20px));background:#fff;color:#25406B;border:2.5px solid #25406B;border-radius:20px;box-shadow:0 5px 0 #25406B,0 18px 40px rgba(20,40,80,.25);overflow:hidden;font-family:Nunito,system-ui,sans-serif;animation:spMi .16s ease-out}
@keyframes spMi{from{opacity:0;transform:translateY(-6px) scale(.98)}}
#spM .spm-mh{display:flex;gap:10px;align-items:center;padding:14px;background:linear-gradient(160deg,#DCEBFB,#FFF7D9)}
#spM .spm-mh .spm-a{width:42px;height:42px;border-radius:50%;background:#FFE08A;border:2px solid #25406B;display:grid;place-items:center;font-weight:900;font-size:18px;flex:none}
#spM .spm-mh b{display:block;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#spM .spm-mh small{display:block;font-size:12px;font-weight:800;color:#2E8B6A}#spM .spm-mh small.off{color:#B9741F}
#spM .spm-mh>div{min-width:0}
#spM button.spm-it{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;font:inherit;font-weight:800;font-size:15px;color:#25406B;padding:12px 16px;text-align:left;cursor:pointer}
#spM button.spm-it:hover,#spM button.spm-it:focus-visible{background:#F2F8FF;outline:none}
#spM button.spm-it span{width:22px;text-align:center;font-size:18px}
#spM .spm-sep{height:1.5px;background:#EAF2FC;margin:2px 0}
#spM button.spm-it.out{color:#C4503F}
#spO{position:fixed;inset:0;z-index:9600;background:rgba(5,20,50,.55);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Nunito,system-ui,sans-serif}
#spO .sp-obx{background:#fff;color:#25406B;border:3px solid #25406B;border-radius:24px;box-shadow:0 6px 0 #25406B;padding:22px 20px 18px;width:100%;max-width:360px;text-align:center}
#spO .sp-oic{font-size:40px;line-height:1}#spO h3{margin:8px 0 6px;font-size:20px;font-weight:900}#spO p{margin:0 0 16px;font-size:14px;font-weight:600;color:#5E7598;line-height:1.5}
#spO .sp-oac{display:flex;gap:8px}#spO .sp-obx button{flex:1;font:inherit;font-weight:900;font-size:15px;border-radius:14px;padding:12px;cursor:pointer}
#spO .sp-oy{background:#C4503F;color:#fff;border:2px solid #8E2F22;box-shadow:0 3px 0 #8E2F22}#spO .sp-og{background:#fff;color:#25406B;border:2px solid #D5E5F8}
`;
function mcss() { if (!document.getElementById('spMcss')) { const s = document.createElement('style'); s.id = 'spMcss'; s.textContent = MCSS; document.head.appendChild(s); } }
const ini1 = u => ((u && (u.email || '')) || '?').trim().charAt(0).toLocaleUpperCase('tr-TR') || '?';
function acctBtn() {
  if (!CFG || PS) return; mcss();
  const hd = document.querySelector('.hd .in'); if (!hd) return;
  let b = document.getElementById('spAB');
  if (!b) { b = document.createElement('button'); b.id = 'spAB'; b.type = 'button'; b.addEventListener('click', ev => { ev.stopPropagation(); openMenu(b); }); const fs = document.getElementById('fsb'); fs ? hd.insertBefore(b, fs) : hd.appendChild(b); }
  const u = curUser;
  b.className = 'spab noico' + (u ? '' : ' g');
  b.setAttribute('aria-label', u ? 'Hesap menüsü: ' + (u.email || '') : 'Hesap menüsü');
  b.title = u ? (u.email || 'Hesap') : 'Giriş yapılmadı';
  b.innerHTML = (u ? ini1(u) : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>') + (isAdmin(u) && PENDN ? '<span class="spdot">' + PENDN + '</span>' : '');
  if (isAdmin(u) && !document.getElementById('spAcss')) { const s = document.createElement('style'); s.id = 'spAcss'; s.textContent = ACSS; document.head.appendChild(s); }
  if (window.SPBrand) window.SPBrand();
}
function closeMenu() { const m = document.getElementById('spM'); if (m) m.remove(); document.removeEventListener('keydown', escMenu); }
function escMenu(e) { if (e.key === 'Escape') closeMenu(); }
function fire(sel, attrs) { const x = document.createElement('button'); x.hidden = true; Object.keys(attrs).forEach(k => x.setAttribute(k, attrs[k])); document.body.appendChild(x); x.click(); x.remove(); }
function openMenu(btn) {
  if (document.getElementById('spM')) return closeMenu();
  mcss(); const u = curUser, m = document.createElement('div'); m.id = 'spM';
  const it = (ic, lab, act, cls) => `<button class="spm-it ${cls || ''}" data-m="${act}"><span>${ic}</span>${lab}</button>`;
  m.innerHTML = `<div class="spm-mn" role="menu">
    <div class="spm-mh"><div class="spm-a">${u ? ini1(u) : '👤'}</div><div><b>${u ? (u.email || '').replace(/[<>&"]/g, '') : 'Giriş yapılmadı'}</b><small class="${u ? '' : 'off'}">${u ? (navigator.onLine ? '☁️ Bütün cihazlarınızla eşitleniyor' : '📴 Çevrimdışı · bağlantı gelince eşitlenir') : 'Veriler kalıcı değil · tanıtım modu'}</small></div></div>
    ${u ? (isAdmin(u) ? it('🛡️', 'Üyelik onayları' + (PENDN ? ' (' + PENDN + ')' : ''), 'adm') : '') + it('⚙️', 'Ayarlar', 'set') + it('👪', 'Veli ve öğrenci girişi', 'pt') + it('💾', 'Yedek al / yükle', 'bak') + it('🎬', 'Tanıtım turu', 'tour') + '<div class="spm-sep"></div>' + it('🚪', 'Çıkış yap', 'out', 'out')
      : it('🔑', 'Giriş yap / Hesap oluştur', 'in') + it('🎬', 'Tanıtım turu', 'tour') + '<div class="spm-sep"></div>' + it('↺', 'Tanıtımdan çık', 'reset', 'out')}
  </div>`;
  document.body.appendChild(m);
  const r = btn.getBoundingClientRect(), mn = m.querySelector('.spm-mn');
  mn.style.top = (r.bottom + 8) + 'px'; mn.style.left = Math.max(10, Math.min(innerWidth - mn.offsetWidth - 10, r.right - mn.offsetWidth)) + 'px';
  m.addEventListener('click', ev => {
    const b = ev.target.closest('[data-m]'); if (!b) { closeMenu(); return; }
    const a = b.dataset.m; closeMenu();
    if (a === 'set') { const t = document.querySelector('[data-a="tab"][data-t="settings"]'); if (t) t.click(); }
    else if (a === 'pt') fire('', { 'data-a': 'ptOpen' });
    else if (a === 'bak') { const t = document.querySelector('[data-a="tab"][data-t="settings"]'); if (t) t.click(); setTimeout(() => fire('', { 'data-a': 'setOpen', 'data-k': 'bak' }), 250); }
    else if (a === 'tour') fire('', { 'data-tr': 'start' });
    else if (a === 'adm') adminOpen();
    else if (a === 'out') askOut();
    else if (a === 'in') { try { localStorage.removeItem(SKIP); } catch (x) {} showLogin(); }
    else if (a === 'reset') { wipeLocal(); location.reload(); }
  });
  document.addEventListener('keydown', escMenu);
  const f = m.querySelector('[data-m]'); if (f) f.focus();
}
function askOut() {
  mcss(); if (document.getElementById('spO')) return;
  const o = document.createElement('div'); o.id = 'spO';
  o.innerHTML = `<div class="sp-obx" role="alertdialog" aria-modal="true" aria-labelledby="spOt"><div class="sp-oic">🚪</div><h3 id="spOt">Çıkış yapılsın mı?</h3><p>Sınıflarınız ve kayıtlarınız hesabınızda güvende kalır. Bu cihazdaki kopya silinir; tekrar giriş yaptığınızda her şey geri gelir.</p><div class="sp-oac"><button class="sp-og" data-o="no">Vazgeç</button><button class="sp-oy" data-o="yes">Çıkış yap</button></div></div>`;
  document.body.appendChild(o);
  const close = () => o.remove();
  o.addEventListener('click', async ev => {
    if (ev.target === o) return close();
    const b = ev.target.closest('[data-o]'); if (!b) return;
    if (b.dataset.o === 'no') return close();
    b.disabled = true; b.textContent = 'Kaydediliyor…';
    // son değişiklikler buluta gitsin (en çok 5 sn bekle)
    await new Promise(r => setTimeout(r, 900));
    try { await Promise.race([waitForPendingWrites(fs), new Promise(r => setTimeout(r, 5000))]); } catch (x) {}
    try { await signOut(auth); } catch (x) {}
    wipeLocal(); try { localStorage.removeItem(ACCT); } catch (x) {}
    location.reload();
  });
  o.querySelector('[data-o="no"]').focus();
}
if (CFG && !PS) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', acctBtn); else acctBtn(); }

window.SPCloud = { panel, showLogin, portal: !!(CFG && fs), portalId, renderPortal, askOut, idToken: async () => { try { return auth && auth.currentUser ? await auth.currentUser.getIdToken() : null; } catch (e) { return null; } }, openMenu: () => { const b = document.getElementById("spAB"); if (b) openMenu(b); } };

// ---- veli / öğrenci sayfası ----
if (PS) {
  const out = () => { try { localStorage.removeItem(PKEY); localStorage.removeItem(PCACHE); localStorage.removeItem('sp-portal-lib'); } catch (e) {} location.reload(); };
  const saveAv = async spec => { await setDoc(doc(fs, 'avreq', PS.id), { av: spec, at: Date.now() }); };
  const lib = { load: async () => { const s = await getDoc(doc(fs, 'bkreq', PS.id)); if (!s.exists()) return null; try { const v = JSON.parse(s.data().j || '[]'); return Array.isArray(v) ? v : null; } catch (e) { return null; } }, save: async L => { await setDoc(doc(fs, 'bkreq', PS.id), { j: JSON.stringify(L), at: Date.now() }); } };
  const show = x => { try { const ro = x.role || PS.role; window.SPPushCtx = { pid: PS.id, role: ro }; renderPortal(JSON.parse(x.d), ro, x.at, out, refresh, ro === 'o' ? saveAv : null, ro === 'o' ? lib : null); } catch (e) { console.warn(e); } };
  const refresh = async () => {
    try {
      const s = await getDoc(doc(fs, 'portal', PS.id));
      if (!s.exists()) { try { localStorage.removeItem(PKEY); localStorage.removeItem(PCACHE); } catch (e) {} alertGone(); return; }
      const x = s.data(); try { localStorage.setItem(PCACHE, JSON.stringify(x)); } catch (e) {} show(x);
    } catch (e) { console.warn('portal', e); }
  };
  const alertGone = () => { const el = document.getElementById('spP'); if (el) el.remove(); document.body.classList.remove('spport'); showLogin(); setTimeout(() => { const pe = document.getElementById('spPEr'), b = document.querySelector('#spL [data-tab="' + (PS.role || 'v') + '"]'); if (b) b.click(); if (pe) pe.textContent = 'Giriş bilgileriniz değişmiş. Öğretmeninizden yenisini isteyin.'; }, 50); };
  const start = () => { setTimeout(() => { try { if (window.SPPush) SPPush.refresh({ pid: PS.id, role: PS.role || 'v' }); } catch (e) {} }, 4000); try { const c = JSON.parse(localStorage.getItem(PCACHE) || 'null'); if (c) show(c); } catch (e) {} refresh(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
}

// ---- çevrimdışı çalışma (service worker) ----
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  const hadCtrl = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadCtrl && !reloaded) { reloaded = true; location.reload(); } });
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(e => console.warn('sw', e)));
}
