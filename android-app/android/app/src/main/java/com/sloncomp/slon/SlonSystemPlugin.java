package com.sloncomp.slon;

import android.annotation.SuppressLint;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Работа SLON в фоне: исключение из оптимизации батареи и настройки
 * автозапуска (ColorOS / MIUI / HyperOS прячут их в своих меню).
 * Из JS: Capacitor.Plugins.SlonSystem.*
 */
@CapacitorPlugin(name = "SlonSystem")
public class SlonSystemPlugin extends Plugin {
    static SlonSystemPlugin instance;
    /** Нажатие на уведомление, которое открыло/подняло приложение */
    static JSObject pendingLaunch;

    @Override public void load() { instance = this; }

    // ── Фоновая связь с сервером (уведомления при закрытом приложении) ──
    // ── «Проверка уведомлений»: что именно мешает уведомлениям ──
    @PluginMethod
    public void diag(PluginCall call) {
        Context c = getContext();
        JSObject r = new JSObject();
        r.put("notifEnabled", androidx.core.app.NotificationManagerCompat.from(c).areNotificationsEnabled());
        int msgImp = -1, callImp = -1;
        if (Build.VERSION.SDK_INT >= 26) {
            android.app.NotificationManager nm = (android.app.NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            android.app.NotificationChannel ch = nm.getNotificationChannel("slon_msgs");
            android.app.NotificationChannel cc = nm.getNotificationChannel("slon_calls");
            if (ch != null) msgImp = ch.getImportance();
            if (cc != null) callImp = cc.getImportance();
        }
        r.put("msgChannel", msgImp);
        r.put("callChannel", callImp);
        r.put("serviceRunning", SlonBgService.running);
        r.put("connected", SlonBgService.connected);
        r.put("connectedAt", SlonBgService.connectedAt);
        r.put("tokenSaved", !c.getSharedPreferences(SlonBgService.PREFS, Context.MODE_PRIVATE).getString("token", "").isEmpty());
        r.put("unrestricted", isIgnoringBatteryOptimizations());
        r.put("manufacturer", Build.MANUFACTURER);
        r.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(r);
    }
    @PluginMethod
    public void requestNotifPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getActivity() != null &&
                androidx.core.content.ContextCompat.checkSelfPermission(getContext(), "android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            androidx.core.app.ActivityCompat.requestPermissions(getActivity(), new String[]{"android.permission.POST_NOTIFICATIONS"}, 7701);
        } else openNotifSettingsInternal();
        call.resolve();
    }
    @PluginMethod
    public void openNotifSettings(PluginCall call) { openNotifSettingsInternal(); call.resolve(); }
    private void openNotifSettingsInternal() {
        try {
            Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName())
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) { openAppDetails(); }
    }

    @PluginMethod
    public void startBackground(PluginCall call) {
        String token = call.getString("token", ""), api = call.getString("api", ""), dev = call.getString("dev", "");
        if (token.isEmpty() || api.isEmpty()) { call.reject("no token"); return; }
        getContext().getSharedPreferences(SlonBgService.PREFS, Context.MODE_PRIVATE).edit()
                .putString("token", token).putString("api", api).putString("dev", dev).apply();
        SlonBgService.start(getContext());
        SlonFcmService.register(getContext());      // FCM-токен — на наш сервер
        call.resolve();
    }
    // Ключ уведомлений этого устройства (приватный X25519) — чтобы показывать текст зашифрованных сообщений
    @PluginMethod
    public void setNotifKey(PluginCall call) {
        String addr = call.getString("addr", ""), priv = call.getString("priv", "");
        if (addr.isEmpty() || priv.isEmpty()) { call.reject("no key"); return; }
        getContext().getSharedPreferences(SlonBgService.PREFS, Context.MODE_PRIVATE).edit()
                .putString("nk_addr", addr).putString("nk_priv", priv).apply();
        call.resolve();
    }
    @PluginMethod
    public void stopBackground(PluginCall call) {
        getContext().getSharedPreferences(SlonBgService.PREFS, Context.MODE_PRIVATE).edit().clear().apply();
        SlonKeepAliveWorker.cancel(getContext());
        getContext().stopService(new Intent(getContext(), SlonBgService.class));
        call.resolve();
    }
    // Что открыло приложение (нажатие «Ответить» / уведомление о сообщении)
    @PluginMethod
    public void getLaunch(PluginCall call) {
        JSObject r = pendingLaunch != null ? pendingLaunch : new JSObject();
        pendingLaunch = null;
        call.resolve(r);
    }
    static void onLaunchIntent(Intent i) {
        if (i == null || i.getStringExtra("slon_action") == null) return;
        JSObject o = new JSObject();
        o.put("action", i.getStringExtra("slon_action"));
        o.put("chat", i.getStringExtra("slon_chat"));
        o.put("callId", i.getStringExtra("slon_call"));
        i.removeExtra("slon_action");
        pendingLaunch = o;
        if (instance != null) instance.notifyListeners("launch", o, true);
    }

    @PluginMethod
    public void backgroundStatus(PluginCall call) {
        JSObject r = new JSObject();
        r.put("unrestricted", isIgnoringBatteryOptimizations());
        r.put("manufacturer", Build.MANUFACTURER);
        call.resolve(r);
    }

    // Системный диалог «Разрешить приложению работать в фоне?»
    @SuppressLint("BatteryLife")
    @PluginMethod
    public void requestUnrestricted(PluginCall call) {
        Context ctx = getContext();
        try {
            if (!isIgnoringBatteryOptimizations()) {
                Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                i.setData(Uri.parse("package:" + ctx.getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(i);
            }
            call.resolve();
        } catch (Exception e) {
            openAppDetails();
            call.resolve();
        }
    }

    // Автозапуск: у OPPO/realme/OnePlus и Xiaomi/Redmi/POCO — свои экраны
    @PluginMethod
    public void openAutostart(PluginCall call) {
        String m = Build.MANUFACTURER.toLowerCase();
        ComponentName[] candidates;
        if (m.contains("xiaomi") || m.contains("redmi") || m.contains("poco")) {
            candidates = new ComponentName[]{
                new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"),
            };
        } else if (m.contains("oppo") || m.contains("realme") || m.contains("oneplus")) {
            candidates = new ComponentName[]{
                new ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"),
                new ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"),
                new ComponentName("com.oplus.safecenter", "com.oplus.safecenter.permission.startup.StartupAppListActivity"),
            };
        } else if (m.contains("huawei") || m.contains("honor")) {
            candidates = new ComponentName[]{
                new ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"),
            };
        } else if (m.contains("vivo")) {
            candidates = new ComponentName[]{
                new ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"),
            };
        } else {
            candidates = new ComponentName[0];
        }
        for (ComponentName c : candidates) {
            try {
                Intent i = new Intent();
                i.setComponent(c);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                call.resolve();
                return;
            } catch (Exception ignored) { }
        }
        // Нет отдельного экрана — открываем карточку приложения (там «Батарея»)
        openAppDetails();
        call.resolve();
    }

    private boolean isIgnoringBatteryOptimizations() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
    }

    private void openAppDetails() {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            i.setData(Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception ignored) { }
    }
}
