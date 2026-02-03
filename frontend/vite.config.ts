import { defineConfig } from 'vite'

export default defineConfig(async () => {
  // dynamic import to avoid ESM/require loading issues on some environments
  const reactPlugin = (await import('@vitejs/plugin-react')).default
  return {
    base: '/Digital-Enrollment-System/',
    plugins: [reactPlugin()],
    server: { port: 5173 },
  }
})
