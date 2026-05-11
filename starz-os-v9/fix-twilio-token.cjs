const fs = require('fs');
const path = require('path');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/supabase/functions/twilio-token/index.ts';

const fn = `import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // Match exact secret names from Supabase secrets list
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
    const TWILIO_API_KEY     = Deno.env.get('TWILIO_API_KEY') || ''
    const TWILIO_API_SECRET  = Deno.env.get('TWILIO_API_KEY_SECRET') || Deno.env.get('TWILIO_API_SECRET') || ''
    const TWILIO_TWIML_APP   = Deno.env.get('TWILIO_TWIML_APP_SID') || ''

    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET) {
      console.error('Missing Twilio creds:', { 
        hasSid: !!TWILIO_ACCOUNT_SID, 
        hasKey: !!TWILIO_API_KEY, 
        hasSecret: !!TWILIO_API_SECRET 
      })
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured', debug: { hasSid: !!TWILIO_ACCOUNT_SID, hasKey: !!TWILIO_API_KEY, hasSecret: !!TWILIO_API_SECRET } }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    const now      = Math.floor(Date.now() / 1000)
    const jti      = \`\${TWILIO_API_KEY}-\${now}\`
    const identity = 'starz-rep'

    const header = btoa(JSON.stringify({ cty: 'twilio-fpa;v=1', typ: 'JWT', alg: 'HS256' }))
      .replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_')

    const grant = TWILIO_TWIML_APP
      ? { voice: { incoming: { allow: true }, outgoing: { application_sid: TWILIO_TWIML_APP } } }
      : { voice: { incoming: { allow: true } } }

    const payload = btoa(JSON.stringify({
      jti,
      iss: TWILIO_API_KEY,
      sub: TWILIO_ACCOUNT_SID,
      nbf: now,
      exp: now + 3600,
      grants: { identity, ...grant },
    })).replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_')

    const enc       = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw', enc.encode(TWILIO_API_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(\`\${header}.\${payload}\`))
    const sig    = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
      .replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_')

    const token = \`\${header}.\${payload}.\${sig}\`

    return new Response(
      JSON.stringify({ token, identity }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
`;

fs.writeFileSync(FILE, Buffer.from(fn, 'utf8'));
console.log('✅ Updated twilio-token/index.ts with correct secret names');
console.log('Now deploy:');
console.log('npx supabase functions deploy twilio-token --project-ref szguizvpiiuiyugrjeks');
