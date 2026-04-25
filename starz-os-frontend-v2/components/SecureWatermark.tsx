"use client"
interface Props { userEmail?: string }
export function SecureWatermark({ userEmail }: Props) {
  const label = userEmail ? `CONFIDENTIAL Â· ${userEmail}` : "CONFIDENTIAL Â· TRAFFIK BOOSTERS"
  const repeated = Array(40).fill(label).join("   ")
  return (
    <div aria-hidden="true" style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden",userSelect:"none" }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ position:"absolute",top:`${i*8.5}%`,left:"-10%",width:"120%",fontSize:"11px",fontFamily:"monospace",color:"rgba(255,0,0,0.06)",whiteSpace:"nowrap",transform:"rotate(-25deg)",letterSpacing:"0.15em",fontWeight:700 }}>{repeated}</div>
      ))}
    </div>
  )
}