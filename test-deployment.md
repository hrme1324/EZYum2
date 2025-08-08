# Deployment Test Guide

## 🔧 What We Fixed:

1. **Added Node.js Engine Specification:**
   ```json
   "engines": {
     "node": "18.x"
   }
   ```

2. **Switched to `builds` Approach:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": { "distDir": "dist" }
       },
       {
         "src": "server/server.js",
         "use": "@vercel/node"
       }
     ]
   }
   ```

3. **Verified Local Build Works:**
   - ✅ `npm run build` completes successfully
   - ✅ TypeScript compilation passes
   - ✅ Vite build generates `dist/` folder

## 🧪 Test Steps:

### 1. Wait for Deployment (2-3 minutes)
Check Vercel dashboard for deployment status.

### 2. Test Frontend
- Go to `https://ezyum.com`
- Should load without errors
- Check browser console for any issues

### 3. Test API Endpoints
- `https://ezyum.com/api/health` - Should return `{"status":"OK"}`
- `https://ezyum.com/api/recipes/random` - Should return a random recipe

### 4. Test Authentication
- Try signing in with Google
- Should redirect to `https://ezyum.com` (not localhost)

## 🔍 Debug Info to Check:

In browser console on `ezyum.com`, look for:
- `🔧 API Configuration:` - Should show `BACKEND_URL: "/api"`
- `🔍 Auth URL Detection:` - Should show correct domain detection

## 🚨 If Still Failing:

1. **Check Vercel Logs** - Look for specific error messages
2. **Verify Environment Variables** - Make sure all required vars are set in Vercel
3. **Test API Keys** - Ensure MealDB, OpenAI, etc. are working

## ✅ Success Indicators:

- ✅ Frontend loads without errors
- ✅ API endpoints return data (not 404)
- ✅ Authentication redirects correctly
- ✅ No console errors about missing modules
