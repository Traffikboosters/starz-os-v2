"use client"
interface StatCardProps { label: string; value: string | number; sub?: string; accent?: "green"|"blue"|"red"|"amber"|"purple"; icon?: string }
const accentMap: Record<string,string> = { green:"border-emerald-500/40 bg-emerald-500/5", blue:"border-blue-500/40 bg-blue-500/5", red:"border-red-500/40 bg-red-500/5", amber:"border-amber-500/40 bg-amber-500/5", purple:"border-purple-500/40 bg-purple-500/5" }
const textMap: Record<string,string> = { green:"text-emerald-400", blue:"text-blue-400", red:"text-red-400", amber:"text-amber-400", purple:"text-purple-400" }

export function StatCard({ label, value, sub, accent="blue", icon }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${accentMap[accent]} flex flex-col gap-1`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`text-3xl font-bold font-mono ${textMap[accent]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  )
}
export function LoadingGrid({ count=4 }: { count?: number }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:count}).map((_,i)=><div key={i} className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 animate-pulse h-28"/>)}</div>
}
export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return <div className="mb-6"><h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>{sub&&<p className="text-slate-400 text-sm mt-1">{sub}</p>}</div>
}
export function Badge({ label, variant }: { label: string; variant: "success"|"warn"|"danger"|"info"|"neutral" }) {
  const map = { success:"bg-emerald-500/20 text-emerald-300 border-emerald-500/30", warn:"bg-amber-500/20 text-amber-300 border-amber-500/30", danger:"bg-red-500/20 text-red-300 border-red-500/30", info:"bg-blue-500/20 text-blue-300 border-blue-500/30", neutral:"bg-slate-700/40 text-slate-300 border-slate-600/40" }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[variant]}`}>{label}</span>
}