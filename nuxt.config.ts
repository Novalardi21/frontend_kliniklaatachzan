export default defineNuxtConfig({
  // Keep one UI/Tailwind pipeline. Enable other integrations when used.
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image'],

  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  // Nuxt UI supplies the Tailwind 4 Vite plugin. The legacy
  // @nuxtjs/tailwindcss and @nuxtjs/eslint-module must not also be loaded.
  colorMode: { preference: 'light', fallback: 'light' },
  ui: { fonts: false },
  routeRules: { '/': { prerender: true } },
  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: { commaDangle: 'never', braceStyle: '1tbs' }
    }
  }
})
