import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

function calculateHeatScore(score: any): number {
  if (!score) return 50;
  const dealScore = Number(score.deal_score || 0);
  const oppScore = Number(score.opportunity_score || 0);
  const closeProb = Number(score.close_probability || 0) * 100;
  return Math.min(100, Math.round((dealScore * 0.4) + (oppScore * 0.3) + (closeProb * 0.3)));
}

const tryInsert = async (supabase: any, schema: string, table: string, data: any) => {
  try { await supabase.schema(schema).from(table).insert(data) } catch(_) {}
}

const tryInsertPublic = async (supabase: any, table: string, data: any) => {
  try { await supabase.from(table).insert(data) } catch(_) {}
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, work_order_id, task_id } = body;

    // ── AUTONOMOUS GROWTH TICK ────────────────────────────────────────────────
    if (action === "autonomous_growth_tick" || action === "run_all") {
      const { data: orders } = await supabase
        .schema("deals")
        .from("work_orders")
        .select("id, client_name, business_name, lead_id, service_type, tenant_id, package")
        .eq("fulfillment_status", "in_fulfillment");

      let ticked = 0, optimized = 0, scaled = 0;

      for (const order of orders ?? []) {
        const { data: score } = await supabase
          .schema("analytics")
          .from("deal_scores")
          .select("deal_score, opportunity_score, close_probability, estimated_value")
          .eq("lead_id", order.lead_id)
          .maybeSingle();

        const heat = calculateHeatScore(score);

        if (heat < 40) {
          await tryInsertPublic(supabase, "developer_tasks", {
            work_order_id: order.id, assigned_to: "Rico",
            task_type: "Campaign Optimization Review", status: "pending", priority: 1
          });
          optimized++;
        } else if (heat > 80) {
          await tryInsertPublic(supabase, "developer_tasks", {
            work_order_id: order.id, assigned_to: "Rico",
            task_type: "Scale Campaign — High Performance", status: "pending", priority: 1
          });
          scaled++;
        }

        await tryInsert(supabase, "analytics", "learning_events", {
          source: "rico_autonomous_growth",
          event_type: heat < 40 ? "optimize" : heat > 80 ? "scale" : "maintain",
          payload: { work_order_id: order.id, client_name: order.client_name, heat_score: heat },
          tenant_id: order.tenant_id,
        });

        await tryInsert(supabase, "analytics", "engine_logs", {
          engine: "rico-engine", event: "growth_tick",
          payload: { work_order_id: order.id, heat },
          tenant_id: order.tenant_id,
        });

        ticked++;
      }

      return json(200, { ok: true, ticked, optimized, scaled,
        message: `Ticked ${ticked} orders — ${optimized} optimized, ${scaled} scaled` });
    }

    // ── PROMOTE PROBATION ─────────────────────────────────────────────────────
    if (action === "promote_probation") {
      const { data: cleared } = await supabase
        .schema("deals").from("work_orders")
        .select("id, client_name")
        .eq("rico_execution_locked", true)
        .lt("clearance_ends_at", new Date().toISOString());

      let released = 0;
      for (const wo of cleared ?? []) {
        try {
          await supabase.schema("deals").from("work_orders")
            .update({ rico_execution_locked: false, execution_status: "ready_for_rico",
              fulfillment_status: "ready_for_rico", production_released_at: new Date().toISOString() })
            .eq("id", wo.id);
          released++;
        } catch(_) {}
      }
      return json(200, { ok: true, released, message: `Released ${released} work orders` });
    }

    // ── START FULFILLMENT ─────────────────────────────────────────────────────
    if (action === "start_fulfillment") {
      await supabase.schema("deals").from("work_orders")
        .update({ fulfillment_status: "in_fulfillment", execution_status: "in_progress" })
        .eq("id", work_order_id);

      const tasks = [
        { work_order_id, assigned_to: "Rico", task_type: "Project Setup", status: "pending", priority: 1 },
        { work_order_id, assigned_to: "SEO Team", task_type: "SEO Audit", status: "pending", priority: 2 },
        { work_order_id, assigned_to: "Backlinks Team", task_type: "Backlink Research", status: "pending", priority: 3 },
        { work_order_id, assigned_to: "Content Team", task_type: "Content Strategy", status: "pending", priority: 4 },
      ];
      await tryInsertPublic(supabase, "developer_tasks", tasks);
      return json(200, { ok: true, message: "Fulfillment started + tasks generated" });
    }

    // ── GENERATE TASKS ────────────────────────────────────────────────────────
    if (action === "generate_tasks") {
      const { data: wo } = await supabase.schema("deals").from("work_orders")
        .select("service_type, package, client_name").eq("id", work_order_id).single();

      const baseTasks = [
        { task_type: "Project Setup", assigned_to: "Rico", priority: 1 },
        { task_type: "SEO Optimization", assigned_to: "SEO Team", priority: 2 },
        { task_type: "Backlink Building", assigned_to: "Backlinks Team", priority: 3 },
        { task_type: "Content Creation", assigned_to: "Content Team", priority: 4 },
        { task_type: "Performance Review", assigned_to: "Rico", priority: 5 },
      ];

      const tasks = baseTasks.map(t => ({ ...t, work_order_id, status: "pending" }));
      await supabase.from("developer_tasks").insert(tasks);
      return json(200, { ok: true, tasks: tasks.length, message: `Generated ${tasks.length} tasks for ${wo?.client_name}` });
    }

    // ── UPDATE TASK ───────────────────────────────────────────────────────────
    if (action === "update_task") {
      const { status } = body;
      await supabase.from("developer_tasks").update({ status }).eq("id", task_id);
      return json(200, { ok: true, message: `Task updated to ${status}` });
    }

    // ── LAUNCH GOOGLE ADS ─────────────────────────────────────────────────────
    if (action === "launch_google_ads_campaign") {
      const { data: order } = await supabase.schema("deals").from("work_orders")
        .select("*").eq("id", work_order_id).single();

      await tryInsert(supabase, "analytics", "engine_logs", {
        engine: "rico-engine", event: "google_ads_launch_intent",
        payload: { work_order_id, client: order?.client_name },
        tenant_id: order?.tenant_id,
      });
      return json(200, { ok: true, message: `Google Ads campaign queued for ${order?.client_name}` });
    }

    return json(400, { error: "Unknown action: " + action });

  } catch (err) {
    return json(500, { error: String(err) });
  }
});