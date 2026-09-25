package com.sloncomp.slon;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.net.ConnectivityManager;
import android.net.Network;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import org.json.JSONObject;

import java.net.URLEncoder;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

/**
 * Фоновая служба SLON: держит своё соединение с нашим сервером (хаб аккаунта)
 * и показывает уведомления о сообщениях и звонках, даже когда приложение
 * полностью закрыто. Без Firebase/Google — напрямую с сервером SLON.
 * Сервер знает, что это фоновое соединение (bg=1): «в сети» из-за него не горит.
 */
public class SlonBgService extends Service {
    public static final String PREFS = "slon_bg";
    static final String CH_BG = "slon_bg", CH_MSG = "slon_msgs", CH_CALL = "slon_calls";
    static final int NID_BG = 1, NID_CALL = 2;
    /** Приложение на экране — оно само всё показывает, служба молчит */
    public static volatile boolean appVisible = false;
    /** Служба сейчас жива (для страховочного перезапуска) */
    public static volatile boolean running = false;
    /** Для экрана «Проверка уведомлений» */
    public static volatile boolean connected = false;
    public static volatile long lastEventAt = 0, connectedAt = 0;

    private OkHttpClient http;
    private WebSocket ws;
    private final Handler h = new Handler(Looper.getMainLooper());
    private int retry = 0;
    private boolean stopped = false;
    private String activeCallId = null, activeCallPeer = null;
    private ConnectivityManager.NetworkCallback netCb;

