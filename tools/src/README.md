# cloud.js kaynakları

`cloud.js` (kökte) bu klasördeki kaynaklardan derlenir:

```
cd <çalışma klasörü>   # package.json'da firebase olmalı (npm i firebase esbuild)
npx esbuild tools/src/cloud.js --bundle --minify --format=iife --target=es2020 --outfile=cloud.js
```

cloud.js değişince index.html'deki `cloud.js?v=` / `config.js?v=` sürümünü ve sw.js önbellek adını artırın.
