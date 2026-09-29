package com.sloncomp.slon;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Мост музыки: JS сообщает, что играет (название, исполнитель, обложка, пауза, позиция),
 * служба SlonMediaService показывает системный плеер; нажатия в нём приходят в JS событием «media».
 * Из JS: Capacitor.Plugins.SlonMedia.update({...}) / stop() / addListener('media', e => …)
 */
@CapacitorPlugin(name = "SlonMedia")
public class SlonMediaPlugin extends Plugin {
    static SlonMediaPlugin instance;
    private static String coverKey = "";
    private static final OkHttpClient http = new OkHttpClient();

    @Override public void load() { instance = this; }

    static void emit(String action, long pos) {
        SlonMediaPlugin p = instance;
        if (p == null) return;
        JSObject d = new JSObject();
        d.put("action", action);
        d.put("pos", pos);
        p.notifyListeners("media", d, true);
    }

    @PluginMethod
    public void update(PluginCall call) {
        SlonMediaService.title = call.getString("title", "");
        SlonMediaService.artist = call.getString("artist", "");
        SlonMediaService.playing = Boolean.TRUE.equals(call.getBoolean("playing", false));
        SlonMediaService.posMs = (long) (double) call.getDouble("pos", 0.0);
        SlonMediaService.durMs = (long) (double) call.getDouble("dur", 0.0);
        String cv = call.getString("cover", null);
        if (cv != null && !cv.equals(coverKey)) {
            coverKey = cv;
            if (cv.isEmpty()) SlonMediaService.cover = null;
            else if (cv.startsWith("data:")) SlonMediaService.cover = decode(cv);
            else if (cv.startsWith("http")) {
                SlonMediaService.cover = null;
                final String url = cv;
                new Thread(() -> {                         // обложка по ссылке — скачиваем в фоне
                    try (Response r = http.newCall(new Request.Builder().url(url).build()).execute()) {
                        if (r.isSuccessful() && r.body() != null && url.equals(coverKey)) {
                            byte[] b = r.body().bytes();
                            SlonMediaService.cover = BitmapFactory.decodeByteArray(b, 0, b.length);
                            SlonMediaService.update(getContext());
                        }
                    } catch (Exception ignored) {}
                }).start();
            }
        }
        try { SlonMediaService.update(getContext()); } catch (Exception ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        coverKey = "";
        SlonMediaService.playing = false;
        try { SlonMediaService.stop(getContext()); } catch (Exception ignored) {}
        call.resolve();
    }

    private static Bitmap decode(String dataUrl) {
        try {
            byte[] b = Base64.decode(dataUrl.substring(dataUrl.indexOf(',') + 1), Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(b, 0, b.length);
        } catch (Exception e) { return null; }
    }
}
