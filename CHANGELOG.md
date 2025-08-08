# Changelog

## 2025-08-02

- Fix OAuth redirect: add `VITE_SITE_URL`, implement `getAuthBaseUrl()`; update Supabase/Google redirect URLs.
- Resolve MIME type error by adding static asset route in `vercel.json` and SPA catch‑all.
- Fix API 404 in production by routing `/api/(.*)` to `server/server.js` and exporting `module.exports = app`.
- Choose `builds` strategy in `vercel.json` (static-build + node) and document alternatives.
- Enforce Node 18 via `package.json` `engines`.
- Simplify GitHub Actions: remove artifacts; add `vercel whoami` debug; add CLI fallback with explicit `VERCEL_TOKEN`.
- Improve `aiService.ts` API base URL resolution and add debug logs.
- Restore original Home page UI with animations.
- Update docs: `PROJECT_DOCUMENTATION.md`, `VERCEL_SETUP.md`, `TROUBLESHOOTING.md`, `SUPABASE_AUTH_SETUP.md`, `VERCEL_AUTH_TROUBLESHOOTING.md`.
