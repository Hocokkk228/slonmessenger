package com.sloncomp.slon;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    // отступы системных панелей в CSS-пикселях (статус-бар, навигация, вырез камеры)
    private int insT, insB, insL, insR;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Свой плагин: работа в фоне, фоновая связь с сервером, автозапуск
        registerPlugin(SlonSystemPlugin.class);
        registerPlugin(SlonMediaPlugin.class);    // музыка в шторке / на экране блокировки
        registerPlugin(SlonCallPlugin.class);     // звонки: служба, звук (ухо/динамик/Bluetooth), датчик приближения
        registerPlugin(SlonPlayerPlugin.class);   // музыка: нативный плеер Media3
        super.onCreate(savedInstanceState);
        setupInsets();
        SlonSystemPlugin.onLaunchIntent(getIntent());
        if (!getSharedPreferences(SlonBgService.PREFS, MODE_PRIVATE).getString("token", "").isEmpty())
        { SlonBgService.start(this); SlonFcmService.register(this); }
    }

    /**
     * Android 15+ рисует приложение «от края до края»: под статус-баром и панелью навигации.
     * env(safe-area-inset-*) в WebView на части прошивок нулевой — шапка и док уезжали под системные
     * панели (RuStore: «ошибки в вёрстке», Samsung A15). Поэтому реальные отступы берём у Android
     * и кладём в CSS-переменные --sat/--sab/--sal/--sar (на них построена вся вёрстка сайта).
     * Плюс: системный «крупный шрифт» больше +15% ломал вёрстку — ограничиваем.
     */
    private void setupInsets() {
        WebView wv = getBridge().getWebView();
        float fs = getResources().getConfiguration().fontScale;
        wv.getSettings().setTextZoom(Math.round(Math.max(0.85f, Math.min(fs, 1.15f)) * 100));
        ViewCompat.setOnApplyWindowInsetsListener(wv, (v, ins) -> {
            Insets s = ins.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            float d = getResources().getDisplayMetrics().density;
            insT = Math.round(s.top / d); insB = Math.round(s.bottom / d);
            insL = Math.round(s.left / d); insR = Math.round(s.right / d);
            pushInsets();
            return ins;
        });
        // загрузчик переписывает страницу (document.write) — после каждой загрузки отдаём заново
        getBridge().addWebViewListener(new WebViewListener() {
            @Override public void onPageLoaded(WebView webView) { pushInsets(); }
        });
        ViewCompat.requestApplyInsets(wv);
    }

    private void pushInsets() {
        WebView wv = getBridge() != null ? getBridge().getWebView() : null;
        if (wv == null) return;
        String js = "(function(){var i={t:" + insT + ",b:" + insB + ",l:" + insL + ",r:" + insR + "};window.__slonInsets=i;"
            + "var d=document.documentElement;if(d){d.style.setProperty('--sat',i.t+'px');d.style.setProperty('--sab',i.b+'px');"
            + "d.style.setProperty('--sal',i.l+'px');d.style.setProperty('--sar',i.r+'px');}"
            + "try{dispatchEvent(new Event('slon-insets'));}catch(e){}})()";
        wv.post(() -> wv.evaluateJavascript(js, null));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        SlonSystemPlugin.onLaunchIntent(intent);
    }
    // Пока приложение на экране, фоновая служба уведомления не показывает
    @Override public void onResume() { super.onResume(); SlonBgService.appVisible = true; pushInsets(); }
    @Override public void onPause() { super.onPause(); SlonBgService.appVisible = false; }
}
