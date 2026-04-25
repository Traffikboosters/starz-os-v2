"use client"
interface Column { key: string; label: string; render?: (val: unknown, row: Record<string,unknown>) => React.ReactNode }
interface Props { columns: Column[]; rows: Record<string,unknown>[]; secure?: boolean; emptyMessage?: string }

export function DataTable({ columns, rows, secure=false, emptyMessage="No data" }: Props) {
  const wrap = (c: React.ReactNode) => secure
    ? <div className="secure-lead-data" style={{userSelect:"none",WebkitUserSelect:"none"}} onCopy={e=>e.preventDefault()}>{c}</div>
    : <>{c}</>
  return wrap(
    <div className="overflow-x-auto rounded-xl border border-slate-700/60">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-slate-700/60 bg-slate-800/60">{columns.map(c=><th key={c.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{c.label}</th>)}</tr></thead>
        <tbody>{rows.length===0?<tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">{emptyMessage}</td></tr>:rows.map((row,i)=><tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30">{columns.map(c=><td key={c.key} className="px-4 py-3 text-slate-300">{c.render?c.render(row[c.key],row):String(row[c.key]??"â€”")}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}