// @ts-nocheck
﻿"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const LOGO = "https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/logo/STARZ-OS%20LOGO555.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoErr, setLogoErr] = useState(false);
  const router = useRouter();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/dashboard");
    } catch {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',-apple-system,sans-serif"}}>
      <div style={{width:"100%",maxWidth:380,padding:"0 20px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          {!logoErr
            ? <img src={LOGO} alt="STARZ-OS" height={40} style={{objectFit:"contain",maxWidth:160}} onError={()=>setLogoErr(true)} />
            : <div style={{fontSize:28,fontWeight:700,color:"#fff"}}>? STARZ-OS</div>
          }
          <p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:10}}>Sign in to continue</p>
        </div>
        <form onSubmit={handleLogin} style={{background:"#111118",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"28px 24px"}}>
          {error && <div style={{background:"rgba(239,68,68,0.12)",border:"0.5px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#f87171"}}>{error}</div>}
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"
              style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}} />
          </div>
          <div style={{marginBottom:24}}>
            <label style={{display:"block",fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:6}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="password"
              style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}} />
          </div>
          <button type="submit" disabled={loading}
            style={{width:"100%",padding:"11px",borderRadius:8,background:loading?"rgba(99,102,241,0.5)":"#6366f1",color:"#fff",fontSize:14,fontWeight:600,border:"none",cursor:loading?"not-allowed":"pointer",fontFamily:"inherit"}}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

