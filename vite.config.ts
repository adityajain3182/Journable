import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // Service worker auto-updates whenever a new build is deployed.
        registerType: 'autoUpdate',
        // Files in /public that aren't fingerprinted but should be cached.
        includeAssets: [
          'favicon.png',
          'apple-touch-icon.png',
          'icon-source.svg',
        ],
        manifest: {
          name: 'Journable',
          short_name: 'Journable',
          description: 'AI-powered nutrition, water, and weight tracker.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#050505',
          theme_color: '#050505',
          categories: ['health', 'lifestyle', 'fitness'],
          icons: [
            { src: '/pwa-192.png',           sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa-512.png',           sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/pwa-maskable-512.png',  sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Precache the app shell so the UI loads offline.
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
          // Don't precache the dev server's source maps.
          globIgnores: ['**/*.map'],
          // Network-first for navigations so users always see the latest UI
          // when they're online; falls back to cache when offline.
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              // Don't cache the EmailJS or Gemini API calls — they must hit
              // the network and we don't want stale auth/AI results.
              urlPattern: ({ url }) =>
                url.origin === 'https://api.emailjs.com' ||
                url.hostname.endsWith('googleapis.com'),
              handler: 'NetworkOnly',
            },
            {
              // Google Fonts — cache the stylesheet briefly, the woff2 long-term.
              urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-stylesheets' },
            },
            {
              urlPattern: ({ url }) => url.hostname === 'fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
        devOptions: {
          // Expose the SW in dev so we can test installability locally.
          enabled: false,
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.EMAILJS_SERVICE_ID': JSON.stringify(env.EMAILJS_SERVICE_ID),
      'process.env.EMAILJS_TEMPLATE_ID': JSON.stringify(env.EMAILJS_TEMPLATE_ID),
      'process.env.EMAILJS_PUBLIC_KEY': JSON.stringify(env.EMAILJS_PUBLIC_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
