# جدولي (PWA)

React + Vite + vite-plugin-pwa. No backend: data lives in the phone's localStorage.

## Run
    npm install
    npm run dev        # test on the phone via the Network URL

## Deploy (HTTPS is required for install + offline)
    npm run build      # outputs dist/
Upload `dist/` to Netlify, Vercel, Cloudflare Pages or GitHub Pages.
On Android: open the link in Chrome, menu, "Install app" / "Add to Home screen".

## Where things are
- src/logic.js : cycle maths (work N, leave N), extend(), date helpers
- src/App.jsx  : all screens
- vite.config.js : PWA manifest + offline caching
