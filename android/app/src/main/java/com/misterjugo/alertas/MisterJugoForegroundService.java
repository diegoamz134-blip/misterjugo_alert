package com.misterjugo.alertas;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

/**
 * MisterJugoForegroundService — Servicio en Primer Plano
 *
 * ¿Por qué esto soluciona el problema?
 * Sin este servicio, cuando el teléfono se bloquea Android mata el proceso
 * de la app (WebView incluido). Esto apaga todos los listeners de Firestore
 * en JavaScript, por lo que no se detectan cambios de pedidos.
 *
 * Con este servicio:
 * ✅ El proceso NUNCA es eliminado por Android (servicio en primer plano)
 * ✅ Los listeners de Firestore en JavaScript siguen activos
 * ✅ Los hooks useAlerts.js detectan cambios y reproducen sonidos
 * ✅ Las notificaciones locales de Capacitor se muestran en la bandeja
 * ✅ START_STICKY = Android reinicia el servicio si lo mata por falta de RAM
 */
public class MisterJugoForegroundService extends Service {

    private static final String TAG = "MisterJugoService";
    // Canal silencioso solo para mantener el servicio activo
    private static final String KEEPALIVE_CHANNEL = "misterjugo-keepalive";
    private static final int KEEPALIVE_NOTIF_ID = 9001;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "✅ ForegroundService creado — app estará siempre activa");
        crearCanalKeepalive();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Abrir la app al tocar la notificación persistente
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, openIntent, piFlags);

        // Notificación persistente mínima (silenciosa, pequeña)
        // Android exige mostrarla para servicios en primer plano
        Notification notification = new NotificationCompat.Builder(this, KEEPALIVE_CHANNEL)
            .setContentTitle("MisterJugo")
            .setContentText("Escuchando pedidos...")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setSilent(true)
            .setOngoing(true)  // No se puede deslizar para quitar
            .build();

        // startForeground previene que Android mate el proceso
        startForeground(KEEPALIVE_NOTIF_ID, notification);

        Log.d(TAG, "🟢 ForegroundService activo — listeners JS nunca mueren");

        // START_STICKY: si Android nos mata por RAM, nos reinicia automáticamente
        return START_STICKY;
    }

    /**
     * Canal silencioso para la notificación persistente del servicio.
     * IMPORTANCE_MIN = no hace sonido, no interrumpe, aparece solo al deslizar.
     */
    private void crearCanalKeepalive() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager =
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        // Solo crear si no existe (no sobreescribir)
        if (manager.getNotificationChannel(KEEPALIVE_CHANNEL) == null) {
            NotificationChannel channel = new NotificationChannel(
                KEEPALIVE_CHANNEL,
                "MisterJugo en segundo plano",
                NotificationManager.IMPORTANCE_MIN
            );
            channel.setDescription("Mantiene activa la recepción de alertas de pedidos");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            channel.enableVibration(false);
            manager.createNotificationChannel(channel);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Servicio no vinculado
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "⚠️ ForegroundService destruido — intentando reiniciar...");
        // Pedir al sistema que lo reinicie a través del receptor
        Intent restart = new Intent(this, BootReceiver.class);
        restart.setAction("com.misterjugo.alertas.RESTART_SERVICE");
        sendBroadcast(restart);
    }
}
