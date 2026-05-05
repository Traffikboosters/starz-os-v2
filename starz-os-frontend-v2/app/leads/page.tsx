"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Lead = {
  id: number;
  name: string | null;
  company: string | null;
  score: number | null;
  status: string | null;
  assigned_rep_id: string | number | null;
  estimated_value: number | null;
  updated_at: string | null;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .schema("leads")
      .from("prospects")
      .select("id,name,company,score,status,assigned_rep_id,estimated_value,updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("FETCH ERROR:", error.message);
    } else {
      setLeads((data || []) as Lead[]);
    }

    setLoading(false);
  };

  const addLead = async () => {
    console.log("ADD LEAD CLICKED");

    const { data, error } = await supabase
      .schema("leads")
      .from("prospects")
      .insert([
        {
          name: "Test Lead",
          company: "Test Company",
          status: "new",
          score: 50,
          estimated_value: 5000,
        },
      ])
      .select();

    console.log("INSERT DATA:", data);
    console.log("INSERT ERROR:", error?.message);

    if (!error) await fetchLeads();
  };

  const autoAssign = async (id: number) => {
    console.log("AUTO ASSIGN:", id);

    const { data, error } = await supabase
      .schema("leads")
      .rpc("assign_best_fit_lead_guarded", {
        p_prospect_id: Number(id),
        p_daily_cap: 20,
        p_load_penalty: 0.2,
        p_fairness_boost: 0.1,
      });

    console.log("ASSIGN DATA:", data);
    console.log("ASSIGN ERROR:", error?.message);

    if (!error) await fetchLeads();
  };

  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel("leads-prospects-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "leads",
          table: "prospects",
        },
        () => {
          console.log("REALTIME UPDATE");
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>STARZ-OS Leads</h1>

      <button onClick={addLead} style={{ marginBottom: 20 }}>
        Add Lead
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border={1} cellPadding={10} style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Score</th>
              <th>Status</th>
              <th>Value</th>
              <th>Assigned</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center" }}>
                  No leads found
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name || "—"}</td>
                  <td>{lead.company || "—"}</td>
                  <td>{lead.score ?? "—"}</td>
                  <td>{lead.status || "—"}</td>
                  <td>${lead.estimated_value ?? 0}</td>
                  <td>{lead.assigned_rep_id || "Unassigned"}</td>
                  <td>
                    {lead.updated_at
                      ? new Date(lead.updated_at).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    <button onClick={() => autoAssign(lead.id)}>
                      Assign
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}