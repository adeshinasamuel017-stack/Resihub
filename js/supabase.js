// ===============================
// ResiHub Supabase Configuration
// ===============================

const SUPABASE_URL = "https://ojwnfcpjlsuxrpoanzvw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qd25mY3BqbHN1eHJwb2FuenZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMjg5MDEsImV4cCI6MjA5ODcwNDkwMX0.2MPBSGSgPxyKc5e3iPvnkcXyuAyrVMJvFQxDPSGUs-Q";
// Create the client
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
console.log("Supabase client:", supabaseClient);