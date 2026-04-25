// @ts-nocheck
"use client";

import {
  useState,
  useEffect,
  type ChangeEvent,
  type FormEvent,
  type CSSProperties,
} from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    business_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("starz-theme");
    if (saved === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("starz-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const { error } = await supabase.schema("crm").from("leads").insert([
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          business_name: form.business_name,
          status: "new",
          score: 0,
        },
      ]);

      if (error) throw error;

      setStatus("✅ Lead created in CRM!");
      setForm({
        name: "",
        email: "",
        phone: "",
        business_name: "",
      });
    } catch (err: unknown) {
      setStatus(`❌ ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: CSSProperties = {
    minHeight: "100vh",
    padding: "40px",
    backgroundColor: darkMode ? "#0f172a" : "#f5f5f5",
    color: darkMode ? "#ffffff" : "#000000",
  };

  const inputStyle: CSSProperties = {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
    color: darkMode ? "#ffffff" : "#000000",
  };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <img
          src="https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/logo/STARZ-OS%20LOGO.png"
          alt="STARZ OS"
          style={{ width: 180, marginBottom: 20 }}
        />

        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          style={{
            marginBottom: 20,
            padding: "10px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            background: "#0ea5e9",
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          {darkMode ? "☀️ Switch to Light" : "🌙 Switch to Dark"}
        </button>

        <h2>STARZ OS - Add Lead</h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            name="business_name"
            placeholder="Business Name (optional)"
            value={form.business_name}
            onChange={handleChange}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              background: "#00a5e9",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
            }}
          >
            {loading ? "Submitting..." : "Submit Lead"}
          </button>
        </form>

        <p style={{ marginTop: 20 }}>{status}</p>
      </div>
    </div>
  );
}