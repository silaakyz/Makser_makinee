// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// Supabase bilgilerin
const supabaseUrl = "https://zkjbbqqrjanlfpeybajt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpramJicXFyamGZwZXliYWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTM1OTUsImV4cCI6MjA3OTY2OTU5NX0.kLhozeMLcLp9kInILAFZ9Qr14zTYSFiyFS8MBl16Y7I";

// Supabase client oluştur
export const supabase = createClient(supabaseUrl, supabaseKey);
