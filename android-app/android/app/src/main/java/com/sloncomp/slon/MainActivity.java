package com.sloncomp.slon;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Свой плагин: работа в фоне без ограничений, автозапуск
        registerPlugin(SlonSystemPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
