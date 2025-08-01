# Supabase Authentication Setup Guide

## 🔐 Fixing Redirect Issues

If you're experiencing redirect issues where signing in on production redirects to localhost, follow these steps:

## 📋 Supabase Dashboard Configuration

### 1. Go to Supabase Dashboard
1. Visit [supabase.com](https://supabase.com)
2. Select your **Ezyum Food App** project
3. Go to **Authentication** → **Settings**

### 2. Configure Site URL
Set the **Site URL** to:
```
https://ezyum.com
```

### 3. Configure Redirect URLs
Add these URLs to the **Redirect URLs** list:

#### Development URLs:
```
http://localhost:3000/auth/callback
http://localhost:3000/
```

#### Production URLs:
```
https://ezyum.com/auth/callback
https://ezyum.com/
https://your-vercel-app.vercel.app/auth/callback
https://your-vercel-app.vercel.app/
```

### 4. Save Changes
Click **Save** to apply the changes.

## 🔧 Environment Variables

### For Production (Vercel)
Add this environment variable in your Vercel dashboard:
```
VITE_SITE_URL=https://ezyum.com
```

### For Development (.env.local)
```
VITE_SITE_URL=http://localhost:3000
```

## 🧪 Testing

### Test Development
1. Start your local servers
2. Go to `http://localhost:3000`
3. Try signing in with Google
4. Should redirect to `http://localhost:3000/auth/callback`

### Test Production
1. Deploy to Vercel
2. Go to `https://ezyum.com`
3. Try signing in with Google
4. Should redirect to `https://ezyum.com/auth/callback`

## 🚨 Common Issues

### Issue 1: Still redirecting to localhost
**Solution:**
- Check that Supabase redirect URLs include your production domain
- Verify `VITE_SITE_URL` is set correctly in Vercel
- Clear browser cache and cookies

### Issue 2: "Invalid redirect URL" error
**Solution:**
- Add your exact production URL to Supabase redirect URLs
- Include both with and without trailing slash
- Wait a few minutes for changes to propagate

### Issue 3: Google OAuth not working
**Solution:**
- Verify Google OAuth is enabled in Supabase
- Check that Google OAuth client ID and secret are set
- Ensure authorized domains include your production domain

## 📱 Mobile Considerations

For mobile apps or PWA, you might also need:
```
https://ezyum.com/auth/callback
https://ezyum.com/
```

## 🔍 Debugging

### Check Current Configuration
In browser console, look for:
```
🔐 Auth redirect URL: https://ezyum.com/auth/callback
```

### Verify Supabase Settings
1. Go to Supabase Dashboard
2. Authentication → Settings
3. Check Site URL and Redirect URLs
4. Ensure they match your production domain

## 🚀 Deployment Checklist

- [ ] Supabase Site URL set to production domain
- [ ] Redirect URLs include production domain
- [ ] `VITE_SITE_URL` environment variable set in Vercel
- [ ] Google OAuth configured in Supabase
- [ ] Test sign-in flow in production
- [ ] Verify redirect works correctly
