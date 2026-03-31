export function EmptyState({ label }) {
  return (
    <div className="bg-card rounded-xl p-8 text-center text-slate-500 border border-slate-700">
      暂无{label}数据
    </div>
  )
}

export function SectionCard({ title, children }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-slate-700 mb-4">
      {title && <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">{title}</h3>}
      {children}
    </div>
  )
}
