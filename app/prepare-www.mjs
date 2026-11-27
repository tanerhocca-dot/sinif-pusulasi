// Sitenin dosyalarını (depo kökü) Android uygulaması için www/ klasörüne kopyalar.
// sw.js kopyalanmaz: uygulama kendi dosyalarını cihazda taşır, service worker gerekmez.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const www = path.resolve(import.meta.dirname, 'www');
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
for (const f of ['config.js', 'push.js', 'cloud.js', 'manifest.webmanifest']) fs.copyFileSync(path.join(root, f), path.join(www, f));
fs.cpSync(path.join(root, 'icons'), path.join(www, 'icons'), { recursive: true });
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// Uygulama içinde olduğumuzu sayfaya bildir
html = html.replace('<head>', '<head><script>window.SP_NATIVE="android";</script>');
// İnternetsiz çalışma: PDF / Excel kütüphaneleri ve yazı tipleri uygulamanın içine gömülür
const nm = path.resolve(import.meta.dirname, 'node_modules');
const ven = path.join(www, 'vendor');
fs.mkdirSync(path.join(ven, 'pdfjs'), { recursive: true });
fs.mkdirSync(path.join(ven, 'fonts'), { recursive: true });
for (const f of ['pdf.min.js', 'pdf.worker.min.js']) fs.copyFileSync(path.join(nm, 'pdfjs-dist/build', f), path.join(ven, 'pdfjs', f));
fs.copyFileSync(path.join(nm, 'jspdf/dist/jspdf.umd.min.js'), path.join(ven, 'jspdf.umd.min.js'));
fs.copyFileSync(path.join(nm, 'xlsx/dist/xlsx.full.min.js'), path.join(ven, 'xlsx.full.min.js'));
let fcss = '';
const fontSets = [['nunito', ['500', '600', '700', '800', '900']], ['kalam', ['700']]];
for (const [fam, ws] of fontSets) for (const w of ws) {
  const css = fs.readFileSync(path.join(nm, '@fontsource', fam, w + '.css'), 'utf8');
  for (const blk of css.split('@font-face').slice(1)) {
    const m = blk.match(/files\/([a-z0-9-]+?-(latin|latin-ext)-\d+-normal)\.woff2/);
    if (!m) continue; // yalnız Latin + Türkçe karakterler
    fs.copyFileSync(path.join(nm, '@fontsource', fam, 'files', m[1] + '.woff2'), path.join(ven, 'fonts', m[1] + '.woff2'));
    const body = blk.slice(0, blk.indexOf('}') + 1).replace(/src:[^;]+;/, `src: url(${m[1]}.woff2) format('woff2');`);
    fcss += '@font-face' + body + '\n';
  }
}
fs.writeFileSync(path.join(ven, 'fonts', 'fonts.css'), fcss);
const swaps = [
  ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/', 'vendor/pdfjs/'],
  ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'vendor/jspdf.umd.min.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'vendor/xlsx.full.min.js'],
  ['https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800;900&family=Kalam:wght@700&display=swap', 'vendor/fonts/fonts.css']
];
for (const [from, to] of swaps) {
  if (!html.includes(from)) throw new Error('Gömülecek adres index.html içinde bulunamadı: ' + from);
  html = html.split(from).join(to);
}
const left = html.match(/https:\/\/(cdnjs\.cloudflare\.com|fonts\.googleapis\.com)[^'"\s)]*/g);
if (left) console.warn('Uyarı: hâlâ internetten yüklenen adresler var:', [...new Set(left)]);
fs.writeFileSync(path.join(www, 'index.html'), html);
console.log('www hazır:', fs.readdirSync(www).join(', '));
