"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ProspectsFeed({
  fetchLeads,
}: {
  fetchLeads: () => void;
}) {
  useEffect(() => {
    const channel = supabase
      .channel("prospects-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "leads",
          table: "prospects",
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads]);

  return null;
}