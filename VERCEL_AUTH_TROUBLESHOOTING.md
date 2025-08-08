# Vercel Authentication Troubleshooting Guide

## 🔧 What I Fixed in the Workflow:

### 1. **Added Explicit Environment Variables**
```yaml
env:
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### 2. **Removed `working-directory`**
- Removed `working-directory: ./` to avoid path issues
- Let Vercel CLI run in the default directory

### 3. **Added Debug Steps**
```yaml
- name: Debug Vercel authentication
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
  run: npx vercel whoami --token=$VERCEL_TOKEN
```

### 4. **Added CLI Fallback**
```yaml
- name: Deploy to Vercel - CLI Fallback
  if: failure()
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
  run: npx vercel --prod --token=$VERCEL_TOKEN --yes
```

## 🔍 GitHub Secrets Checklist:

### Required Secrets (Settings → Secrets and variables → Actions):

1. **`VERCEL_TOKEN`** (case-sensitive)
   - Get from: Vercel Dashboard → Settings → Tokens
   - Create new token if needed

2. **`VERCEL_ORG_ID`** (case-sensitive)
   - Get from: Vercel Dashboard → Settings → General → Org ID

3. **`VERCEL_PROJECT_ID`** (case-sensitive)
   - Get from: Vercel Dashboard → Project Settings → General → Project ID

## 🚨 Common Issues & Solutions:

### Issue: "You must re-authenticate"
**Solution:**
- ✅ Check secret names are exactly correct (case-sensitive)
- ✅ Verify token is valid and not expired
- ✅ Ensure org/project IDs match current project

### Issue: "Invalid token"
**Solution:**
- ✅ Generate new token in Vercel Dashboard
- ✅ Update `VERCEL_TOKEN` secret in GitHub
- ✅ Check token has correct permissions

### Issue: "Project not found"
**Solution:**
- ✅ Verify `VERCEL_PROJECT_ID` matches current project
- ✅ Check `VERCEL_ORG_ID` is correct
- ✅ Ensure project exists in the specified org

## 🧪 Testing Steps:

### 1. Check Debug Output
Look for this in GitHub Actions logs:
```
Debug Vercel authentication
npx vercel whoami --token=$VERCEL_TOKEN
```

Should show:
```
> Vercel CLI 25.1.0
> Authenticated as your-email@example.com
```

### 2. Check Action Method
If action method fails, look for:
```
Deploy to Vercel - Action Method
```

### 3. Check CLI Fallback
If action fails, CLI fallback should run:
```
Deploy to Vercel - CLI Fallback
```

## ✅ Success Indicators:

- ✅ Debug step shows "Authenticated as [your-email]"
- ✅ Action method completes successfully
- ✅ Or CLI fallback completes successfully
- ✅ Deployment appears in Vercel Dashboard
- ✅ No "re-authenticate" errors

## 🚀 If Still Failing:

1. **Regenerate Vercel Token:**
   - Go to Vercel Dashboard → Settings → Tokens
   - Create new token
   - Update GitHub secret

2. **Verify Project Settings:**
   - Check Vercel project is linked to GitHub repo
   - Verify auto-deploy is enabled

3. **Try Manual Deployment:**
   ```bash
   npx vercel --prod --token=YOUR_TOKEN
   ```

## 📋 Current Workflow Features:

- ✅ **Dual deployment methods** (action + CLI fallback)
- ✅ **Debug authentication** before deployment
- ✅ **Explicit environment variables**
- ✅ **Continue on error** to allow fallback
- ✅ **No artifact dependencies**
- ✅ **Simplified configuration**
