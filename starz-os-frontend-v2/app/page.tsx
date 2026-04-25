import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold">â­ STARZ-OS</h1>
      <div className="grid grid-cols-2 gap-4">
        {[
          { href:"/executive", label:"âš¡ Executive" },
          { href:"/sales", label:"ðŸ“ž Sales" },
          { href:"/marketing", label:"ðŸ“£ Marketing" },
          { href:"/operations", label:"âš™ï¸ Operations" },
          { href:"/leads", label:"ðŸ”’ Leads" },
          { href:"/stats", label:"ðŸ“Š Stats" },
          { href:"/security", label:"ðŸ›¡ï¸ Security" },
        ].map(({href,label}) => (
          <Link key={href} href={href} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-center font-semibold transition-colors">{label}</Link>
        ))}
      </div>
    </main>
  )
}