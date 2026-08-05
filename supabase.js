// --- KONFIGURASI SUPABASE ---
const SUPABASE_URL = 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Inisialisasi Klien Supabase global
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
