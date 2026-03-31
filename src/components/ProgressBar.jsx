export default function ProgressBar({ processed, total, onCancel }) {
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0
  return (
    <div className="bg-card rounded-xl p-4 border border-slate-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-400 text-sm">⚙️ 正在解析...</span>
        <span className="text-blue-400 text-sm font-mono">{pct}%</span>
      </div>
      <div className="bg-slate-900 rounded-full h-1.5">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-slate-500 text-xs">
          已处理 {processed.toLocaleString()} / {total.toLocaleString()} 行
        </span>
        <button
          onClick={onCancel}
          className="text-slate-500 hover:text-red-400 text-xs underline"
        >
          取消
        </button>
      </div>
    </div>
  )
}
