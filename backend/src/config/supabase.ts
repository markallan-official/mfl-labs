import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://yvaidjzhhejrfgpovzmm.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWlkanpoaGVqcmZncG92em1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDMxOTcsImV4cCI6MjA4NzYxOTE5N30.uyREMgiTD5o5it4SB5xFoBalKItB_5z-ehOFafQl_vo';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[SUPABASE] ERROR: Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables!');
}

console.log(`[SUPABASE] Connecting to: ${supabaseUrl}`);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseConfig = {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    isConfigured: !!supabaseUrl && !!supabaseAnonKey,
};

export default supabase;
