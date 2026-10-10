import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/mall-merchant/',
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 8093,
    proxy: {
      '/gateway': {
        target: 'http://localhost:8201',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gateway/, ''),
      },
      // AI 客服（mall-ai-agent）；生产环境由 nginx 做同样转发
      '/agent': {
        target: 'http://localhost:8500',
        changeOrigin: true,
      },
    },
  },
  build: { rollupOptions: { output: { manualChunks: { 'element-plus': ['element-plus'] } } } },
})
