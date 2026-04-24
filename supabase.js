import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ncxmsvnshjsxaclffssj.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeG1zdm5zaGpzeGFjbGZmc3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MTcwNTMsImV4cCI6MjA1Nzk5MzA1M30.eyJpc3MiOiJzdXBhYmFzZSJ9'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
