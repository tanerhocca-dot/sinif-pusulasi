// Sınıf Pusulası · bildirim gönderici
// GitHub Actions'ta birkaç dakikada bir çalışır: son çalışmadan beri değişen veli/öğrenci/birebir
// sayfalarını ve öğrenci girişlerini okur, yeni kayıtları bulur, abone cihazlara Web Push yollar.
// Gerekli gizli anahtar: FIREBASE_SA (Firebase hizmet hesabı JSON'u). Depoya asla yazılmaz.
import admin from 'firebase-admin';
import webpush from 'web-push';
import { h, first, classItems, bbItems, reqItems, libItems, squash } from './lib.mjs';

const SA = process.env.FIREBASE_SA;
if (!SA) { console.log('FIREBASE_SA tanımlı değil; bildirim gönderici atlandı.'); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) });
const db = admin.firestore();
const DRY = process.env.DRY === '1';

// ---- önceki anahtarlarla karşılaştır ----
async function diff(sid, items) {
  const ref = db.collection('pushst').doc(sid), snap = await ref.get();
  const prev = snap.exists ? JSON.parse(snap.data().k || '{}') : null, next = {}, out = [];
  for (const mod of Object.keys(items)) {
    const L = items[mod], hs = L.map(x => h(x.k)), seen = new Set((prev && prev[mod]) || []);
    if (prev) L.forEach((x, i) => { if (!seen.has(hs[i])) out.push(Object.assign({ mod }, x)); });
    next[mod] = [...new Set([...(prev && prev[mod] || []), ...hs])].slice(-600);
  }
  if (!DRY) await ref.set({ k: JSON.stringify(next), at: Date.now() });
  return prev ? out : []; // ilk kez görülen sayfa: yalnız temel kayıt
}
const SUBS = new Map();
async function subsFor(field, val) {
  const key = field + ':' + val; if (SUBS.has(key)) return SUBS.get(key);
  const q = await db.collection('push').where(field, '==', val).get();
  const L = q.docs.map(d => Object.assign({ _id: d.id }, d.data())); SUBS.set(key, L); return L;
}
const quiet = () => { const hr = (new Date().getUTCHours() + 3) % 24; return hr >= 22 || hr < 7; };
let sent = 0, dropped = 0;
async function deliver(list, ev, o) {
  for (const s of list) {
    const off = String(s.off || '').split(',').filter(Boolean), E = ev.filter(e => !off.includes(e.mod));
    if (!E.length) continue;
    if (s.q && quiet()) continue;
    const one = E.length === 1, p = {
      title: one ? E[0].title : (o.who ? o.who + ' · ' : '') + E.length + ' yeni bildirim',
      body: one ? (o.who && s.role === 'v' ? o.who + ' · ' : '') + E[0].body : E.slice(0, 4).map(e => { const t = o.who && e.title.endsWith(' ' + o.who) ? e.title.slice(0, -o.who.length - 1) : e.title; return (t + (e.body ? (/[A-Za-zÇĞİÖŞÜçğıöşü0-9]/.test(t) ? ' — ' : ' ') + e.body : '')).slice(0, 90); }).join('\n') + (E.length > 4 ? '\n+' + (E.length - 4) + ' daha' : ''),
      url: o.url, icon: o.icon, tag: o.tag
    };
    if (DRY) { console.log('DRY', s.role, JSON.stringify(p)); continue; }
    try { await webpush.sendNotification(JSON.parse(s.s), JSON.stringify(p), { TTL: 6 * 3600, urgency: 'normal' }); sent++; }
    catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) { await db.collection('push').doc(s._id).delete().catch(() => {}); dropped++; } else console.warn('gönderilemedi', e && e.statusCode, e && e.body); }
  }
}

async function main() {
  // VAPID anahtarları: ilk çalışmada üretilir, gizli kısım yalnız sunucu tarafında saklanır
  const vref = db.collection('pushst').doc('_vapid'); let v = (await vref.get()).data();
  if (!v || !v.priv) { const k = webpush.generateVAPIDKeys(); v = { pub: k.publicKey, priv: k.privateKey }; await vref.set(v); console.log('VAPID anahtarı üretildi'); }
  const pc = await db.collection('pubcfg').doc('vapid').get();
  if (!pc.exists || pc.data().k !== v.pub) await db.collection('pubcfg').doc('vapid').set({ k: v.pub });
  webpush.setVapidDetails('mailto:sinifppusulasi@gmail.com', v.pub, v.priv);

  const mref = db.collection('pushst').doc('_meta'), meta = (await mref.get()).data() || {}, now = Date.now();
  const since = meta.t ? meta.t - 3 * 60e3 : 0;
  const q = c => since ? db.collection(c).where('at', '>', since).get() : db.collection(c).get();
  const [P, BR, KR] = await Promise.all([q('portal'), q('bbreq'), q('bkreq')]);
  console.log('değişen:', P.size, 'sayfa,', BR.size, 'birebir girişi,', KR.size, 'kitaplık');
  const PD = new Map(); P.docs.forEach(d => PD.set(d.id, d.data()));
  const portal = async id => { if (PD.has(id)) return PD.get(id); const s = await db.collection('portal').doc(id).get(); const x = s.exists ? s.data() : null; PD.set(id, x); return x; };

  // öğretmenden öğrenci / veliye
  for (const d of P.docs) {
    const x = d.data(); let D; try { D = JSON.parse(x.d || '{}'); } catch (e) { continue; }
    const items = x.role === 'b' ? bbItems(D) : classItems(D);
    let ev = await diff('p_' + d.id, items);
    const np = Array.isArray(D.np) ? D.np : []; ev = ev.filter(e => !np.includes(e.mod));
    if (!ev.length) continue;
    const subs = (await subsFor('pid', d.id)).filter(s => s.role === x.role);
    if (subs.length) await deliver(subs, squash(ev), { who: x.role === 'v' ? first(D.name) : '', url: x.role === 'b' ? 'birebir.html' : './', icon: x.role === 'b' ? 'icons/birebir-192.png' : 'icons/icon-192.png', tag: 'sp-' + d.id.slice(0, 8) });
  }
  // öğrenciden öğretmene
  const toTeacher = async (id, items, pref, nm) => {
    const p = await portal(id); if (!p || !p.owner) return;
    const ev = await diff(pref + id, items); if (!ev.length) return;
    const subs = (await subsFor('owner', p.owner)).filter(s => s.role === 't');
    if (subs.length) await deliver(subs, squash(ev), { who: nm, url: './', icon: pref === 'b_' ? 'icons/birebir-192.png' : 'icons/icon-192.png', tag: 'sp-t-' + id.slice(0, 8) });
  };
  for (const d of BR.docs) { const p = await portal(d.id); let j = {}, D = {}; try { j = JSON.parse(d.data().j || '{}'); D = JSON.parse((p && p.d) || '{}'); } catch (e) {} await toTeacher(d.id, reqItems(j, first(D.name) || 'Öğrenci'), 'b_', first(D.name)); }
  for (const d of KR.docs) { const p = await portal(d.id); let L = [], D = {}; try { L = JSON.parse(d.data().j || '[]'); D = JSON.parse((p && p.d) || '{}'); } catch (e) {} await toTeacher(d.id, libItems(L, first(D.name) || 'Öğrenci'), 'k_', first(D.name)); }

  if (!DRY) await mref.set({ t: now });
  console.log('gönderilen:', sent, '· silinen eski abonelik:', dropped);
}
main().then(() => process.exit(0), e => { console.error(e); process.exit(1); });
