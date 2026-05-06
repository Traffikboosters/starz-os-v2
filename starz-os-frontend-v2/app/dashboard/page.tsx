import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) return <pre>{error.message}</pre>
  return <pre>{JSON.stringify(data.user, null, 2)}</pre>
}