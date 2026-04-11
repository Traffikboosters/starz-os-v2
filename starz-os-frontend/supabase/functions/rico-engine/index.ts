import { createClient } from "npm:@supabase/supabase-js@2.49.8";

type Role = "seo" | "dev" | "content" | "qa";

interface TaskTemplate {
  task_type: string;
  assigned_role: Role;
  instructions: string;
  priority?: "low" | "normal" | "high";
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Store user pools in env as JSON for easier ops updates.
// Example:
// USERS_BY_ROLE_JSON={"seo":["uuid1"],"dev":["uuid2"],"content":["uuid3"],"qa":["uuid4"]}
const USERS_BY_ROLE_JSON = Deno.env.get("USERS_BY_ROLE_JSON");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DEFAULT_USERS: Record<Role, string[]> = {
  seo: [],
  dev: [],
  content: [],
  qa: [],
};

const USERS: Record<Role, string[]> = (() => {
  if (!USERS_BY_ROLE_JSON) return DEFAULT_USERS;
  try {
    const parsed = JSON.parse(USERS_BY_ROLE_JSON);
    return {
      seo: Array.isArray(parsed.seo) ? parsed.seo : [],
      dev: Array.isArray(parsed.dev) ? parsed.dev : [],
      content: Array.isArray(parsed.content) ? parsed.content : [],
      qa: Array.isArray(parsed.qa) ? parsed.qa : [],
    };
  } catch {
    return DEFAULT_USERS;
  }
})();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function assignUser(role: Role): string | null {
  const pool = USERS[role] ?? [];
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getTasksForService(serviceType: string): TaskTemplate[] {
  if (serviceType === "SEO") {
    return [
      {
        task_type: "keyword_research",
        assigned_role: "seo",
        instructions: "Find 50 high-intent keywords with search volume + KD",
      },
      {
        task_type: "site_audit",
        assigned_role: "seo",
        instructions: "Run full technical SEO audit (speed, errors, structure)",
      },
      {
        task_type: "on_page_fix",
        assigned_role: "dev",
        instructions: "Fix meta tags, headings, schema, internal linking",
      },
      {
        task_type: "content_creation",
        assigned_role: "content",
        instructions: "Write 5 SEO-optimized blog posts targeting keywords",
      },
      {
        task_type: "backlinks",
        assigned_role: "seo",
        instructions: "Build 20 high DA backlinks",
      },
    ];
  }

  return [];
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => null);
    const work_order_id = body?.work_order_id;

    if (!work_order_id || typeof work_order_id !== "string") {
      return json({ success: false, error: "Missing or invalid work_order_id" }, 400);
    }

    console.log("Rico triggered:", work_order_id);

    // Fetch work order
    const { data: wo, error: woError } = await supabase
      .schema("fulfillment")
      .from("work_orders")
      .select("*")
      .eq("id", work_order_id)
      .single();

    if (woError || !wo) {
      return json({ success: false, error: "Work order not found" }, 404);
    }

    const serviceType = wo.service_type ?? wo.service ?? "";
    const taskTemplates = getTasksForService(serviceType);

    if (taskTemplates.length === 0) {
      return json({
        success: true,
        tasks_created: 0,
        message: `No task template for service_type: ${serviceType}`,
      });
    }

    // Optional idempotency guard: skip if tasks already exist
    const { data: existingTasks, error: existingError } = await supabase
      .schema("fulfillment")
      .from("tasks")
      .select("id")
      .eq("work_order_id", work_order_id)
      .limit(1);

    if (existingError) throw existingError;
    if (existingTasks && existingTasks.length > 0) {
      return json({
        success: true,
        tasks_created: 0,
        message: "Tasks already exist for this work order",
      });
    }

    const now = new Date().toISOString();
    const payload = taskTemplates.map((task) => ({
      work_order_id,
      task_type: task.task_type,
      assigned_role: task.assigned_role,
      assigned_to: assignUser(task.assigned_role), // can be null if no pool
      instructions: task.instructions,
      status: "pending",
      priority: task.priority ?? "normal",
      created_at: now,
    }));

    const { error: insertError } = await supabase
      .schema("fulfillment")
      .from("tasks")
      .insert(payload);

    if (insertError) throw insertError;

    const { error: updateError } = await supabase
      .schema("fulfillment")
      .from("work_orders")
      .update({
        status: "in_progress",
        start_date: now,
      })
      .eq("id", work_order_id);

    if (updateError) throw updateError;

    return json({ success: true, tasks_created: payload.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("Rico error:", message);
    return json({ success: false, error: message }, 500);
  }
});