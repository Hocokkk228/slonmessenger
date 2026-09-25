package com.sloncomp.slon;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.util.concurrent.TimeUnit;

/**
 * Страховка фоновой связи: если прошивка (MIUI/HyperOS, ColorOS…) убила службу,
 * WorkManager поднимает её снова — раз в 15 минут и сразу после смахивания из недавних.
 */
public class SlonKeepAliveWorker extends Worker {
    public SlonKeepAliveWorker(@NonNull Context c, @NonNull WorkerParameters p) { super(c, p); }

    @NonNull @Override public Result doWork() {
        Context c = getApplicationContext();
        String token = c.getSharedPreferences(SlonBgService.PREFS, Context.MODE_PRIVATE).getString("token", "");
        if (!token.isEmpty() && !SlonBgService.running) SlonBgService.start(c);
        return Result.success();
    }

    /** Периодическая проверка (минимум, который разрешает Android, — 15 минут) */
    public static void schedule(Context c) {
        try {
            WorkManager.getInstance(c).enqueueUniquePeriodicWork("slon_keepalive", ExistingPeriodicWorkPolicy.KEEP,
                    new PeriodicWorkRequest.Builder(SlonKeepAliveWorker.class, 15, TimeUnit.MINUTES).build());
        } catch (Exception ignored) { }
    }
    /** Разовый перезапуск через пару секунд (после смахивания приложения) */
    public static void kick(Context c) {
        try {
            WorkManager.getInstance(c).enqueueUniqueWork("slon_kick", ExistingWorkPolicy.REPLACE,
                    new OneTimeWorkRequest.Builder(SlonKeepAliveWorker.class).setInitialDelay(2, TimeUnit.SECONDS).build());
        } catch (Exception ignored) { }
    }
    public static void cancel(Context c) {
        try { WorkManager.getInstance(c).cancelUniqueWork("slon_keepalive"); } catch (Exception ignored) { }
    }
}
