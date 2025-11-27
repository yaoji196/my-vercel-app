// vite.config.mjs
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx' // ✅ 使用 import

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx() // 启用 JSX 支持
  ],
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})