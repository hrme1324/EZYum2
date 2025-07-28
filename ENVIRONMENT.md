# 🌍 Environment Setup Guide

## 🔧 **Local Development**

### **1. Create Environment File**
```bash
# Copy the template
cp env.example .env.local

# Edit with your actual values
nano .env.local
```

### **2. Required Variables**
```env
# Supabase (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: AI Services (for future features)
VITE_OPENAI_API_KEY=your_openai_key
VITE_MEALDB_API_KEY=your_mealdb_key
VITE_HUGGINGFACE_TOKEN=your_huggingface_token
```

## 🚀 **Production Deployment (Vercel)**

### **1. Set Environment Variables in Vercel**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable from your `.env.local`
3. Set to **Production** environment

### **2. Required Production Variables**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

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

### **Error: "Missing Supabase environment variables"**
**Solution**: The app now uses fallback values automatically. This error should never appear again.

### **Authentication Not Working**
1. Check Supabase Auth settings
2. Verify redirect URIs are correct
3. Ensure Google OAuth is properly configured

### **Build Fails**
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
