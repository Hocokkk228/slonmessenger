package com.sloncomp.slon;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

/**
 * Музыка SLON в системе: плеер в шторке и на экране блокировки (обложка, название, назад / пауза / вперёд,
 * перемотка). Пока трек играет, служба работает на переднем плане — Android не выгружает приложение
 * и музыка не обрывается, когда SLON свёрнут или экран погашен.
 * Сам звук играет веб-часть (тег audio); сюда приходит только состояние, а нажатия уходят обратно в JS.
 */
public class SlonMediaService extends Service {
    static final String CH = "slon_music";
    static final int ID = 7310;
    static final String A_PREV = "slon.media.prev", A_TOGGLE = "slon.media.toggle", A_NEXT = "slon.media.next", A_STOP = "slon.media.stop";

    // состояние — его выставляет плагин
    static String title = "", artist = "";
    static boolean playing = false;
    static long posMs = 0, durMs = 0;
    static Bitmap cover = null;
    static boolean running = false;

    private MediaSessionCompat session;

    static void update(Context c) {
        Intent i = new Intent(c, SlonMediaService.class);
        if (playing) ContextCompat.startForegroundService(c, i);
        else if (running) c.startService(i);
    }
    static void stop(Context c) {
        if (running) c.stopService(new Intent(c, SlonMediaService.class));
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override public void onCreate() {
        super.onCreate();
        running = true;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CH, "Музыка", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
        session = new MediaSessionCompat(this, "SLON");
        session.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { SlonMediaPlugin.emit("play", 0); }
            @Override public void onPause() { SlonMediaPlugin.emit("pause", 0); }
            @Override public void onSkipToNext() { SlonMediaPlugin.emit("next", 0); }
            @Override public void onSkipToPrevious() { SlonMediaPlugin.emit("prev", 0); }
            @Override public void onSeekTo(long pos) { posMs = pos; SlonMediaPlugin.emit("seek", pos); }
            @Override public void onStop() { SlonMediaPlugin.emit("stop", 0); }
        });
        session.setActive(true);
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String a = intent != null ? intent.getAction() : null;
        if (A_PREV.equals(a)) SlonMediaPlugin.emit("prev", 0);
        else if (A_NEXT.equals(a)) SlonMediaPlugin.emit("next", 0);
        else if (A_TOGGLE.equals(a)) SlonMediaPlugin.emit(playing ? "pause" : "play", 0);
        else if (A_STOP.equals(a)) { SlonMediaPlugin.emit("stop", 0); stopSelf(); return START_NOT_STICKY; }
        refresh();
        return START_NOT_STICKY;
    }

    private PendingIntent act(String a, int code) {
        Intent i = new Intent(this, SlonMediaService.class).setAction(a);
        return PendingIntent.getService(this, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private void refresh() {
        MediaMetadataCompat.Builder md = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, durMs > 0 ? durMs : -1);
        if (cover != null) md.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, cover);
        session.setMetadata(md.build());
        session.setPlaybackState(new PlaybackStateCompat.Builder()
            .setActions(PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE | PlaybackStateCompat.ACTION_PLAY_PAUSE
                | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                | PlaybackStateCompat.ACTION_SEEK_TO | PlaybackStateCompat.ACTION_STOP)
            .setState(playing ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED, posMs, playing ? 1f : 0f)
            .build());

        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent openPi = open == null ? null : PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CH)
            .setSmallIcon(R.drawable.ic_stat_slon)
            .setContentTitle(title)
            .setContentText(artist)
            .setLargeIcon(cover)
            .setContentIntent(openPi)
            .setDeleteIntent(act(A_STOP, 4))
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(playing)
            .addAction(android.R.drawable.ic_media_previous, "Назад", act(A_PREV, 1))
            .addAction(playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, playing ? "Пауза" : "Играть", act(A_TOGGLE, 2))
            .addAction(android.R.drawable.ic_media_next, "Дальше", act(A_NEXT, 3))
            .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(session.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2));
        Notification n = b.build();
        if (playing) {
            if (Build.VERSION.SDK_INT >= 29) startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            else startForeground(ID, n);
        } else {
            // на паузе уведомление остаётся, но его можно смахнуть, и Android может выгрузить службу
            ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_DETACH);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(ID, n);
        }
    }

    @Override public void onDestroy() {
        running = false;
        try { session.setActive(false); session.release(); } catch (Exception ignored) {}
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).cancel(ID);
        super.onDestroy();
    }
}
