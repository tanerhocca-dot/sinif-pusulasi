/* Sınıf Pusulası · bildirimler (Web Push)
   Cihaz aboneliği Firestore "push/{id}" belgesine yazılır. Bildirimleri GitHub Actions'ta
   birkaç dakikada bir çalışan gönderici (tools/push/run.mjs) yollar. */
(function () {
  'use strict';
  var CFG = window.SP_FIREBASE || {}, P = CFG.projectId || 'sinif-pusulasi', K = CFG.apiKey || '';
  var API = 'https://firestore.googleapis.com/v1/projects/' + P + '/databases/(default)/documents/';
  var M = {
    kontrol: ['📚', 'Ödev ve kitap kontrolleri', 'Listelere işaret girildiğinde'],
    yoklama: ['🗓️', 'Yoklama', 'Gelmedi veya izinli işaretlendiğinde'],
    puan: ['⭐', 'Ödül puanları ve süper etiketler', 'Lig puanı ve etiket verildiğinde'],
    yaptirim: ['⚠️', 'Yaptırımlar', 'Eksi puan girildiğinde'],
    rozet: ['🏅', 'Rozetler', 'Yeni rozet kazanıldığında'],
    not: ['📝', 'Notlar ve denemeler', 'Not ya da deneme sonucu girildiğinde'],
    mesaj: ['💬', 'Koç mesajları', 'Koç mesaj yazdığında'],
    program: ['🎯', 'Program ve görevler', 'Programa görev eklendiğinde'],
    hatirlatma: ['📌', 'Hatırlatmalar', 'Göreve hatırlatma iğnelendiğinde'],
    omesaj: ['💬', 'Öğrenci mesajları', 'Birebir öğrencin yazdığında'],
    okayit: ['✅', 'Öğrenci görev ve deneme kayıtları', 'Öğrenci görevini ya da denemesini girdiğinde'],
    okitap: ['📚', 'Öğrenci kitap eklemeleri', 'Öğrenci kitaplığına kitap eklediğinde']
  };
  var ROLE = { v: ['kontrol', 'yoklama', 'puan', 'yaptirim', 'rozet', 'not'], o: ['kontrol', 'yoklama', 'puan', 'yaptirim', 'rozet', 'not'], b: ['mesaj', 'program', 'hatirlatma'], t: ['omesaj', 'okayit', 'okitap'] };
  var SEND = ['kontrol', 'yoklama', 'puan', 'yaptirim', 'rozet', 'not', 'mesaj', 'program', 'hatirlatma'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plat() {
    var ua = navigator.userAgent || '', ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var sa = !!((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone);
    var kind = ios ? (/iPad|Macintosh/.test(ua) ? 'ipad' : 'iphone') : /Android/.test(ua) ? 'android' : 'desktop';
    return { ios: ios, sa: sa, kind: kind, native: !!window.SP_NATIVE };
  }
  function support() {
    var p = plat();
    if (p.native) return { ok: false, why: 'native', p: p };
    if (p.ios && !p.sa) return { ok: false, why: 'ios', p: p };
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return { ok: false, why: 'old', p: p };
    if (location.protocol !== 'https:' && !/^(localhost|127\.)/.test(location.hostname)) return { ok: false, why: 'http', p: p };
    if (Notification.permission === 'denied') return { ok: false, why: 'denied', p: p };
    return { ok: true, p: p };
  }
  function lsk(ctx) { return 'sp-push-' + (ctx.pid || ctx.owner || 'x'); }
  function ld(ctx) { try { return JSON.parse(localStorage.getItem(lsk(ctx)) || 'null'); } catch (e) { return null; } }
  function sv(ctx, o) { try { if (o) localStorage.setItem(lsk(ctx), JSON.stringify(o)); else localStorage.removeItem(lsk(ctx)); } catch (e) {} }
  function b64u(s) { var pad = '='.repeat((4 - s.length % 4) % 4), b = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/')), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  async function sha(s) { var d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(d)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('').slice(0, 40); }
  var VAPID = null;
  async function vapid() {
    if (VAPID) return VAPID;
    var r = await fetch(API + 'pubcfg/vapid?key=' + K);
    if (!r.ok) throw new Error('vapid');
    var j = await r.json(); VAPID = j.fields && j.fields.k && j.fields.k.stringValue; if (!VAPID) throw new Error('vapid');
    return VAPID;
  }
  async function hdr(ctx) { var h = { 'Content-Type': 'application/json' }; if (ctx.role === 't' && window.SPCloud && SPCloud.idToken) { var t = await SPCloud.idToken(); if (t) h.Authorization = 'Bearer ' + t; } return h; }
  async function put(ctx, id, data) {
    var f = {}; Object.keys(data).forEach(function (k) { var v = data[k]; f[k] = typeof v === 'number' ? { integerValue: String(Math.round(v)) } : { stringValue: String(v) }; });
    var r = await fetch(API + 'push/' + id + '?key=' + K, { method: 'PATCH', headers: await hdr(ctx), body: JSON.stringify({ fields: f }) });
    if (!r.ok) throw new Error('kayıt ' + r.status);
  }
  async function del(ctx, id) { try { await fetch(API + 'push/' + id + '?key=' + K, { method: 'DELETE', headers: await hdr(ctx) }); } catch (e) {} }
  async function reg() { var r = await navigator.serviceWorker.getRegistration(); if (!r) r = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }); return navigator.serviceWorker.ready.then(function () { return r; }); }
  async function curSub() { try { var r = await reg(); return await r.pushManager.getSubscription(); } catch (e) { return null; } }

  async function enable(ctx, st) {
    var perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error(perm === 'denied' ? 'denied' : 'dismiss');
    var key = await vapid(), r = await reg(), sub = await r.pushManager.getSubscription();
    if (sub) { try { var ok = sub.options && sub.options.applicationServerKey; if (ok) { var a = new Uint8Array(ok), b = b64u(key); if (a.length !== b.length || a.some(function (x, i) { return x !== b[i]; })) { await sub.unsubscribe(); sub = null; } } } catch (e) {} }
    if (!sub) sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(key) });
    var js = JSON.stringify(sub.toJSON()), id = await sha(js.match(/"endpoint":"([^"]+)"/)[1] + '|' + (ctx.pid || ctx.owner));
    st = Object.assign({ off: [], q: ctx.role === 't' ? 0 : 1 }, st || {}, { id: id, on: 1 });
    await write(ctx, st, js); sv(ctx, st); return st;
  }
  async function write(ctx, st, js) {
    if (!js) { var s = await curSub(); if (!s) throw new Error('nosub'); js = JSON.stringify(s.toJSON()); }
    var p = plat();
    await put(ctx, st.id, { pid: ctx.pid || '', role: ctx.role, owner: ctx.owner || '', s: js, off: (st.off || []).join(','), q: st.q ? 1 : 0, at: Date.now(), dev: p.kind + (p.sa ? '-app' : '') });
  }
  async function disable(ctx) { var st = ld(ctx); if (st && st.id) await del(ctx, st.id); sv(ctx, null); }
  // Kayıt dursa bile cihaz aboneliği yenilenirse (tarayıcı anahtarı değiştirirse) açılışta yeniden yaz
  async function refresh(ctx) {
    var st = ld(ctx); if (!st || !st.on || !support().ok || Notification.permission !== 'granted') return;
    try { var s = await curSub(); if (!s) { await enable(ctx, st); return; } if (Date.now() - (st.w || 0) > 6 * 864e5) { await write(ctx, st, JSON.stringify(s.toJSON())); st.w = Date.now(); sv(ctx, st); } } catch (e) {}
  }

  /* ---------------- arayüz ---------------- */
  function css() {
    if (document.getElementById('sppcss')) return;
    var c = document.createElement('style'); c.id = 'sppcss'; c.textContent =
      '#sppO{position:fixed;inset:0;z-index:10050;background:rgba(232,242,255,.45);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:16px;animation:sppF .2s ease}' +
      '@keyframes sppF{from{opacity:0}}@keyframes sppU{from{transform:translateY(24px);opacity:.4}}' +
      '#sppB{width:min(460px,100%);max-height:min(88vh,760px);overflow:auto;background:#fff;border:1.5px solid #D5E5F8;border-radius:22px;box-shadow:0 18px 50px rgba(37,64,107,.18);font-family:Nunito,system-ui,sans-serif;color:#25406B;text-align:left;animation:sppU .25s cubic-bezier(.2,1.2,.4,1);-webkit-overflow-scrolling:touch}' +
      '#sppB .sh{position:sticky;top:0;background:#fff;display:flex;align-items:center;gap:10px;padding:16px 18px 10px;border-bottom:1px solid #EEF4FC;z-index:1}#sppB .sh b{font-size:18px;font-weight:900;flex:1}#sppB .sx{width:34px;height:34px;border-radius:50%;border:1.5px solid #D5E5F8;background:#fff;font-size:16px;cursor:pointer;color:#25406B}' +
      '#sppB .sc{padding:12px 18px 18px}#sppB .st{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:16px;background:#F3F8FF;border:1.5px solid #D5E5F8;margin-bottom:12px}#sppB .st.on{background:#EAF7F0;border-color:#BFE3CF}#sppB .st.warn{background:#FFF6DA;border-color:#F0D58A}' +
      '#sppB .st i{font-style:normal;font-size:24px}#sppB .st span{flex:1;font-size:13.5px;line-height:1.4;font-weight:700}#sppB .st span b{display:block;font-size:15px;font-weight:900}' +
      '#sppB .bt{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 16px;border-radius:13px;border:2px solid #25406B;background:linear-gradient(160deg,#FFF6CF,#FFD966);box-shadow:0 3px 0 #25406B;color:#25406B;font:900 14px Nunito,system-ui,sans-serif;cursor:pointer}#sppB .bt.g{background:#fff;border:1.5px solid #D5E5F8;box-shadow:none;font-weight:800}#sppB .bt:disabled{opacity:.55}' +
      '#sppB .row2{display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 6px}#sppB .row2 .bt{flex:1 1 140px}' +
      '#sppB h4{margin:16px 0 6px;font-size:12px;letter-spacing:.06em;font-weight:900;color:#62789B;text-transform:uppercase}' +
      '#sppB .tg{display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid #EEF4FC;cursor:pointer;-webkit-tap-highlight-color:transparent}#sppB .tg:last-child{border-bottom:0}#sppB .tg em{font-style:normal;font-size:20px;width:28px;text-align:center}#sppB .tg span{flex:1;min-width:0}#sppB .tg b{display:block;font-size:14.5px;font-weight:800}#sppB .tg small{display:block;font-size:12px;color:#62789B;font-weight:600}' +
      '#sppB .sw{position:relative;width:46px;height:28px;border-radius:99px;background:#D7E2F0;flex:0 0 auto;transition:background .2s}#sppB .sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s}#sppB .tg.on .sw{background:#2E8B6A}#sppB .tg.on .sw::after{transform:translateX(18px)}#sppB .tg.dis{opacity:.45;pointer-events:none}' +
      '#sppB p,#sppB ol{text-align:left!important}#sppB .box{border:1.5px solid #D5E5F8;border-radius:16px;padding:2px 12px;background:#fff}#sppB .nt{font-size:12.5px;color:#62789B;line-height:1.5;margin:10px 2px 0;font-weight:600}#sppB ol{margin:6px 0 0 18px;padding:0;font-size:13.5px;line-height:1.6;font-weight:700}' +
      '@media(max-width:599px){#sppO{align-items:flex-end;padding:0}#sppB{width:100%;max-height:90vh;border-radius:22px 22px 0 0;border-bottom:0;padding-bottom:env(safe-area-inset-bottom)}#sppB .tg{padding:13px 2px}}' +
      '@media(min-width:900px){#sppB{width:520px}}';
    document.head.appendChild(c);
  }
  function guide(s) {
    var p = s.p;
    if (s.why === 'ios') return '<div class="st warn"><i>📲</i><span><b>Önce ana ekrana ekleyin</b>' + (p.kind === 'ipad' ? 'iPad' : 'iPhone') + '’da bildirimler yalnızca ana ekrana eklenen uygulamada çalışır.</span></div><ol><li>Safari’de <b>Paylaş</b> düğmesine (kare ve yukarı ok) dokunun.</li><li><b>Ana Ekrana Ekle</b>’yi seçin.</li><li>Ana ekrandaki <b>Sınıf Pusulası</b> simgesinden açıp buraya yeniden gelin.</li></ol><p class="nt">iOS / iPadOS 16.4 ve sonrası gerekir.</p>';
    if (s.why === 'native') return '<div class="st warn"><i>🌐</i><span><b>Bu uygulamada şimdilik yok</b>Bildirim almak için <b>www.sinifpusulasi.com.tr</b> adresini Chrome’da açıp menüden <b>Ana ekrana ekle</b> deyin; oradan bildirimleri açın.</span></div>';
    if (s.why === 'denied') return '<div class="st warn"><i>🔕</i><span><b>Bildirim izni kapalı</b>' + (p.kind === 'desktop' ? 'Adres çubuğundaki kilit / ayar simgesine tıklayıp <b>Bildirimler → İzin ver</b> seçin, sonra sayfayı yenileyin.' : p.ios ? 'Ayarlar → Bildirimler → Sınıf Pusulası’ndan izni açın.' : 'Telefon Ayarları → Uygulamalar → Chrome (veya Sınıf Pusulası) → Bildirimler’den izni açın.') + '</span></div>';
    if (s.why === 'http') return '<div class="st warn"><i>🔒</i><span><b>Güvenli bağlantı gerekli</b>Bildirimler yalnızca https adresinde çalışır.</span></div>';
    return '<div class="st warn"><i>⚠️</i><span><b>Bu tarayıcı desteklemiyor</b>Chrome, Edge, Firefox ya da Safari’nin güncel sürümünü kullanın.</span></div>';
  }
  var CUR = null;
  function close() { var o = document.getElementById('sppO'); if (o) o.remove(); CUR = null; }
  function tg(k, on, extra, dis) { var m = M[k] || ['🔔', k, '']; return '<div class="tg' + (on ? ' on' : '') + (dis ? ' dis' : '') + '" data-spp="' + (extra || 'mod') + '" data-k="' + k + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" tabindex="0"><em>' + m[0] + '</em><span><b>' + esc(m[1]) + '</b><small>' + esc(m[2]) + '</small></span><i class="sw"></i></div>'; }
  function draw() {
    var ctx = CUR; if (!ctx) return; var b = document.getElementById('sppB'); if (!b) return;
    var s = support(), st = ld(ctx), on = !!(st && st.on && s.ok && Notification.permission === 'granted' && (ctx.role !== 't' || ctx.owner)), npOff = ctx.np || [];
    var mods = (ROLE[ctx.role] || []).filter(function (k) { return npOff.indexOf(k) < 0; });
    var h = '<div class="sh"><b>🔔 Bildirimler</b><button class="sx" data-spp="x" aria-label="Kapat">✕</button></div><div class="sc">';
    if (ctx.sender) {
      var off = ctx.sender.off || [];
      h += '<h4 style="margin-top:4px">Öğrenci ve velilere giden bildirimler</h4><p class="nt" style="margin:0 2px 8px">Kapattığınız konu hiçbir öğrenciye ve veliye gönderilmez; onların ayarlarında da görünmez.</p><div class="box">' + SEND.map(function (k) { return tg(k, off.indexOf(k) < 0, 'snd'); }).join('') + '</div><h4>Bu cihaz</h4>';
    }
    if (ctx.role === 't' && !ctx.owner) h += '<div class="st warn"><i>👤</i><span><b>Hesabınızla giriş yapın</b>Bu cihaza bildirim almak için önce Sınıf Pusulası hesabınızla giriş yapın.</span></div>';
    else if (!s.ok) h += guide(s);
    else if (on) h += '<div class="st on"><i>✅</i><span><b>Bu cihazda açık</b>' + (ctx.role === 't' ? 'Öğrencilerinden gelenler bu cihaza düşer.' : 'Yeni kayıtlar birkaç dakika içinde bu cihaza düşer.') + '</span></div><div class="row2"><button class="bt g" data-spp="test">Deneme bildirimi</button><button class="bt g" data-spp="off">Bu cihazda kapat</button></div>';
    else h += '<div class="st"><i>🔔</i><span><b>Bu cihazda kapalı</b>' + (ctx.role === 't' ? 'Öğrenci mesajları ve kayıtları için bildirim alın.' : ctx.role === 'v' ? 'Çocuğunuzla ilgili yeni kayıtlardan haberdar olun.' : 'Öğretmenin yeni bir şey girdiğinde haberin olsun.') + '</span></div><div class="row2"><button class="bt" data-spp="on">🔔 Bildirimleri aç</button></div>';
    if (mods.length) { h += '<h4>' + (ctx.role === 't' ? 'Bana gelecek bildirimler' : 'Hangi bildirimler gelsin?') + '</h4><div class="box">' + mods.map(function (k) { return tg(k, !(st && st.off && st.off.indexOf(k) >= 0), 'mod', !on); }).join('') + '</div>'; }
    else if (ctx.role !== 't') h += '<p class="nt">Öğretmenin şu an bu sayfa için bildirim göndermiyor.</p>';
    h += '<h4>Zamanlama</h4><div class="box"><div class="tg' + (st && st.q ? ' on' : '') + (on ? '' : ' dis') + '" data-spp="q" role="switch" tabindex="0"><em>🌙</em><span><b>Sessiz saatler</b><small>22.00 – 07.00 arası bildirim gelmesin</small></span><i class="sw"></i></div></div>';
    h += '<p class="nt">Bildirimler birkaç dakikada bir toplu gönderilir; anlık değildir. ' + (s.p.kind === 'desktop' ? 'Bilgisayarda tarayıcı açık olmasa da (arka planda çalışıyorsa) gelir.' : s.p.ios ? 'Ana ekrandaki uygulama kapalıyken de gelir.' : 'Uygulama kapalıyken de gelir.') + '</p></div>';
    b.innerHTML = h;
  }
  function busy(on) { var b = document.getElementById('sppB'); if (b) b.querySelectorAll('.bt').forEach(function (x) { x.disabled = on; }); }
  function msg(t) { var b = document.getElementById('sppB'); if (!b) return; var p = b.querySelector('.sppm'); if (!p) { p = document.createElement('p'); p.className = 'nt sppm'; p.style.cssText = 'color:#C4503F;font-weight:800'; var sc = b.querySelector('.sc'); sc.insertBefore(p, sc.children[1] || null); } p.textContent = t; }
  async function act(a, el) {
    var ctx = CUR; if (!ctx) return; var st = ld(ctx);
    if (a === 'x') return close();
    if (a === 'on') { busy(true); try { await enable(ctx, st); draw(); try { var r = await reg(); r.showNotification('🔔 Bildirimler açık', { body: 'Sınıf Pusulası bildirimleri bu cihaza gelecek.', icon: ctx.icon || 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'sp-test' }); } catch (e) {} } catch (e) { busy(false); draw(); var m = String(e && e.message || e); msg(m === 'denied' ? 'İzin verilmedi. Tarayıcı ayarlarından bildirim iznini açın.' : m === 'dismiss' ? 'İzin penceresi kapatıldı. Tekrar deneyin.' : m === 'vapid' ? 'Bildirim sistemi henüz hazır değil. Biraz sonra tekrar deneyin.' : 'Açılamadı: ' + m); } return; }
    if (a === 'off') { busy(true); await disable(ctx); draw(); return; }
    if (a === 'test') { try { var r2 = await reg(); await r2.showNotification('🧭 Deneme bildirimi', { body: 'Böyle görünecek. Yeni kayıtlar birkaç dakika içinde gelir.', icon: ctx.icon || 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'sp-test' }); } catch (e) { msg('Gösterilemedi'); } return; }
    if (a === 'mod' || a === 'q') {
      if (!st || !st.on) return; var k = el.dataset.k;
      if (a === 'q') st.q = st.q ? 0 : 1; else { st.off = st.off || []; var i = st.off.indexOf(k); if (i >= 0) st.off.splice(i, 1); else st.off.push(k); }
      sv(ctx, st); draw(); try { await write(ctx, st); } catch (e) { msg('Kaydedilemedi, bağlantıyı kontrol edin.'); } return;
    }
    if (a === 'snd' && ctx.sender) { var off = ctx.sender.off = (ctx.sender.off || []).slice(), j = off.indexOf(el.dataset.k); if (j >= 0) off.splice(j, 1); else off.push(el.dataset.k); try { ctx.sender.save(off); } catch (e) {} draw(); }
  }
  function open(ctx) {
    css(); close(); CUR = ctx; vapid().catch(function () {});
    var o = document.createElement('div'); o.id = 'sppO'; o.innerHTML = '<div id="sppB" role="dialog" aria-modal="true" aria-label="Bildirimler"></div>'; document.body.appendChild(o);
    o.addEventListener('click', function (e) { if (e.target === o) return close(); var t = e.target.closest('[data-spp]'); if (t) { e.preventDefault(); act(t.dataset.spp, t); } });
    o.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); else if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.tg')) { e.preventDefault(); act(e.target.dataset.spp, e.target); } });
    draw();
  }
  function isOn(ctx) { var st = ld(ctx); return !!(st && st.on && support().ok && Notification.permission === 'granted'); }
  window.SPPush = { M: M, ROLE: ROLE, SEND: SEND, open: open, refresh: refresh, isOn: isOn, support: support };
})();
