#!/bin/bash
# Sınıf Pusulası · Firestore kurallarını yayınlar (Google Cloud Shell'de çalıştırın)
P=sinif-pusulasi
URL=https://raw.githubusercontent.com/tanerhocca-dot/sinif-pusulasi/main/firestore.rules
curl -fsSL "$URL?t=$(date +%s)" -o /tmp/sp.rules || { echo "❌ Kural dosyası indirilemedi"; exit 1; }
python3 -c "import json;print(json.dumps({'source':{'files':[{'name':'firestore.rules','content':open('/tmp/sp.rules').read()}]}}))" > /tmp/sp.json
T=$(gcloud auth print-access-token) || { echo "❌ Google hesabı yetkisi alınamadı"; exit 1; }
H="x-goog-user-project: $P"
R=$(curl -s -X POST -H "Authorization: Bearer $T" -H "$H" -H "Content-Type: application/json" -d @/tmp/sp.json "https://firebaserules.googleapis.com/v1/projects/$P/rulesets")
RS=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin).get('name',''))" 2>/dev/null)
[ -z "$RS" ] && { echo "❌ Kurallar oluşturulamadı:"; echo "$R"; exit 1; }
R2=$(curl -s -X PATCH -H "Authorization: Bearer $T" -H "$H" -H "Content-Type: application/json" -d "{\"release\":{\"name\":\"projects/$P/releases/cloud.firestore\",\"rulesetName\":\"$RS\"}}" "https://firebaserules.googleapis.com/v1/projects/$P/releases/cloud.firestore")
echo "$R2" | grep -q "rulesetName" && echo "✅ Kurallar yayınlandı" || { echo "❌ Yayınlanamadı:"; echo "$R2"; exit 1; }
