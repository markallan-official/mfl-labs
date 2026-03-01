# Deployment Guide - MFL LABS SaaS

This guide outlines the steps to deploy your SaaS platform to a production environment using **Vercel** (Frontend) and **Supabase** (Backend/Database).

## 1. Supabase Configuration (Backend)

Ensure your Supabase project is ready for production:

1.  **Site URL**: Update your `Site URL` in `Authentication > Settings > Configuration` to your production URL (e.g., `https://mfl-labs.vercel.app`).
2.  **Redirect URLs**: Add your production URL and common redirect patterns (e.g., `https://mfl-labs.vercel.app/**`) to the `Redirect URLs` list.
3.  **Database Tables**: Ensure all tables (`users`, `user_assignments`, etc.) are created and RLS (Row Level Security) policies are active.
4.  **SMTP**: For reliable emails, configure a custom SMTP provider (like Sengrid or Resend) in `Authentication > Settings > SMTP`.

## 2. Vercel Deployment (Zero-Config)

I have hardcoded the credentials into the system CORE for you. You now only need to deploy with **ZERO** configuration.

1.  **Import**: Select your repository `MFL-LAB` in Vercel.
2.  **Project Name**: Use `mfl-labs`.
3.  **Root Directory**: Keep it as the **Default (Root)**.
4.  **Framework Preset**: Select **`Vite`**.
5.  **Environment Variables**: **SKIP THIS SECTION**. (Leave it empty).
6.  **Deploy**: Vercel will automatically build the frontend and serve the API.

## 3. Post-Deployment Steps

1.  **Initial Admin Setup**: Manually set your status to `admin` in the Supabase `users` table for your email `markmallan01@gmail.com`.
2.  **Access Approvals**: Use the **Admin Control Panel** to approve new requests.

## 4. Scaling Considerations

*   **Database Scaling**: Monitor Supabase usage and upgrade plans if your user base grows significantly.
*   **API Performance**: Vercel Serverless Functions have a 10s execution limit on Hobby plans. For heavy backend tasks, consider Supabase Edge Functions.

---
*Created by Antigravity for MFL LABS*
