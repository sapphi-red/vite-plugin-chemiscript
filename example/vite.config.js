import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { chemiscript } from 'vite-plugin-chemiscript'

export default defineConfig({
  plugins: [vue(), chemiscript()],
  optimizeDeps: {
    exclude: ['vue-chemistry']
  }
})
