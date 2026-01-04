#!/bin/bash
set -e

APP_ROOT="NUMARS-POS"
ZIP_NAME="NUMARS-POS-FULLSTACK-SOURCE.zip"
TMP_DIR="/tmp/numars-pos-source"

echo "======================================="
echo "🚀 GENERATE ZIP FULLSTACK SOURCE CODE"
echo "======================================="

# Bersihkan
rm -rf "$TMP_DIR"
rm -f "$ZIP_NAME"

mkdir -p "$TMP_DIR/$APP_ROOT"

# Copy semua source code
echo "📦 Copying full source code..."
rsync -av \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.env \
  --exclude=.env.* \
  --exclude=frontend/dist \
  --exclude=*.log \
  ./ "$TMP_DIR/$APP_ROOT"

# Validasi folder penting
REQUIRED_DIRS=("backend" "frontend" "database" "deploy")
for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$TMP_DIR/$APP_ROOT/$dir" ]; then
    echo "❌ Folder $dir tidak ditemukan"
    exit 1
  fi
done

# Info build
cat <<EOF > "$TMP_DIR/$APP_ROOT/ZIP_INFO.txt"
NUMARS POS – FULLSTACK SOURCE CODE
Generated : $(date)
Includes  :
- Backend (Node.js / Express)
- Frontend (Vue 3 Source)
- Database Schema & Seed
- Deploy Script (Non Docker)
- Docs Operasional

NOTE:
- node_modules DIEXCLUDE
- .env DIEXCLUDE
EOF

# Buat ZIP
echo "🗜️ Creating ZIP..."
cd /tmp
zip -r "$ZIP_NAME" "numars-pos-source" > /dev/null

# Pindahkan ZIP ke project root
mv "/tmp/$ZIP_NAME" "$(pwd)/$ZIP_NAME"

echo "======================================="
echo "✅ ZIP BERHASIL DIBUAT"
echo "➡️ $(pwd)/$ZIP_NAME"
echo "======================================="
