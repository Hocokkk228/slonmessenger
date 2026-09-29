package com.sloncomp.slon

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import java.io.File

/**
 * Музыка SLON — настоящий системный плеер Android (Media3 / ExoPlayer + MediaSession).
 * Его видят шторка, экран блокировки, «острова» оболочек (ColorOS Fluid Cloud, HyperOS, OriginOS,
 * MagicOS, HarmonyOS), часы, машина, кнопки гарнитуры. Очередь плейлиста живёт здесь — следующий трек
 * включается сам даже при погашенном экране.
 * Всё, что проиграно или скачано заранее (SlonPlayer.cache), лежит в кеше на устройстве — играет без сети.
 */
@OptIn(UnstableApi::class)
class SlonPlayerService : MediaSessionService() {
    companion object {
        private var cacheInst: SimpleCache? = null
        @Synchronized fun cache(c: Context): SimpleCache {
            cacheInst?.let { return it }
            val s = SimpleCache(File(c.applicationContext.filesDir, "music"),
                LeastRecentlyUsedCacheEvictor(6L * 1024 * 1024 * 1024),    // до 6 ГБ музыки на устройстве
                StandaloneDatabaseProvider(c.applicationContext))
            cacheInst = s
            return s
        }
        fun dataSource(c: Context): CacheDataSource.Factory {
            val http = DefaultHttpDataSource.Factory().setUserAgent("SLON").setAllowCrossProtocolRedirects(true)
            return CacheDataSource.Factory().setCache(cache(c))
                .setUpstreamDataSourceFactory(DefaultDataSource.Factory(c, http))
                .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
        }
    }

    private var session: MediaSession? = null

    override fun onCreate() {
        super.onCreate()
        val player = ExoPlayer.Builder(this)
            .setMediaSourceFactory(DefaultMediaSourceFactory(dataSource(this)))
            .setAudioAttributes(AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MUSIC).build(), true)
            .setHandleAudioBecomingNoisy(true)          // выдернули наушники — пауза
            .setWakeMode(C.WAKE_MODE_NETWORK)
            .build()
        val open = packageManager.getLaunchIntentForPackage(packageName)?.let {
            PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        }
        val b = MediaSession.Builder(this, player)
        if (open != null) b.setSessionActivity(open)
        session = b.build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

    // приложение смахнули из недавних: если музыка не играет — служба тоже уходит
    override fun onTaskRemoved(rootIntent: Intent?) {
        val p = session?.player
        if (p == null || !p.playWhenReady || p.mediaItemCount == 0) stopSelf()
    }

    override fun onDestroy() {
        session?.run { player.release(); release() }
        session = null
        super.onDestroy()
    }
}
