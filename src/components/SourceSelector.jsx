import { useMemo, useState } from 'react'
import { defaultSelectedSources } from '../lib/metrics'

export default function SourceSelector({ data, onConfirm, onReset }) {
  const sources = data.sources ?? []
  const initialSources = useMemo(() => defaultSelectedSources(sources), [sources])
  const [selected, setSelected] = useState(initialSources)

  function toggleSource(source) {
    setSelected(current =>
      current.includes(source)
        ? current.filter(item => item !== source)
        : [...current, source]
    )
  }

  function selectAll() {
    setSelected(sources)
  }

  function selectPreferred() {
    setSelected(initialSources)
  }

  return (
    <div className="max-w-2xl mx-auto pt-16 px-4 pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">选择数据来源</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          默认选择 Apple Watch 和 iPhone。第三方 App 可能重复写入步数、心率或睡眠，建议只保留你信任的来源。
        </p>
      </div>

      <div className="bg-card border border-slate-800 rounded-lg p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={selectPreferred} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm">
            Apple 设备
          </button>
          <button onClick={selectAll} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-sm">
            全部来源
          </button>
          <button onClick={() => setSelected([])} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm">
            清空
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
          {sources.map(source => (
            <label key={source} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(source)}
                onChange={() => toggleSource(source)}
                className="accent-blue-500"
              />
              <span className="text-slate-200 truncate" title={source}>{source}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button onClick={onReset} className="text-slate-500 hover:text-slate-300 text-sm">
          重新上传
        </button>
        <button
          onClick={() => onConfirm(selected)}
          disabled={selected.length === 0}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm"
        >
          分析 {selected.length} 个来源
        </button>
      </div>
    </div>
  )
}
