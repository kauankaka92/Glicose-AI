"""
Glicose AI - Android WebView Container
Serve os assets locais via HTTP e carrega no WebView nativo Android.
"""
import threading
import http.server
import os
from kivy.app import App
from kivy.uix.widget import Widget
from kivy.clock import Clock
from android.runnable import run_on_ui_thread  # type: ignore
from jnius import autoclass  # type: ignore

# Classes Android
PythonActivity = autoclass('org.kivy.android.PythonActivity')
WebView = autoclass('android.webkit.WebView')
WebViewClient = autoclass('android.webkit.WebViewClient')
WebChromeClient = autoclass('android.webkit.WebChromeClient')
WebSettings = autoclass('android.webkit.WebSettings')
View = autoclass('android.view.View')
LayoutParams = autoclass('android.view.ViewGroup$LayoutParams')
Color = autoclass('android.graphics.Color')
Build = autoclass('android.os.Build')

PORT = 8765
WWW_DIR = os.path.join(os.path.dirname(__file__), 'assets', 'www')


class SilentHandler(http.server.SimpleHTTPRequestHandler):
    """Servidor HTTP silencioso servindo assets locais."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WWW_DIR, **kwargs)

    def log_message(self, *args):
        pass  # Suprime logs

    def end_headers(self):
        # Headers necessários para ES modules e Service Worker
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'public, max-age=86400')
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        super().end_headers()


def start_server():
    server = http.server.HTTPServer(('127.0.0.1', PORT), SilentHandler)
    server.serve_forever()


class WebViewWidget(Widget):
    pass


class GlicoseAIApp(App):
    webview = None

    def build(self):
        # Inicia servidor HTTP em thread daemon
        t = threading.Thread(target=start_server, daemon=True)
        t.start()
        # Aguarda servidor subir antes de criar WebView
        Clock.schedule_once(self._create_webview, 0.5)
        return WebViewWidget()

    @run_on_ui_thread
    def _create_webview(self, dt):
        activity = PythonActivity.mActivity
        wv = WebView(activity)

        # Configurações do WebView
        settings = wv.getSettings()
        settings.setJavaScriptEnabled(True)
        settings.setDomStorageEnabled(True)
        settings.setDatabaseEnabled(True)
        settings.setAllowFileAccess(True)
        settings.setAllowContentAccess(True)
        settings.setAllowFileAccessFromFileURLs(True)
        settings.setAllowUniversalAccessFromFileURLs(True)
        settings.setCacheMode(WebSettings.LOAD_DEFAULT)
        settings.setMixedContentMode(0)  # MIXED_CONTENT_ALWAYS_ALLOW
        settings.setMediaPlaybackRequiresUserGesture(False)
        settings.setLoadWithOverviewMode(True)
        settings.setUseWideViewPort(True)
        settings.setBuiltInZoomControls(False)
        settings.setDisplayZoomControls(False)

        # API 21+ configurações adicionais
        if Build.VERSION.SDK_INT >= 21:
            settings.setMixedContentMode(0)

        # WebViewClient: intercepta navegação interna
        wv.setWebViewClient(WebViewClient())
        wv.setWebChromeClient(WebChromeClient())
        wv.setBackgroundColor(Color.parseColor('#0f172a'))

        # Fullscreen
        wv.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )

        # Adiciona WebView como view principal da Activity
        layout_params = LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT
        )
        activity.addContentView(wv, layout_params)

        self.webview = wv
        wv.loadUrl(f'http://127.0.0.1:{PORT}/index.html')

    def on_back_pressed(self):
        """Navega para trás no histórico do WebView."""
        if self.webview and self.webview.canGoBack():
            self.webview.goBack()
        else:
            self.stop()


if __name__ == '__main__':
    GlicoseAIApp().run()
