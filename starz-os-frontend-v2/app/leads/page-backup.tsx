"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Lead = {
  id: number;
  name: string | null;
  company: string | null;
  score: number | null;
  status: string | null;
  assigned_rep_id: string | null;
  estimated_value: number | null;
  updated_at: string | null;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .schema("leads")
      .from("prospects")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Fetch error:", error);
      setErrorMsg(error.message);
    } else {
      setLeads(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const safeFetch = async () => {
      await fetchLeads();
      if (!isMounted) return;
    };

    safeFetch();

    // Prevent duplicate subscriptions
    if (!channelRef.current) {
      const channel = supabase
        .channel("leads-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "leads", table: "prospects" },
          async () => {
            // refresh on change
            await fetchLeads();
          }
        )
        .subscribe();

      channelRef.current = channel;
    }

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchLeads]);

  async function assignLead(id: number) {
    setErrorMsg(null);

    const { error } = await supabase.schema("leads").rpc("assign_best_fit_lead_guarded", {
      p_prospect_id: id,
      p_daily_cap: 70,
      p_load_penalty: 0.2,
      p_fairness_boost: 0.1,
    });

    if (error) {
      console.error("Assign error:", error);
      setErrorMsg(error.message);
      return;
    }

    await fetchLeads();
  }

  return (
    <div>
      <h1>Live Leads</h1>

      {loading && <p>Loading...</p>}
      {errorMsg && <p style={{ color: "crimson" }}>Error: {errorMsg}</p>}

      {!loading && leads.length === 0 && !errorMsg && (
        <p>No leads found (check RLS or table)</p>
      )}

      {leads.map((lead) => (
        <div key={lead.id} style={{ marginBottom: 12 }}>
          <b>{lead.name ?? "No Name"}</b> — {lead.company ?? "No Company"}
          <br />
          Score: {lead.score ?? "N/A"}
          <br />
          Value:{" "}
          {lead.estimated_value != null
            ? `$${lead.estimated_value.toLocaleString()}`
            : "N/A"}
          <br />
          <button onClick={() => assignLead(lead.id)}>Assign Lead</button>
        </div>
      ))}
    </div>
  );
}