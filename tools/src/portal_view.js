// Sınıf Pusulası · veli / öğrenci sayfası (salt okunur)
import { doc, getDoc } from 'firebase/firestore';

export const PKEY = 'sp-portal', PCACHE = 'sp-portal-cache';
export async function portalId(u, p) {
  const s = 'sp1|' + String(u).trim().toLocaleLowerCase('tr-TR') + '|' + String(p).trim();
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
export function portalSession() { try { return JSON.parse(localStorage.getItem(PKEY) || 'null'); } catch (e) { return null; } }
export async function portalLogin(fs, u, p, role) {
  const id = await portalId(u, p);
  const s = await getDoc(doc(fs, 'portal', id));
  if (!s.exists()) { const e = new Error('nf'); e.code = 'nf'; throw e; }
  const r = s.data().role;
  if (role && r !== role) { const e = new Error('role'); e.code = 'role'; e.role = r; throw e; }
  localStorage.setItem(PKEY, JSON.stringify({ id, role: r }));
  try { localStorage.setItem(PCACHE, JSON.stringify(s.data())); } catch (e) {}
  return s.data();
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => n == null || isNaN(n) ? '—' : (Math.round(n * 100) / 100).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
const fd = (d, o) => { try { return new Date(d + 'T12:00').toLocaleDateString('tr-TR', o || { day: 'numeric', month: 'long' }); } catch (e) { return d; } };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

const CSS = `
body.spport > *:not(#spP):not(#spL):not(#ppAvO):not(#sppO):not(script):not(style){display:none!important}
body.spport,html.spport{background:#FFF7D9;overflow:hidden!important}
#spP{position:fixed;inset:0;z-index:9000;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;background:linear-gradient(180deg,#BFE0FA,#DCEBFB 220px,#FFF7D9 520px);color:#25406B;font-family:Nunito,system-ui,-apple-system,sans-serif;padding:calc(14px + env(safe-area-inset-top,0px)) 14px calc(30px + env(safe-area-inset-bottom,0px))}
#spP *{box-sizing:border-box}#spP svg,#spP img{max-width:100%}#spP .pp-hero>div{min-width:0!important}#spP .pp-hero h1,#spP .pp-hero p{overflow-wrap:anywhere}
#spP .pp-w{max-width:880px;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:14px}
#spP .pp-top{display:flex;align-items:center;gap:12px}
#spP .pp-top img{width:44px;height:44px;border-radius:12px}
#spP .pp-top .pp-tt{flex:1;min-width:0}#spP .pp-top small{display:block;font-size:11px;font-weight:900;letter-spacing:.12em;color:#4F6A95}#spP .pp-top b{font-size:18px;font-weight:900}
#spP .pp-tb{display:flex;gap:6px}#spP .pp-nt span{margin-left:4px}@media(max-width:520px){#spP .pp-nt span{display:none}}#spP .pp-tb button{font:inherit;font-weight:800;font-size:13px;border:2px solid #25406B;background:#fff;color:#25406B;border-radius:12px;padding:6px 10px;cursor:pointer}
#spP .pp-hero{background:#fff;border:2.5px solid #25406B;border-radius:24px;box-shadow:0 4px 0 #25406B;padding:18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
#spP .pp-av{width:64px;height:64px;border-radius:50%;background:#FFE08A;border:2.5px solid #25406B;display:grid;place-items:center;font-weight:900;font-size:24px;flex:none}
#spP .pp-hero h1{margin:0;font-size:24px;font-weight:900;line-height:1.15}#spP .pp-hero p{margin:3px 0 0;font-weight:700;color:#5E7598;font-size:14px}
#spP .pp-avi{background:none;padding:0;overflow:hidden;width:84px;height:84px}#spP .pp-avi img{width:100%;height:100%;display:block}
#spP .pp-ave{display:inline-block;margin:8px 8px 0 0;font:inherit;font-weight:900;font-size:13px;border:2px solid #25406B;background:#fff;color:#25406B;border-radius:99px;padding:5px 12px;cursor:pointer;box-shadow:0 2px 0 #25406B}
#ppAvO{position:fixed;inset:0;z-index:9800;background:rgba(5,20,50,.55);display:flex;align-items:center;justify-content:center;padding:14px;overflow:auto}#ppAvO .pp-avbx{background:#fff;border:3px solid #25406B;border-radius:24px;box-shadow:0 6px 0 #25406B;padding:16px;width:100%;max-width:520px;max-height:calc(100vh - 28px);overflow:auto;color-scheme:light}.pp-lbh{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.pp-lbh h2{margin:0}.pp-lbadd{margin:0!important;background:#FFE08A!important}.pp-lb{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1.5px solid #E3ECF8}.pp-lbt{flex:1;min-width:0}.pp-lbt b{display:block;font-size:15.5px}.pp-lbt small{color:#62789B;font-weight:700}.pp-lbt p{margin:6px 0 0;font-size:13.5px;color:#25406B;white-space:pre-wrap;overflow-wrap:anywhere}.pp-lbs{display:block;color:#E9A800;font-size:15px;letter-spacing:1px}.pp-lbb{display:flex;gap:4px}.pp-lbb button{font:inherit;border:2px solid #D5E5F8;background:#fff;border-radius:10px;width:36px;height:34px;cursor:pointer}.pp-lbf h3{margin:0 0 10px;font-family:Nunito,system-ui,sans-serif;color:#25406B}.pp-lbf label{display:block;font-weight:800;font-size:13.5px;color:#4F6A95;margin:8px 0 0;font-family:Nunito,system-ui,sans-serif}.pp-lbf input,.pp-lbf textarea{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:15px;border:2px solid #D5E5F8;border-radius:12px;padding:9px 10px;margin-top:4px;color:#25406B;background:#fff}.pp-lb2{display:grid;grid-template-columns:1fr 110px;gap:8px}.pp-lbr{display:flex;gap:4px;margin-top:4px}.pp-lbr button{font-size:28px;line-height:1;border:0;background:none;color:#D5DCE7;cursor:pointer;padding:0 2px}.pp-lbr button.on{color:#F2B705}.pp-lbact{display:flex;gap:8px;margin-top:12px}.pp-lbact .pp-ave{margin:0;flex:1;padding:10px;background:#FFE08A}.pp-lbact .pp-lbx{background:#fff;flex:0 0 auto}
.pp-lbst{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 10px}.pp-lbst span{background:#F4F8FE;border:2px solid #D5E5F8;border-radius:99px;padding:3px 12px;font-size:13px;font-weight:800;color:#4F6A95}.pp-lbst b{color:#25406B;font-weight:900}.pp-lbst .pp-lblv{background:#FFF3CC;border-color:#F3DC8F;color:#7A5A12}.pp-shelf{background:linear-gradient(180deg,#8B5A2B,#6E4520);border-radius:18px;padding:14px 14px 4px;box-shadow:inset 0 0 0 4px #5A3818,inset 0 6px 18px rgba(0,0,0,.35)}.pp-row2{margin-bottom:12px}.pp-books2{display:flex;align-items:flex-end;gap:3px;min-height:150px;padding:0 6px;background:linear-gradient(180deg,#5E3A1A,#4A2D13);border-radius:8px 8px 0 0;box-shadow:inset 0 10px 16px rgba(0,0,0,.35);overflow:hidden}.pp-board{height:14px;background:linear-gradient(180deg,#C48A4E,#9A6533);border-radius:3px;box-shadow:0 4px 0 #6B421D,0 7px 10px rgba(0,0,0,.35)}.pp-sp{position:relative;flex:none;border:0;padding:0;cursor:pointer;border-radius:4px 4px 2px 2px;background:linear-gradient(90deg,var(--c2) 0,var(--c1) 22%,var(--c1) 70%,var(--c2) 100%);box-shadow:inset -2px 0 0 rgba(0,0,0,.18),0 -1px 0 rgba(255,255,255,.3) inset;display:flex;align-items:center;justify-content:center;transition:transform .2s;transform-origin:bottom center;animation:ppSpIn .45s cubic-bezier(.2,1.4,.4,1) both}.pp-sp:hover,.pp-sp:focus-visible{transform:translateY(-8px) rotate(-2deg);outline:none}.pp-sp span{writing-mode:vertical-rl;transform:rotate(180deg);color:#fff;font:900 12.5px/1.05 Nunito,system-ui,sans-serif;max-height:calc(100% - 26px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 0 rgba(0,0,0,.35)}.pp-sp em{position:absolute;top:4px;left:50%;transform:translateX(-50%);font-style:normal;font-size:11px;color:#FFE08A;text-shadow:0 1px 0 rgba(0,0,0,.4)}.pp-spb{position:absolute;left:0;right:0;bottom:12px;height:3px;background:rgba(255,224,138,.85)}.pp-spb.b2{bottom:auto;top:18px;height:2px;opacity:.7}.pp-spadd{width:40px;height:120px;background:repeating-linear-gradient(135deg,rgba(255,255,255,.08) 0 6px,transparent 6px 12px);border:2.5px dashed rgba(255,224,138,.7);animation:none}.pp-spadd span{transform:none;writing-mode:horizontal-tb;font-size:24px;color:#FFE08A}@keyframes ppSpIn{from{opacity:0;transform:translateY(-30px)}}.pp-bkd{text-align:left}.pp-bkc{background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;border-radius:14px;padding:22px 16px;margin-bottom:10px;box-shadow:inset 8px 0 0 rgba(0,0,0,.15)}.pp-bkc b{display:block;font:900 22px/1.15 Nunito,system-ui,sans-serif}.pp-bkc small{display:block;margin-top:6px;font:800 14px Nunito,system-ui,sans-serif;opacity:.9}.pp-bki{font-family:Nunito,system-ui,sans-serif;color:#25406B}.pp-bko{white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px;line-height:1.5;margin:8px 0 0}.pp-bkd .pp-lbact .pp-ave{flex:1}@media(prefers-reduced-motion:reduce){.pp-sp{animation:none}}
.pp-averr{color:#C4503F;font-weight:800;font-size:13px;margin:8px 0 0;font-family:Nunito,system-ui,sans-serif}
#spP .pp-te{border:2px solid #D5E5F8;border-radius:16px;padding:10px;margin-bottom:8px}#spP .pp-teh{display:inline-block;background:#3D7CC9;color:#fff;font-weight:900;font-size:12.5px;border-radius:99px;padding:2px 12px;margin-bottom:8px}#spP .pp-tep{background:#B9741F}#spP .pp-tg{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}#spP .pp-tg2{grid-template-columns:repeat(2,1fr)}#spP .pp-tn{background:#F7FBFF;border-radius:12px;padding:8px 4px;text-align:center}#spP .pp-tn small{display:block;font-size:11.5px;font-weight:800;color:#5E7598}#spP .pp-tn b{display:block;font-size:20px;font-weight:900;font-variant-numeric:tabular-nums}#spP .pp-tns{background:#EAF3FE}#spP .pp-tav{display:flex;align-items:center;justify-content:space-between;background:#FFF3CC;border-radius:14px;padding:10px 14px;font-weight:900}#spP .pp-tav b{font-size:24px}@media (max-width:480px){#spP .pp-tg{grid-template-columns:repeat(2,1fr)}}
#spP .pp-chip{display:inline-block;font-size:12px;font-weight:900;border-radius:99px;padding:3px 10px;background:#FFE08A;border:2px solid #25406B;margin-top:6px}
#spP .pp-kp{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
#spP .pp-k{background:#fff;border:2px solid #D5E5F8;border-radius:18px;padding:12px;text-align:center}
#spP .pp-k b{display:block;font-size:24px;font-weight:900;font-variant-numeric:tabular-nums}#spP .pp-k small{font-size:12px;font-weight:800;color:#5E7598}
#spP .pp-card{background:#fff;border:2px solid #D5E5F8;border-radius:22px;padding:16px}
#spP h2{margin:0 0 10px;font-size:18px;font-weight:900;display:flex;align-items:center;gap:8px}
#spP .pp-mut{color:#5E7598;font-weight:600;font-size:13px}
#spP .pp-bg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
#spP .pp-bc{border:2px solid #D5E5F8;border-radius:16px;padding:12px}
#spP summary .pp-rt b,#spP summary .pp-rt small{display:block}#spP .pp-bc small strong{font-weight:900;color:#25406B}
#spP .pp-bc .pp-be{font-size:30px;letter-spacing:2px;min-height:38px}#spP .pp-bc b{display:block;font-size:15px}#spP .pp-bc small{display:block;font-size:12.5px;font-weight:700;color:#5E7598;margin-top:3px}
#spP .pp-bar{height:10px;border-radius:99px;background:#EAF2FC;overflow:hidden;margin-top:8px}#spP .pp-bar i{display:block;height:100%;background:#2E8B6A;border-radius:99px}
#spP .pp-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #EAF2FC}#spP .pp-row:first-of-type{border-top:0}
#spP .pp-row .pp-rt{flex:1;min-width:0}#spP .pp-row .pp-rt b{display:block;font-size:14.5px}#spP .pp-row .pp-rt small{display:block;font-size:12.5px;color:#5E7598;font-weight:700}
#spP .pp-pv{font-weight:900;font-variant-numeric:tabular-nums;white-space:nowrap}#spP .pp-pos{color:#2E8B6A}#spP .pp-neg{color:#C4503F}
#spP .pp-dots{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}#spP .pp-dots span{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-size:12px;font-weight:900;background:#EAF2FC;color:#5E7598}
#spP .pp-dots .s-y{background:#DDF3E9;color:#2E8B6A}#spP .pp-dots .s-n{background:#FBE1DC;color:#C4503F}#spP .pp-dots .s-e{background:#FCEBCF;color:#B9741F}
#spP table{width:100%;border-collapse:collapse;font-size:13.5px;font-variant-numeric:tabular-nums}#spP .pp-tw{overflow-x:auto}
#spP th{font-size:11.5px;font-weight:900;color:#5E7598;text-align:center;padding:6px 4px;border-bottom:2px solid #EAF2FC;white-space:nowrap}#spP th:first-child,#spP td:first-child{text-align:left}
#spP td{padding:7px 4px;text-align:center;border-bottom:1px solid #F1F6FC;font-weight:700}#spP td.pp-av2{font-weight:900}
#spP .pp-g-y{color:#2E8B6A}#spP .pp-g-e{color:#B9741F}#spP .pp-g-n{color:#C4503F}
#spP details{border-top:1px solid #EAF2FC;padding:8px 0}#spP summary{cursor:pointer;list-style:none;display:flex;gap:10px;align-items:center}#spP summary::-webkit-details-marker{display:none}
#spP .pp-sub{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:8px}#spP .pp-sub div{background:#F7FBFF;border-radius:10px;padding:6px 8px;font-size:12.5px;font-weight:700}
#spP svg text{font-family:inherit}
#spP .ex-chips{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 8px;margin:10px -2px 4px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
#spP .ex-chips button{flex:none;scroll-snap-align:center;text-align:left;font:inherit;color:#25406B;background:#F7FBFF;border:2px solid #D5E5F8;border-radius:14px;padding:8px 12px;cursor:pointer;max-width:200px}
#spP .ex-chips button b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#spP .ex-chips button small{font-size:12px;font-weight:700;color:#5E7598}
#spP .ex-chips button.on{background:#FFE08A;border-color:#25406B;box-shadow:0 3px 0 #25406B}
#spP .ex-card{border:2.5px solid #25406B;border-radius:20px;padding:14px;margin-top:6px;background:linear-gradient(180deg,#F4F9FF,#fff 120px)}
#spP .ex-hd{display:flex;align-items:center;gap:10px}#spP .ex-hd button{width:44px;height:44px;flex:none;border-radius:50%;border:2px solid #25406B;background:#fff;color:#25406B;font:900 24px/1 Nunito,system-ui,sans-serif;cursor:pointer}#spP .ex-hd button:disabled{opacity:.3;cursor:default}
#spP .ex-ttl{flex:1;min-width:0;text-align:center}#spP .ex-ttl b{display:block;font-size:19px;font-weight:900}#spP .ex-ttl small{font-size:13px;font-weight:700;color:#5E7598}
#spP .ex-badge{margin:10px auto 0;width:max-content;max-width:100%;background:#FFF3CC;border-radius:99px;padding:4px 12px;font-size:13px;font-weight:900}
#spP .ex-kp{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
#spP .ex-kp>div{background:#fff;border:2px solid #D5E5F8;border-radius:16px;padding:10px;text-align:center;min-width:0}
#spP .ex-kp b{display:block;font-size:26px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1.1}#spP .ex-kp b span{font-size:15px;color:#5E7598}#spP .ex-kp small{display:block;font-size:12px;font-weight:800;color:#5E7598}#spP .ex-kp em{display:block;font-style:normal;font-size:11.5px;font-weight:800;margin-top:4px}
#spP .ex-lg{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;font-weight:800;color:#5E7598;margin:4px 0 6px}#spP .ex-lg i{display:inline-block;vertical-align:middle;margin-right:4px}
#spP .ex-lg .k1{width:18px;height:8px;border-radius:4px;background:#3B7DDD}#spP .ex-lg .k2{width:3px;height:14px;background:#25406B}#spP .ex-lg .k3{width:18px;height:2px;background:#9DBBE6}
#spP .ex-sr{display:grid;grid-template-columns:minmax(110px,1fr) 2fr 124px;gap:12px;align-items:center;padding:10px 0;border-top:1px solid #EAF2FC}#spP .ex-sr:first-child{border-top:0}
#spP .ex-sl b{display:block;font-size:14.5px}#spP .ex-sl small{font-size:12px;font-weight:700;color:#5E7598}
#spP .ex-sb{display:flex;align-items:center;gap:10px;min-width:0}#spP .ex-tr{position:relative;flex:1;height:14px;border-radius:99px;background:#EAF2FC}
#spP .ex-tr i{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:#3B7DDD}#spP .ex-tr i.lo{background:#E8915F}
#spP .ex-tr em{position:absolute;top:-4px;bottom:-4px;width:3px;margin-left:-1.5px;background:#25406B;border-radius:2px}
#spP .ex-sv{width:76px;flex:none;text-align:right;font-variant-numeric:tabular-nums}#spP .ex-sv b{font-size:17px;font-weight:900}#spP .ex-sv span{font-size:12px;color:#5E7598;font-weight:800}#spP .ex-sv small{display:block;font-size:11.5px;font-weight:700;color:#5E7598}
#spP .ex-sp{display:flex;justify-content:flex-end}
@media (max-width:640px){#spP .ex-kp{grid-template-columns:repeat(2,1fr)}#spP .ex-sr{grid-template-columns:1fr auto;gap:6px 10px}#spP .ex-sb{grid-column:1/-1;grid-row:2}#spP .ex-sp{grid-row:1;grid-column:2}}
#spP .pp-books{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#spP .pp-books span{font-size:12px;font-weight:800;background:#FFF3CC;border-radius:8px;padding:3px 8px}
#spP .pp-foot{text-align:center;font-size:12px;font-weight:700;color:#5E7598;margin-top:6px}
#spP .pp-empty{font-size:13.5px;color:#5E7598;font-weight:700}
@media (max-width:640px){#spP .pp-kp{grid-template-columns:repeat(2,1fr)}#spP .pp-bg{grid-template-columns:1fr}#spP .pp-hero h1{font-size:20px}}
`;

function chart(ex, sel) {
  if (ex.length < 2) return '';
  const W = 640, H = 190, L = 34, R = 12, T = 14, B = 34;
  const vals = ex.flatMap(e => [e.t, e.a]).filter(v => v != null);
  let mx = Math.max(...vals), mn = Math.min(...vals); mx = Math.ceil((mx + 2) / 5) * 5; mn = Math.max(0, Math.floor((mn - 2) / 5) * 5);
  const x = i => L + i * (W - L - R) / (ex.length - 1), y = v => T + (mx - v) * (H - T - B) / ((mx - mn) || 1);
  const line = k => ex.map((e, i) => e[k] == null ? '' : (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(e[k]).toFixed(1)).join(' ');
  let g = '';
  for (let v = mn; v <= mx; v += Math.max(5, Math.round((mx - mn) / 4 / 5) * 5)) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#EAF2FC"/><text x="${L - 6}" y="${y(v) + 4}" font-size="11" text-anchor="end" fill="#5E7598">${v}</text>`;
  const lab = ex.map((e, i) => (i === 0 || i === ex.length - 1 || ex.length <= 6) ? `<text x="${x(i)}" y="${H - 12}" font-size="10.5" text-anchor="${i === 0 ? 'start' : i === ex.length - 1 ? 'end' : 'middle'}" fill="#5E7598">${esc(fd(e.d, { day: 'numeric', month: 'short' }))}</text>` : '').join('');
  const dots = ex.map((e, i) => e.t == null ? '' : `<g data-ex="${i}" style="cursor:pointer"><circle cx="${x(i)}" cy="${y(e.t)}" r="14" fill="transparent"/>${i === sel ? `<line x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H - B}" stroke="#FFE08A" stroke-width="10" opacity=".7"/>` : ''}<circle cx="${x(i)}" cy="${y(e.t)}" r="${i === sel ? 7 : 4}" fill="${i === sel ? '#fff' : '#3B7DDD'}" stroke="#3B7DDD" stroke-width="${i === sel ? 3.5 : 0}"/></g>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Toplam net gelişimi">${g}<path d="${line('a')}" fill="none" stroke="#B9C9DF" stroke-width="2" stroke-dasharray="5 4"/><path d="${line('t')}" fill="none" stroke="#3B7DDD" stroke-width="3" stroke-linejoin="round"/>${dots}${lab}</svg>
  <div class="pp-mut" style="display:flex;gap:14px;margin-top:4px"><span><b style="color:#3B7DDD">━</b> Toplam net</span><span><b style="color:#B9C9DF">┅</b> Sınıf ortalaması</span></div>`;
}
function spark(vals, sel) {
  const pts = vals.map((v, i) => [i, v]).filter(p => p[1] != null); if (pts.length < 2) return '';
  const W = 120, H = 34, mx = Math.max(...pts.map(p => p[1])), mn = Math.min(...pts.map(p => p[1])), n = vals.length - 1 || 1;
  const X = i => 4 + i * (W - 8) / n, Y = v => 4 + (mx - v) * (H - 8) / ((mx - mn) || 1);
  const s = vals[sel];
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><path d="${pts.map((p, k) => (k ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' ')}" fill="none" stroke="#9DBBE6" stroke-width="2"/>${s != null ? `<circle cx="${X(sel)}" cy="${Y(s)}" r="4" fill="#3B7DDD"/>` : ''}</svg>`;
}
function examSec(ex, sel) {
  if (!ex.length) return '<h2>📊 Deneme sonuçları</h2><p class="pp-empty">Henüz deneme sonucu yok.</p>';
  const e = ex[sel], pr = sel > 0 ? ex[sel - 1] : null, dt = pr && e.t != null && pr.t != null ? Math.round((e.t - pr.t) * 100) / 100 : null;
  const diffA = e.a != null && e.t != null ? Math.round((e.t - e.a) * 100) / 100 : null;
  const best = Math.max(...ex.map(z => z.t ?? -1e9)), isBest = e.t === best && ex.length > 1;
  const chips = ex.map((z, i) => `<button class="${i === sel ? 'on' : ''}" data-ex="${i}"><b>${esc(z.n)}</b><small>${esc(fd(z.d, { day: 'numeric', month: 'short' }))} · ${fmt(z.t)}</small></button>`).join('');
  const subs = e.s.filter(s => s.v != null || s.a != null);
  const scale = s => Math.max(+s.q || 0, s.v || 0, s.a || 0, 1);
  const rows = subs.map(s => {
    const M = scale(s), w = Math.max(0, (s.v || 0) / M * 100), am = s.a != null ? Math.max(0, s.a / M * 100) : null, up = s.v != null && s.a != null ? s.v >= s.a : null;
    const tr = ex.map(z => { const q = z.s.find(k => k.n === s.n); return q ? q.v : null; });
    return `<div class="ex-sr"><div class="ex-sl"><b>${esc(s.n)}</b><small>${s.d != null ? `D ${s.d} · Y ${s.y}${s.q ? ' · B ' + Math.max(0, s.q - s.d - s.y) : ''}` : (s.q ? s.q + ' soru' : '')}</small></div>
      <div class="ex-sb"><div class="ex-tr"><i class="${up === false ? 'lo' : ''}" style="width:${w}%"></i>${am != null ? `<em style="left:${am}%" title="Sınıf ortalaması ${fmt(s.a)}"></em>` : ''}</div><div class="ex-sv"><b>${fmt(s.v)}</b>${s.q ? `<span>/${s.q}</span>` : ''}<small>ort. ${fmt(s.a)}</small></div></div>
      <div class="ex-sp">${spark(tr, sel)}</div></div>`;
  }).join('');
  return `<h2>📊 Deneme sonuçları <span class="pp-mut" style="margin-left:auto;font-size:13px">${ex.length} deneme</span></h2>
  ${chart(ex, sel)}
  <div class="ex-chips" role="tablist">${chips}</div>
  <div class="ex-card">
    <div class="ex-hd"><button data-ex="p" ${sel ? '' : 'disabled'} aria-label="Önceki deneme">‹</button><div class="ex-ttl"><b>${esc(e.n)}</b><small>${fd(e.d, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}</small></div><button data-ex="n" ${sel < ex.length - 1 ? '' : 'disabled'} aria-label="Sonraki deneme">›</button></div>
    ${isBest ? '<div class="ex-badge">🌟 Şimdiye kadarki en yüksek net!</div>' : ''}
    <div class="ex-kp">
      <div><b>${fmt(e.t)}</b><small>Toplam net</small>${dt != null ? `<em class="${dt >= 0 ? 'pp-pos' : 'pp-neg'}">${dt > 0 ? '▲ +' : dt < 0 ? '▼ ' : ''}${fmt(dt)} önceki denemeye göre</em>` : '<em class="pp-mut">ilk deneme</em>'}</div>
      <div><b>${fmt(e.a)}</b><small>Sınıf ortalaması</small>${diffA != null ? `<em class="${diffA >= 0 ? 'pp-pos' : 'pp-neg'}">${diffA >= 0 ? 'ortalamanın ' + fmt(diffA) + ' üstünde' : 'ortalamanın ' + fmt(-diffA) + ' altında'}</em>` : ''}</div>
      ${e.r ? `<div><b>${e.r}<span>/${e.rn}</span></b><small>Sınıf sırası</small></div>` : ''}
      <div><b>${e.p != null ? fmt(e.p) : '—'}</b><small>Puan</small></div>
    </div>
    <div class="ex-lg"><span><i class="k1"></i> Net</span><span><i class="k2"></i> Sınıf ortalaması</span><span><i class="k3"></i> Dersin bütün denemelerdeki seyri</span></div>
    <div class="ex-subs">${rows || '<p class="pp-empty">Bu deneme için ders netleri girilmemiş.</p>'}</div>
  </div>`;
}
function openAv(cur, save) {
  const o = document.createElement('div'); o.id = 'ppAvO';
  o.innerHTML = '<div class="pp-avbx"><div id="ppAvH"></div></div>'; document.body.appendChild(o);
  const close = () => o.remove();
  window.SPAvatar.editor(o.querySelector('#ppAvH'), cur || window.SPAvatar.random(), {
    title: 'Avatarını yap 🎨', sub: 'Kendine benzet ya da hayalindeki karakteri seç. Öğretmenin de görecek.',
    onSave: async a => { const b = o.querySelector('[data-ava="ok"]'); if (b) { b.disabled = true; b.textContent = 'Kaydediliyor…'; } try { await save(a); close(); } catch (e) { if (b) { b.disabled = false; b.textContent = '✓ Kaydet'; } alert0(o, 'Kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.'); } },
    onCancel: close
  });
  o.addEventListener('click', ev => { if (ev.target === o) close(); });
}
function alert0(o, m) { let e = o.querySelector('.pp-averr'); if (!e) { e = document.createElement('p'); e.className = 'pp-averr'; o.querySelector('.pp-avbx').appendChild(e); } e.textContent = m; }
const gcl = v => v == null ? '' : v < 50 ? 'pp-g-n' : v < 70 ? 'pp-g-e' : 'pp-g-y';
const SY = { y: '✓', n: '✗', e: '½', a: '–', p: '·' }, SYpm = { y: '+', n: '−', a: '–', p: '·' }, SYatt = { y: '✓', n: '✗', e: 'İ', p: '·' };


// ---- Öğrencinin kendi kitaplığı (bkreq/{giriş kimliği}) ----
const LBK = 'sp-portal-lib';
const stars = n => '★★★★★'.slice(0, n || 0) + '☆☆☆☆☆'.slice(0, 5 - (n || 0));
function libInit(box, lib) {
  if (!box) return;
  let L = []; try { L = JSON.parse(localStorage.getItem(LBK) || '[]'); } catch (e) {}
  const COL = [['#E2463B','#B8322A'],['#3D7CC9','#2C5E9E'],['#2E8B6A','#1F6A50'],['#F2B705','#C99400'],['#8E5BC7','#6C3FA3'],['#E8771E','#BF5C10'],['#1FA3A3','#157E7E'],['#D94C8A','#B0346C'],['#5B6FD6','#4152B0'],['#7A9A2E','#5C7720']];
  const hash = t => { let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return Math.abs(h); };
  const spine = b => { const c = COL[hash(b.id + b.t) % COL.length], pg = +b.p || 150, w = Math.round(Math.max(30, Math.min(54, 26 + pg / 14))), h = Math.round(Math.max(118, Math.min(168, 112 + (hash(b.t) % 56))));
    return `<button class="pp-sp" data-lb="see" data-id="${esc(b.id)}" style="--c1:${c[0]};--c2:${c[1]};width:${w}px;height:${h}px" title="${esc(b.t)}"><i class="pp-spb"></i><span>${esc(b.t)}</span>${b.r >= 4 ? '<em>★</em>' : ''}<i class="pp-spb b2"></i></button>`; };
  const draw = () => {
    const sorted = L.slice().sort((a, b) => String(a.d || '').localeCompare(String(b.d || '')));
    const pages = L.reduce((a, b) => a + (+b.p || 0), 0);
    const W = Math.max(240, (box.clientWidth || 320) - 36), rows = []; let row = [], used = 0;
    sorted.forEach(b => { const w = Math.round(Math.max(30, Math.min(54, 26 + (+b.p || 150) / 14))) + 3; if (used + w > W - 50 && row.length) { rows.push(row); row = []; used = 0; } row.push(b); used += w; });
    rows.push(row); while (rows.length < 2) rows.push([]);
    const lvl = L.length >= 30 ? ['🏛️', 'Kütüphane Ustası'] : L.length >= 15 ? ['🦉', 'Bilge Okur'] : L.length >= 5 ? ['📗', 'Kitap Kurdu'] : ['🌱', 'Yeni Okur'];
    box.innerHTML = `<div class="pp-lbh"><h2>📚 Kitaplığım</h2><button class="pp-ave pp-lbadd" data-lb="add">＋ Kitap ekle</button></div>` +
      `<div class="pp-lbst"><span><b>${L.length}</b> kitap</span>${pages ? `<span><b>${pages.toLocaleString('tr-TR')}</b> sayfa</span>` : ''}<span class="pp-lblv">${lvl[0]} ${lvl[1]}</span></div>` +
      `<div class="pp-shelf">${rows.map((r, i) => `<div class="pp-row2"><div class="pp-books2">${r.map(spine).join('')}${i === rows.length - 1 ? '<button class="pp-sp pp-spadd" data-lb="add" aria-label="Kitap ekle"><span>＋</span></button>' : ''}</div><div class="pp-board"></div></div>`).join('')}</div>` +
      `<p class="pp-mut" style="margin:8px 0 0">${L.length ? 'Bir kitaba dokun: özetini gör, düzenle.' : 'Rafın boş! Okuduğun ilk kitabı ekle, rafına dizilsin. 📖'}</p>`;
  };
  const see = b => { const o = document.createElement('div'); o.id = 'ppAvO'; const c = COL[hash(b.id + b.t) % COL.length];
    o.innerHTML = `<div class="pp-avbx pp-lbf pp-bkd"><div class="pp-bkc" style="--c1:${c[0]};--c2:${c[1]}"><b>${esc(b.t)}</b>${b.a ? `<small>${esc(b.a)}</small>` : ''}</div><div class="pp-bki">${b.r ? `<div class="pp-lbs">${stars(b.r)}</div>` : ''}<p class="pp-mut" style="margin:4px 0">${[b.p ? b.p + ' sayfa' : '', b.d ? 'Bitirdiğin gün: ' + fd(b.d, { day: 'numeric', month: 'long', year: 'numeric' }) : ''].filter(Boolean).map(esc).join(' · ')}</p>${b.o ? `<p class="pp-bko">${esc(b.o)}</p>` : '<p class="pp-mut">Özet yazmadın.</p>'}</div>
      <div class="pp-lbact"><button class="pp-ave" data-sd="ed">✎ Düzenle</button><button class="pp-ave pp-lbx" data-sd="del">🗑 Sil</button><button class="pp-ave pp-lbx" data-sd="x">Kapat</button></div></div>`;
    document.body.appendChild(o);
    o.addEventListener('click', async ev => { if (ev.target === o) return o.remove(); const k = ev.target.closest('[data-sd]'); if (!k) return; const a = k.dataset.sd; o.remove();
      if (a === 'ed') form(b); else if (a === 'del') { if (!confirm('“' + b.t + '” kitaplığından silinsin mi?')) return; const old = L.slice(); L = L.filter(x => x.id !== b.id); draw(); try { await save(); } catch (e) { L = old; draw(); window.alert('Silinemedi. İnternet bağlantını kontrol et.'); } } }); };
  let rzT = null; window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (document.body.contains(box)) draw(); }, 200); });
  const save = async () => { try { localStorage.setItem(LBK, JSON.stringify(L)); } catch (e) {} await lib.save(L); };
  const form = b => {
    b = b || {}; const o = document.createElement('div'); o.id = 'ppAvO'; const today = new Date().toISOString().slice(0, 10);
    o.innerHTML = `<div class="pp-avbx pp-lbf"><h3>${b.id ? 'Kitabı düzenle' : 'Yeni kitap'} 📖</h3>
      <label>Kitabın adı *<input id="lbT" maxlength="120" value="${esc(b.t || '')}"></label>
      <div class="pp-lb2"><label>Yazar<input id="lbA" maxlength="80" value="${esc(b.a || '')}"></label><label>Sayfa<input id="lbP" type="number" min="1" max="5000" inputmode="numeric" value="${esc(b.p || '')}"></label></div>
      <label>Bitirdiğin gün<input id="lbD" type="date" max="${today}" value="${esc(b.d || today)}"></label>
      <label>Beğenin<div class="pp-lbr">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-r="${i}" class="${(b.r || 0) >= i ? 'on' : ''}">★</button>`).join('')}</div></label>
      <label>Kısa özet <small>(kendi cümlelerinle)</small><textarea id="lbO" rows="5" maxlength="1000" placeholder="Kitap neyi anlatıyor? En çok neyi sevdin?">${esc(b.o || '')}</textarea></label>
      <p class="pp-averr" id="lbE"></p><div class="pp-lbact"><button class="pp-ave" data-lf="ok">✓ Kaydet</button><button class="pp-ave pp-lbx" data-lf="x">Vazgeç</button></div></div>`;
    document.body.appendChild(o); let r = b.r || 0;
    o.addEventListener('click', async ev => {
      if (ev.target === o) return o.remove();
      const rb = ev.target.closest('[data-r]'); if (rb) { r = +rb.dataset.r === r ? 0 : +rb.dataset.r; o.querySelectorAll('[data-r]').forEach(z => z.classList.toggle('on', +z.dataset.r <= r)); return; }
      const f = ev.target.closest('[data-lf]'); if (!f) return; if (f.dataset.lf === 'x') return o.remove();
      const t = o.querySelector('#lbT').value.trim(); if (!t) { o.querySelector('#lbE').textContent = 'Kitabın adını yaz.'; return; }
      const nb = { id: b.id || Math.random().toString(36).slice(2, 10), t, a: o.querySelector('#lbA').value.trim(), p: Math.max(0, Math.min(5000, parseInt(o.querySelector('#lbP').value, 10) || 0)) || '', d: o.querySelector('#lbD').value || '', r, o: o.querySelector('#lbO').value.trim(), at: Date.now() };
      const old = L.slice(); L = b.id ? L.map(x => x.id === b.id ? nb : x) : L.concat([nb]); if (L.length > 300) L = L.slice(-300);
      f.disabled = true; f.textContent = 'Kaydediliyor…';
      try { await save(); o.remove(); draw(); } catch (e) { L = old; f.disabled = false; f.textContent = '✓ Kaydet'; o.querySelector('#lbE').textContent = 'Kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.'; }
    });
    setTimeout(() => { const i = o.querySelector('#lbT'); if (i && !b.id) i.focus(); }, 50);
  };
  box.addEventListener('click', async ev => {
    const b = ev.target.closest('[data-lb]'); if (!b) return; ev.stopPropagation();
    if (b.dataset.lb === 'add') return form();
    const it = L.find(x => x.id === b.dataset.id); if (!it) return;
    if (b.dataset.lb === 'see') return see(it);
    if (b.dataset.lb === 'ed') return form(it);
    if (b.dataset.lb === 'del') { if (!confirm('“' + it.t + '” kitaplığından silinsin mi?')) return; const old = L.slice(); L = L.filter(x => x.id !== it.id); draw(); try { await save(); } catch (e) { L = old; draw(); window.alert('Silinemedi. İnternet bağlantını kontrol et.'); } }
  });
  draw();
  lib.load().then(R => { if (Array.isArray(R)) { L = R; try { localStorage.setItem(LBK, JSON.stringify(L)); } catch (e) {} draw(); } }).catch(() => {});
}
export function renderPortal(D, role, at, onOut, onRefresh, onAvatar, lib) {
  if (!document.getElementById('spPcss')) { const s = document.createElement('style'); s.id = 'spPcss'; s.textContent = CSS; document.head.appendChild(s); }
  document.body.classList.add('spport');
  let el = document.getElementById('spP'); if (!el) { el = document.createElement('div'); el.id = 'spP'; document.body.appendChild(el); }
  const ic = (document.querySelector('link[rel="apple-touch-icon"]') || {}).href || '';
  const first = (D.name || '').split(' ')[0], veli = role === 'v';
  const ini = (D.name || '?').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toLocaleUpperCase('tr-TR');
  const lg = D.lg || {}, ex = D.ex || [], lastEx = ex[ex.length - 1];
  let ov = null; try { ov = JSON.parse(localStorage.getItem('sp-portal-av') || 'null'); } catch (e) {}
  const av = ov && ov.at > (at || 0) ? ov.av : D.av, AV = window.SPAvatar;
  const hwT = (D.trk || []).filter(t => t.mode === 'status'), hwY = hwT.reduce((a, t) => a + (t.c.y || 0), 0), hwN = hwT.reduce((a, t) => a + t.tot, 0);
  const nb = (D.badges || []).reduce((a, b) => a + b.got.length, 0);
  let h = `<div class="pp-w">
  <div class="pp-top">${ic ? `<img src="${ic}" alt="">` : ''}<div class="pp-tt"><small>${veli ? 'VELİ SAYFASI' : 'ÖĞRENCİ SAYFASI'}</small><b>Sınıf Pusulası</b></div><div class="pp-tb">${window.SPPush ? `<button data-pp="nt" class="pp-nt" aria-label="Bildirimler">🔔<span>Bildirimler</span></button>` : ''}<button data-pp="re">⟳ Yenile</button><button data-pp="out">Çıkış</button></div></div>
  <div class="pp-hero"><div class="pp-av${av && AV ? ' pp-avi' : ''}">${av && AV ? `<img src="${AV.url(av)}" alt="">` : esc(ini)}</div><div style="flex:1;min-width:200px"><h1>${veli ? esc(D.name) : 'Merhaba ' + esc(first) + '! 👋'}</h1><p>${esc(D.cls)}${D.no ? ' · No ' + esc(D.no) : ''} · ${esc(D.school)}</p><p>${esc(D.teacher)} · ${esc(D.term || '')}</p>${!veli && AV && onAvatar ? '<button class="pp-ave" data-pp="av">🎨 Avatarımı düzenle</button>' : ''}<span class="pp-chip">Son güncelleme: ${at ? new Date(at).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—'}</span></div></div>
  <div class="pp-kp"><div class="pp-k"><b>${nb}</b><small>🏅 Rozet</small></div><div class="pp-k"><b class="${(lg.net || 0) >= 0 ? 'pp-pos' : 'pp-neg'}">${(lg.net || 0) > 0 ? '+' : ''}${lg.net || 0}</b><small>🏆 Lig puanı${lg.r ? ' · ' + lg.r + '/' + lg.n : ''}</small></div><div class="pp-k"><b>${hwN ? '%' + pct(hwY, hwN) : '—'}</b><small>📝 Ödev tamamlama</small></div><div class="pp-k"><b>${lastEx ? fmt(lastEx.t) : '—'}</b><small>📊 Son deneme neti</small></div></div>`;

  // Türkçe notları
  if ((D.trn || []).length) h += `<div class="pp-card"><h2>📝 Türkçe notları</h2>` + D.trn.map(T => {
    const e = T.d || {}, cell = (k, lab, cls) => `<div class="pp-tn${cls ? ' ' + cls : ''}"><small>${lab}</small><b class="${gcl(e[k])}">${e[k] ?? '—'}</b></div>`;
    const ex = n => { const s = T['s' + n], f = T['f' + n]; return `<div class="pp-te"><div class="pp-teh">${n}. Sınav</div><div class="pp-tg">${cell('y' + n, 'Yazılı')}${cell('d' + n, 'Dinleme')}${cell('k' + n, 'Konuşma')}<div class="pp-tn pp-tns"><small>Sınav puanı</small><b class="${gcl(s)}">${s == null ? '—' : fmt(s) + (f ? '' : '*')}</b></div></div></div>`; };
    return `<div class="pp-mut" style="margin:4px 0 8px;font-weight:900">${esc(T.lab)}</div>${ex(1)}${T.e2 ? ex(2) : ''}${T.pf ? `<div class="pp-te"><div class="pp-teh pp-tep">Performans</div><div class="pp-tg pp-tg2">${cell('p1', '1. Performans')}${cell('p2', '2. Performans')}</div></div>` : ''}<div class="pp-tav"><span>Türkçe ortalaması</span><b class="${gcl(T.avg)}">${fmt(T.avg)}</b></div><p class="pp-mut" style="margin:6px 0 4px;font-size:12px">Sınav puanı: Yazılı %${T.w[0]} · Dinleme %${T.w[1]} · Konuşma %${T.w[2]}${(T.f1 && T.f2) ? '' : ' · * eksik notla hesaplandı'}. Ortalama: sınav puanları ve performans notlarının ortalaması.</p>`;
  }).join('') + `</div>`;

  // Kitaplığım (yalnız öğrenci)
  if (!veli && lib) h += `<div class="pp-card" id="ppLib"><h2>📚 Kitaplığım</h2><p class="pp-empty">Yükleniyor…</p></div>`;
  // Rozetler
  h += `<div class="pp-card"><h2>🏅 Rozetler</h2><div class="pp-bg">` + (D.badges || []).map(b => {
    const goal = b.next ? b.next.n : (b.got.length ? b.got[b.got.length - 1].n : 1);
    return `<div class="pp-bc"><div class="pp-be">${b.got.length ? b.got.map(t => `<span title="${esc(t.t)}">${t.e}</span>`).join('') : '<span style="opacity:.25">' + b.ic + '</span>'}</div><b>${b.ic} ${esc(b.lab)}</b><small>${b.got.length ? 'Kazanılan: ' + b.got.map(t => esc(t.t)).join(', ') : 'Henüz rozet yok'}</small><small>${b.k === 'kd' ? 'Toplam iyilik: ' + b.cur : 'Şu an üst üste: <strong>' + b.cur + '</strong> · en iyi: ' + b.best}</small>${b.next ? `<div class="pp-bar"><i style="width:${Math.min(100, pct(b.k === 'kd' ? b.cur : b.best, goal))}%"></i></div><small>Sıradaki: ${b.next.e} ${esc(b.next.t)} (${b.next.n})</small>` : '<small>🎉 Bütün rozetler kazanıldı!</small>'}</div>`;
  }).join('') + `</div></div>`;

  // Lig
  h += `<div class="pp-card"><h2>🏆 Sınıf ligi</h2><div class="pp-kp" style="margin-bottom:10px"><div class="pp-k"><b class="${(lg.net || 0) >= 0 ? 'pp-pos' : 'pp-neg'}">${(lg.net || 0) > 0 ? '+' : ''}${lg.net || 0}</b><small>Puan</small></div>${lg.r ? `<div class="pp-k"><b>${lg.r}/${lg.n}</b><small>Lig sırası</small></div>` : ''}${lg.pg != null ? `<div class="pp-k"><b>${lg.pg}</b><small>Performans notu önerisi</small></div>` : ''}<div class="pp-k"><b>${lg.sh || 0}</b><small>🛡️ Kalkan</small></div></div>` +
    ((lg.h || []).length ? (lg.h || []).slice(0, 12).map(p => `<div class="pp-row"><span style="font-size:22px">${p.e}</span><span class="pp-rt"><b>${esc(p.t)}</b><small>${fd(p.d)}${p.n ? ' · ' + esc(p.n) : ''}</small></span><span class="pp-pv ${p.v >= 0 ? 'pp-pos' : 'pp-neg'}">${p.v > 0 ? '+' : ''}${p.v}</span></div>`).join('') : '<p class="pp-empty">Bu dönem henüz puan hareketi yok.</p>') + `</div>`;

  // Ödev ve takip
  h += `<div class="pp-card"><h2>📝 Ödev ve takip performansı</h2>` + ((D.trk || []).length ? (D.trk || []).map(t => {
    const c = t.c || {}, ok = c.y || 0, sy = t.mode === 'pm' ? SYpm : t.mode === 'att' ? SYatt : SY;
    const sub = t.mode === 'count' ? `${t.sum} ${esc(t.unit)} · ${t.tot} kayıt` : t.mode === 'att' ? `Geldi ${c.y || 0} · İzinli ${c.e || 0} · Gelmedi ${c.n || 0}` : t.mode === 'pm' ? `Okudu ${c.y || 0} · Okumadı ${c.n || 0} · ${t.tot} kontrol` : `Yaptı ${c.y || 0} · Yarım ${c.e || 0} · Yapmadı ${c.n || 0} · ${t.tot} kontrol`;
    return `<div class="pp-row" style="display:block"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:22px">${t.em}</span><span class="pp-rt"><b>${esc(t.ti)}</b><small>${sub}</small></span>${t.mode !== 'count' ? `<span class="pp-pv">%${pct(ok, t.tot)}</span>` : ''}</div>${t.mode !== 'count' ? `<div class="pp-bar"><i style="width:${pct(ok, t.tot)}%"></i></div>` : ''}<div class="pp-dots">${t.rec.slice().reverse().map(r => `<span class="s-${r.s}" title="${esc(fd(r.d))}${r.k ? ' · ' + esc(r.k) : ''}${r.nt ? ' · ' + esc(r.nt) : ''}">${t.mode === 'count' ? (r.v == null ? '·' : r.v) : (sy[r.s] || '·')}</span>`).join('')}</div></div>`;
  }).join('') : '<p class="pp-empty">Henüz kontrol kaydı yok.</p>') +
    `<div class="pp-row"><span style="font-size:22px">📚</span><span class="pp-rt"><b>Okunan kitap: ${D.books || 0}</b>${(D.bookNames || []).length ? `<div class="pp-books">${D.bookNames.map(b => `<span>${esc(b)}</span>`).join('')}</div>` : ''}</span></div>` +
    (D.abs && (D.abs.n || D.abs.e) ? `<div class="pp-row"><span style="font-size:22px">🗓</span><span class="pp-rt"><b>Devamsızlık</b><small>Gelmedi ${D.abs.n} gün · İzinli ${D.abs.e} gün</small></span></div>` : '') + `</div>`;

  // Notlar
  h += `<div class="pp-card"><h2>📑 Notlar</h2>` + ((D.grades || []).length ? D.grades.slice().reverse().map(T => {
    const ks = ['y1', 'y2', 'y3', 'p1', 'p2', 'p3', 'pr'].filter(k => Object.values(T.d).some(x => x[k] != null));
    const lab = { y1: '1. Yazılı', y2: '2. Yazılı', y3: '3. Yazılı', p1: '1. Perf.', p2: '2. Perf.', p3: '3. Perf.', pr: 'Proje' };
    return `<div class="pp-mut" style="margin:4px 0 6px;font-weight:900">${esc(T.lab)}</div><div class="pp-tw"><table><thead><tr><th>Ders</th>${ks.map(k => `<th>${lab[k]}</th>`).join('')}<th>Ort.</th></tr></thead><tbody>${Object.keys(T.d).map(d => { const x = T.d[d]; return `<tr><td>${esc(d.replace(' ve Ahlak Bilgisi', '').replace(' Teknolojileri ve Yazılım', '').replace(' Eğitimi ve Spor', ''))}</td>${ks.map(k => `<td class="${gcl(x[k])}">${x[k] ?? ''}</td>`).join('')}<td class="pp-av2 ${gcl(x.a ?? x.o)}">${fmt(x.a ?? x.o)}</td></tr>`; }).join('')}</tbody></table></div>`;
  }).join('') : '<p class="pp-empty">Henüz not girilmedi.</p>') + `</div>`;

  // Denemeler
  h += `<div class="pp-card" id="ppEx"></div>`;

  h += `<p class="pp-foot">Bu sayfadaki bilgileri öğretmeniniz paylaşır ve kayıt girdikçe güncellenir. ${veli ? 'Giriş bilgilerinizi kimseyle paylaşmayın.' : 'Şifreni kimseye söyleme.'}</p></div>`;
  el.innerHTML = h;
  let sel = ex.length - 1;
  const drawEx = () => { const box = el.querySelector('#ppEx'); if (box) box.innerHTML = examSec(ex, sel); const c = box && box.querySelector('.ex-chips .on'); if (c) c.scrollIntoView({ block: 'nearest', inline: 'center' }); };
  drawEx();
  if (!veli && lib) libInit(el.querySelector('#ppLib'), lib);
  el.onclick = ev => {
    const x = ev.target.closest('[data-ex]'); if (x) { const v = x.dataset.ex; sel = v === 'p' ? Math.max(0, sel - 1) : v === 'n' ? Math.min(ex.length - 1, sel + 1) : +v; drawEx(); return; }
    const b = ev.target.closest('[data-pp]'); if (!b) return;
    if (b.dataset.pp === 'av') return openAv(av, async spec => { await onAvatar(spec); try { localStorage.setItem('sp-portal-av', JSON.stringify({ av: spec, at: Date.now() })); } catch (e) {} renderPortal(D, role, at, onOut, onRefresh, onAvatar, lib); });
    if (b.dataset.pp && b.dataset.pp.indexOf('lb') === 0) return;
    if (b.dataset.pp === 'nt') { const c = window.SPPushCtx || {}; return window.SPPush && SPPush.open({ pid: c.pid, role: c.role || role, np: D.np || [] }); }
    if (b.dataset.pp === 'out') onOut(); else onRefresh();
  };
}
