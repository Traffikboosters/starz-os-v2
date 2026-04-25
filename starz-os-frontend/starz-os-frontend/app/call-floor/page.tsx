"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔑 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🧠 ORG
const ORG_ID = "cff5dcc8-ac88-4070-8b6e-0d2e8d837a3a";

// 📦 TYPES
type Call = {
  id: string;
  phone: string;
  call_status: "dialing" | "in-progress" | "closed";
  duration: number | null;
  revenue: number | null;
  created_at: string;
};

export default function CallFloorPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  // 📡 FETCH CALLS
  const fetchCalls = async () => {
    const { data } = await supabase
      .from("calls")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCalls(data);
    setLoading(false);
  };

  // 🎨 STATUS COLOR
  const getColor = (status: string) => {
    if (status === "dialing") return "#facc15";
    if (status === "in-progress") return "#22c55e";
    if (status === "closed") return "#3b82f6";
    return "#555";
  };

  // 🤖 STEVE — AUTO CREATE CALLS
  const generateCall = async () => {
    const randomPhone = `555-${Math.floor(1000 + Math.random() * 9000)}`;

    await supabase.from("calls").insert({
      phone: randomPhone,
      call_status: "dialing",
      duration: null,
      revenue: null,
    });
  };

  // 🔄 VOX — PROGRESS CALLS
  const progressCalls = async () => {
    for (const call of calls) {
      if (call.call_status === "dialing") {
        await supabase
          .from("calls")
          .update({ call_status: "in-progress" })
          .eq("id", call.id);
      } else if (call.call_status === "in-progress") {
        const revenue = Math.floor(Math.random() * 3000);

        await supabase
          .from("calls")
          .update({
            call_status: "closed",
            duration: Math.floor(Math.random() * 300),
            revenue,
          })
          .eq("id", call.id);
      }
    }
  };

  // ⏱ AUTO LOOP (THIS IS THE MAGIC)
  useEffect(() => {
    fetchCalls();

    const interval = setInterval(async () => {
      await generateCall();   // Steve creates calls
      await progressCalls();  // Vox moves them forward
      await fetchCalls();     // UI refresh
    }, 4000); // every 4 seconds

    return () => clearInterval(interval);
  }, [calls]);

  // UI
  return (
    <div style={{ padding: 20, background: "#000", minHeight: "100vh", color: "#fff" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20 }}>
        🤖 STARZ OS – AI Call Floor
      </h1>

      {loading && <p>Loading...</p>}

      {calls.map((call) => (
        <div
          key={call.id}
          style={{
            marginBottom: 12,
            padding: 15,
            borderRadius: 10,
            background: "#111",
            border: `1px solid ${getColor(call.call_status)}`,
          }}
        >
          <div style={{ fontSize: 18 }}>📱 {call.phone}</div>
          <div>Status: {call.call_status}</div>
          {call.duration && <div>Duration: {call.duration}s</div>}
          {call.revenue && <div>💰 ${call.revenue}</div>}
        </div>
      ))}
    </div>
  );
}