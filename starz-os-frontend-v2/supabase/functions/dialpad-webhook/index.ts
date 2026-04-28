import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const DIALPAD_COMPANY_ID = '6461005901602816'

Deno.serve(async (req: Request) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()
    console.log('Dialpad webhook received:', JSON.stringify(body))

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const event = body.event || body.type || ''
    const callId = body.call_id || body.id || ''
    const dialpadUserId = body.user_id || body.agent_id || ''
    const phone = body.phone_number || body.external_number || body.to_number || ''
    const direction = body.direction || 'outbound'
    const status = body.state || body.status || 'unknown'
    const duration = body.duration || 0
    const recordingUrl = body.recording_url || null
    const transcript = body.transcription || body.transcript || null
    const targetId = body.target?.id || body.target_id || null

    if (!callId) {
      return new Response(JSON.stringify({ ok: true, msg: 'No call_id, ignoring' }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    // Map Dialpad states to our status
    const mappedStatus = {
      'ringing': 'ringing',
      'active': 'active',
      'connected': 'active',
      'hangup': 'completed',
      'voicemail': 'voicemail',
      'missed': 'missed',
      'declined': 'declined',
    }[status.toLowerCase()] || status

    // Upsert call record
    const { error } = await sb.schema('dialer').from('calls').upsert({
      dialpad_call_id: callId,
      dialpad_user_id: dialpadUserId,
      dialpad_target_id: targetId,
      phone: phone,
      phone_number: phone,
      direction: direction,
      status: mappedStatus,
      call_status: mappedStatus,
      duration: duration,
      recording_url: recordingUrl,
      transcript: transcript,
      org_id: '00000000-0000-0000-0000-000000000301',
      started_at: body.date_started ? new Date(body.date_started * 1000).toISOString() : new Date().toISOString(),
      ended_at: body.date_ended ? new Date(body.date_ended * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'dialpad_call_id', ignoreDuplicates: false })

    if (error) {
      console.error('Upsert error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    // If call completed + transcript exists, update call queue
    if (mappedStatus === 'completed' && phone) {
      await sb.schema('dialer').from('call_queue').update({
        status: 'called',
        last_call_at: new Date().toISOString(),
      }).eq('phone', phone)
    }

    return new Response(JSON.stringify({ ok: true, call_id: callId, status: mappedStatus }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Dialpad webhook error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
