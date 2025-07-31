# 🌍 Environment Setup Guide

## 🔧 **Local Development**

### **1. Create Environment File**
```bash
# Copy the template
cp env.example .env.local

# Edit with your actual values
nano .env.local
```

### **2. Frontend Environment Variables (.env.local)**
```env
# Supabase (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend URL (Required for API calls)
VITE_BACKEND_URL=http://localhost:3001/api

# Optional: Analytics
VITE_ANALYTICS_ID=your_analytics_id
```

### **3. Backend Environment Variables (server/.env)**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002,http://localhost:3003

# API Keys (Optional - MealDB has public API)
MEALDB_API_KEY=your_mealdb_api_key
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

## 🚀 **Production Deployment (Vercel)**

### **1. Frontend Deployment**
**Environment Variables for Vercel Frontend:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=https://your-backend-domain.vercel.app/api
VITE_ANALYTICS_ID=your_analytics_id
```

### **2. Backend Deployment (Vercel Functions)**
**Environment Variables for Vercel Backend:**
```env
MEALDB_API_KEY=your_mealdb_api_key
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

### **3. Deployment Configuration**
**Frontend:**
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

**Backend:**
- Framework Preset: Node.js
- Root Directory: `server`
- Build Command: `npm install`
- Output Directory: `api`

## 🛡️ **Security Notes**

### **✅ Safe to Expose (Public Keys):**
- `VITE_SUPABASE_URL` - Public project URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key (designed to be public)

### **❌ Never Expose:**
- Supabase Service Role Key (if you had one)
- OAuth Client Secrets
- Real API keys for paid services

## 🔄 **Fallback System**

The app includes a **fallback system** that ensures it always works:

1. **Local Development**: Uses `.env.local` values
2. **Production**: Uses environment variables if set, otherwise uses safe fallbacks
3. **No Errors**: App never crashes due to missing environment variables

## 🚨 **Troubleshooting**

### **1. Port Configuration Issues**
**Error:** `listen EADDRINUSE: address already in use :::3001`
**Solution:**
```bash
# Find and kill the process using port 3001
lsof -i :3001
kill <PID>

# Or use a different port
PORT=3003 npm start
```

### **2. API 404 Errors**
**Error:** `api/api/recipes/random:1 Failed to load resource: 404`
**Causes:**
- Incorrect `VITE_BACKEND_URL` configuration
- Double `/api/` path in API calls
- Backend server not running

**Solution:**
- Verify `VITE_BACKEND_URL=http://localhost:3001/api` in `.env.local`
- Ensure backend server is running on port 3001
- Check API calls don't have duplicate `/api/` paths

### **3. CORS Errors**
**Error:** `Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3002' has been blocked by CORS policy`
**Solution:**
- Update `ALLOWED_ORIGINS` in backend `.env` to include your frontend port
- Restart backend server after changing CORS settings

### **4. Environment Variables Not Loading**
**Error:** API calls using default values instead of environment variables
**Solution:**
- Ensure `.env.local` file exists in project root
- Restart development server after adding environment variables
- Check variable names start with `VITE_` for frontend

### **5. Vercel Deployment Issues**
**Error:** API calls failing in production
**Solution:**
- Set correct `VITE_BACKEND_URL` for production domain
- Ensure backend is deployed as Vercel Functions
- Check environment variables are set in Vercel dashboard

### **6. Authentication Not Working**
1. Check Supabase Auth settings
2. Verify redirect URIs are correct
3. Ensure Google OAuth is properly configured

### **7. Build Fails**
1. Run `npm run build` locally to test
2. Check Vercel build logs
3. Verify all TypeScript errors are resolved

## 📋 **Quick Setup Checklist**

- [ ] Copy `env.example` to `.env.local`
- [ ] Add your Supabase URL and anon key
- [ ] Test locally with `npm run dev`
- [ ] Set Vercel environment variables
- [ ] Deploy and test production

## 🔍 **Verification**

### **Test Local Setup:**
```bash
npm run dev
# Should start without environment errors
```

### **Test Production Build:**
```bash
npm run build
# Should build successfully
```

---

**The app is now bulletproof against environment variable issues!** 🛡️
