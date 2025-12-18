import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_GEMINI_API_KEY)
    }
  }
})
