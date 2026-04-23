import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://ncxmsvnshjsxaclffssj.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeG1zdm5zaGpzeGFjbGZmc3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTg1MTIsImV4cCI6MjA4OTY5NDUxMn0.Gr9Uj5mtwshipsE-ya4xiB9AVabCtKPs_K_WS6fsmmc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
