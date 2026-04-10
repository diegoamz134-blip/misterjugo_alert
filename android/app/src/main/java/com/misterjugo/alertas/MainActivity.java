package com.misterjugo.alertas;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
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
}
