"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: string;
  business_name?: string | null;
  phone?: string | null;
  email?: string | null;
};

type ActionType = "call" | "email" | "meeting" | null;

export default function PowerDialer() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loadingAction, setLoadingAction] = useState<ActionType>(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadLead(excludeId?: string) {
    setError("");
    setMessage("");
    setLoadingLead(true);

    let query = supabase
      .from("leads") // change if your table name is different
      .select("id,business_name,phone,email")
      .limit(1);

    if (excludeId) query = query.neq("id", excludeId);

    const { data, error } = await query;

    setLoadingLead(false);

    if (error) {
      setError(error.message || "Failed to load lead");
      return;
    }

    setLead(data?.[0] ?? null);
  }

  useEffect(() => {
    loadLead();
  }, []);

  async function invokeAction(
    action: Exclude<ActionType, null>,
    functionName: string,
    body: Record<string, unknown>
  ) {
    setError("");
    setMessage("");
    setLoadingAction(action);

    const { data, error } = await supabase.functions.invoke(functionName, { body });

    setLoadingAction(null);

    if (error) {
      setError(error.message || `Failed to run ${action}`);
      return;
    }

    setMessage(`${action.toUpperCase()} sent successfully.`);
    console.log(`${action} response:`, data);
  }

  const disabled = !lead || loadingLead || loadingAction !== null;

  return (
    <div className="space-y-3">
      <div className="rounded border p-3">
        {loadingLead ? (
          <p className="text-sm">Loading lead...</p>
        ) : !lead ? (
          <p className="text-sm text-amber-600">No leads found.</p>
        ) : (
          <div className="text-sm space-y-1">
            <p><strong>ID:</strong> {lead.id}</p>
            <p><strong>Business:</strong> {lead.business_name ?? "—"}</p>
            <p><strong>Phone:</strong> {lead.phone ?? "—"}</p>
            <p><strong>Email:</strong> {lead.email ?? "—"}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!lead) return;
            invokeAction("call", "voice-engine", {
              lead_id: lead.id,
              phone: lead.phone,
              business_name: lead.business_name,
            });
          }}
          className="rounded px-3 py-2 bg-blue-600 text-white disabled:opacity-50"
        >
          {loadingAction === "call" ? "Calling..." : "📞 Call"}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!lead) return;
            invokeAction("email", "email-engine", {
              lead_id: lead.id,
              email: lead.email,
              business_name: lead.business_name,
            });
          }}
          className="rounded px-3 py-2 bg-green-600 text-white disabled:opacity-50"
        >
          {loadingAction === "email" ? "Sending..." : "📧 Email"}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!lead) return;
            invokeAction("meeting", "video-engine", {
              lead_id: lead.id,
              email: lead.email,
              business_name: lead.business_name,
            });
          }}
          className="rounded px-3 py-2 bg-purple-600 text-white disabled:opacity-50"
        >
          {loadingAction === "meeting" ? "Booking..." : "🎥 Meeting"}
        </button>

        <button
          type="button"
          disabled={loadingLead || loadingAction !== null}
          onClick={() => loadLead(lead?.id)}
          className="rounded px-3 py-2 bg-gray-700 text-white disabled:opacity-50"
        >
          Next Lead →
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-600">{message}</p> : null}
    </div>
  );
}