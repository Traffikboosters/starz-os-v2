import { NextRequest, NextResponse } from 'next/server';

const DIALPAD_API_BASE = 'https://dialpad.com/api/v2';
const CALLER_NUMBER = '+14075503897';

export async function POST(req: NextRequest) {
  const { phone, leadName } = await req.json();

  if (!phone) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
  }

  const DIALPAD_API_KEY = process.env.DIALPAD_API_KEY;
  if (!DIALPAD_API_KEY) {
    return NextResponse.json({ error: 'Dialpad API key not configured' }, { status: 500 });
  }

  try {
    const cleaned = phone.replace(/\D/g, '');
    const formatted = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;

    // Dialpad uses apikey as query param
    const url = `${DIALPAD_API_BASE}/calls?apikey=${DIALPAD_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        phone_number: formatted,
        from_number: CALLER_NUMBER,
        outbound_caller_id: CALLER_NUMBER,
        custom_data: leadName || 'PowerDial Lead',
      }),
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({
        error: 'Dialpad returned invalid response',
        status: response.status,
        raw: text.slice(0, 500),
      }, { status: 500 });
    }

    if (!response.ok) {
      return NextResponse.json({
        error: data?.error?.message || data?.message || 'Dialpad API error',
        details: data,
      }, { status: response.status });
    }

    return NextResponse.json({ success: true, call: data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const DIALPAD_API_KEY = process.env.DIALPAD_API_KEY;
  try {
    const response = await fetch(`${DIALPAD_API_BASE}/users/me?apikey=${DIALPAD_API_KEY}`, {
      headers: { 'Accept': 'application/json' },
    });
    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch { return NextResponse.json({ raw: text.slice(0, 500) }); }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}