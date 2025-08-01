# 🔐 Security Guidelines

## 🚨 CRITICAL: Environment Variables

### Never Commit These Files:

- `.env`
- `.env.local`
- `.env.*`
- `*.env`
- Any file containing API keys

### Safe Files to Commit:

- `env.example` (template with placeholder values)
- `src/vite-env.d.ts` (TypeScript declarations)

## 🔑 API Key Management

### Current API Keys (ROTATE THESE IMMEDIATELY):

1. **Supabase URL & Anon Key** - Rotate in Supabase Dashboard
2. **Google OAuth Credentials** - Rotate in Google Cloud Console
3. **Any other API keys** - Check all services

### How to Rotate Keys:

#### Supabase:

1. Go to Supabase Dashboard → Settings → API
2. Generate new API keys
3. Update your `.env.local` file
4. Update Vercel environment variables

#### Google OAuth:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create new OAuth 2.0 Client ID
3. Update Supabase Auth settings
4. Update redirect URIs

## 🛡️ Security Best Practices

### 1. Environment Variables

```bash
# ✅ DO: Use .env.local for local development
cp env.example .env.local
# Edit .env.local with your actual keys

# ❌ DON'T: Never commit .env files
git add .env.local  # NEVER DO THIS
```

### 2. Pre-commit Security Checks

The pre-commit hook automatically checks for:

- Environment files in commits
- API keys in staged files
- Security vulnerabilities

### 3. Vercel Environment Variables

For production, set environment variables in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable from your `.env.local`
3. Never commit production keys

## 🚨 Emergency Response

### If API Keys Are Exposed:

1. **IMMEDIATELY** rotate all exposed keys
2. Check Git history for other exposures
3. Review all commits for sensitive data
4. Update all services with new keys
5. Monitor for unauthorized usage

### Git History Cleanup:

```bash
# Remove file from Git history (DANGEROUS - only if necessary)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local.backup" \
  --prune-empty --tag-name-filter cat -- --all
```

## 📋 Security Checklist

- [ ] Rotate all exposed API keys
- [ ] Update `.env.local` with new keys
- [ ] Update Vercel environment variables
- [ ] Verify `.gitignore` includes all env patterns
- [ ] Test pre-commit security hooks
- [ ] Review all recent commits for sensitive data
- [ ] Set up monitoring for API key usage
- [ ] Document incident response procedures

## 🔍 Monitoring

### GitGuardian Integration:

- Set up GitGuardian for your repository
- Configure alerts for secret detection
- Review alerts immediately

### Regular Security Audits:

- Weekly: Check for new environment files
- Monthly: Rotate API keys
- Quarterly: Security review of dependencies

## 📞 Emergency Contacts

If you discover a security breach:

1. **IMMEDIATELY** rotate all affected keys
2. Document the incident
3. Review and update security procedures
4. Consider professional security audit

---

**Remember: Security is everyone's responsibility!**
