import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";
const GKEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;
const TENANT = "00000000-0000-0000-0000-000000000301";
const DEFAULT_TARGETS = [
  {industry:"plumber",city:"Miami",state:"FL"},
  {industry:"HVAC",city:"Miami",state:"FL"},
  {industry:"roofing",city:"Miami",state:"FL"},
  {industry:"electrician",city:"Miami",state:"FL"},
  {industry:"plumber",city:"Houston",state:"TX"},
  {industry:"HVAC",city:"Houston",state:"TX"},
  {industry:"roofing",city:"Houston",state:"TX"},
  {industry:"plumber",city:"Dallas",state:"TX"},
  {industry:"roofing",city:"Atlanta",state:"GA"},
  {industry:"plumber",city:"Atlanta",state:"GA"},
  {industry:"plumber",city:"Phoenix",state:"AZ"},
  {industry:"roofing",city:"Phoenix",state:"AZ"},
  {industry:"plumber",city:"Tampa",state:"FL"},
  {industry:"roofing",city:"Tampa",state:"FL"},
];
serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(()=>({}));
  const targets = body.targets || DEFAULT_TARGETS;
  const limit = body.limit || 15;
  const stats = {total_scraped:0,inserted:0,skipped:0,errors:[] as string[]};
  for (const t of targets) {
    try {
      const q = encodeURIComponent(t.industry+" in "+t.city+" "+t.state);
      const sr = await fetch("https://maps.googleapis.com/maps/api/place/textsearch/json?query="+q+"&key="+GKEY);
      const sd = await sr.json();
      if (sd.status !== "OK" && sd.status !== "ZERO_RESULTS") { stats.errors.push(t.industry+"/"+t.city+": "+sd.status); continue; }
      const places = (sd.results||[]).slice(0,limit);
      stats.total_scraped += places.length;
      for (const p of places) {
        try {
          const dr = await fetch("https://maps.googleapis.com/maps/api/place/details/json?place_id="+p.place_id+"&fields=name,formatted_phone_number,website,formatted_address,rating,user_ratings_total,business_status&key="+GKEY);
          const dd = await dr.json();
          const d = dd.result||{};
          if (d.business_status==="PERMANENTLY_CLOSED") { stats.skipped++; continue; }
          const {data:ex} = await sb.from("leads").select("id").eq("place_id",p.place_id).maybeSingle();
          if (ex) { stats.skipped++; continue; }
          const phone = d.formatted_phone_number||null;
          if (phone) {
            const {data:ep} = await sb.from("leads").select("id").eq("phone",phone).eq("tenant_id",TENANT).maybeSingle();
            if (ep) { stats.skipped++; continue; }
          }
          const {error} = await sb.from("leads").insert({
            name:p.name,business_name:p.name,phone,email:null,
            industry:t.industry.toLowerCase(),source:"Google Maps",
            source_id:null,status:"New",score:0,tenant_id:TENANT,
            place_id:p.place_id,
            notes:JSON.stringify({website:d.website||null,address:d.formatted_address||null,rating:d.rating||p.rating||null,review_count:d.user_ratings_total||p.user_ratings_total||0,city:t.city,state:t.state,scraped_at:new Date().toISOString()}),
          });
          if (error) stats.errors.push(p.name+": "+error.message);
          else stats.inserted++;
          await new Promise(r=>setTimeout(r,80));
        } catch(e:any){stats.errors.push(p.name+": "+e.message);}
      }
      await new Promise(r=>setTimeout(r,500));
    } catch(e:any){stats.errors.push(t.industry+"/"+t.city+": "+e.message);}
  }
  return new Response(JSON.stringify({success:true,...stats}),{headers:{"Content-Type":"application/json"},status:200});
});