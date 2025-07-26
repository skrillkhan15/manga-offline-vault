import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: '/manga-offline-vault/', // Important for GitHub Pages subpath
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Manga Tracker',
        short_name: 'MangaPWA',
        start_url: '/manga-offline-vault/', // Must match base
        scope: '/manga-offline-vault/',    // For proper routing
        display: 'standalone',
        background_color: '#fafcff',
        theme_color: '#a855f7',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),  // Fixes the "@" alias import issue
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
