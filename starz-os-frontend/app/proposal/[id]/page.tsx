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
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProposal();
  }, []);

  const fetchProposal = async () => {
    const { data, error } = await sb
      .schema("deals")
      .from("proposals")
      .select("*")
      .eq("proposal_id", params.id)
      .single();
    if (error || !data) { setError("Proposal not found."); setLoading(false); return; }
    setProposal(data);
    setLoading(false);
    // Mark as viewed
    if (!data.viewed_at) {
      await sb.schema("deals").from("proposals").update({ viewed_at: new Date().toISOString() }).eq("proposal_id", params.id);
    }
  };

  const handleSign = async () => {
    if (!signerName.trim()) { setError("Please enter your full name to sign."); return; }
    if (!signature.trim()) { setError("Please type your signature."); return; }
    setSigning(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sign-work-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          proposal_id: params.id,
          signer_name: signerName,
          signature_data: signature,
        }),
      });
      if (!res.ok) throw new Error("Signing failed");
      // Update proposal status
      await sb.schema("deals").from("proposals").update({
        status: "signed",
        signed_at: new Date().toISOString(),
        signer_name: signerName,
        signature_data: signature,
      }).eq("proposal_id", params.id);
      setSigned(true);
    } catch(e: any) {
      setError(e.message || "Signing failed. Please try again.");
    }
    setSigning(false);
  };

  if (loading) return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"#f5f5f5"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:40,height:40,border:"4px solid #ff6b35",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}></div>
        <p style={{color:"#666"}}>Loading your proposal...</p>
      </div>
    </div>
  );

  if (error && !proposal) return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"#f5f5f5"}}>
      <div style={{textAlign:"center",padding:40}}>
        <h2 style={{color:"#1a1a2e"}}>Proposal Not Found</h2>
        <p style={{color:"#666"}}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"Arial,sans-serif",maxWidth:800,margin:"0 auto",padding:"0 0 60px",color:"#333",background:"#fff",minHeight:"100vh"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{background:"#1a1a2e",padding:"40px 30px",textAlign:"center"}}>
        <div style={{display:"inline-block",background:"#ff6b35",padding:"8px 20px",borderRadius:4,marginBottom:16}}>
          <span style={{color:"#fff",fontWeight:900,fontSize:22,letterSpacing:2}}>TRAFFIK BOOSTERS</span>
        </div>
        <h1 style={{color:"#fff",margin:"0 0 8px",fontSize:28,fontWeight:700}}>GROWTH PROPOSAL</h1>
        <p style={{color:"#ff6b35",margin:0,fontSize:13,letterSpacing:1}}>
          CONFIDENTIAL · {proposal.proposal_id} · {new Date(proposal.created_at).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}
        </p>
      </div>

      <div style={{padding:"36px 30px"}}>

        {/* Status badge */}
        {proposal.status === "signed" && (
          <div style={{background:"#e8f5e9",border:"1px solid #4caf50",borderRadius:8,padding:"12px 20px",marginBottom:24,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:20}}>✅</span>
            <span style={{color:"#2e7d32",fontWeight:600}}>This proposal has been signed. Thank you!</span>
          </div>
        )}

        {/* Client Info */}
        <h2 style={{color:"#1a1a2e",borderBottom:"3px solid #ff6b35",paddingBottom:10,marginTop:0}}>Prepared For</h2>
        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:10}}>
          <tbody>
            <tr><td style={{padding:"8px 0",fontWeight:"bold",color:"#666",width:130,fontSize:13,textTransform:"uppercase"}}>Business</td><td style={{padding:"8px 0",fontSize:15,fontWeight:600}}>{proposal.business_name}</td></tr>
            <tr><td style={{padding:"8px 0",fontWeight:"bold",color:"#666",fontSize:13,textTransform:"uppercase"}}>Industry</td><td style={{padding:"8px 0",textTransform:"capitalize"}}>{proposal.industry}</td></tr>
            <tr><td style={{padding:"8px 0",fontWeight:"bold",color:"#666",fontSize:13,textTransform:"uppercase"}}>Phone</td><td style={{padding:"8px 0"}}>{proposal.phone||"N/A"}</td></tr>
            <tr><td style={{padding:"8px 0",fontWeight:"bold",color:"#666",fontSize:13,textTransform:"uppercase"}}>Email</td><td style={{padding:"8px 0"}}>{proposal.lead_email||"N/A"}</td></tr>
          </tbody>
        </table>

        {/* Discovery Summary */}
        <h2 style={{color:"#1a1a2e",borderBottom:"3px solid #ff6b35",paddingBottom:10,marginTop:36}}>Discovery Summary</h2>
        <p style={{background:"#fff8f5",padding:20,borderLeft:"4px solid #ff6b35",fontStyle:"italic",lineHeight:1.8,margin:0,borderRadius:"0 8px 8px 0",color:"#444"}}>{proposal.conversation_summary}</p>

        {/* Services */}
        <h2 style={{color:"#1a1a2e",borderBottom:"3px solid #ff6b35",paddingBottom:10,marginTop:36}}>Scope of Services</h2>
        <p style={{color:"#666",fontSize:14,marginBottom:20}}>Based on your goals and current situation, we recommend the following services.</p>
        {(proposal.deliverables||[]).map((d: any, i: number) => (
          <div key={i} style={{marginBottom:24,padding:20,background:"#f9f9f9",borderRadius:8,borderLeft:"4px solid #ff6b35"}}>
            <h3 style={{color:"#1a1a2e",margin:"0 0 12px",fontSize:16}}>{d.service}</h3>
            <ul style={{margin:0,paddingLeft:20}}>
              {(d.items||[]).map((item: string, j: number) => (
                <li key={j} style={{marginBottom:6,color:"#555"}}>{item}</li>
              ))}
            </ul>
          </div>
        ))}

        {/* Our Process */}
        <h2 style={{color:"#1a1a2e",borderBottom:"3px solid #ff6b35",paddingBottom:10,marginTop:36}}>Our Process</h2>
        {[
          "Strategy call to align on goals and finalize scope",
          "Agreement signed and deposit secured",
          "Onboarding begins — dedicated team assigned within 24 hours",
          "Campaign launches and results tracking begins",
        ].map((step, i) => (
          <div key={i} style={{display:"flex",gap:12,marginBottom:8,alignItems:"center"}}>
            <div style={{minWidth:36,height:36,background:"#ff6b35",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:"bold"}}>{i+1}</div>
            <div style={{background:"#f9f9f9",padding:"10px 16px",borderRadius:4,flex:1}}>{step}</div>
          </div>
        ))}

        {/* 3-Day Guarantee */}
        <h2 style={{color:"#1a1a2e",borderBottom:"3px solid #ff6b35",paddingBottom:10,marginTop:36}}>3-Day Satisfaction Guarantee</h2>
        <div style={{background:"#fff8f5",padding:20,borderRadius:8,border:"1px solid #ff6b35"}}>
          <p style={{margin:0,lineHeight:1.7}}>You may cancel within <strong>3 business days</strong> of signing for a <strong>full refund</strong> — no questions asked. After 3 days, our team will have allocated resources and begun work.</p>
        </div>

        {/* Client Acknowledgement */}
        <h2 style={{color:"#1a1a2e",borderBottom:"3px solid #ff6b35",paddingBottom:10,marginTop:36}}>Client Acknowledgement</h2>
        <ul style={{color:"#555",lineHeight:2,paddingLeft:20}}>
          <li>I understand the scope of services outlined above</li>
          <li>I agree to the deliverables listed in this proposal</li>
          <li>I authorize Traffik Boosters to begin work after the 3-day cancellation period</li>
          <li>I understand results are based on strategy and execution and are not guaranteed within a specific timeframe</li>
        </ul>

        {/* E-Sign Section */}
        {!signed && proposal.status !== "signed" && (
          <>
            <h2 style={{color:"#1a1a2e",borderBottom:"3px solid #ff6b35",paddingBottom:10,marginTop:36}}>Sign This Proposal</h2>
            <div style={{background:"#f9f9f9",padding:24,borderRadius:8,border:"1px solid #ddd"}}>
              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontWeight:"bold",marginBottom:6,color:"#1a1a2e"}}>Full Name *</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder="Enter your full legal name"
                  style={{width:"100%",padding:"12px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:15,boxSizing:"border-box"}}
                />
              </div>
              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontWeight:"bold",marginBottom:6,color:"#1a1a2e"}}>Signature *</label>
                <input
                  type="text"
                  value={signature}
                  onChange={e => setSignature(e.target.value)}
                  placeholder="Type your name as your digital signature"
                  style={{width:"100%",padding:"12px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:22,fontFamily:"cursive",boxSizing:"border-box",color:"#1a1a2e"}}
                />
              </div>
              {error && <p style={{color:"#e53e3e",marginBottom:12,fontSize:14}}>{error}</p>}
              <p style={{fontSize:12,color:"#999",marginBottom:16}}>By signing, you confirm you have read and agree to all terms above. Your IP address and timestamp will be recorded.</p>
              <button
                onClick={handleSign}
                disabled={signing}
                style={{width:"100%",background:signing?"#ccc":"#ff6b35",color:"#fff",border:"none",padding:"16px",borderRadius:6,fontSize:16,fontWeight:700,cursor:signing?"not-allowed":"pointer",letterSpacing:0.5}}
              >
                {signing ? "Processing..." : "Sign Proposal →"}
              </button>
            </div>
          </>
        )}

        {/* Signed confirmation */}
        {(signed || proposal.status === "signed") && (
          <div style={{background:"#e8f5e9",border:"2px solid #4caf50",borderRadius:8,padding:24,marginTop:36,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <h3 style={{color:"#2e7d32",margin:"0 0 8px"}}>Proposal Signed Successfully!</h3>
            <p style={{color:"#555",margin:"0 0 16px"}}>Thank you! Steve will reach out within 24 hours to discuss next steps and investment details.</p>
            <p style={{color:"#888",fontSize:13,margin:0}}>Proposal ID: {proposal.proposal_id}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{background:"#1a1a2e",padding:28,marginTop:36,borderRadius:8,textAlign:"center"}}>
          <p style={{margin:"0 0 6px",color:"#ff6b35",fontWeight:900,fontSize:16,letterSpacing:1}}>STEVE WILLIAMS</p>
          <p style={{margin:"0 0 4px",color:"#aaa",fontSize:13}}>Business Growth Expert · Traffik Boosters</p>
          <p style={{margin:"0 0 12px",color:"#aaa",fontSize:13}}>786-254-1592 · steve@traffikboosters.com · traffikboosters.com</p>
          <p style={{margin:0,color:"#555",fontSize:11}}>Proposal ID: {proposal.proposal_id} · CONFIDENTIAL</p>
        </div>

      </div>
    </div>
  );
}