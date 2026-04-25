import Link from "next/link"

export default function Home() {
  const pages = [
    { href:"/executive", label:"Executive Dashboard" },
    { href:"/sales", label:"Sales War Room" },
    { href:"/marketing", label:"Marketing Hub" },
    { href:"/operations", label:"Operations" },
    { href:"/leads", label:"Leads Intelligence" },
    { href:"/stats", label:"Stats & Reports" },
    { href:"/security", label:"Security Center" },
  ]
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-2">STARZ-OS</h1>
        <p className="text-slate-400">Business Operating System by Traffik Boosters</p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {pages.map(({href,label}) => (
          <Link key={href} href={href} className="px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-center font-semibold transition-all">{label}</Link>
        ))}
      </div>
    </main>
  )
}