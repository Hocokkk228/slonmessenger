package com.sloncomp.slon;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** После перезагрузки/обновления приложения снова запускаем фоновую связь (если вошли в аккаунт) */
public class SlonBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(a) && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)) return;
        String token = c.getSharedPreferences(SlonBgService.PREFS, Context.MODE_PRIVATE).getString("token", "");
        if (!token.isEmpty()) SlonBgService.start(c);
    }
}
