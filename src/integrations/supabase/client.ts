import { createClient } from "@supabase/supabase-js";

// Supabase Project bilgilerini buraya koy
const SUPABASE_URL = "https://zkjbbqqrjanlfpeybajt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpramJicXFyamFubGZwZXliYWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTM1OTUsImV4cCI6MjA3OTY2OTU5NX0.kLhozeMLcLp9kInILAFZ9Qr14zTYSFiyFS8MBl16Y7I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
