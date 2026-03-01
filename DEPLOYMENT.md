# Deployment Guide - MFL LABS SaaS

This guide outlines the steps to deploy your SaaS platform to a production environment using **Vercel** (Frontend) and **Supabase** (Backend/Database).

## 1. Supabase Configuration (Backend)

Ensure your Supabase project is ready for production:

1.  **Site URL**: Update your `Site URL` in `Authentication > Settings > Configuration` to your production URL (e.g., `https://mfl-labs.vercel.app`).
2.  **Redirect URLs**: Add your production URL and common redirect patterns (e.g., `https://mfl-labs.vercel.app/**`) to the `Redirect URLs` list.
3.  **Database Tables**: Ensure all tables (`users`, `user_assignments`, etc.) are created and RLS (Row Level Security) policies are active.
4.  **SMTP**: For reliable emails, configure a custom SMTP provider (like Sengrid or Resend) in `Authentication > Settings > SMTP`.

## 2. Vercel Deployment

You should deploy the **Frontend** and **Backend** as two separate projects in Vercel to allow them to scale and function correctly.

### A. Frontend Deployment (Project: `mfl-labs-ui`)
1.  **Import**: Select your repository in Vercel.
2.  **Root Directory**: Set this to **`frontend`**.
3.  **Framework Preset**: Select **`Vite`**.
4.  **Environment Variables**:
    *   `VITE_SUPABASE_URL`: Your Supabase URL.
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
5.  **Deploy**: This will serve your main Assembly Matrix dashboard.

### B. Backend Deployment (Project: `mfl-labs-api`)
1.  **Import**: Select the same repository again for a new project.
2.  **Root Directory**: Set this to **`backend`**.
3.  **Framework Preset**: Select **`Other`** or **`Node.js`**. (Vercel will detect the `vercel.json` inside the backend folder).
4.  **Environment Variables**:
    *   `SUPABASE_URL`: (Note: NO `VITE_` prefix here!)
    *   `SUPABASE_ANON_KEY`: (Note: NO `VITE_` prefix here!)
    *   `SMTP_USER`, `SMTP_PASS`, etc.
5.  **Deploy**: This will host your Express API server.

## 3. Post-Deployment Steps

1.  **CORS**: Update the `CORS_ORIGIN` environment variable in your **Backend** project to include your **Frontend** Vercel URL.
2.  **Initial Admin Setup**: Manually set your status to `admin` in the Supabase `users` table for your primary email (e.g., `markmallan01@gmail.com`).
3.  **Access Approvals**: Use the **Admin Control Panel** to review and approve new access requests.

## 4. Scaling Considerations

*   **Database Scaling**: Monitor Supabase usage and upgrade plans if your user base grows significantly.
*   **API Performance**: Vercel Serverless Functions have a 10s execution limit on Hobby plans. For heavy backend tasks, consider Supabase Edge Functions.

---
*Created by Antigravity for MFL LABS*
