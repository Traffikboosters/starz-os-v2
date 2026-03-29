"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import Link from "next/link"
export default function TestPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLeads() {
      const { data, error } = await supabase
        .from("steve_leads")
        .select("*")
        .limit(10)

      if (error) {
        console.error("Supabase error:", error)
      }

      setLeads(data || [])
      setLoading(false)
    }

    loadLeads()
  }, [])

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>⭐ STARZ OS Database Test</h1>

      {loading && <p>Loading data...</p>}

      {!loading && leads.length === 0 && (
        <p>No leads found in Supabase.</p>
      )}

      {leads.map((lead, index) => (
        <pre key={index}>
          {JSON.stringify(lead, null, 2)}
        </pre>
      ))}
    </div>
  )
}