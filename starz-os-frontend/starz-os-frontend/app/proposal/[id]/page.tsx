"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProposalPage({ params }: { params: { id: string } }) {
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signature, setSignature] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProposal();
  }, []);

  const fetchProposal = async () => {
    try {
      const { data, error } = await sb
        .schema("deals")
        .from("proposals")
        .select("*")
        .eq("proposal_id", params.id)
        .single();

      if (error || !data) {
        setError("Proposal not found.");
        setLoading(false);
        return;
      }

      setProposal(data);
      setLoading(false);

      // mark as viewed
      if (!data.viewed_at) {
        await sb
          .schema("deals")
          .from("proposals")
          .update({ viewed_at: new Date().toISOString() })
          .eq("proposal_id", params.id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load proposal.");
      setLoading(false);
    }
  };

  // 🔥 SIGN PROPOSAL
  const handleSign = async () => {
    if (!signerName.trim()) return setError("Enter your full name");
    if (!signature.trim()) return setError("Enter signature");

    setSigning(true);
    setError("");

    try {
      const { error } = await sb
        .schema("deals")
        .from("proposals")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signer_name: signerName,
          signature_data: signature,
        })
        .eq("proposal_id", params.id);

      if (error) throw error;

      setSigned(true);
      setProposal((prev: any) => ({
        ...prev,
        status: "signed",
      }));
    } catch (e: any) {
      console.error(e);
      setError("Signing failed. Try again.");
    }

    setSigning(false);
  };

  // 💳 STRIPE CHECKOUT
  const payNow = async () => {
    if (!proposal) return;

    try {
      setSubmitting(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-proposal-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
          body: JSON.stringify({
            proposalId: proposal.id || proposal.proposal_id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Checkout failed");
      }

      if (data?.url) {
        // 🚀 redirect to Stripe
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(err.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  // =============================
  // UI STATES
  // =============================
  if (loading) {
    return <div style={{ padding: 40 }}>Loading proposal...</div>;
  }

  if (!proposal) {
    return <div style={{ padding: 40 }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>

      <h1>Proposal</h1>
      <h2>{proposal.business_name}</h2>

      {/* ERROR */}
      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          {error}
        </div>
      )}

      {/* SIGN SECTION */}
      {!signed && proposal.status !== "signed" && (
        <div style={{ marginTop: 20 }}>
          <input
            placeholder="Full Name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            style={{ display: "block", marginBottom: 10, padding: 8 }}
          />

          <input
            placeholder="Signature"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            style={{ display: "block", marginBottom: 10, padding: 8 }}
          />

          <button
            onClick={handleSign}
            disabled={signing}
            style={{
              padding: 10,
              background: "#ff6b35",
              color: "#fff",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            {signing ? "Signing..." : "Sign Proposal"}
          </button>
        </div>
      )}

      {/* PAY BUTTON */}
      {(signed || proposal.status === "signed") && proposal.status !== "paid" && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={payNow}
            disabled={submitting}
            style={{
              background: "#06b6d4",
              padding: 14,
              borderRadius: 8,
              color: "#000",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer",
            }}
          >
            {submitting ? "Redirecting..." : "💳 Pay Now"}
          </button>

          <p style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            Secure checkout powered by Stripe. Your project starts immediately after payment.
          </p>
        </div>
      )}

      {/* SUCCESS */}
      {proposal.status === "paid" && (
        <div style={{ marginTop: 20, color: "green", fontWeight: "bold" }}>
          ✅ Payment received — your project is now active
        </div>
      )}

    </div>
  );
}