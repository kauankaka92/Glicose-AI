#!/bin/bash
# build.sh — Compila o APK do Glicose AI
# Execute em Linux, WSL ou macOS com Buildozer instalado.
set -e

cd "$(dirname "$0")"

echo "==> Instalando dependências do Buildozer..."
pip install --quiet buildozer cython

echo "==> Limpando build anterior (se existir)..."
buildozer android clean 2>/dev/null || true

echo "==> Compilando APK debug..."
buildozer -v android debug

echo ""
echo "✅ APK gerado em: bin/glicoseai-1.0.0-arm64-v8a_armeabi-v7a-debug.apk"
