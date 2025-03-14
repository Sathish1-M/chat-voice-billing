export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt'],
  devtools: { enabled: true },

  shadcn: {
    prefix: '', // optional prefix for component classes
    componentDir: './components/ui' // the directory where your shadcn components are stored
  },

  compatibilityDate: '2025-03-14'
})