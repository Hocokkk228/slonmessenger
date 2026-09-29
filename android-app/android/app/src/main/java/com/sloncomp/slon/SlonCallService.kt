package com.sloncomp.slon

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

/**
 * Идущий звонок SLON: служба переднего плана (микрофон, камера). Пока она работает, Android не выгружает
 * приложение и не глушит микрофон — звонок не рвётся, когда SLON свёрнут или экран погашен.
 * В шторке — «Звонок с …» с таймером и кнопкой «Завершить». Сам звонок (WebRTC) идёт в веб-части.
 */
class SlonCallService : Service() {
    companion object {
        const val CH = "slon_call_ongoing"
        const val ID = 7320
        const val A_HANGUP = "slon.call.hangup"
        @Volatile var title = "Звонок"
        @Volatile var video = false
        @Volatile var since = 0L
        @Volatile var running = false

        fun start(c: Context, t: String, v: Boolean) {
            title = t; video = v
            if (!running) since = System.currentTimeMillis()
            ContextCompat.startForegroundService(c, Intent(c, SlonCallService::class.java))
        }
        fun stop(c: Context) { if (running) c.stopService(Intent(c, SlonCallService::class.java)) }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        running = true
        if (Build.VERSION.SDK_INT >= 26) {
            val ch = NotificationChannel(CH, "Идущий звонок", NotificationManager.IMPORTANCE_LOW)
            ch.setShowBadge(false)
            getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == A_HANGUP) { SlonCallPlugin.emit("hangup"); return START_NOT_STICKY }
        val open = packageManager.getLaunchIntentForPackage(packageName)?.let {
            PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        }
        val hang = PendingIntent.getService(this, 1, Intent(this, SlonCallService::class.java).setAction(A_HANGUP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val n = NotificationCompat.Builder(this, CH)
            .setSmallIcon(R.drawable.ic_stat_slon).setColor(0xFF3390EC.toInt())
            .setContentTitle(title)
            .setContentText(if (video) "Видеозвонок" else "Звонок")
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setOngoing(true).setOnlyAlertOnce(true).setSilent(true)
            .setUsesChronometer(true).setWhen(since).setShowWhen(true)
            .setContentIntent(open)
            .addAction(0, "Завершить", hang)
            .build()
        var type = 0
        if (Build.VERSION.SDK_INT >= 30) {
            type = ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            if (video) type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
        }
        try {
            ServiceCompat.startForeground(this, ID, n, type)
        } catch (e: Exception) {
            // нет разрешения на камеру/микрофон для службы — хотя бы без типа, чтобы не падать
            try { ServiceCompat.startForeground(this, ID, n, 0) } catch (_: Exception) { stopSelf() }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        running = false
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }
}
