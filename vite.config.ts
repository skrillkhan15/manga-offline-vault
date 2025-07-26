import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/manga-offline-vault/',  // <-- Fix for GitHub Pages subpath
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Manga Tracker',
        short_name: 'MangaPWA',
        start_url: '/manga-offline-vault/',  // <-- Match base here too
        display: 'standalone',
        background_color: '#fafcff',
        theme_color: '#a855f7',
        icons: [
          {
            src: '/manga-offline-vault/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/manga-offline-vault/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/manga-offline-vault/icons/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
