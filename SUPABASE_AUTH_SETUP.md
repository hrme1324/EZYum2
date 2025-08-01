# Supabase Authentication Setup Guide

## 🔧 Required Configuration

### 1. Supabase Dashboard Configuration

Go to your Supabase project dashboard and configure the following:

#### **Authentication > URL Configuration**
- **Site URL**: `https://ezyum.com`
- **Redirect URLs**: Add these URLs:
  ```
  https://ezyum.com/auth/callback
  http://localhost:3000/auth/callback
  https://your-vercel-domain.vercel.app/auth/callback
  ```

#### **Authentication > Providers > Google**
- **Enabled**: ✅ Yes
- **Client ID**: Your Google OAuth Client ID
- **Client Secret**: Your Google OAuth Client Secret
- **Redirect URL**: `https://ezyum.com/auth/callback`

### 2. Google OAuth Configuration

In your Google Cloud Console:

#### **OAuth 2.0 Client IDs > Authorized redirect URIs**
Add these redirect URIs:
```
https://ezyum.com/auth/callback
http://localhost:3000/auth/callback
https://your-vercel-domain.vercel.app/auth/callback
```

### 3. Environment Variables

#### **Frontend (.env.local)**
```bash
VITE_SUPABASE_URL=https://whclrrwwnffirgcngeos.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=https://ezyum.com
```

#### **Backend (server/.env)**
```bash
SUPABASE_URL=https://whclrrwwnffirgcngeos.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
ALLOWED_ORIGINS=https://ezyum.com,http://localhost:3000
```

### 4. Vercel Environment Variables

In your Vercel dashboard, set these environment variables:

#### **Frontend Variables**
```
VITE_SUPABASE_URL=https://whclrrwwnffirgcngeos.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=https://ezyum.com
```

#### **Backend Variables**
```
SUPABASE_URL=https://whclrrwwnffirgcngeos.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
ALLOWED_ORIGINS=https://ezyum.com
```

## 🔍 Testing the Configuration

### Local Testing
1. Start your local server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign in with Google"
4. Should redirect to `https://ezyum.com/auth/callback` after Google auth

### Production Testing
1. Go to `https://ezyum.com`
2. Click "Sign in with Google"
3. Should redirect to `https://ezyum.com/auth/callback` after Google auth

## 🚨 Common Issues

### Issue: Still redirecting to localhost
**Solution**: Check that `VITE_SITE_URL=https://ezyum.com` is set in your environment variables

### Issue: "Invalid redirect URL" error
**Solution**: Add `https://ezyum.com/auth/callback` to your Supabase redirect URLs

### Issue: Google OAuth error
**Solution**: Add `https://ezyum.com/auth/callback` to your Google OAuth authorized redirect URIs

## 📱 Mobile Testing

The app should now work correctly on mobile devices:
- Access from phone: `https://ezyum.com`
- Sign in with Google
- Should redirect back to `https://ezyum.com` (not localhost)

## 🔧 Debug Information

The app now includes comprehensive debugging. Check the browser console for:
- `🔍 Auth URL Detection:` - Shows what domain is being detected
- `✅ Using VITE_SITE_URL:` - Confirms the environment variable is being used
- `🔐 Auth redirect URL:` - Shows the final redirect URL being sent to Supabase

## ✅ Verification Checklist

- [ ] Supabase Site URL set to `https://ezyum.com`
- [ ] Supabase Redirect URLs include `https://ezyum.com/auth/callback`
- [ ] Google OAuth redirect URIs include `https://ezyum.com/auth/callback`
- [ ] `VITE_SITE_URL=https://ezyum.com` in environment variables
- [ ] Local testing redirects to `ezyum.com`
- [ ] Mobile testing redirects to `ezyum.com`
- [ ] Production testing works correctly
