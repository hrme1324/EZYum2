# 🔧 Ezyum Food App Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. **MIME Type Error: "Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of 'text/html'"**

**Symptoms:**

- Browser console shows MIME type errors
- Assets fail to load (404 errors)
- App doesn't render properly

**Root Causes:**

1. **Stale build files** - Old asset references don't match new files
2. **Development server issues** - Vite not serving latest assets
3. **Proxy configuration conflicts** - API proxy interfering with asset serving
4. **Browser cache** - Cached old asset references

**Solutions:**

#### Quick Fix:

```bash
# Clean everything and rebuild
rm -rf dist node_modules/.vite
npm run build
npm run dev
```

#### Detailed Fix:

```bash
# 1. Stop all development servers
pkill -f "vite"
pkill -f "node"

# 2. Clear all caches
rm -rf dist node_modules/.vite .vite

# 3. Reinstall dependencies (if needed)
npm install

# 4. Rebuild and start
npm run build
npm run dev
```

#### Browser Fix:

1. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Clear browser cache**: Developer Tools → Application → Storage → Clear
3. **Disable cache**: Developer Tools → Network → Disable cache

### 2. **API Connection Errors**

**Symptoms:**

- "MealDB API error" in console
- Recipe data not loading
- Network errors

**Solutions:**

#### Check API Connectivity:

```bash
# Test MealDB API
curl https://www.themealdb.com/api/json/v1/1/categories.php

# Test with our proxy
curl http://localhost:3000/api/health
```

#### Fix API Issues:

1. **Check internet connection**
2. **Verify API endpoints** in `vite.config.ts`
3. **Use offline mode** if APIs are down

### 3. **Port Conflicts**

**Symptoms:**

- "Port X is in use" errors
- Server won't start

**Solutions:**

```bash
# Find what's using the port
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Kill processes
kill -9 <PID>

# Or use different port
npm run dev -- --port 3003
```

### 4. **Build Failures**

**Symptoms:**

- `npm run build` fails
- TypeScript errors
- Missing dependencies

**Solutions:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Fix TypeScript errors
npm run type-check
npm run lint:fix

# Rebuild
npm run build
```

### 5. **Development Server Issues**

**Symptoms:**

- Hot reload not working
- Changes not reflecting
- Server crashes

**Solutions:**

```bash
# Restart with clean cache
rm -rf node_modules/.vite
npm run dev

# Check for file watching issues
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 🔍 Diagnostic Tools

### Run Troubleshooting Script:

```bash
node troubleshoot.js
```

### Manual Checks:

#### 1. **Check Build Output:**

```bash
ls -la dist/
ls -la dist/assets/
```

#### 2. **Verify Asset References:**

```bash
# Check if HTML references match actual files
grep -o 'index-[^"]*\.js' dist/index.html
ls dist/assets/*.js
```

#### 3. **Test Development Server:**

```bash
# Start dev server
npm run dev

# In another terminal, test endpoints
curl http://localhost:3000/
curl http://localhost:3000/api/health
```

## 🛠️ Advanced Fixes

### 1. **Fix Vite Configuration Issues:**

If you're still having issues, try this minimal `vite.config.ts`:

```typescript
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### 2. **Fix Package.json Scripts:**

Ensure your scripts are correct:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  }
}
```

### 3. **Environment Variables:**

Check if you need environment variables:

```bash
# Copy example env file
cp env.example .env

# Add your API keys
echo "VITE_SUPABASE_URL=your_supabase_url" >> .env
echo "VITE_SUPABASE_ANON_KEY=your_supabase_key" >> .env
```

## 🚀 Production Deployment Issues

### 1. **Vercel Deployment:**

If deploying to Vercel, ensure:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

### 2. **Static Hosting:**

For static hosting (Netlify, GitHub Pages):

```bash
# Build for production
npm run build

# Test locally
npm run preview
```

## 📞 Getting Help

### 1. **Check Logs:**

```bash
# Development logs
npm run dev 2>&1 | tee dev.log

# Build logs
npm run build 2>&1 | tee build.log
```

### 2. **Common Error Messages:**

| Error              | Solution                           |
| ------------------ | ---------------------------------- |
| `MIME type`        | Clear cache, rebuild               |
| `Port in use`      | Kill processes, use different port |
| `Module not found` | Reinstall dependencies             |
| `API error`        | Check internet, use offline mode   |
| `TypeScript error` | Run `npm run type-check`           |

### 3. **Still Stuck?**

1. **Run the troubleshooting script**: `node troubleshoot.js`
2. **Check GitHub issues** for similar problems
3. **Clear everything and start fresh**:
   ```bash
   rm -rf node_modules dist package-lock.json
   npm install
   npm run build
   npm run dev
   ```

## ✅ Success Checklist

After fixing issues, verify:

- [ ] `npm run dev` starts without errors
- [ ] App loads in browser at `http://localhost:3000`
- [ ] No console errors
- [ ] API calls work (or offline mode works)
- [ ] Hot reload works
- [ ] Build succeeds: `npm run build`
- [ ] Preview works: `npm run preview`

---

**💡 Pro Tip:** Always run `node troubleshoot.js` first to get a quick diagnosis of your setup!

## Production Errors and Fixes

### 1) Browser: Failed to load module script (MIME type text/html)
- **Cause**: SPA catch‑all routed asset requests to `index.html`.
- **Fix**: Add static asset route to `vercel.json` before catch‑all:
  - `{ "src": "/(.*\\..*)", "dest": "/$1" }`.

### 2) 404: `/api/recipes/random`
- **Cause**: Frontend called `/api/*` but serverless was not correctly routed/exported.
- **Fix**:
  - `vercel.json` route: `{ "src": "/api/(.*)", "dest": "/server/server.js" }`.
  - `server/server.js`: export app for Vercel: `module.exports = app;` and only `listen()` in non‑production.

### 3) OAuth redirect went to localhost
- **Cause**: Hardcoded/implicit localhost redirect.
- **Fix**: Use `VITE_SITE_URL` and `getAuthBaseUrl()`; ensure Supabase redirect URLs include `https://ezyum.com/auth/callback` & `http://localhost:3000/auth/callback`.

### 4) Vercel GitHub Action: "You must re-authenticate"
- **Cause**: CLI lacked token in CI context.
- **Fix**:
  - Provide `VERCEL_TOKEN` via env and action input.
  - Add debug step: `npx vercel whoami --token=$VERCEL_TOKEN`.
  - Add CLI fallback: `npx vercel --prod --token=$VERCEL_TOKEN --yes`.
  - Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` secrets.

### 5) ESLint/Prettier blocking CI
- **Fixes**:
  - Relax overly strict ESLint rules; keep `wrap-regex` as warn.
  - Run `npm run lint:fix` and `prettier --write` locally.

## CI/CD Workflow (current)
- No artifact upload/download; Vercel action builds itself.
- Tokens passed via secrets; Node 18 enforced via `package.json` `engines`.

## Quick Validation
- Frontend build: `npm run build` → dist created.
- Health: `/api/health` returns `{ status: 'OK' }`.
- Random recipe: `/api/recipes/random` returns JSON from MealDB.
- OAuth: redirects to `https://ezyum.com/auth/callback` in prod.
