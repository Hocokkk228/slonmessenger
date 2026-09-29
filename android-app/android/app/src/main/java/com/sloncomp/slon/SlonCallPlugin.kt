package com.sloncomp.slon

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Звонки на Android нативно (сам WebRTC — в веб-части):
 *  • служба идущего звонка (SlonCallService) — звонок живёт в фоне и при погашенном экране;
 *  • аудиорежим связи + аудиофокус (музыка встаёт на паузу);
 *  • куда идёт звук: ухо / динамик / проводные наушники / Bluetooth — с переключением на лету;
 *  • датчик приближения: у уха экран гаснет (только аудиозвонок через ухо).
 * Из JS: Capacitor.Plugins.SlonCall.start / stop / routes / setRoute; события «call» (hangup) и «routes».
 */
@CapacitorPlugin(name = "SlonCall")
class SlonCallPlugin : Plugin() {
    companion object {
        @Volatile var instance: SlonCallPlugin? = null
        fun emit(action: String) {
            instance?.notifyListeners("call", JSObject().put("action", action), true)
        }
    }

    private val am by lazy { context.getSystemService(Context.AUDIO_SERVICE) as AudioManager }
    private var focus: AudioFocusRequest? = null
    private var prox: PowerManager.WakeLock? = null
    private var active = false
    private var video = false
    private var route = ""                      // выбранный пользователем маршрут («» — авто)

    private val devCb = object : AudioDeviceCallback() {
        override fun onAudioDevicesAdded(added: Array<out AudioDeviceInfo>?) { onDevicesChanged() }
        override fun onAudioDevicesRemoved(removed: Array<out AudioDeviceInfo>?) { onDevicesChanged() }
    }

    override fun load() { instance = this }

    @PluginMethod
    fun start(call: PluginCall) {
        video = call.getBoolean("video", false) == true
        val t = call.getString("title", "Звонок") ?: "Звонок"
        try { SlonCallService.start(context, t, video) } catch (_: Exception) {}
        if (!active) {
            active = true
            route = ""
            am.mode = AudioManager.MODE_IN_COMMUNICATION
            am.isMicrophoneMute = false
            requestFocus()
            am.registerAudioDeviceCallback(devCb, Handler(Looper.getMainLooper()))
            applyRoute(autoRoute())
        }
        call.resolve(state())
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        release()
        call.resolve()
    }

    @PluginMethod
    fun routes(call: PluginCall) { call.resolve(state()) }

    @PluginMethod
    fun setRoute(call: PluginCall) {
        val r = call.getString("route", "") ?: ""
        route = r
        applyRoute(if (r.isEmpty()) autoRoute() else r)
        call.resolve(state())
    }

