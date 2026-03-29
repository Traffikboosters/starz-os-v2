"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [deals, setDeals] = useState<any[]>([]);

  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from("deals.pipeline")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setDeals(data || []);
  };

  useEffect(() => {
    fetchDeals();

    const channel = supabase
      .channel("deals-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "deals", table: "pipeline" },
        fetchDeals
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stages = ["new", "contacted", "qualified", "closed"];

  return (
    <div className="p-10 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">🚀 Deals Dashboard</h1>

      <div className="grid grid-cols-4 gap-6">
        {stages.map((stage) => (
          <div key={stage}>
            <h2 className="mb-3 font-semibold text-lg uppercase">
              {stage}
            </h2>

            {deals
              .filter((d) => d.stage === stage)
              .map((deal) => (
                <div
                  key={deal.id}
                  className="bg-slate-800 p-4 mb-3 rounded shadow"
                >
                  <p className="font-bold">{deal.name}</p>
                  <p>${deal.value || 0}</p>
                </div>
              ))}

            {deals.filter((d) => d.stage === stage).length === 0 && (
              <p className="text-sm text-gray-400">No deals</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}