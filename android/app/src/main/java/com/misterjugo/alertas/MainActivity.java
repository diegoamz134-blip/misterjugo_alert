package com.misterjugo.alertas;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — Punto de entrada de la app MisterJugo
 *
 * Al crearse, inicia el MisterJugoForegroundService que mantiene
 * el proceso vivo para que los listeners de Firestore en JavaScript
 * nunca se detengan, incluso con el teléfono bloqueado.
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        iniciarServicioAlertas();
        solicitarExcepcionBateria(); // BUG #4 — pedir que Android no mate la app
    }

    private void iniciarServicioAlertas() {
        try {
            Log.d(TAG, "▶ Iniciando MisterJugoForegroundService...");
            Intent serviceIntent = new Intent(this, MisterJugoForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error iniciando servicio: " + e.getMessage());
        }
    }

    /**
     * BUG #4 CORREGIDO: Solicita al usuario que la app quede exenta de
     * la optimización de batería de Android. Sin esto, Android 12+ (y
     * fabricantes como Samsung/Xiaomi/Huawei) matan el proceso aunque
     * exista un ForegroundService activo.
     *
     * Esto es lo mismo que hace WhatsApp para mantenerse siempre activa.
     */
    private void solicitarExcepcionBateria() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        try {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            if (pm == null) return;
            String pkg = getPackageName();
            if (!pm.isIgnoringBatteryOptimizations(pkg)) {
                Log.d(TAG, "🔋 Solicitando excepción de optimización de batería...");
                Intent intent = new Intent(
                    Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:" + pkg)
                );
                startActivity(intent);
            } else {
                Log.d(TAG, "✅ App ya exenta de optimización de batería");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error solicitando excepción batería: " + e.getMessage());
        }
    }
}
