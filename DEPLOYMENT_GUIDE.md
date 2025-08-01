# 🚀 Complete Deployment Guide

## **Overview: Local vs Production**

### **Local Development:**

```
Frontend: http://localhost:3002/     ← Your web app
Backend:  http://localhost:3001/api  ← Your API server
```

### **Production (Vercel):**

```
Frontend: https://your-app.vercel.app/           ← Your web app
Backend:  https://your-app.vercel.app/api/       ← Your API (same domain!)
```

## **🔧 What Changes When Deploying**

### **1. Environment Variables**

**Local (.env.local):**

```env
VITE_BACKEND_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Production (Vercel Dashboard):**

```env
VITE_BACKEND_URL=https://your-app.vercel.app/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **2. Backend Configuration**

**Local (server/.env):**

```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002,http://localhost:3003
```

**Production (Vercel Dashboard):**

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app.vercel.app
MEALDB_API_KEY=your_mealdb_api_key
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

## **🚀 Step-by-Step Deployment**

### **Step 1: Prepare Your Code**

1. **Ensure your code is ready:**

   ```bash
   npm run build
   npm run lint
   ```

2. **Test locally:**

   ```bash
   # Terminal 1: Start backend
   cd server && npm start

   # Terminal 2: Start frontend
   npm run dev
   ```

### **Step 2: Deploy to Vercel**

1. **Install Vercel CLI:**

   ```bash
   npm i -g vercel
   ```

2. **Deploy:**

   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project or create new
   - Set project name
   - Confirm deployment

### **Step 3: Configure Environment Variables**

1. **Go to Vercel Dashboard**
2. **Navigate to:** Your Project → Settings → Environment Variables
3. **Add these variables:**

**Frontend Variables:**

```
VITE_BACKEND_URL=https://your-app.vercel.app/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ANALYTICS_ID=your_analytics_id
```

**Backend Variables:**

```
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app.vercel.app
MEALDB_API_KEY=your_mealdb_api_key
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

### **Step 4: Redeploy**

```bash
vercel --prod
```

## **🔍 How It Works**

### **Local Development:**

- **Frontend** runs on port 3002
- **Backend** runs on port 3001
- **API calls** go to `http://localhost:3001/api/`

### **Production (Vercel):**

- **Frontend** gets deployed as static files
- **Backend** gets deployed as Vercel Functions
- **API calls** go to `https://your-app.vercel.app/api/`
- **Same domain** for both frontend and backend!

## **📁 File Structure for Deployment**

```
your-app/
├── src/                    ← Frontend (React)
├── server/                 ← Backend (Express)
│   ├── server.js          ← Main server file
│   └── package.json       ← Backend dependencies
├── vercel.json            ← Vercel configuration
├── package.json           ← Frontend dependencies
└── .env.local             ← Local environment (not deployed)
```

## **🔧 Vercel Configuration (vercel.json)**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "functions": {
    "server/server.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## **✅ What You DON'T Need to Change**

### **Code Changes:**

- ✅ **No code changes needed** - your existing code works for both local and production
- ✅ **API calls work the same** - just different URLs
- ✅ **Environment variables handle the differences**

### **Supabase:**

- ✅ **No changes needed** - Supabase works the same in production
- ✅ **Same database** - local and production use the same Supabase project

## **🚨 Common Issues & Solutions**

### **1. API 404 Errors in Production**

**Cause:** Wrong `VITE_BACKEND_URL`
**Solution:** Set `VITE_BACKEND_URL=https://your-app.vercel.app/api`

### **2. CORS Errors**

**Cause:** Wrong `ALLOWED_ORIGINS`
**Solution:** Set `ALLOWED_ORIGINS=https://your-app.vercel.app`

### **3. Environment Variables Not Loading**

**Cause:** Variables not set in Vercel Dashboard
**Solution:** Add all required variables in Vercel Dashboard

### **4. Build Fails**

**Cause:** TypeScript errors or missing dependencies
**Solution:** Fix locally first, then redeploy

## **🔍 Testing Your Deployment**

### **1. Check Frontend:**

- Visit `https://your-app.vercel.app/`
- Should load your React app

### **2. Check Backend:**

- Visit `https://your-app.vercel.app/api/health`
- Should return `{"status":"OK"}`

### **3. Check API Endpoints:**

- Visit `https://your-app.vercel.app/api/recipes/random`
- Should return recipe data

## **📊 Monitoring**

### **Vercel Dashboard:**

- **Deployments:** Check build status
- **Functions:** Monitor API performance
- **Analytics:** Track usage

### **Supabase Dashboard:**

- **Database:** Monitor queries and performance
- **Auth:** Check user signups
- **Logs:** Debug issues

---

**🎉 That's it! Your app will work exactly the same in production as it does locally, just with different URLs.**
