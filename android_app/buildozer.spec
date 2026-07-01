[app]
title = Glicose AI
package.name = glicoseai
package.domain = com.glicoseai

source.dir = .
source.include_exts = py,png,jpg,kv,atlas,html,css,js,json,svg,txt

version = 1.0.0

requirements = python3,kivy==2.3.0,android

# Assets do site empacotados junto
source.include_patterns = assets/www/*,assets/www/**/*,assets/icon.png,assets/splash.png

orientation = portrait
fullscreen = 0

# Ícone e splash
icon.filename = %(source.dir)s/assets/icon.png
presplash.filename = %(source.dir)s/assets/splash.png
presplash.color = #0f172a

android.permissions = INTERNET,ACCESS_NETWORK_STATE,WRITE_EXTERNAL_STORAGE,READ_EXTERNAL_STORAGE
android.api = 33
android.minapi = 21
android.ndk = 25b
android.sdk = 33
android.ndk_api = 21
android.archs = arm64-v8a, armeabi-v7a

android.allow_backup = False
android.wakelock = False

# Habilita WebView nativo
android.add_jars =
android.add_src =

# Gradle extras para WebView moderno
android.gradle_dependencies = androidx.webkit:webkit:1.8.0

android.enable_androidx = True

[buildozer]
log_level = 2
warn_on_root = 1
