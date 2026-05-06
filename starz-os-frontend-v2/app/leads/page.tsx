import LeadsClient from "./LeadsClient";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SIZE, Lead } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = (sp.status ?? "").trim();
  const page = Math.max(Number(sp.page ?? "1") || 1, 1);
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("leads")
    .select(
      "id,name,business_name,score,status,assigned_to,revenue_tier,updated_at",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.or("name.ilike.%" + q + "%,business_name.ilike.%" + q + "%");

  const { data, error, count } = await query;

  return (
    <LeadsClient
      initialLeads={(data ?? []) as Lead[]}
      initialError={error?.message ?? null}
      initialCount={count ?? 0}
      initialPage={page}
      initialQ={q}
      initialStatus={status || "all"}
      pageSize={DEFAULT_PAGE_SIZE}
    />
  );
}
