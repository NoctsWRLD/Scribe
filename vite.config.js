import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// The base path must match the URL the app is served from:
//   local dev and Vercel  -> /
//   GitHub Pages project -> /SmartStudy/
// It comes from the environment so the same codebase targets both.
//
// Vite keeps `base` verbatim in import.meta.env.BASE_URL. A base without a
// trailing slash therefore produces a broken join in the router
// ("/SmartStudy" + "dashboard" -> "/SmartStudydashboard"), so normalise once
// here and use the same value everywhere.
function normalizeBase(path) {
  if (!path) return '/'
  return path.endsWith('/') ? path : `${path}/`
}

// GitHub Pages serves static files only. An unknown path returns 404.html, so
// emit one that stashes the requested path and bounces back into the SPA.
// Without this, every client-side route 404s on a hard refresh or a shared link.
function githubPagesSpaFallback() {
  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    closeBundle() {
      const base = normalizeBase(process.env.BASE_PATH)
      // ESM: __dirname does not exist. Resolve from import.meta.url instead.
      const out = fileURLToPath(new URL('./dist/404.html', import.meta.url))
      writeFileSync(
        out,
        `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <script>
      (function () {
        var base = ${JSON.stringify(base)};
        var l = window.location;
        var path = l.pathname.indexOf(base) === 0 ? l.pathname.slice(base.length) : l.pathname;
        if (path) sessionStorage.setItem('__spa_redirect', path + l.search + l.hash);
        l.replace(base);
      })();
    </script>
  </head>
  <body><p>Redirecting&hellip;</p></body>
</html>
`
      )
    },
  }
}

export default defineConfig({
  base: normalizeBase(process.env.BASE_PATH),
  plugins: [
    react(),
    tailwindcss(),
    githubPagesSpaFallback(),
  ],
  build: {
    // Firestore's realtime SDK is a separately lazy-loaded vendor chunk.
    // Its minified size is about 588 KB; keep a little headroom without
    // hiding growth in the app's own chunks.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // The database SDK is only needed by the signed-in screens. Without an
        // explicit split, Rollup hoists it into the main chunk and the public
        // landing page pays for it.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@firebase/firestore') || id.includes('firebase/firestore')) {
            return 'firebase-firestore'
          }
          if (id.includes('@firebase/auth') || id.includes('firebase/auth')) {
            return 'firebase-auth'
          }
          if (id.includes('@firebase/app') || id.includes('firebase/app')) {
            return 'firebase-app'
          }
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')
            || id.includes('node_modules/scheduler')) {
            return 'react'
          }
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'router'
          }
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
