package com.sloncomp.slon

import android.content.ComponentName
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Base64
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.cache.CacheWriter
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.common.util.concurrent.MoreExecutors
import java.util.concurrent.Executors

/**
 * Пульт нативного плеера для JS (Capacitor.Plugins.SlonPlayer):
 *  setQueue({items:[{id,url,title,artist,cover}], index, pos, play, shuffle, repeat}) · play · pause · seek({pos}) ·
 *  next · prev · jump({index}) · setShuffle({on}) · setRepeat({mode:'off'|'one'|'all'}) · stop · state ·
 *  cache({urls}) — скачать заранее для игры без сети · cached({urls}) — какие уже на устройстве.
 * События: «state» {playing, pos, dur, index, id, ended}, «error» {id, message}, «cached» {url, ok}.
 */
@OptIn(UnstableApi::class)
@CapacitorPlugin(name = "SlonPlayer")
class SlonPlayerPlugin : Plugin() {
    private val main = Handler(Looper.getMainLooper())
    private var ctl: MediaController? = null
    private val waiting = mutableListOf<(MediaController) -> Unit>()
    private var connecting = false
    private val io = Executors.newSingleThreadExecutor()
    private val tick = object : Runnable {
        override fun run() { emitState(); if (ctl?.isPlaying == true) main.postDelayed(this, 1000) }
    }

    private fun withCtl(f: (MediaController) -> Unit) {
        main.post {
            ctl?.let { f(it); return@post }
            waiting += f
            if (connecting) return@post
            connecting = true
            val token = SessionToken(context, ComponentName(context, SlonPlayerService::class.java))
            val fut = MediaController.Builder(context, token).buildAsync()
            fut.addListener({
                connecting = false
                try {
                    val c = fut.get(); ctl = c
                    c.addListener(object : Player.Listener {
                        override fun onEvents(player: Player, events: Player.Events) {
                            emitState()
                            if (player.isPlaying) { main.removeCallbacks(tick); main.postDelayed(tick, 1000) }
                        }
                        override fun onPlayerError(error: PlaybackException) {
                            val o = JSObject(); o.put("id", c.currentMediaItem?.mediaId ?: ""); o.put("message", error.errorCodeName)
                            notifyListeners("error", o, true)
                        }
                    })
                    val q = waiting.toList(); waiting.clear(); q.forEach { it(c) }
                } catch (e: Exception) { waiting.clear() }
            }, MoreExecutors.directExecutor())
        }
    }

    private fun stateOf(c: MediaController): JSObject {
        val o = JSObject()
        o.put("playing", c.isPlaying)
        o.put("want", c.playWhenReady)
        o.put("pos", c.currentPosition)
        o.put("dur", if (c.duration > 0) c.duration else 0)
        o.put("index", c.currentMediaItemIndex)
        o.put("id", c.currentMediaItem?.mediaId ?: "")
        o.put("ended", c.playbackState == Player.STATE_ENDED)
        o.put("buffering", c.playbackState == Player.STATE_BUFFERING)
        o.put("shuffle", c.shuffleModeEnabled)
        return o
    }
    private fun emitState() { ctl?.let { notifyListeners("state", stateOf(it), true) } }

    private fun itemOf(o: JSObject): MediaItem {
        val md = MediaMetadata.Builder().setTitle(o.getString("title") ?: "").setArtist(o.getString("artist") ?: "")
        val cv = o.getString("cover") ?: ""
        if (cv.startsWith("data:")) {
            try { md.setArtworkData(Base64.decode(cv.substring(cv.indexOf(',') + 1), Base64.DEFAULT), MediaMetadata.PICTURE_TYPE_FRONT_COVER) } catch (_: Exception) {}
        } else if (cv.startsWith("http")) md.setArtworkUri(Uri.parse(cv))
        return MediaItem.Builder().setMediaId(o.getString("id") ?: "").setUri(o.getString("url") ?: "")
            .setMediaMetadata(md.build()).build()
    }

