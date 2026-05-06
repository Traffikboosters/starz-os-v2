import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL https://szguizvpiiuiyugrjeks.supabase.co
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z3VpenZwaWl1aXl1Z3JqZWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjU4OTIsImV4cCI6MjA3NjkwMTg5Mn0.VyOzV1XfmO0faC5EoqU35s0YquEpJ-cCcsPJhm5nI5Y
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEYeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z3VpenZwaWl1aXl1Z3JqZWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjU4OTIsImV4cCI6MjA3NjkwMTg5Mn0.VyOzV1XfmO0faC5EoqU35s0YquEpJ-cCcsPJhm5nI5Y

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient(url, key)
}

