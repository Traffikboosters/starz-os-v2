import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

// Default client (public schema)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Schema-specific clients
// Non-public schemas require both Accept-Profile and Content-Profile headers
export function schemaClient(schema: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema },
    global: {
      headers: {
        'Accept-Profile': schema,
        'Content-Profile': schema,
      },
    },
  })
}

// Pre-built schema clients for all STARZ-OS schemas
export const db = {
  crm: schemaClient('crm'),
  deals: schemaClient('deals'),
  dialer: schemaClient('dialer'),
  analytics: schemaClient('analytics'),
  security: schemaClient('security'),
  outreach: schemaClient('outreach'),
  marketing: schemaClient('marketing'),
  steve: schemaClient('steve'),
  rico: schemaClient('rico'),
  hr: schemaClient('hr'),
  seo: schemaClient('seo'),
  intelligence: schemaClient('intelligence'),
  authority: schemaClient('authority'),
  ai: schemaClient('ai'),
  sales: schemaClient('sales'),
}

export const SUPABASE_PROJECT_ID = 'szguizvpiiuiyugrjeks'
export const SUPABASE_FUNCTIONS_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1`
