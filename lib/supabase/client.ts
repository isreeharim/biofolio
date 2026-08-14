import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zzdoibodjjltkbqrdlzn.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZG9pYm9kampsdGticXJkbHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTI1NTMsImV4cCI6MjEwMjI4ODU1M30.fKEJnLMSlehzY2oiK7zQ9rVnN6iMvy8U3yRRf9F8K-U";

  return createBrowserClient(url, anonKey);
}
