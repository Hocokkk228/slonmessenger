package com.sloncomp.slon;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

/**
 * Уведомления SLON (сообщения и звонки) — общие для фоновой службы и FCM.
 * Одинаковые теги у обоих каналов: пришло двумя путями — показывается один раз.
 */
public final class SlonNotify {
    static final String CH_BG = "slon_bg", CH_MSG = "slon_msgs", CH_CALL = "slon_calls";
    static final int NID_CALL = 2;
    static volatile String activeCallPeer = null;

    private SlonNotify() { }

    static NotificationManager nm(Context c) { return (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE); }

    static void channels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager m = nm(c);
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

    static PendingIntent openApp(Context c, String action, String chat, String callId, int req) {
        Intent i = new Intent(c, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (action != null) i.putExtra("slon_action", action);
        if (chat != null) i.putExtra("slon_chat", chat);
        if (callId != null) i.putExtra("slon_call", callId);
        return PendingIntent.getActivity(c, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void message(Context c, String chat, String title, String body) {
        channels(c);
        Notification n = new NotificationCompat.Builder(c, CH_MSG)
                .setSmallIcon(R.drawable.ic_stat_slon).setColor(0xFF3390EC)
                .setContentTitle(title).setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(openApp(c, "open", chat, null, chat.hashCode()))
                .build();
        nm(c).notify("chat:" + chat, 10, n);
    }

    static void call(Context c, String peer, String title, String callId, boolean video) {
        channels(c);
        activeCallPeer = peer;
        PendingIntent answer = openApp(c, "answer", peer, callId, 200);
        Intent di = new Intent(c, SlonCallActionReceiver.class).setAction("decline")
                .putExtra("peer", peer).putExtra("callId", callId);
        PendingIntent decline = PendingIntent.getBroadcast(c, 201, di, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification n = new NotificationCompat.Builder(c, CH_CALL)
                .setSmallIcon(R.drawable.ic_stat_slon).setColor(0xFF3390EC)
                .setContentTitle(title)
                .setContentText(video ? "Входящий видеозвонок" : "Входящий звонок")
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setOngoing(true).setAutoCancel(false)
                .setTimeoutAfter(45000)
                .setFullScreenIntent(answer, true)
                .setContentIntent(answer)
                .addAction(0, "Отклонить", decline)
                .addAction(0, "Ответить", answer)
                .build();
        n.flags |= Notification.FLAG_INSISTENT;
        nm(c).notify(NID_CALL, n);
    }

    static void missed(Context c, String peer, String title) {
        cancelCall(c);
        channels(c);
        Notification n = new NotificationCompat.Builder(c, CH_MSG)
                .setSmallIcon(R.drawable.ic_stat_slon).setColor(0xFF3390EC)
                .setContentTitle("Пропущенный звонок").setContentText(title)
                .setAutoCancel(true)
                .setContentIntent(openApp(c, "open", peer, null, peer.hashCode() + 7))
                .build();
        nm(c).notify("missed:" + peer, 11, n);
    }

    static void cancelCall(Context c) { nm(c).cancel(NID_CALL); activeCallPeer = null; }
}
