import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves a project site under https://<owner>.github.io/<repo>/,
// so assets must be referenced with a "/<repo>/" base in production.
// In CI we read the repo name from GITHUB_REPOSITORY ("owner/repo"); locally
// (dev/preview) we fall back to "/". No manual edit needed when the repo is named.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_ACTIONS && repo ? `/${repo}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
