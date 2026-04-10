package com.misterjugo.alertas;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * MisterJugoFCMService — Servicio nativo de Firebase Cloud Messaging
 *
 * FUNCIONA en todos los estados:
 * ✅ App abierta (foreground)
 * ✅ App en background
 * ✅ Teléfono bloqueado
 * ✅ App terminada / muerta por el sistema
 *
 * CLAVE: El servidor envía mensajes DATA-ONLY (sin bloque "notification").
 * Esto obliga a Android a siempre llamar onMessageReceived(), dándonos
 * control total: podemos encender la pantalla y crear la notificación.
 */
public class MisterJugoFCMService extends FirebaseMessagingService {

    private static final String TAG = "MisterJugoFCM";
    private static final String CHANNEL_KITCHEN = "kitchen-alerts";
    private static final String CHANNEL_WAITER  = "waiter-alerts";

    @Override
    public void onCreate() {
        super.onCreate();
        crearCanales();
    }

    /**
     * Se llama SIEMPRE que llega un mensaje FCM (data-only).
     * Aquí enciende la pantalla y muestra la notificación.
     */
    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Log.d(TAG, "✅ onMessageReceived() llamado — FCM entregó el mensaje");

        Map<String, String> data = remoteMessage.getData();

        String title    = data.containsKey("title") ? data.get("title") : "MisterJugo";
        String body     = data.containsKey("body")  ? data.get("body")  : "Tienes un pedido nuevo";
        String role     = data.containsKey("role")  ? data.get("role")  : "kitchen";
        String channelId = "waiter".equals(role) ? CHANNEL_WAITER : CHANNEL_KITCHEN;

        // 1) Encender la pantalla aunque esté bloqueada
        encenderPantalla();

        // 2) Mostrar notificación heads-up (como WhatsApp)
        mostrarNotificacion(title, body, channelId);
    }

    /**
     * Adquiere un WakeLock para encender la pantalla del teléfono.
     * Requiere permiso WAKE_LOCK en AndroidManifest.
     * Se libera automáticamente a los 10 segundos.
     */
    private void encenderPantalla() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm == null) return;

            // SCREEN_BRIGHT_WAKE_LOCK | ACQUIRE_CAUSES_WAKEUP → enciende la pantalla
            // ON_AFTER_RELEASE → mantiene encendida un momento tras soltar el lock
            @SuppressWarnings("deprecation")
            PowerManager.WakeLock wl = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK
                    | PowerManager.ACQUIRE_CAUSES_WAKEUP
                    | PowerManager.ON_AFTER_RELEASE,
                "MisterJugo:NotificationWakeLock"
            );
            wl.acquire(10_000L); // 10 segundos máximo
            Log.d(TAG, "🔆 Pantalla encendida via WakeLock");
        } catch (Exception e) {
            Log.e(TAG, "Error al encender pantalla: " + e.getMessage());
        }
    }

    /**
     * Crea y muestra una notificación heads-up con sonido y vibración.
     * VISIBILITY_PUBLIC = visible en pantalla de bloqueo (como WhatsApp).
     * PRIORITY_MAX = aparece como banner flotante en la parte superior.
     */
    private void mostrarNotificacion(String title, String body, String channelId) {
        // Intent para abrir la app al tocar la notificación
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, flags);

        // Sonido de alerta del sistema
        Uri sonido = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            // PRIORITY_MAX = heads-up banner flotante (como WhatsApp)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            // VISIBILITY_PUBLIC = mostrar contenido en pantalla de bloqueo
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSound(sonido)
            .setVibrate(new long[]{0, 400, 150, 400, 150, 700})
            // CATEGORY_ALARM = mayor urgencia, como una alarma
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            // Luces LED si el teléfono las tiene
            .setLights(0xFFFF6600, 500, 500);

        NotificationManager manager =
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (manager != null) {
            // ID único basado en tiempo para no reemplazar notificaciones anteriores
            int notificationId = (int) (System.currentTimeMillis() % 10000);
            manager.notify(notificationId, builder.build());
            Log.d(TAG, "🔔 Notificación mostrada: [" + channelId + "] " + title);
        }
    }

    /**
     * Crea los canales de notificación (requerido Android 8+).
     * IMPORTANCE_HIGH = hace el heads-up banner + sonido + vibración.
     */
    private void crearCanales() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager =
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        NotificationChannel kitchenChannel = new NotificationChannel(
            CHANNEL_KITCHEN,
            "Alertas de Cocina y Jugo",
            NotificationManager.IMPORTANCE_HIGH
        );
        kitchenChannel.setDescription("Pedidos nuevos en cocina");
        kitchenChannel.enableVibration(true);
        kitchenChannel.setVibrationPattern(new long[]{0, 400, 150, 400, 150, 700});
        kitchenChannel.setLockscreenVisibility(1); // 1 = VISIBILITY_PUBLIC
        kitchenChannel.enableLights(true);
        kitchenChannel.setLightColor(0xFFFF6600);
        manager.createNotificationChannel(kitchenChannel);

        NotificationChannel waiterChannel = new NotificationChannel(
            CHANNEL_WAITER,
            "Alertas de Mozos",
            NotificationManager.IMPORTANCE_HIGH
        );
        waiterChannel.setDescription("Pedidos listos para entregar");
        waiterChannel.enableVibration(true);
        waiterChannel.setVibrationPattern(new long[]{0, 400, 150, 400, 150, 700});
        waiterChannel.setLockscreenVisibility(1); // 1 = VISIBILITY_PUBLIC
        waiterChannel.enableLights(true);
        waiterChannel.setLightColor(0xFFFF6600);
        manager.createNotificationChannel(waiterChannel);

        Log.d(TAG, "✅ Canales de notificación creados");
    }

    @Override
    public void onNewToken(@NonNull String token) {
        Log.d(TAG, "🔑 Nuevo token FCM: " + token);
        // Se registra en Firestore al abrir la app desde useNativePush.js
    }
}
