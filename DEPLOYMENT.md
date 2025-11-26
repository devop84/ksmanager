# Quick Deployment Guide for nssvb.kitemanager.com

## Initial Setup (One-Time)

### 1. Domain Configuration
- **Subdomain**: `nssvb.kitemanager.com`
- **DNS Record Type**: CNAME
- **Target**: `cname.vercel-dns.com`

### 2. DNS Setup Steps
1. Log in to your domain registrar (where `kitemanager.com` is managed)
2. Go to DNS Management
3. Add CNAME record:
   - **Name**: `nssvb`
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: 3600
4. Save and wait 5-60 minutes for propagation

### 3. Vercel Project Setup
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import your GitHub repository (or create new project)
3. Go to **Settings** → **Domains**
4. Add domain: `nssvb.kitemanager.com`
5. Follow DNS verification steps

### 4. Environment Variables
In Vercel Dashboard → **Settings** → **Environment Variables**, ensure:
- `VITE_NEON_DATABASE_URL` is set (copy from `DATABASE_URL`)
- All environments selected (Production, Preview, Development)

### 5. Neon Database Integration
1. In Vercel Dashboard → **Settings** → **Integrations**
2. Add **Neon** integration
3. Select your Neon project and branch
4. This creates `DATABASE_URL` automatically

## Daily Update Workflow

### Quick Update (Recommended)
```bash
# 1. Make your changes
# 2. Test locally
npm run dev

# 3. Build to check for errors
npm run build

# 4. Commit and push
git add .
git commit -m "Update description"
git push origin main

# 5. Vercel automatically deploys in ~2-3 minutes
# 6. Check deployment status in Vercel dashboard
# 7. Visit https://nssvb.kitemanager.com to verify
```

### Testing Before Production
```bash
# 1. Create feature branch
git checkout -b feature/update-name

# 2. Make changes and test
npm run dev

# 3. Push branch
git push origin feature/update-name

# 4. Vercel creates preview URL automatically
# 5. Test on preview URL
# 6. If good, merge to main:
git checkout main
git merge feature/update-name
git push origin main
```

## Troubleshooting

### DNS Not Working
- Check DNS propagation: [whatsmydns.net](https://www.whatsmydns.net)
- Verify CNAME record is correct
- Wait up to 48 hours for full propagation
- Check Vercel domain settings for verification status

### Deployment Fails
- Check build logs in Vercel dashboard
- Verify environment variables are set
- Test build locally: `npm run build`
- Check for syntax errors in code

### Database Connection Issues
- Verify `VITE_NEON_DATABASE_URL` is set in Vercel
- Check Neon dashboard for database status
- Ensure database schema is up to date

### Rollback Deployment
1. Go to Vercel Dashboard → **Deployments**
2. Find previous working deployment
3. Click three dots (⋯) → **Promote to Production**

## Useful Links
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Neon Dashboard](https://console.neon.tech)
- [DNS Propagation Checker](https://www.whatsmydns.net)

## Notes
- Updates deploy automatically on every `git push` to main branch
- Preview deployments are created for all branches/PRs
- SSL certificate is automatically provisioned by Vercel
- Database migrations must be run manually in Neon dashboard

