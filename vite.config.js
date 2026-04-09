import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',

      // ── Habilitar en modo desarrollo para poder probar ──
      devOptions: {
        enabled: true,
        type: 'module',
      },

      // ── Archivos estáticos a pre-cachear ──
      includeAssets: ['icons/*.png', 'icons/*.jpg', 'manifest.json'],

      // ── Manifest de la PWA ──
      manifest: {
        name: 'MisterJugo · Sistema de Cocina',
        short_name: 'MisterJugo',
        description: 'Sistema de avisos en tiempo real entre cocina y mozos',
        theme_color: '#f97316',
        background_color: '#080d1a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        lang: 'es',
        categories: ['food', 'utilities'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      // ── Estrategia de caché con Workbox ──
      workbox: {
        // Cachea todos los assets del build
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],

        // No cachear llamadas de Firebase (son en tiempo real)
        navigateFallback: 'index.html',

        runtimeCaching: [
          {
            // Google Fonts → CacheFirst (cambian poco)
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Firebase Firestore → NetworkOnly (datos en tiempo real, nunca cachear)
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Firebase Auth → NetworkOnly
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
