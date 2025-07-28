# 🔧 Troubleshooting Guide

## 🚨 **HMR (Hot Module Replacement) Errors**

### **Error: `__HMR_CONFIG_NAME__ is not defined`**

**Symptoms:**
- Development server shows HMR errors
- Browser console shows `__HMR_CONFIG_NAME__` errors
- Hot reload stops working

**Solutions:**

#### **Quick Fix:**
```bash
# 1. Stop the dev server
pkill -f "vite"

# 2. Clear Vite cache
rm -rf node_modules/.vite

# 3. Clear build cache
rm -rf dist

# 4. Restart dev server
npm run dev
```

#### **Nuclear Option (if above doesn't work):**
```bash
# 1. Stop everything
pkill -f "vite"
pkill -f "node"

# 2. Clear all caches
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite

# 3. Reinstall dependencies
npm install

# 4. Restart
npm run dev
```

### **Browser Cache Issues:**
1. **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear Browser Cache**: Developer Tools → Application → Storage → Clear
3. **Incognito Mode**: Test in private/incognito browser

## 🔥 **Environment Variable Errors**

### **Error: "Missing Supabase environment variables"**

**Solution:**
- The app now has fallback values - this error should never appear
- Check browser console for debug logs
- Verify Vercel environment variables are set correctly

## 🏗️ **Build Errors**

### **TypeScript Errors:**
```bash
# Fix automatically
npm run lint:fix

# Check types
npm run type-check

# Build test
npm run build
```

### **ESLint Errors:**
```bash
# Fix automatically
npm run lint:fix

# Check manually
npm run lint
```

## 🚀 **Deployment Issues**

### **Vercel Build Fails:**
1. **Check Build Logs**: Vercel Dashboard → Deployments → Latest
2. **Test Locally**: `npm run build`
3. **Environment Variables**: Verify in Vercel Dashboard
4. **TypeScript**: Ensure no type errors

### **Authentication Issues:**
1. **Supabase Settings**: Check Auth → Settings
2. **Redirect URIs**: Verify in Supabase and Google Cloud
3. **Environment Variables**: Ensure Vercel has correct values

## 🔍 **Debugging Steps**

### **1. Check Console Logs:**
```javascript
// Look for these in browser console:
🔍 Environment Variables Check: { hasUrl: true, hasKey: true, ... }
🎯 Final Supabase Config: { usingEnvVars: true, ... }
```

### **2. Verify Environment Variables:**
```bash
# Local development
cat .env.local

# Check what Vite sees
npm run dev
# Look for environment logs in terminal
```

### **3. Test Build Process:**
```bash
# Clean build
npm run build

# Check for errors
npm run type-check
npm run lint
```

## 🛠️ **Common Commands**

### **Development:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### **Code Quality:**
```bash
npm run lint         # Check code style
npm run lint:fix     # Fix code style automatically
npm run type-check   # Check TypeScript types
npm run format       # Format code with Prettier
```

### **Security:**
```bash
# Pre-commit hooks run automatically
git add .
git commit -m "message"  # Will run security checks
```

## 🚨 **Emergency Procedures**

### **If App Won't Start:**
1. **Kill all processes**: `pkill -f "node" && pkill -f "vite"`
2. **Clear caches**: `rm -rf node_modules/.vite dist`
3. **Reinstall**: `npm install`
4. **Restart**: `npm run dev`

### **If Build Fails:**
1. **Check TypeScript**: `npm run type-check`
2. **Fix linting**: `npm run lint:fix`
3. **Clean build**: `rm -rf dist && npm run build`

### **If Environment Variables Don't Work:**
1. **Check Vercel**: Dashboard → Settings → Environment Variables
2. **Verify names**: Must start with `VITE_`
3. **Redeploy**: Push changes to trigger new deployment

## 📞 **Getting Help**

### **Debug Information to Collect:**
1. **Browser Console**: Screenshot of errors
2. **Terminal Output**: Copy/paste build logs
3. **Environment**: Local vs Production behavior
4. **Steps to Reproduce**: Exact sequence of actions

### **Useful Files:**
- `VERCEL_SETUP.md` - Environment variable setup
- `ENVIRONMENT.md` - Environment configuration
- `SECURITY.md` - Security guidelines

---

**Most issues can be resolved with the quick fixes above!** 🛠️
