"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type RouterLog = {
  id: string;
  created_at: string;
  engine: string;
  route: string;
  response_status: number;
  duration_ms: number;
};

export default function CommandCenter() {
  const [logs, setLogs] = useState<RouterLog[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);

  async function loadData() {
    const { data } = await supabase
      .schema("analytics")
      .from("router_logs")
      .select("id, created_at, engine, route, response_status, duration_ms")
      .order("created_at", { ascending: false })
      .limit(20);

    setLogs(data ?? []);

    const { count } = await supabase
      .schema("analytics")
      .from("router_logs")
      .select("*", { count: "exact", head: true });

    setTotalRequests(count ?? 0);
  }

  useEffect(() => {
    loadData();

    const channel = supabase.channel("analytics:router_logs", {
      config: { private: true },
    });

    channel
      .on("broadcast", { event: "INSERT" }, (payload) => {
        const row = payload.payload?.new as RouterLog;
        if (!row) return;
        setLogs((prev) => [row, ...prev.slice(0, 19)]);
        setTotalRequests((n) => n + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h1>⭐ STARZ Command Center</h1>
      <h2>Total Requests: {totalRequests}</h2>
      <ul style={{ marginTop: 20 }}>
        {logs.map((log) => (
          <li key={log.id}>
            {log.engine} / {log.route} · {log.response_status} · {log.duration_ms}ms
          </li>
        ))}
      </ul>
    </div>
  );
}