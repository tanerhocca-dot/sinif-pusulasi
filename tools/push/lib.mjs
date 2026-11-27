// Bildirim gönderici: sayfa verisinden bildirim kalemleri çıkaran saf işlevler
const h = s => { let x = 5381; s = String(s); for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0; return (x >>> 0).toString(36); };
const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const fd = d => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(d || ''); return m ? (+m[3]) + ' ' + AY[+m[2] - 1] : ''; };
const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const first = n => String(n || '').trim().split(/\s+/)[0] || '';
const sgn = v => (v > 0 ? '+' : '') + v;

// ---- değişiklikleri anahtarlara çevir: {modül: [{k, title, body}]} ----
function classItems(d) {
  const o = { puan: [], yaptirim: [], rozet: [], kontrol: [], yoklama: [], not: [] };
  for (const p of (d.lg && d.lg.h) || []) {
    const k = String(p.k || ''), v = +p.v || 0, key = ['p', p.d, p.t, v, p.n, k].join('|');
    if (v > 0 && !/^[lb]/.test(k)) o.puan.push({ k: key, title: (/^s/.test(k) ? '🌟 Süper etiket: ' : '⭐ ') + cut(p.t, 40) + ' (' + sgn(v) + ')', body: cut(p.n, 120) || 'Lig puanına eklendi · ' + fd(p.d) });
    else if (v < 0 && !/^l/.test(k)) o.yaptirim.push({ k: key, title: '⚠️ Yaptırım: ' + cut(p.t, 40) + ' (' + v + ')', body: cut(p.n, 120) || fd(p.d) });
  }
  for (const b of d.badges || []) for (const g of b.got || []) o.rozet.push({ k: 'r|' + b.k + '|' + g.t, title: '🏅 Yeni rozet: ' + (g.e || '') + ' ' + cut(g.t, 40), body: (b.lab || '') + ' rozeti kazanıldı' });
  const LB = { pm: { y: 'Okudu ✓', n: 'Okumadı ✗' }, att: { n: 'Gelmedi', e: 'İzinli' }, def: { y: 'Yaptı ✓', e: 'Yarım', n: 'Yapmadı ✗' } };
  for (const t of d.trk || []) for (const r of t.rec || []) {
    if (!r || !['y', 'n', 'e'].includes(r.s)) continue;
    if (t.mode === 'att') { if (r.s === 'y') continue; o.yoklama.push({ k: 'a|' + t.ti + '|' + r.d + '|' + r.s, title: '🗓️ Yoklama', body: fd(r.d) + ': ' + LB.att[r.s] }); continue; }
    const lab = t.mode === 'count' ? (r.v != null ? r.v + ' ' + (t.unit || '') : '') : (LB[t.mode] || LB.def)[r.s] || '';
    o.kontrol.push({ k: 'c|' + t.ti + '|' + r.d + '|' + r.s + '|' + (r.v ?? ''), title: (t.em || '📋') + ' ' + cut(t.ti, 50), body: fd(r.d) + ': ' + lab + (r.nt ? ' · ' + cut(r.nt, 60) : '') });
  }
  if ((d.trn || []).length) o.not.push({ k: 'trn|' + h(JSON.stringify(d.trn)), title: '📝 Türkçe notları güncellendi', body: 'Yeni notları sayfada görebilirsiniz.' });
  if ((d.grades || []).length) o.not.push({ k: 'g|' + h(JSON.stringify(d.grades)), title: '📝 Notlar güncellendi', body: 'Yeni notları sayfada görebilirsiniz.' });
  for (const e of d.ex || []) o.not.push({ k: 'ex|' + e.n + '|' + e.d, title: '📊 Yeni deneme: ' + cut(e.n, 40), body: e.t != null ? 'Toplam net: ' + e.t : fd(e.d) });
  return o;
}
function bbItems(d) {
  const o = { mesaj: [], program: [], hatirlatma: [] };
  for (const c of d.ch || []) if (c && c.f === 't') o.mesaj.push({ k: 'm|' + c.id, title: '💬 Koçundan mesaj', body: cut(c.t, 160) });
  for (const w of Object.keys(d.wk || {})) for (const t of d.wk[w] || []) {
    if (!t || !t.id) continue;
    o.program.push({ k: 't|' + t.id, title: '🎯 Programına yeni görev', body: cut(t.kn || 'Görev', 60) + (t.g != null ? '' : '') });
    if (t.rm) o.hatirlatma.push({ k: 'h|' + t.id + '|' + h(t.rm), title: '📌 Koçundan hatırlatma', body: cut((t.kn ? t.kn + ': ' : '') + t.rm, 160) });
  }
  return o;
}
function reqItems(j, nm) {
  const o = { omesaj: [], okayit: [], okitap: [] };
  for (const m of j.m || []) if (m && m.id && m.t) o.omesaj.push({ k: 'm|' + m.id, title: '💬 ' + nm, body: cut(m.t, 160) });
  for (const e of j.e || []) if (e && e.id && !e.x) o.okayit.push({ k: 'e|' + e.id + '|' + e.s, title: '✅ ' + nm, body: cut((e.kn || 'Görev') + ' · ' + ({ y: 'tamamladı', e: 'yarım bıraktı', n: 'yapamadı' }[e.s] || 'kaydetti'), 120) });
  for (const e of j.dn || []) if (e && e.id && !e.x) o.okayit.push({ k: 'd|' + e.id, title: '📊 ' + nm, body: 'Deneme girdi: ' + cut(e.n || fd(e.d), 60) });
  for (const b of j.bk || []) if (b && b.id && !b.x) o.okitap.push({ k: 'k|' + b.id, title: '📚 ' + nm, body: 'Kitaplığına ekledi: ' + cut(b.t, 60) });
  return o;
}
function libItems(L, nm) { return { okitap: (Array.isArray(L) ? L : []).filter(b => b && b.id).map(b => ({ k: 'k|' + b.id, title: '📚 ' + nm, body: 'Kitaplığına ekledi: ' + cut(b.t || b.title, 60) })) }; }

function squash(ev) { // aynı modülde çok sayıda kayıt → tek satır
  const by = {}; ev.forEach(e => (by[e.mod] = by[e.mod] || []).push(e));
  const out = [];
  for (const mod of Object.keys(by)) {
    const L = by[mod];
    if (L.length > 2 && ['program', 'kontrol', 'okayit', 'puan'].includes(mod)) {
      const T = { program: '🎯 Programına ' + L.length + ' yeni görev eklendi', kontrol: '📚 ' + L.length + ' yeni kontrol kaydı', okayit: L[0].title + ' · ' + L.length + ' kayıt', puan: '⭐ ' + L.length + ' yeni ödül puanı' }[mod];
      out.push({ mod, title: T, body: L.slice(0, 3).map(x => x.body).join(' · ') });
    } else out.push(...L);
  }
  return out;
}

export { h, fd, cut, first, sgn, classItems, bbItems, reqItems, libItems, squash };
