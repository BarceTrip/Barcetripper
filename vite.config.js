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
        description: 'Itinerario, spese, radar ed emergenze del viaggio a Barcellona.',
        lang: 'it',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#07090D',
        theme_color: '#07090D',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  build: { target: 'es2020' },
});
