package com.sloncomp.slon;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONObject;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;

/** «Отклонить» в уведомлении о звонке — работает, даже если приложение не запущено */
public class SlonCallActionReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent i) {
        if (!"decline".equals(i.getAction())) return;
        String peer = i.getStringExtra("peer"), callId = i.getStringExtra("callId");
        SlonNotify.cancelCall(c);
        if (peer == null || peer.isEmpty()) return;
        String token = c.getSharedPreferences(SlonBgService.PREFS, Context.MODE_PRIVATE).getString("token", "");
        String api = c.getSharedPreferences(SlonBgService.PREFS, Context.MODE_PRIVATE).getString("api", "");
        if (token.isEmpty() || api.isEmpty()) return;
        PendingResult pr = goAsync();
        new Thread(() -> {
            try {
                JSONObject b = new JSONObject().put("to", peer).put("payload",
                        new JSONObject().put("type", "call_reject").put("callId", callId == null ? "" : callId));
                Request r = new Request.Builder().url(api + "/signal")
                        .header("Authorization", "Bearer " + token)
                        .post(RequestBody.create(b.toString(), MediaType.get("application/json"))).build();
                new OkHttpClient().newCall(r).execute().close();
            } catch (Exception ignored) {
            } finally { pr.finish(); }
        }).start();
    }
}
