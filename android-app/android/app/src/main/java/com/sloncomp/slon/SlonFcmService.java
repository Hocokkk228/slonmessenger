package com.sloncomp.slon;

import android.content.Context;

import androidx.annotation.NonNull;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONObject;

import java.util.Map;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;

/**
 * Пуши как в Telegram (там — GcmPushListenerService): Google Play Services будит
 * SLON, даже если приложение убито/смахнуто, и мы сразу показываем уведомление.
 * FCM только будит — сами сообщения по-прежнему идут с сервера SLON,
 * а текст зашифрованных чатов в пуш не кладётся.
 */
public class SlonFcmService extends FirebaseMessagingService {

    @Override public void onMessageReceived(@NonNull RemoteMessage rm) {
        Map<String, String> d = rm.getData();
        String type = d.get("type");
        if (type == null) return;
        Context c = getApplicationContext();
        switch (type) {
            case "msg":
                if (!SlonBgService.appVisible)
                    SlonNotify.message(c, str(d, "chat"), str(d, "title"), str(d, "body"));
                break;
            case "call":
                if (!SlonBgService.appVisible)
                    SlonNotify.call(c, str(d, "peer"), str(d, "title"), str(d, "callId"), "1".equals(d.get("video")));
                break;
            case "call_end":
                if (str(d, "peer").equals(SlonNotify.activeCallPeer)) SlonNotify.missed(c, str(d, "peer"), str(d, "title"));
                break;
        }
        // Проснулись — заодно поднимаем фоновую связь (как Telegram после пуша)
        String token = c.getSharedPreferences(SlonBgService.PREFS, MODE_PRIVATE).getString("token", "");
        if (!token.isEmpty() && !SlonBgService.running) SlonBgService.start(c);
    }

    @Override public void onNewToken(@NonNull String fcm) { register(getApplicationContext(), fcm); }

    private static String str(Map<String, String> d, String k) { String v = d.get(k); return v == null ? "" : v; }

    /** Отдать FCM-токен нашему серверу (если в приложении есть google-services.json) */
    public static void register(Context c) {
        try {
            if (FirebaseApp.getApps(c).isEmpty()) return;
            FirebaseMessaging.getInstance().getToken().addOnSuccessListener(t -> register(c, t));
        } catch (Exception ignored) { }
    }
    static void register(Context c, String fcm) {
        String token = c.getSharedPreferences(SlonBgService.PREFS, MODE_PRIVATE).getString("token", "");
        String api = c.getSharedPreferences(SlonBgService.PREFS, MODE_PRIVATE).getString("api", "");
        String dev = c.getSharedPreferences(SlonBgService.PREFS, MODE_PRIVATE).getString("dev", "");
        if (token.isEmpty() || api.isEmpty() || fcm == null) return;
        new Thread(() -> {
            try {
                JSONObject b = new JSONObject().put("token", fcm).put("dev", dev);
                Request r = new Request.Builder().url(api + "/push/fcm")
                        .header("Authorization", "Bearer " + token)
                        .post(RequestBody.create(b.toString(), MediaType.get("application/json"))).build();
                new OkHttpClient().newCall(r).execute().close();
            } catch (Exception ignored) { }
        }).start();
    }
}