    // ── маршруты звука ──
    private fun available(): List<String> {
        val out = mutableListOf<String>()
        val types = am.getDevices(AudioManager.GET_DEVICES_OUTPUTS).map { it.type }.toSet()
        if (AudioDeviceInfo.TYPE_BUILTIN_EARPIECE in types) out += "earpiece"
        out += "speaker"
        if (types.any { it == AudioDeviceInfo.TYPE_WIRED_HEADSET || it == AudioDeviceInfo.TYPE_WIRED_HEADPHONES || it == AudioDeviceInfo.TYPE_USB_HEADSET }) out += "wired"
        if (types.any { it == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || it == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP || (Build.VERSION.SDK_INT >= 31 && it == AudioDeviceInfo.TYPE_BLE_HEADSET) }) out += "bluetooth"
        return out
    }
    // по умолчанию: гарнитура > наушники > видео в динамик > аудио в ухо
    private fun autoRoute(): String {
        val a = available()
        return when {
            "bluetooth" in a -> "bluetooth"
            "wired" in a -> "wired"
            video || "earpiece" !in a -> "speaker"
            else -> "earpiece"
        }
    }
    private fun current(): String {
        if (Build.VERSION.SDK_INT >= 31) {
            return when (am.communicationDevice?.type) {
                AudioDeviceInfo.TYPE_BUILTIN_SPEAKER -> "speaker"
                AudioDeviceInfo.TYPE_BLUETOOTH_SCO, AudioDeviceInfo.TYPE_BLE_HEADSET -> "bluetooth"
                AudioDeviceInfo.TYPE_WIRED_HEADSET, AudioDeviceInfo.TYPE_WIRED_HEADPHONES, AudioDeviceInfo.TYPE_USB_HEADSET -> "wired"
                else -> "earpiece"
            }
        }
        @Suppress("DEPRECATION")
        return when {
            am.isSpeakerphoneOn -> "speaker"
            am.isBluetoothScoOn -> "bluetooth"
            "wired" in available() -> "wired"
            else -> "earpiece"
        }
    }
    private fun applyRoute(r: String) {
        try {
            if (Build.VERSION.SDK_INT >= 31) {
                val want = am.availableCommunicationDevices.firstOrNull { d ->
                    when (r) {
                        "speaker" -> d.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
                        "bluetooth" -> d.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || d.type == AudioDeviceInfo.TYPE_BLE_HEADSET
                        "wired" -> d.type == AudioDeviceInfo.TYPE_WIRED_HEADSET || d.type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES || d.type == AudioDeviceInfo.TYPE_USB_HEADSET
                        else -> d.type == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE
                    }
                }
                if (want != null) am.setCommunicationDevice(want) else am.clearCommunicationDevice()
            } else {
                @Suppress("DEPRECATION")
                when (r) {
                    "bluetooth" -> { am.isSpeakerphoneOn = false; am.startBluetoothSco(); am.isBluetoothScoOn = true }
                    "speaker" -> { am.stopBluetoothSco(); am.isBluetoothScoOn = false; am.isSpeakerphoneOn = true }
                    else -> { am.stopBluetoothSco(); am.isBluetoothScoOn = false; am.isSpeakerphoneOn = false }
                }
            }
        } catch (_: Exception) {}
        proximity(active && !video && r == "earpiece")
    }
    private fun onDevicesChanged() {
        if (!active) return
        // подключили/отключили гарнитуру — если пользователь не выбирал сам или выбранного больше нет, берём авто
        if (route.isEmpty() || route !in available()) { route = ""; applyRoute(autoRoute()) }
        notifyListeners("routes", state(), true)
    }
    private fun state(): JSObject {
        val o = JSObject()
        o.put("routes", JSArray(available()))
        o.put("current", if (active) current() else "")
        return o
    }

    // ── аудиофокус: на время звонка музыка и другие приложения замолкают ──
    private fun requestFocus() {
        if (Build.VERSION.SDK_INT >= 26) {
            val f = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
                .build()
            focus = f
            am.requestAudioFocus(f)
        } else {
            @Suppress("DEPRECATION")
            am.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
        }
    }

    // ── датчик приближения: экран гаснет у уха ──
    private fun proximity(on: Boolean) {
        try {
            if (on) {
                if (prox == null) {
                    val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
                    if (pm.isWakeLockLevelSupported(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK))
                        prox = pm.newWakeLock(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK, "slon:call-proximity")
                }
                prox?.let { if (!it.isHeld) it.acquire(4 * 60 * 60 * 1000L) }
            } else prox?.let { if (it.isHeld) it.release() }
        } catch (_: Exception) {}
    }

    private fun release() {
        if (!active) { SlonCallService.stop(context); return }
        active = false
        proximity(false)
        try { am.unregisterAudioDeviceCallback(devCb) } catch (_: Exception) {}
        try {
            if (Build.VERSION.SDK_INT >= 31) am.clearCommunicationDevice()
            else {
                @Suppress("DEPRECATION")
                run { am.stopBluetoothSco(); am.isBluetoothScoOn = false; am.isSpeakerphoneOn = false }
            }
            am.mode = AudioManager.MODE_NORMAL
            if (Build.VERSION.SDK_INT >= 26) focus?.let { am.abandonAudioFocusRequest(it) }
            else @Suppress("DEPRECATION") am.abandonAudioFocus(null)
        } catch (_: Exception) {}
        SlonCallService.stop(context)
    }

    override fun handleOnDestroy() { release(); super.handleOnDestroy() }
}