    public static void start(Context c) {
        Intent i = new Intent(c, SlonBgService.class);
        try {
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i); else c.startService(i);
        } catch (Exception ignored) { }
    }

    @Override public IBinder onBind(Intent i) { return null; }

    @Override public void onCreate() {
        super.onCreate();
        running = true;
        SlonKeepAliveWorker.schedule(this);
        channels();
        Notification n = new NotificationCompat.Builder(this, CH_BG)
                .setSmallIcon(R.drawable.ic_stat_slon)
                .setContentTitle("SLON на связи")
                .setContentText("Сообщения и звонки придут, даже если приложение закрыто")
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setOngoing(true).setShowWhen(false)
                .setContentIntent(openApp(null, null, null, 100))
                .build();
        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_REMOTE_MESSAGING : 0;
        try { ServiceCompat.startForeground(this, NID_BG, n, type); } catch (Exception e) { stopSelf(); return; }
        http = new OkHttpClient.Builder().pingInterval(30, TimeUnit.SECONDS).retryOnConnectionFailure(true).build();
        // сеть появилась — сразу переподключаемся
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
            netCb = new ConnectivityManager.NetworkCallback() {
                @Override public void onAvailable(Network network) { h.post(() -> { retry = 0; if (ws == null) connect(); }); }
            };
            cm.registerDefaultNetworkCallback(netCb);
        } catch (Exception ignored) { }
        connect();
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "decline".equals(intent.getAction())) declineCall(intent);
        else if (ws == null) connect();
        return START_STICKY;
    }

    // Смахнули из недавних — многие прошивки при этом убивают и службу: просим поднять её снова
    @Override public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        if (!prefs().getString("token", "").isEmpty()) SlonKeepAliveWorker.kick(this);
    }

    @Override public void onDestroy() {
        running = false;
        if (!prefs().getString("token", "").isEmpty()) SlonKeepAliveWorker.kick(this);   // убили — поднимемся
        stopped = true;
        h.removeCallbacksAndMessages(null);
        try { if (ws != null) ws.close(1000, "stop"); } catch (Exception ignored) { }
        try { ((ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE)).unregisterNetworkCallback(netCb); } catch (Exception ignored) { }
        super.onDestroy();
    }

    private SharedPreferences prefs() { return getSharedPreferences(PREFS, MODE_PRIVATE); }

    private void connect() {
        if (stopped) return;
        String token = prefs().getString("token", ""), api = prefs().getString("api", "");
        if (token.isEmpty() || api.isEmpty()) { stopSelf(); return; }
        try {
            String url = api.replaceFirst("^http", "ws") + "/ws?bg=1&token=" + URLEncoder.encode(token, "UTF-8")
                    + "&dev=" + URLEncoder.encode("bg-" + prefs().getString("dev", ""), "UTF-8");
            ws = http.newWebSocket(new Request.Builder().url(url).build(), new WebSocketListener() {
                @Override public void onOpen(WebSocket s, Response r) { retry = 0; connected = true; connectedAt = System.currentTimeMillis(); schedulePing(); }
                @Override public void onMessage(WebSocket s, String text) { lastEventAt = System.currentTimeMillis(); h.post(() -> handle(text)); }
                @Override public void onClosed(WebSocket s, int code, String reason) { h.post(() -> reconnect(s, code)); }
                @Override public void onFailure(WebSocket s, Throwable t, Response r) {
                    int code = r != null ? r.code() : 0;
                    h.post(() -> reconnect(s, code));
                }
            });
        } catch (Exception e) { reconnect(null, 0); }
    }

    private void reconnect(WebSocket s, int code) {
        if (s != null && s != ws) return;
        ws = null;
        connected = false;
        if (stopped) return;
        if (code == 401) {                                 // сессию отозвали — вышли из аккаунта
            prefs().edit().clear().apply();
            SlonKeepAliveWorker.cancel(this);
            stopSelf(); return;
        }
        long wait = Math.min(60000, 1000L << Math.min(retry++, 6));
        h.postDelayed(this::connect, wait);
    }

    private void schedulePing() {
        h.removeCallbacks(ping);
        h.postDelayed(ping, 25000);
    }
    private final Runnable ping = new Runnable() {
        @Override public void run() {
            if (ws != null) { ws.send("{\"t\":\"ping\"}"); h.postDelayed(this, 25000); }
        }
    };

    // ── Входящее с сервера ──
    private void handle(String text) {
        try {
            JSONObject m = new JSONObject(text);
            String t = m.optString("t");
            if ("ml".equals(t)) {
                if (m.optInt("chg", 0) == 1) return;
                JSONObject rec = m.optJSONObject("rec");
                if (rec == null || rec.optBoolean("out") || rec.optBoolean("del") || rec.optBoolean("gone")) return;
                String chat = rec.optString("chat");
                if (chat.isEmpty() || "saved".equals(chat)) return;
                String k = rec.optString("k", "text");
                String body;
                switch (k) {
                    case "photo": body = "📷 Фото"; break;
                    case "voice": body = "🎙️ Голосовое"; break;
                    case "slon": body = "🐘 Слонкружок"; break;
                    case "file": body = "📎 " + rec.optString("name", "Файл"); break;
                    case "e2e": body = "🔒 Новое сообщение"; break;   // содержимое зашифровано — сервер его не знает
                    default: body = rec.optString("text", "Новое сообщение");
                }
                String nick = rec.optString("nick", "");
                showMessage(chat, nick.isEmpty() ? "@" + chat : nick, body);
            } else if ("data".equals(t)) {
                JSONObject p = m.optJSONObject("payload");
                if (p == null) return;
                String type = p.optString("type"), from = m.optString("from");
                if ("bg_test".equals(type)) {
                    boolean was = appVisible; appVisible = false;
                    showMessage("__test", "SLON · проверка", "✅ Уведомления работают: сервер → фоновая служба → телефон");
                    appVisible = was;
                } else if ("call_incoming".equals(type)) {
                    String nick = p.optString("nick", "");
                    showCall(from, nick.isEmpty() ? "@" + from : nick, p.optString("callId"), p.optBoolean("isVideo"));
                } else if ("call_cancel".equals(type) || "call_end".equals(type) || "call_reject".equals(type)) {
                    if (activeCallPeer != null && activeCallPeer.equals(from)) missedCall(from);
                }
            } else if ("self".equals(t)) {
                JSONObject p = m.optJSONObject("payload");
                if (p != null && "call_sync".equals(p.optString("type"))) cancelCall();
            }
        } catch (Exception ignored) { }
    }

    private void showMessage(String chat, String title, String body) {
        if (appVisible) return;
        Notification n = new NotificationCompat.Builder(this, CH_MSG)
                .setSmallIcon(R.drawable.ic_stat_slon).setColor(0xFF3390EC)
                .setContentTitle(title).setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(openApp("open", chat, null, chat.hashCode()))
                .build();
        nm().notify("chat:" + chat, 10, n);
    }

    private void showCall(String peer, String title, String callId, boolean video) {
        if (appVisible) return;
        activeCallId = callId; activeCallPeer = peer;
        PendingIntent answer = openApp("answer", peer, callId, 200);
        Intent di = new Intent(this, SlonBgService.class).setAction("decline")
                .putExtra("peer", peer).putExtra("callId", callId);
        PendingIntent decline = PendingIntent.getService(this, 201, di, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification n = new NotificationCompat.Builder(this, CH_CALL)
                .setSmallIcon(R.drawable.ic_stat_slon).setColor(0xFF3390EC)
                .setContentTitle(title)
                .setContentText(video ? "📹 Входящий видеозвонок" : "📞 Входящий звонок")
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setOngoing(true).setAutoCancel(false)
                .setTimeoutAfter(45000)
                .setFullScreenIntent(answer, true)
                .setContentIntent(answer)
                .addAction(0, "❌ Отклонить", decline)
                .addAction(0, "📞 Ответить", answer)
                .build();
        n.flags |= Notification.FLAG_INSISTENT;   // звонит, пока не ответят/не отклонят
        nm().notify(NID_CALL, n);
    }

    private void missedCall(String peer) {
        cancelCall();
        if (appVisible) return;
        Notification n = new NotificationCompat.Builder(this, CH_MSG)
                .setSmallIcon(R.drawable.ic_stat_slon).setColor(0xFF3390EC)
                .setContentTitle("Пропущенный звонок").setContentText("@" + peer)
                .setAutoCancel(true)
                .setContentIntent(openApp("open", peer, null, peer.hashCode() + 7))
                .build();
        nm().notify("missed:" + peer, 11, n);
    }

    private void cancelCall() { nm().cancel(NID_CALL); activeCallId = null; activeCallPeer = null; }

    // «Отклонить» прямо из уведомления — без открытия приложения
    private void declineCall(Intent i) {
        String peer = i.getStringExtra("peer"), callId = i.getStringExtra("callId");
        cancelCall();
        if (ws == null || peer == null) return;
        try {
            JSONObject rej = new JSONObject().put("t", "send").put("to", peer)
                    .put("payload", new JSONObject().put("type", "call_reject").put("callId", callId));
            ws.send(rej.toString());
            JSONObject sync = new JSONObject().put("t", "self").put("payload", new JSONObject()
                    .put("type", "call_sync").put("key", callId == null ? "" : callId.replaceAll("[^A-Za-z0-9_-]", "_"))
                    .put("action", "rejected").put("peerId", peer).put("dev", "bg").put("ts", System.currentTimeMillis()));
            ws.send(sync.toString());
        } catch (Exception ignored) { }
    }

    private PendingIntent openApp(String action, String chat, String callId, int req) {
        Intent i = new Intent(this, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (action != null) i.putExtra("slon_action", action);
        if (chat != null) i.putExtra("slon_chat", chat);
        if (callId != null) i.putExtra("slon_call", callId);
        return PendingIntent.getActivity(this, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private NotificationManager nm() { return (NotificationManager) getSystemService(NOTIFICATION_SERVICE); }

    private void channels() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager m = nm();
        NotificationChannel bg = new NotificationChannel(CH_BG, "Работа в фоне", NotificationManager.IMPORTANCE_MIN);
        bg.setShowBadge(false);
        m.createNotificationChannel(bg);
        NotificationChannel msg = new NotificationChannel(CH_MSG, "Сообщения", NotificationManager.IMPORTANCE_HIGH);
        msg.enableVibration(true);
        m.createNotificationChannel(msg);
        NotificationChannel call = new NotificationChannel(CH_CALL, "Звонки", NotificationManager.IMPORTANCE_HIGH);
        call.enableVibration(true);
        call.setVibrationPattern(new long[]{0, 600, 400, 600, 400, 600});
        call.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        call.setSound(android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_RINGTONE),
                new android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        m.createNotificationChannel(call);
    }
}
