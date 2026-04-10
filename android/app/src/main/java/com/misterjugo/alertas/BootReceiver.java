package com.misterjugo.alertas;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * BootReceiver — Reinicia el ForegroundService cuando:
 * 1. El dispositivo se reinicia (BOOT_COMPLETED)
 * 2. El servicio se destruye y pide reinicio (RESTART_SERVICE)
 *
 * Sin esto, al reiniciar el teléfono la app no recibirá alertas
 * hasta que el usuario la abra manualmente.
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : "";

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
            || "com.misterjugo.alertas.RESTART_SERVICE".equals(action)) {

            Log.d(TAG, "📱 Reiniciando MisterJugoForegroundService...");
            Intent serviceIntent = new Intent(context, MisterJugoForegroundService.class);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        }
    }
}
