"use client";

import { useState } from "react";

type Lead = {
  name?: string;
  company?: string;
  email?: string;
  city?: string;
};

export default function DashboardPage() {
  const [status, setStatus] = useState("Idle");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runEngine = async () => {
    if (loading) return;

    setLoading(true);
    setStatus("Running...");
    setErrorMessage(null);
    setLeads([]);

    try {
      console.log("Calling internal API: /api/run-prospect");

      const response = await fetch("/api/run-prospect", {
        method: "POST",
      });

      const data = await response.json();
      console.log("Response from API:", data);

      if (!response.ok) {
        const readableError =
          typeof data?.error === "string"
            ? data.error
            : JSON.stringify(data ?? "Unknown error");

        throw new Error(readableError);
      }

      // Adjust if your backend returns different structure
      setLeads(data.leads ?? []);
      setStatus("Completed ✅");
    } catch (err: any) {
      console.error("Engine Error:", err);
      setStatus("Failed ❌");
      setErrorMessage(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#ffffff",
        padding: "40px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>
        STARZ OS Prospecting Command Center
      </h1>

      <div
        style={{
          background: "#1e293b",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "30px",
        }}
      >
        <p>System Status: Online</p>
        <p>Engine Status: {status}</p>

        {errorMessage && (
          <div
            style={{
              background: "#7f1d1d",
              padding: "10px",
              marginTop: "10px",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {errorMessage}
          </div>
        )}

        <button
          onClick={runEngine}
          disabled={loading}
          style={{
            marginTop: "15px",
            padding: "10px 18px",
            background: loading ? "#555" : "#22c55e",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Running..." : "Run Prospecting Engine"}
        </button>
      </div>

      <div
        style={{
          background: "#1e293b",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>Leads</h2>

        {leads.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No leads yet...</p>
        ) : (
          leads.map((lead, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              {lead.name || lead.company || "Unnamed Lead"}
              {lead.city && ` — ${lead.city}`}
            </div>
          ))
        )}
      </div>
    </div>
  );
}