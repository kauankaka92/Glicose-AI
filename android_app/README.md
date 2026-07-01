# Glicose AI — Android APK

Container Android nativo para o site Glicose AI.
Usa Kivy + Buildozer + WebView nativo com servidor HTTP local.

## Estrutura

```
android_app/
├── main.py              # App Kivy + WebView Android
├── buildozer.spec       # Configuração do Buildozer
├── requirements.txt     # Dependências Python
├── generate_assets.py   # Gera icon.png e splash.png
├── build.sh             # Script de build (Linux/WSL)
└── assets/
    ├── icon.png         # Ícone 512x512 (gerado)
    ├── splash.png       # Splash 1024x500 (gerado)
    └── www/             # Site completo (cópia do /app)
        ├── index.html
        ├── css/
        ├── js/
        ├── pages/
        ├── icons/
        ├── manifest.json
        └── sw.js
```

## Como compilar

### Pré-requisitos (Linux/WSL/macOS)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3-pip git zip unzip openjdk-17-jdk \
    autoconf libtool pkg-config zlib1g-dev libncurses5-dev \
    libncursesw5-dev libtinfo5 cmake libffi-dev libssl-dev

pip3 install buildozer cython
```

### Build

```bash
cd android_app
chmod +x build.sh
./build.sh
```

Ou manualmente:

```bash
cd android_app
buildozer android debug
```

### APK gerado

```
android_app/bin/glicoseai-1.0.0-arm64-v8a_armeabi-v7a-debug.apk
```

### Instalar no dispositivo

```bash
adb install bin/glicoseai-*.apk
```

## Como funciona

1. O `main.py` inicia um servidor HTTP local na porta `8765` em thread daemon
2. O servidor serve `assets/www/` como raiz (todos os arquivos do site)
3. O WebView nativo Android carrega `http://127.0.0.1:8765/index.html`
4. ES modules, localStorage, fetch e Service Worker funcionam normalmente
5. O botão Back do Android navega no histórico do WebView

## Notas

- O site original em `c:\Glicose AI\app\` **não foi modificado**
- A cópia em `assets/www/` teve apenas os caminhos `/app/` convertidos para relativos
- Compatível com Android 5.0+ (API 21+)
- Arquiteturas: arm64-v8a e armeabi-v7a