    @PluginMethod
    fun setQueue(call: PluginCall) {
        val arr = call.getArray("items") ?: JSArray()
        val items = (0 until arr.length()).map { itemOf(JSObject.fromJSONObject(arr.getJSONObject(it))) }
        val index = call.getInt("index", 0) ?: 0
        val pos = (call.getDouble("pos", 0.0) ?: 0.0).toLong()
        val play = call.getBoolean("play", true) ?: true
        val shuffle = call.getBoolean("shuffle", false) ?: false
        val repeat = call.getString("repeat", "off") ?: "off"
        withCtl { c ->
            c.setMediaItems(items, index.coerceIn(0, maxOf(0, items.size - 1)), pos)
            c.shuffleModeEnabled = shuffle
            c.repeatMode = repeatOf(repeat)
            c.prepare()
            if (play) c.play()
            call.resolve(stateOf(c))
        }
    }
    @PluginMethod fun play(call: PluginCall) = withCtl { it.play(); call.resolve() }
    @PluginMethod fun pause(call: PluginCall) = withCtl { it.pause(); call.resolve() }
    @PluginMethod fun seek(call: PluginCall) { val p = (call.getDouble("pos", 0.0) ?: 0.0).toLong(); withCtl { it.seekTo(p); call.resolve() } }
    @PluginMethod fun next(call: PluginCall) = withCtl { it.seekToNextMediaItem(); call.resolve() }
    @PluginMethod fun prev(call: PluginCall) = withCtl { it.seekToPrevious(); call.resolve() }
    @PluginMethod fun jump(call: PluginCall) { val i = call.getInt("index", 0) ?: 0; withCtl { it.seekTo(i, 0); it.play(); call.resolve() } }
    @PluginMethod fun setShuffle(call: PluginCall) { val on = call.getBoolean("on", false) ?: false; withCtl { it.shuffleModeEnabled = on; call.resolve() } }
    @PluginMethod fun setRepeat(call: PluginCall) { val m = call.getString("mode", "off") ?: "off"; withCtl { it.repeatMode = repeatOf(m); call.resolve() } }
    @PluginMethod fun stop(call: PluginCall) = withCtl { it.stop(); it.clearMediaItems(); call.resolve() }
    @PluginMethod fun state(call: PluginCall) = withCtl { call.resolve(stateOf(it)) }

    private fun repeatOf(m: String) = when (m) { "one" -> Player.REPEAT_MODE_ONE; "all" -> Player.REPEAT_MODE_ALL; else -> Player.REPEAT_MODE_OFF }

    // ── без сети: скачать треки в кеш плеера заранее ──
    @PluginMethod
    fun cache(call: PluginCall) {
        val arr = call.getArray("urls") ?: JSArray()
        val urls = (0 until arr.length()).map { arr.getString(it) }
        call.resolve()
        io.execute {
            val ds = SlonPlayerService.dataSource(context).createDataSource()
            for (u in urls) {
                var ok = false
                try {
                    if (isCached(u)) ok = true
                    else { CacheWriter(ds, DataSpec(Uri.parse(u)), null, null).cache(); ok = true }
                } catch (_: Exception) {}
                val o = JSObject(); o.put("url", u); o.put("ok", ok)
                notifyListeners("cached", o, true)
            }
        }
    }
    @PluginMethod
    fun cached(call: PluginCall) {
        val arr = call.getArray("urls") ?: JSArray()
        io.execute {
            val out = JSArray()
            for (i in 0 until arr.length()) { val u = arr.getString(i); if (isCached(u)) out.put(u) }
            val o = JSObject(); o.put("urls", out); call.resolve(o)
        }
    }
    private fun isCached(u: String): Boolean {
        val c = SlonPlayerService.cache(context)
        val meta = c.getContentMetadata(u)
        val len = androidx.media3.datasource.cache.ContentMetadata.getContentLength(meta)
        return len > 0 && c.isCached(u, 0, len)
    }

    override fun handleOnDestroy() { main.removeCallbacks(tick); ctl?.release(); ctl = null; super.handleOnDestroy() }
}
