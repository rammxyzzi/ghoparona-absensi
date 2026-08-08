import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://XYZ.supabase.co'; // GANTI DENGAN URL SUPABASE KAMU
const supabaseKey = 'eyJhbG...'; // GANTI DENGAN ANON KEY SUPABASE KAMU

export const supabase = createClient(supabaseUrl, supabaseKey);
