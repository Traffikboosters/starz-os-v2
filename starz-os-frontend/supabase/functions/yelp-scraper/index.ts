import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";
serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const YELP_KEY = Deno.env.get("YELP_API_KEY")!;
  const body = await req.json().catch(() => ({}));
  const industry = body.industry || "plumber";
  const city = body.city || "Miami";
  const state = body.state || "FL";
  const limit = Math.min(body.limit || 20, 50);
  const TENANT = "00000000-0000-0000-0000-000000000301";
  try {
    const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(industry)}&location=${encodeURIComponent(city + " " + state)}&limit=${limit}&sort_by=review_count`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${YELP_KEY}` } });
    const data = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: data.error?.description || "Yelp API error" }), { status: 500 });
    const businesses = data.businesses || [];
    const inserted = [];
    const skipped = [];
    for (const biz of businesses) {
      const phone = biz.phone || biz.display_phone || null;
      const website = biz.url || null;
      const address = biz.location?.display_address?.join(", ") || null;
      const rating = biz.rating || null;
      const reviewCount = biz.review_count || 0;
      const yelpId = biz.id;
      const { data: existing } = await supabase.from("leads").select("id").eq("source_id", yelpId).single();
      if (existing) { skipped.push(biz.name); continue; }
      const { error: insertErr } = await supabase.from("leads").insert({
        name: biz.name, business_name: biz.name, phone, email: null,
        industry: industry.toLowerCase(), source: "Yelp",
        source_id: yelpId, status: "New", score: 0,
        tenant_id: TENANT,
        notes: JSON.stringify({ website, address, rating, review_count: reviewCount, city, state, yelp_url: biz.url, categories: biz.categories?.map((c: any) => c.title).join(", "), scraped_at: new Date().toISOString() }),
        source_quality: Math.min(100, Math.round((reviewCount / 50) * 100)),
      });
      if (insertErr) { skipped.push(biz.name); }
      else { inserted.push({ name: biz.name, phone, website: biz.url, rating, reviews: reviewCount }); }
      await new Promise(r => setTimeout(r, 50));
    }
    return new Response(JSON.stringify({ success: true, source: "Yelp", query: `${industry} in ${city} ${state}`, found: businesses.length, inserted: inserted.length, skipped: skipped.length, leads: inserted }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
