import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// 🧠 AI fallback (if Dialpad doesn't return outcome)
function detectOutcome(callTranscript: string) {
  const text = (callTranscript || "").toLowerCase();

  if (text.includes("yes") || text.includes("interested")) {
    return "interested";
  }
  if (text.includes("maybe") || text.includes("send info")) {
    return "maybe";
  }
  return "not_interested";
}

Deno.serve(async () => {
  try {
    // 1. Get next lead from queue
    const { data: queue, error: fetchError } = await supabase
      .from("call_queue")
      .select("*")
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !queue) {
      return new Response(
        JSON.stringify({ message: "No leads in queue" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Mark as calling
    await supabase
      .from("call_queue")
      .update({ status: "calling" })
      .eq("id", queue.id);

    // 3. Trigger Dialpad call
    const callRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/dialpad-call`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get(
            "SUPABASE_SERVICE_ROLE_KEY"
          )}`,
        },
        body: JSON.stringify({
          phone: queue.phone,
          name: queue.name,
          lead_id: queue.lead_id,
        }),
      }
    );

    let result: any = {};
    try {
      result = await callRes.json();
    } catch {
      result = { success: false };
    }

    // 🧠 Determine outcome (Dialpad OR fallback AI)
    let outcome =
      result.outcome ||
      detectOutcome(result.transcript || "");

    // 4. SEND TO DEAL PIPELINE
    await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/deal-engine`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get(
            "SUPABASE_SERVICE_ROLE_KEY"
          )}`,
        },
        body: JSON.stringify({
          lead_id: queue.lead_id,
          name: queue.name,
          phone: queue.phone,
          outcome,
          notes: "Auto-generated from call",
        }),
      }
    );

    // 5. AUTO PROPOSAL (ONLY IF INTERESTED) 🔥
    if (outcome === "interested") {
      await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/proposal-engine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get(
              "SUPABASE_SERVICE_ROLE_KEY"
            )}`,
          },
          body: JSON.stringify({
            lead_id: queue.lead_id,
            name: queue.name,
            phone: queue.phone,
          }),
        }
      );
    }

    // 6. Update queue after call attempt
    await supabase
      .from("call_queue")
      .update({
        status: result.success ? "completed" : "failed",
        attempts: (queue.attempts || 0) + 1,
        last_called_at: new Date().toISOString(),
      })
      .eq("id", queue.id);

    // 7. Return response
    return new Response(
      JSON.stringify({
        success: true,
        queue,
        outcome,
        proposal_created: outcome === "interested",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : String(err);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});