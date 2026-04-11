import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: control } = await supabase
    .from("scraper_control")
    .select("*")
    .limit(1)
    .single();

  if (!control || !control.system_enabled) {
    return new Response(JSON.stringify({ allowed: false, reason: "SYSTEM DISABLED" }), { status: 403 });
  }

  const { data: usage } = await supabase
    .from("api_usage_today")
    .select("*")
    .single();

  const totalCalls = Number(usage?.total_calls || 0);
  const totalCost = Number(usage?.total_cost || 0);

  if (totalCalls >= control.daily_limit) {
    return new Response(JSON.stringify({ allowed: false, reason: "DAILY LIMIT REACHED", calls: totalCalls, limit: control.daily_limit }), { status: 429 });
  }

  if (totalCost >= control.max_daily_cost) {
    return new Response(JSON.stringify({ allowed: false, reason: "COST LIMIT REACHED", cost: totalCost, limit: control.max_daily_cost }), { status: 429 });
  }

  return new Response(JSON.stringify({
    allowed: true,
    remaining_calls: control.daily_limit - totalCalls,
    remaining_budget: control.max_daily_cost - totalCost
  }), { status: 200 });
});
