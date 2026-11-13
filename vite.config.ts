import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { contentBundle } from './scripts/content-plugin'

// base を相対パスにしているため、GitHub Pages のどのリポジトリ名でもそのまま動く
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), contentBundle()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
