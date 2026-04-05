"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ReplyPage() {
  const params = useSearchParams();
  const sentRef = useRef(false);

  const [status, setStatus] = useState("Sending...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    const sendReply = async () => {
      try {
        const email = params.get("email");
        const intent = params.get("intent") ?? "unknown";

        if (!email) {
          setStatus("Missing email.");
          return;
        }

        const res = await fetch(
          "https://szguizvpiiuiyugrjeks.supabase.co/functions/v1/reply-webhook",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, intent }),
          },
        );

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const data = await res.json();
        console.log("Webhook response:", data);

        setStatus("✅ Response received. We'll follow up shortly.");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(err);
        setError(message);
        setStatus("❌ Failed to send.");
      }
    };

    void sendReply();
  }, [params]);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Traffik Boosters</h1>
      <p>{status}</p>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}