import { createClient } from '@supabase/supabase-js';

// Vite env vars — set in .env.local for dev, and in Netlify dashboard for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yvaidjzhhejrfgpovzmm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWlkanpoaGVqcmZncG92em1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDMxOTcsImV4cCI6MjA4NzYxOTE5N30.uyREMgiTD5o5it4SB5xFoBalKItB_5z-ehOFafQl_vo';

console.log('[SUPABASE CLIENT] URL:', supabaseUrl ? '✅ Set' : '❌ Missing');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Avoid Navigator LockManager by not persisting session to localStorage
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
});

export default supabase;
