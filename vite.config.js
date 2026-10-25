import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'جدولي',
        short_name: 'جدولي',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        start_url: '/',
        background_color: '#eaf0f2',
        theme_color: '#1c4e80',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'fonts', cacheableResponse: { statuses: [0, 200] }, expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } },
        }],
      },
    }),
  ],
});
