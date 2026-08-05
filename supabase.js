<!-- Supabase JS Client CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>


// --- KONFIGURASI SUPABASE ---
const SUPABASE_URL = 'https://lwzeobrzpzjxiywdwuws.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3emVvYnJ6cHpqeGl5d2R3dXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0ODE2NDgsImV4cCI6MjEwMTA1NzY0OH0.kSQ3yvm2JwpPo4qRkRDxmEpkwrzpktGYBU0HAg3PXx4';

// Inisialisasi Klien Supabase global
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
