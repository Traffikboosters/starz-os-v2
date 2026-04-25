"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b0f1a" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Topbar />

        <div style={{ padding: 20, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}