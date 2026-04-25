import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TENANT_ID = "00000000-0000-0000-0000-000000000301";

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const body = await req.json().catch(() => ({}));
  const industry = body.industry || "plumber";
  const city = body.city || "Miami";
  const state = body.state || "FL";
  const limit = Math.min(body.limit || 20, 60);

  try {
    const query = `${industry} in ${city} ${state}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=establishment&key=${GOOGLE_PLACES_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Places API error: ${data.status} — ${data.error_message || ""}`);
    }

    const places = (data.results || []).slice(0, limit);
    const inserted = [];
    const skipped = [];

    for (const place of places) {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,formatted_address,rating,user_ratings_total,business_status&key=${GOOGLE_PLACES_API_KEY}`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        const d = detailData.result || {};

        if (d.business_status === "PERMANENTLY_CLOSED") { skipped.push(place.name); continue; }

        const placeId = place.place_id;
        const { data: existing } = await supabase.from("leads").select("id").eq("place_id", placeId).single();
        if (existing) { skipped.push(place.name); continue; }

        const reviewCount = d.user_ratings_total || place.user_ratings_total || 0;
        const { error: insertErr } = await supabase.from("leads").insert({
          name: place.name,
          business_name: place.name,
          phone: d.formatted_phone_number || null,
          email: null,
          industry: industry.toLowerCase(),
          source: "Google Maps",
          status: "New",
          score: 0,
          tenant_id: TENANT_ID,
          place_id: placeId,
          notes: JSON.stringify({ website: d.website||null, address: d.formatted_address||null, rating: d.rating||null, review_count: reviewCount, city, state, scraped_at: new Date().toISOString() }),
          source_quality: Math.min(100, Math.round((reviewCount / 50) * 100)),
        });

        if (insertErr) { skipped.push(place.name); }
        else { inserted.push({ name: place.name, phone: d.formatted_phone_number||null, website: d.website||null, rating: d.rating||null, reviews: reviewCount }); }

        await new Promise(r => setTimeout(r, 80));
      } catch(e) { skipped.push(place.name); }
    }

    return new Response(JSON.stringify({ success: true, query, found: places.length, inserted: inserted.length, skipped: skipped.length, leads: inserted }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
