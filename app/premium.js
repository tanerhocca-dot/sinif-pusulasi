/* Sınıf Pusulası · Premium (yalnız Android uygulamasında yüklenir)
   Baz (ücretsiz): 1 sınıf · Premium: sınırsız sınıf, bulut eşitleme, Denemeler & LGS analizi
   Ödeme: Google Play Faturalandırma, RevenueCat üzerinden (window.SP_RC_KEY tanımlanınca açılır). */
(function () {
  'use strict';
  var KEY = 'sp-prem', LS = 'ogrenci-takip-v1', ENT = 'premium';
  var PLANS = {
    yearly: { id: 'yearly', name: 'Yıllık', price: '599 TL', per: '/ yıl', note: 'Aylık yaklaşık 50 TL · %37 tasarruf', rc: 'ANNUAL' },
    monthly: { id: 'monthly', name: 'Aylık', price: '79 TL', per: '/ ay', note: 'İstediğin zaman iptal', rc: 'MONTHLY' }
  };
  var sel = 'yearly', rcReady = false;

  /* ---------- durum ---------- */
  function st() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function setSt(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} refreshCard(); }
  function isPremium() { var s = st(); return !!s.on && (!s.exp || s.exp > Date.now()); }
  function realClassCount() {
    try { var d = JSON.parse(localStorage.getItem(LS) || '{}'); return (d.classes || []).filter(function (c) { return !c.demo; }).length; }
    catch (e) { return 0; }
  }

  /* ---------- görünüm ---------- */
  var css = '' +
    '.prm-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(37,64,107,.28);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;animation:prmIn .18s ease}' +
    '@keyframes prmIn{from{opacity:0}to{opacity:1}}' +
    '.prm{position:relative;width:100%;max-width:420px;max-height:calc(100vh - 32px);overflow-y:auto;background:rgba(255,255,255,.92);border:1px solid #D5E5F8;border-radius:26px;padding:22px 20px 18px;color:#25406B;font:inherit}' +
    '.prm-x{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;border:1px solid #D5E5F8;background:#fff;color:#62789B;font-size:16px}' +
    '.prm-top{text-align:center;margin-bottom:14px}.prm-ic{width:64px;height:64px;border-radius:18px;margin:0 auto 8px;display:block}' +
    '.prm h2{margin:0;font-size:22px}.prm h2 b{background:#FFE08A;border-radius:8px;padding:0 7px}' +
    '.prm-why{margin:6px 0 0;color:#62789B;font-size:14px}' +
    '.prm-f{list-style:none;margin:14px 0;padding:12px 14px;background:linear-gradient(135deg,rgba(220,235,251,.75),rgba(255,247,217,.75));border:1px solid #D5E5F8;border-radius:18px}' +
    '.prm-f li{display:flex;gap:10px;align-items:flex-start;padding:5px 0;font-size:15px}.prm-f li i{font-style:normal;width:22px;text-align:center}' +
    '.prm-p{display:grid;gap:10px}' +
    '.prm-pl{position:relative;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 15px;border:2px solid #D5E5F8;border-radius:18px;background:#fff;text-align:left;color:#25406B;font:inherit;width:100%}' +
    '.prm-pl.on{border-color:#2F5492;background:#F3F8FF}.prm-pl b{font-size:16px}.prm-pl small{display:block;color:#62789B;font-size:12.5px;margin-top:2px}' +
    '.prm-pl .pr{font-size:18px;font-weight:700;white-space:nowrap}.prm-pl .pr span{font-size:12px;font-weight:500;color:#62789B}' +
    '.prm-bdg{position:absolute;top:-10px;left:14px;background:#FFE08A;color:#25406B;font-size:11.5px;font-weight:700;padding:2px 9px;border-radius:999px}' +
    '.prm-go{width:100%;margin-top:14px;padding:15px;border:0;border-radius:16px;background:#2F5492;color:#fff;font:inherit;font-size:16.5px;font-weight:700}' +
    '.prm-go:disabled{opacity:.6}' +
    '.prm-sub{display:flex;justify-content:center;gap:18px;margin-top:10px}.prm-sub button{border:0;background:none;color:#2F5492;font:inherit;font-size:13.5px;text-decoration:underline}' +
    '.prm-sm{margin:10px 0 0;color:#62789B;font-size:11.5px;text-align:center;line-height:1.45}' +
    '.prm-card{display:flex;align-items:center;gap:12px;margin:0 0 12px;padding:14px 16px;border-radius:20px;border:1px solid #D5E5F8;background:linear-gradient(135deg,rgba(220,235,251,.8),rgba(255,247,217,.8));color:#25406B}' +
    '.prm-card .t{flex:1}.prm-card b{display:block;font-size:15.5px}.prm-card small{color:#62789B}' +
    '.prm-card button{border:0;border-radius:12px;padding:9px 14px;background:#2F5492;color:#fff;font:inherit;font-weight:700}' +
    '.prm-card.ok button{background:#fff;color:#2F5492;border:1px solid #D5E5F8}' +
    '.prm-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:2147483001;background:#25406B;color:#fff;padding:10px 16px;border-radius:14px;font-size:14px;max-width:88vw;text-align:center}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function toast(t) {
    var o = document.querySelector('.prm-toast'); if (o) o.remove();
    o = document.createElement('div'); o.className = 'prm-toast'; o.textContent = t; document.body.appendChild(o);
    setTimeout(function () { o.remove(); }, 3200);
  }

  var REASON = {
    class: 'Ücretsiz sürümde 1 sınıf kullanılabilir. Daha fazla sınıf için Premium\'a geç.',
    exams: 'Denemeler ve LGS analizi Premium\'a özel.',
    sync: 'Tüm cihazlarında bulut eşitleme Premium\'a özel.',
    menu: 'Sınıf Pusulası\'nın tüm gücünü aç.'
  };
  var taps = 0, tapT = null;

  function openPaywall(reason, onClose) {
    closePaywall();
    var ov = document.createElement('div'); ov.className = 'prm-ov'; ov.id = 'prmOv';
    var plan = function (p, badge) {
      return '<button class="prm-pl' + (sel === p.id ? ' on' : '') + '" data-prm="pl" data-id="' + p.id + '">' +
        (badge ? '<span class="prm-bdg">' + badge + '</span>' : '') +
        '<span><b>' + p.name + '</b><small>' + p.note + '</small></span>' +
        '<span class="pr">' + p.price + ' <span>' + p.per + '</span></span></button>';
    };
    ov.innerHTML = '<div class="prm" role="dialog" aria-label="Sınıf Pusulası Premium">' +
      '<button class="prm-x" data-prm="x" aria-label="Kapat">✕</button>' +
      '<div class="prm-top"><img class="prm-ic" src="icons/icon-192.png" alt="" data-prm="ic">' +
      '<h2>Sınıf Pusulası <b>Premium</b></h2><p class="prm-why">' + (REASON[reason] || REASON.menu) + '</p></div>' +
      '<ul class="prm-f">' +
      '<li><i>👥</i><span><b>Sınırsız sınıf ve öğrenci</b></span></li>' +
      '<li><i>☁️</i><span><b>Bulut eşitleme</b> — telefon, tablet ve bilgisayarda aynı veriler</span></li>' +
      '<li><i>📝</i><span><b>Denemeler ve LGS analizi</b> — net, ortalama, hedef okul karşılaştırması</span></li>' +
      '</ul>' +
      '<div class="prm-p">' + plan(PLANS.yearly, 'En avantajlı') + plan(PLANS.monthly) + '</div>' +
      '<button class="prm-go" data-prm="buy">Premium\'a geç</button>' +
      '<div class="prm-sub"><button data-prm="restore">Satın alımları geri yükle</button></div>' +
      '<p class="prm-sm">Ödeme Google Play hesabından alınır. Abonelik, dönem bitmeden en az 24 saat önce iptal edilmezse kendiliğinden yenilenir. Google Play › Abonelikler bölümünden istediğin zaman iptal edebilirsin.</p>' +
      '</div>';
    ov._onClose = onClose;
    document.body.appendChild(ov);
  }
  function closePaywall(silent) {
    var ov = document.getElementById('prmOv'); if (!ov) return;
    var cb = ov._onClose; ov.remove(); if (!silent && cb) cb();
  }
  function goHome() { var b = document.querySelector('[data-a="tab"][data-t="home"]'); if (b) b.click(); }

  document.addEventListener('click', function (e) {
    var p = e.target.closest('[data-prm]');
    if (p) {
      var k = p.dataset.prm;
      if (k === 'x') closePaywall();
      else if (k === 'pl') { sel = p.dataset.id; document.querySelectorAll('.prm-pl').forEach(function (b) { b.classList.toggle('on', b.dataset.id === sel); }); }
      else if (k === 'buy') buy(p);
      else if (k === 'restore') restore();
      else if (k === 'open') openPaywall('menu');
      else if (k === 'manage') manage();
      else if (k === 'ic') { // gizli test anahtarı: logoya 7 kez dokun
        taps++; clearTimeout(tapT); tapT = setTimeout(function () { taps = 0; }, 1500);
        if (taps >= 7) { taps = 0; var on = !isPremium(); setSt({ on: on, src: 'test', at: Date.now() }); toast(on ? 'Test: Premium açıldı' : 'Test: Premium kapandı'); closePaywall(true); }
      }
      return;
    }
    if (e.target === document.getElementById('prmOv')) { closePaywall(); return; }
    // ---- kilitler (uygulamanın kendi tıklama işleyicisinden önce yakalanır) ----
    var a = e.target.closest('[data-a]'); if (!a || isPremium()) return;
    var act = a.dataset.a;
    if ((act === 'ncOpen' || act === 'goNewClass' || act === 'newClass') && realClassCount() >= 1) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (act === 'newClass') { var m = document.querySelector('[data-a="close"]'); if (m) m.click(); }
      openPaywall('class');
    }
  }, true);

  // Denemeler sekmesi (dokunarak da kaydırarak da açılabilir) → Premium ekranı
  new MutationObserver(function () {
    if (document.body.classList.contains('isex') && !isPremium() && !document.getElementById('prmOv')) openPaywall('exams', goHome);
    refreshCard();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ---------- Ayarlar'da Premium kartı ---------- */
  function refreshCard() {
    if (!document.body.classList.contains('isset')) return;
    var v = document.getElementById('view'); if (!v) return;
    var c = document.getElementById('prmCard'), on = isPremium();
    var html = on
      ? '<span style="font-size:26px">⭐</span><span class="t"><b>Premium aktif</b><small>' + (st().src === 'test' ? 'Test modu' : 'Teşekkürler! Tüm özellikler açık.') + '</small></span><button data-prm="manage">Yönet</button>'
      : '<span style="font-size:26px">⭐</span><span class="t"><b>Ücretsiz sürüm</b><small>Sınırsız sınıf, bulut eşitleme ve Denemeler için</small></span><button data-prm="open">Premium</button>';
    if (!c) { c = document.createElement('div'); c.id = 'prmCard'; v.insertBefore(c, v.firstChild); }
    if (c.dataset.on !== String(on)) { c.className = 'prm-card' + (on ? ' ok' : ''); c.innerHTML = html; c.dataset.on = String(on); }
  }
  var vw = null;
  function watchView() {
    var v = document.getElementById('view'); if (!v || v === vw) return; vw = v;
    new MutationObserver(function () { if (!document.getElementById('prmCard')) refreshCard(); }).observe(v, { childList: true });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', watchView) : watchView();

  /* ---------- Google Play ödemesi (RevenueCat) ---------- */
  function RC() { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases; }
  function apply(info) {
    var ent = info && info.customerInfo ? info.customerInfo.entitlements : info && info.entitlements;
    var a = ent && ent.active && ent.active[ENT];
    if (a) setSt({ on: true, src: 'play', plan: a.productIdentifier, exp: a.expirationDate ? Date.parse(a.expirationDate) : 0, at: Date.now() });
    else if (st().src === 'play') setSt({ on: false, src: 'play', at: Date.now() });
  }
  async function initRC() {
    var P = RC(); if (!P || !window.SP_RC_KEY) return;
    try { await P.configure({ apiKey: window.SP_RC_KEY }); rcReady = true; apply(await P.getCustomerInfo()); }
    catch (e) { console.warn('rc', e); }
  }
  async function buy(btn) {
    var P = RC();
    if (!P || !rcReady) { toast('Ödeme sistemi Google Play onayından sonra açılacak.'); return; }
    btn.disabled = true; btn.textContent = 'Google Play açılıyor…';
    try {
      var o = await P.getOfferings(), cur = o && o.current, want = PLANS[sel].rc;
      var pkg = cur && cur.availablePackages.find(function (k) { return k.packageType === want; });
      if (!pkg) throw new Error('paket yok');
      apply(await P.purchasePackage({ aPackage: pkg }));
      if (isPremium()) { closePaywall(true); toast('Premium açıldı. Teşekkürler! ⭐'); }
    } catch (e) {
      if (!(e && (e.userCancelled || e.code === '1'))) toast('Satın alma tamamlanamadı. Lütfen tekrar dene.');
    }
    btn.disabled = false; btn.textContent = 'Premium\'a geç';
  }
  async function restore() {
    var P = RC();
    if (!P || !rcReady) { toast('Ödeme sistemi Google Play onayından sonra açılacak.'); return; }
    try { apply(await P.restorePurchases()); toast(isPremium() ? 'Premium geri yüklendi ⭐' : 'Bu Google hesabında abonelik bulunamadı.'); closePaywall(true); }
    catch (e) { toast('Geri yükleme yapılamadı.'); }
  }
  function manage() {
    if (st().src === 'test') { setSt({ on: false }); toast('Test: Premium kapandı'); return; }
    window.open('https://play.google.com/store/account/subscriptions?package=com.sinifpusulasi.app', '_blank');
  }

  window.SPPremium = { isPremium: isPremium, open: openPaywall };
  initRC();
})();
