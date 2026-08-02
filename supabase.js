import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://lwzeobrzpzjxiywdwuws.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3emVvYnJ6cHpqeGl5d2R3dXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0ODE2NDgsImV4cCI6MjEwMTA1NzY0OH0.kSQ3yvm2JwpPo4qRkRDxmEpkwrzpktGYBU0HAg3PXx4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)