// Sitenin dosyalarını (depo kökü) Android uygulaması için www/ klasörüne kopyalar.
// sw.js kopyalanmaz: uygulama kendi dosyalarını cihazda taşır, service worker gerekmez.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const www = path.resolve(import.meta.dirname, 'www');
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
for (const f of ['config.js', 'cloud.js', 'manifest.webmanifest']) fs.copyFileSync(path.join(root, f), path.join(www, f));
fs.cpSync(path.join(root, 'icons'), path.join(www, 'icons'), { recursive: true });
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// Uygulama içinde olduğumuzu sayfaya bildir
html = html.replace('<head>', '<head><script>window.SP_NATIVE="android";</script>');
fs.writeFileSync(path.join(www, 'index.html'), html);
console.log('www hazır:', fs.readdirSync(www).join(', '));
