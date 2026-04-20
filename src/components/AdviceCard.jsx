import { RATING_COLOR, RATING_ICON, RATING_LABEL } from '../lib/chartOptions'

export default function AdviceCard({ advice }) {
  const color = RATING_COLOR[advice.status] ?? RATING_COLOR.null
  const label = RATING_LABEL[advice.status] ?? '暂无'

  return (
    <div className="bg-card rounded-lg p-4 border border-slate-700 mb-4">
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{RATING_ICON[advice.status] ?? '⚪'}</span>
            <h3 className="text-slate-100 font-semibold text-sm">健康建议</h3>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${color}22`, color }}>
              {label}
            </span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">{advice.summary}</p>
          <p className="text-slate-500 text-xs mt-1">{advice.stability}</p>
        </div>

        {advice.metrics.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {advice.metrics.map(item => {
              const metricColor = RATING_COLOR[item.status] ?? RATING_COLOR.null
              return (
                <div key={item.label} className="rounded-lg bg-slate-900/50 border border-slate-800 p-2">
                  <p className="text-slate-500 text-xs">{item.label}</p>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: metricColor }}>{item.value}</p>
                </div>
              )
            })}
          </div>
        )}

        <div>
          <p className="text-slate-400 text-xs font-medium mb-1">改善方向</p>
          <ul className="space-y-1">
            {advice.actions.map(action => (
              <li key={action} className="text-slate-500 text-xs leading-relaxed">• {action}</li>
            ))}
          </ul>
        </div>

        <p className="text-xs leading-relaxed" style={{ color }}>
          {advice.medical}
        </p>
      </div>
    </div>
  )
}
