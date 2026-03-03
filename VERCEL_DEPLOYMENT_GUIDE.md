# Vercel Deployment Guide - mfl-labs

## Overview
This guide explains how to deploy the mfl-labs SaaS platform frontend to Vercel.

## Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository (markallan-official/mfl-labs)
- Node.js 18 LTS or higher
- Supabase project configured

## Deployment Configuration

### Build Settings
The project uses the following build configuration:
- **Framework**: Vite
- **Build Command**: `npm run build --workspace=@saas/frontend`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install`
- **Node Version**: 18.x (LTS)

### Environment Variables Required
These must be set in Vercel Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://yvaidjzhhejrfgpovzmm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWlkanpoaGVqcmZncG92em1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDMxOTcsImV4cCI6MjA4NzYxOTE5N30.uyREMgiTD5o5it4SB5xFoBalKItB_5z-ehOFafQl_vo
FRONTEND_URL=https://mfl-labs.vercel.app
```

## Step-by-Step Deployment Instructions

### 1. Push Code to GitHub
```bash
git add .
git commit -m "chore: prepare for Vercel deployment"
git push origin main
```

### 2. Import Project to Vercel
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Click "Import Git Repository"
4. Select your GitHub repo: `markallan-official/mfl-labs`
5. Click "Import"

### 3. Configure Project
On the "Configure Project" screen:

**Project Name**
```
mfl-labs
```

**Framework Preset**
```
Vite
```

**Root Directory**
```
./
```

**Build Command** (auto-detected from Vite)
```
npm run build --workspace=@saas/frontend
```

**Output Directory**
```
frontend/dist
```

**Install Command**
```
npm install
```

### 4. Add Environment Variables
1. Scroll to "Environment Variables"
2. Add each variable:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://yvaidjzhhejrfgpovzmm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `FRONTEND_URL` | `https://mfl-labs.vercel.app` |

3. Click "Deploy"

### 5. Wait for Deployment
Vercel will:
1. Install dependencies (`npm install`)
2. Build the project (`npm run build --workspace=@saas/frontend`)
3. Deploy to the CDN

Check the Deployment page for progress. Expected duration: 2-5 minutes

## Vercel Configuration Files

### vercel.json
The `vercel.json` file in the root directory configures:
- Build command and output directory
- Environment variables
- Rewrites for SPA routing
- Security headers

Key settings:
```json
{
  "version": 2,
  "buildCommand": "npm run build --workspace=@saas/frontend",
  "outputDirectory": "frontend/dist",
  "installCommand": "npm install",
  "framework": "vite",
  "env": [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "FRONTEND_URL"
  ],
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

## Custom Domains

To add a custom domain (optional):
1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `mfl-labs.com`)
4. Follow DNS configuration instructions from your registrar

## Troubleshooting

### Build Fails with Module Resolution Error
**Problem**: `ERR_MODULE_NOT_FOUND` in build output

**Solution**:
1. Ensure all imports use proper file extensions (ESM)
2. Check that no `.js` or `.ts` extensions are missing from imports
3. Verify tsconfig.json has proper settings
4. Run locally: `npm run build --workspace=@saas/frontend`

### Chunk Size Warning but Build Succeeds
**Problem**: Vite warning about chunks > 500KB

**Impact**: None - just a performance hint. Can be fixed later by code-splitting.

**When to optimize**: After deployment when monitoring performance metrics.

### Build Command Not Found
**Problem**: `npm run build --workspace=@saas/frontend` fails with command not found

**Solution**:
1. Verify workspaces are defined in root `package.json`
2. Check `@saas/frontend` package name in `frontend/package.json`
3. Ensure all packages have been installed locally first

## Build Optimization Tips

### Reduce Bundle Size
The current bundle is optimized but can be improved with:

```typescript
// Use dynamic imports for large components
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
```

Update `vite.config.ts`:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@mui/material', '@emotion/react'],
        },
      },
    },
  },
});
```

### Enable Compression
Vercel automatically enables gzip compression. No configuration needed.

## Deployment Checklist

Before deploying to production:

- [x] All code commits pushed to GitHub
- [x] Environment variables configured in Vercel
- [x] Build succeeds locally: `npm run build --workspace=@saas/frontend`
- [x] No TypeScript errors: `npm run type-check --workspace=@saas/frontend`
- [x] Tests pass (if applicable): `npm test --workspace=@saas/frontend`
- [x] All imports use proper file extensions

## Backend API Integration

The frontend is deployed on Vercel, but the backend API runs separately.

### API Configuration
The frontend proxies API requests via environment configuration:

**Development** (`frontend/vite.config.ts`):
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
  },
}
```

**Production** (via `VITE_SUPABASE_URL`):
Frontend uses Supabase authentication and calls backend APIs based on configuration.

### Vercel Serverless Functions (Optional)
To add backend endpoints to Vercel, create files in `/api`:
```typescript
// /api/health.ts
export default function handler(req, res) {
  res.status(200).json({ status: 'ok' });
}
```

## Monitoring & Analytics

### Check Deployment Status
1. Go to https://vercel.com/dashboard
2. Click on "mfl-labs" project
3. View recent deployments and analytics

### View Build Logs
1. Click on a deployment
2. View "Build" logs for environment setup
3. View "Runtime Logs" for runtime errors

## Rollback to Previous Deployment

If a deployment has issues:

1. Go to Deployments tab
2. Find the working deployment
3. Click "..."  menu → "Promote to Production"

## Database Migrations (if needed)

Since this is a frontend-only deployment on Vercel, database migrations happen:
1. Separately on your backend server
2. Via Supabase dashboard for direct database changes
3. Automatically via CI/CD on backend deployment

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Router v6](https://reactrouter.com)
- [Supabase Documentation](https://supabase.com/docs)

## Support & Issues

If deployment fails:

1. Check build logs in Vercel dashboard
2. Run build locally to reproduce: `npm run build --workspace=@saas/frontend`
3. Check environment variables are set correctly
4. Verify Git repository has all required files pushed

---

**Last Updated**: March 3, 2026  
**Framework**: Vite + React  
**Platform**: Vercel  
**Status**: ✅ Ready for Production
