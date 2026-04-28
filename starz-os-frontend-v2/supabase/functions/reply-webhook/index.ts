const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY   = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL   = 'hello@traffikboosters.com';
const FROM_NAME    = 'Steve | Traffik Boosters';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function hasPhone(text: string): boolean {
  return /\+?1?[\s.\-]?\(?[0-9]{3}\)?[\s.\-]?[0-9]{3}[\s.\-]?[0-9]{4}/.test(text);
}

function detectIntent(msg: string, incoming?: string): string {
  if (incoming) return incoming;
  const l = msg.toLowerCase();
  if (l.includes('not interested') || l.includes('remove') || l.includes('stop') || l.includes('unsubscribe')) return 'not_interested';
  if (l.includes('interested') || l.includes('yes') || l.includes('when can') || l.includes("let's") || l.includes('sounds good') || l.includes('love to')) return 'interested';
  if (l.includes('how much') || l.includes('cost') || l.includes('price') || l.includes('included') || l.includes('package')) return 'question';
  if (l.includes('maybe') || l.includes('already have') || l.includes('using someone') || l.includes('not sure')) return 'maybe';
  return 'curious';
}

function buildResponse(intent: string, lead: any, leadHasPhone: boolean, phoneJustProvided: string | null): { subject: string; html: string } {
  const name = (lead.contact_name || lead.first_name || '').split(' ')[0];
  const hi   = name ? `Hi ${name},` : 'Hi,';
  const biz  = lead.business_name || lead.company_name || 'your business';
  const footer = `<div style="margin-top:28px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;align-items:center;gap:12px;"><img src="https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Steve.png" style="width:40px;height:40px;border-radius:50%;"/><div style="font-size:13px;color:#475569;"><strong style="color:#1e293b;">Steve</strong> -- Traffik Boosters<br/><a href="https://traffikboosters.com" style="color:#3b82f6;">traffikboosters.com</a></div></div>`;
  const wrap  = (b: string) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;line-height:1.7;color:#1e293b;">${b}${footer}</div>`;

  // Phone just captured in this reply
  if (phoneJustProvided) return {
    subject: `Got it - I'll call you shortly`,
    html: wrap(`<p>${hi}</p><p>Perfect -- I've got your number (<strong>${phoneJustProvided}</strong>) and I'll give you a call shortly.</p><p>I'll be calling from <strong>786-254-1592</strong> -- feel free to save it so you know it's me.</p><p>Looking forward to speaking with you about what we can do for ${biz}!</p>`)
  };

  // Interested but no phone -- ask for number
  if (intent === 'interested' && !leadHasPhone) return {
    subject: `Great - what's the best number to reach you?`,
    html: wrap(`<p>${hi}</p><p>That's great to hear!</p><p>What's the best phone number to reach you? A quick call is the fastest way to show you exactly what we can do for ${biz}.</p><p>Just reply with your number and I'll call you at a time that works.</p>`)
  };

  // Interested WITH phone -- offer booking slots
  if (intent === 'interested') return {
    subject: `Great - let's find a time to talk`,
    html: wrap(`<p>${hi}</p><p>That's great to hear!</p><p>I'd love to show you exactly what we can do for ${biz}. I have a few slots open this week:</p><ul style="line-height:2;"><li>Tomorrow 10am-12pm</li><li>Wednesday 2pm-4pm</li><li>Thursday anytime after 11am</li></ul><p>Just reply with what works and I'll lock it in. Talk soon!</p>`)
  };

  if (intent === 'question') return {
    subject: `Good question - here's exactly what's included`,
    html: wrap(`<p>${hi}</p><p>Happy to break it down!</p><p>Here's what we include for a business like ${biz}:</p><ul style="line-height:2;"><li>Local SEO -- show up when customers search near you</li><li>Review generation -- build trust and outrank competitors</li><li>Website optimization -- fast, mobile-ready, converting</li><li>Monthly reporting -- you see exactly what's working</li></ul>${!leadHasPhone ? `<p>I'd love to walk you through this on a quick call -- what's the best number to reach you?</p>` : `<p>Want to jump on a quick 10-minute call to go through this for ${biz} specifically?</p>`}`)
  };

  if (intent === 'maybe') return {
    subject: `No pressure - just want to make sure you have the full picture`,
    html: wrap(`<p>${hi}</p><p>Totally understand -- no pressure at all.</p><p>Most businesses we work with were in the same spot. Then they saw the numbers and it clicked.</p><p>Would it be worth a 10-minute call to see what the opportunity looks like in your market? If it doesn't make sense, I'll tell you straight.</p>${!leadHasPhone ? `<p>If yes, just reply with your phone number and I'll call you.</p>` : ''}`)
  };

  if (intent === 'not_interested') return {
    subject: `No problem - removing you now`,
    html: wrap(`<p>${hi}</p><p>Not a problem -- you won't hear from us again.</p><p>If anything changes, feel free to reach out at <a href="mailto:hello@traffikboosters.com" style="color:#3b82f6;">hello@traffikboosters.com</a>.</p><p>Wishing you and ${biz} all the best!</p>`)
  };

  // Curious / default
  return {
    subject: `Here's a bit more about what we do`,
    html: wrap(`<p>${hi}</p><p>Happy to share more!</p><p>We help businesses like ${biz} get found by customers who are actively searching right now.</p><p>Usually means 8-15 more leads per month within 60 days.</p>${!leadHasPhone ? `<p>Want to see what that looks like for ${biz}? Just reply with your phone number and I'll give you a quick call.</p>` : `<p>Want to jump on a quick call to see what this looks like for ${biz} specifically?</p>`}`)
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = await req.json();
    const { email, phone, message, lead_id, name, channel, intent: incomingIntent } = body;

    if (!message || (!email && !phone)) {
      return new Response(JSON.stringify({ error: 'message + email or phone required' }), { status: 400, headers: cors });
    }

    const intent = detectIntent(message, incomingIntent);
    const msgHasPhone = hasPhone(message);

    // Fetch lead
    let lead: any = { business_name: name || '', contact_name: name || '', phone: phone || null };
    let existingPhone = phone || null;
    let leadUuid: string | null = lead_id || null;

    if (leadUuid) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${leadUuid}&limit=1`, {
        headers: { 'Authorization': `Bearer ${SERVICE_ROLE}`, 'apikey': SERVICE_ROLE }
      });
      const rows = await r.json().catch(() => []);
      if (rows?.[0]) { lead = rows[0]; existingPhone = rows[0].phone || existingPhone; }
    } else if (email) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}&limit=1`, {
        headers: { 'Authorization': `Bearer ${SERVICE_ROLE}`, 'apikey': SERVICE_ROLE }
      });
      const rows = await r.json().catch(() => []);
      if (rows?.[0]) { lead = rows[0]; existingPhone = rows[0].phone || existingPhone; leadUuid = rows[0].id; }
    }

    // Extract + log phone if message contains one and lead has none
    let phoneJustProvided: string | null = null;
    if (msgHasPhone && !existingPhone) {
      const extractRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/extract_and_log_phone`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SERVICE_ROLE}`, 'apikey': SERVICE_ROLE, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_email: email || null, p_lead_id: leadUuid || null, p_message: message })
      });
      const extracted = await extractRes.json().catch(() => null);
      if (typeof extracted === 'string' && extracted.length > 6) {
        phoneJustProvided = extracted;
        existingPhone = extracted;
        lead.phone = extracted;
        console.log(`Phone captured: ${extracted} for ${email}`);
      }
    }

    const leadHasPhone = !!(existingPhone || phone);

    // Log reply
    await fetch(`${SUPABASE_URL}/rest/v1/reply_inbox`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE}`, 'apikey': SERVICE_ROLE,
        'Content-Type': 'application/json', 'Accept-Profile': 'outreach', 'Content-Profile': 'outreach'
      },
      body: JSON.stringify({
        lead_email: email || null, lead_name: name || lead.contact_name || null,
        company: lead.business_name || null, reply_text: message,
        intent_signal: intent, intent_confidence: '0.90',
        provider: channel || 'email', received_at: new Date().toISOString(), actioned: false,
      })
    }).catch(() => {});

    // Update pipeline
    const pFilter = leadUuid ? `lead_id=eq.${leadUuid}` : email ? `email=eq.${encodeURIComponent(email)}` : null;
    if (pFilter) {
      const patchBody: any = {
        stage: intent === 'not_interested' ? 'nurture' : 'engaged',
        outreach_status: 'replied', reply_received_at: new Date().toISOString(),
        reply_intent: intent, updated_at: new Date().toISOString(),
      };
      if (existingPhone) patchBody.phone = existingPhone;
      await fetch(`${SUPABASE_URL}/rest/v1/pipeline?${pFilter}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE}`, 'apikey': SERVICE_ROLE,
          'Content-Type': 'application/json', 'Accept-Profile': 'deals', 'Content-Profile': 'deals'
        },
        body: JSON.stringify(patchBody)
      }).catch(() => {});
    }

    // Send Steve's response
    const { subject, html } = buildResponse(intent, lead, leadHasPhone, phoneJustProvided);
    let emailSent = false;
    if (email) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: [email], subject, html, reply_to: FROM_EMAIL })
      });
      emailSent = emailRes.ok;

      if (emailSent) {
        await fetch(`${SUPABASE_URL}/rest/v1/reply_inbox?lead_email=eq.${encodeURIComponent(email)}&actioned=eq.false`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SERVICE_ROLE}`, 'apikey': SERVICE_ROLE,
            'Content-Type': 'application/json', 'Accept-Profile': 'outreach', 'Content-Profile': 'outreach'
          },
          body: JSON.stringify({
            actioned: true, actioned_at: new Date().toISOString(),
            actioned_by: 'steve',
            action_taken: phoneJustProvided ? 'phone_captured_replied' : `replied_${intent}`,
          })
        }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({
      ok: true, intent, email, lead_id: leadUuid,
      phone_captured: phoneJustProvided,
      phone_requested: !leadHasPhone && intent !== 'not_interested',
      steve_replied: emailSent,
      response_subject: subject,
    }), { status: 200, headers: cors });

  } catch (err) {
    console.error('reply-webhook:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: cors });
  }
});
