"use client";

import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runOutreach = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
        "https://szguizvpiiuiyugrjeks.supabase.co/functions/v1/outreach-engine/start",
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Failed to run outreach" });
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">🚀 STARZ OS — Steve Outreach</h1>

      <button
        onClick={runOutreach}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        {loading ? "Running Steve..." : "Run Steve Outreach"}
      </button>

      {result && (
        <pre className="bg-black text-green-400 p-4 rounded w-full max-w-xl overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}