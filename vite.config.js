import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Barcellona 15-20 settembre',
        short_name: 'Barcellona',
        description: 'Itinerario, valigia, spese, luoghi ed emergenze del viaggio a Barcellona.',
        lang: 'it',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#28353D',
        theme_color: '#28353D',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,mjs,css,html,png,svg,ico,webp}'],   // mjs: il worker di PDF.js
        navigateFallback: '/index.html',
        /* tessere, font e rilievo della mappa già visti restano in cache un mese */
        runtimeCaching: [
          { urlPattern: /^https:\/\/tiles\.openfreemap\.org\//, handler: 'CacheFirst', options: { cacheName: 'mappa', expiration: { maxEntries: 1500, maxAgeSeconds: 30 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } } },
          { urlPattern: /^https:\/\/s3\.amazonaws\.com\/elevation-tiles-prod\//, handler: 'CacheFirst', options: { cacheName: 'rilievo', expiration: { maxEntries: 600, maxAgeSeconds: 30 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } } },
        ],
      },
    }),
  ],
  build: { target: 'es2020' },
  worker: { format: 'es' },
});
