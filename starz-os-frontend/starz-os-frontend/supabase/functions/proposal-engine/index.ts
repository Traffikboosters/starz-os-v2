import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function generateProposalId(service = "SEO") {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `TB-${service}-${year}-${rand}`;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { lead_id, name, phone } = body;

    const proposal_id = generateProposalId("SEO");

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        proposal_id,
        lead_id,
        name,
        phone,
        status: "sent",
        amount: 1500,
        deposit_required: 525, // 35%
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, proposal: data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});