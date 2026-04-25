"use client"
import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function AIAccessGovernor() {
  useEffect(() => {
    const block = (e: MouseEvent) => { if ((e.target as HTMLElement).closest(".secure-lead-data")) e.preventDefault() }
    const blockKey = (e: KeyboardEvent) => {
      if (!(e.target as HTMLElement).closest(".secure-lead-data")) return
      if ((e.ctrlKey || e.metaKey) && ["c","a","s"].includes(e.key.toLowerCase())) e.preventDefault()
    }
    document.addEventListener("contextmenu", block)
    document.addEventListener("keydown", blockKey)
    supabase.auth.getSession().then(({ data }) => { if (!data.session) window.location.href = "/login" })
    return () => { document.removeEventListener("contextmenu", block); document.removeEventListener("keydown", blockKey) }
  }, [])
  return null
}