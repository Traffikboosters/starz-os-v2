"use client";

import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        ⚙️ Admin Dashboard
      </h1>

      <div
        style={{
          padding: 20,
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          cursor: "pointer",
        }}
        onClick={() => router.push("/developer")}
      >
        <h2>🧠 Developer Portal</h2>
        <p>Access APIs, engines, and system controls</p>
      </div>
    </div>
  );
}