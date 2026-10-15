import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages : https://narkotine.github.io/compendium-primaire/ (même origine que collège + jeux)
export default defineConfig({
  base: '/compendium-primaire/',
  build: { target: 'es2020', assetsInlineLimit: 0 },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'icons/*.svg', 'figures/*.svg'],
      manifest: {
        id: '/compendium-primaire/',
        name: 'Maths Primaire',
        short_name: 'Maths Primaire',
        description: 'Les maths du CE1 au CM2 : comprendre les nombres, avec des exercices à manipuler. Hors ligne.',
        lang: 'fr',
        start_url: '/compendium-primaire/',
        scope: '/compendium-primaire/',
        display: 'standalone',
        background_color: '#f7f6f2',
        theme_color: '#d1495b',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        globIgnores: ['**/404.html'],
        cacheId: 'compendium-primaire',
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/^\/compendium-primaire\//],
      },
    }),
  ],
});
