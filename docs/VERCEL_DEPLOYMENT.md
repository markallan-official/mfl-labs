# Vercel Deployment Setup Guide (MFL LABS)

## Prerequisites

- GitHub account with `markallan-official` username
- Vercel account (linked to your GitHub)
- Supabase project created (Ref: `yvaidjzhhejrfgpovzmm`)

## Step 1: Link GitHub Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your GitHub repository: `markallan-official/mfl-labs`
4. Click "Import"

## Step 2: Configure Environment Variables in Vercel

In Vercel project settings (Settings > Environment Variables), add these **EXACT** variables:

### **Required for Frontend (Vite)**
| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://yvaidjzhhejrfgpovzmm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWlkanpoaGVqcmZncG92em1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDMxOTcsImV4cCI6MjA4NzYxOTE5N30.uyREMgiTD5o5it4SB5xFoBalKItB_5z-ehOFafQl_vo` |
| `FRONTEND_URL` | `https://mfl-labs.vercel.app` (or your custom domain) |

### **Required for Backend (Node.js)**
| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://yvaidjzhhejrfgpovzmm.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWlkanpoaGVqcmZncG92em1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDMxOTcsImV4cCI6MjA4NzYxOTE5N30.uyREMgiTD5o5it4SB5xFoBalKItB_5z-ehOFafQl_vo` |
| `SMTP_USER` | (Your Gmail/SMTP Email) |
| `SMTP_PASS` | (Your App Password) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |

## Step 3: Configure Build Settings in Vercel

Vercel should automatically detect the settings from `vercel.json`, but verify these:
- **Framework Preset:** `Vite`
- **Root Directory:** `./` (Project root)
- **Build Command:** `npm run build --workspace=@saas/frontend`
- **Output Directory:** `frontend/dist`
- **Install Command:** `npm install`

## Step 4: Verification

1. After deployment, visit `https://mfl-labs.vercel.app`.
2. Check the console for `[SUPABASE CLIENT] URL: ✅ Set`.
3. Try to log in. The frontend will communicate with the backend via the `/api` proxy.

## Troubleshooting

### "this.lock is not a function"
This was fixed by removing the custom lock mock in `supabase.ts`. Ensure your local code matches the latest push.

### "Safety latch triggered"
This was fixed by adding logic to `AuthContext.tsx` to wait for Supabase to process redirect codes (`?code=...`) before rendering the app.

### API Returns 404
Ensure `vercel.json` has the correct rewrites for `/api/:path*` pointing to `/api/index.ts`.
- Frontend: Change vite port in `vite.config.ts`
- Backend: Change API_PORT in `.env`

### Supabase connection fails
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check Supabase project is active
- Verify network connectivity

## Deployment Workflow

1. Push to `main` branch
2. GitHub Actions workflow triggers automatically
3. Tests run (if configured)
4. Builds project
5. Deploys to Vercel
6. Frontend available at: https://your-domain.vercel.app
