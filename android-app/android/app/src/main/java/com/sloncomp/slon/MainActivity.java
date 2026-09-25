package com.sloncomp.slon;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Свой плагин: работа в фоне, фоновая связь с сервером, автозапуск
        registerPlugin(SlonSystemPlugin.class);
        super.onCreate(savedInstanceState);
        SlonSystemPlugin.onLaunchIntent(getIntent());
        if (!getSharedPreferences(SlonBgService.PREFS, MODE_PRIVATE).getString("token", "").isEmpty())
        { SlonBgService.start(this); SlonFcmService.register(this); }
    }
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        SlonSystemPlugin.onLaunchIntent(intent);
    }
    // Пока приложение на экране, фоновая служба уведомления не показывает
    @Override public void onResume() { super.onResume(); SlonBgService.appVisible = true; }
    @Override public void onPause() { super.onPause(); SlonBgService.appVisible = false; }
}
