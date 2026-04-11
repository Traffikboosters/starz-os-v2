import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    const { lead_id, name, phone, outcome, notes } = body;

    // 🧠 Determine stage
    let stage = "new";
    let interest_level = "low";

    if (outcome === "interested") {
      stage = "qualified";
      interest_level = "high";
    } else if (outcome === "maybe") {
      stage = "nurturing";
      interest_level = "medium";
    } else if (outcome === "not_interested") {
      stage = "lost";
      interest_level = "none";
    }

    // 🔍 Check existing deal
    const { data: existing } = await supabase
      .from("pipeline")
      .select("*")
      .eq("lead_id", lead_id)
      .maybeSingle();

    if (existing) {
      // 🔄 Update deal
      await supabase
        .from("pipeline")
        .update({
          stage,
          interest_level,
          notes,
          last_contacted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // ➕ Create deal
      await supabase.from("pipeline").insert({
        lead_id,
        name,
        phone,
        stage,
        interest_level,
        notes,
        last_contacted_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : String(err);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500 }
    );
  }
});