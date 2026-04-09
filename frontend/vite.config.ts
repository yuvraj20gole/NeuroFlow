import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// GitHub project pages: CI sets BASE_PATH=/<repo>/ (see .github/workflows/pages.yml). Local dev: omit for '/'.
function viteBase(): string {
  const raw = process.env.BASE_PATH?.trim()
  if (!raw) return '/'
  let b = raw.startsWith('/') ? raw : `/${raw}`
  if (!b.endsWith('/')) b = `${b}/`
  return b
}
const base = viteBase()

export default defineConfig({
  base,
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
