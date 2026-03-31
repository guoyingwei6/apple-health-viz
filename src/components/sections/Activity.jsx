import ReactECharts from 'echarts-for-react'
import { COLORS, baseChartOption } from '../../lib/chartOptions'
import { EmptyState, SectionCard } from './_empty'

function buildHeatmap(stepsByDay) {
  const result = []
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push([key, stepsByDay[key] ?? 0])
  }
  return result
}

export default function Activity({ data, stepsByDay }) {
  const monthlySteps = Object.entries(
    Object.entries(stepsByDay).reduce((acc, [date, val]) => {
      const month = date.slice(0, 7)
      if (!acc[month]) acc[month] = { sum: 0, days: 0 }
      acc[month].sum += val
      acc[month].days++
      return acc
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, days }]) => ({ month, avg: Math.round(sum / days) }))

  const heatmapData = buildHeatmap(stepsByDay)
  const maxSteps = Math.max(...heatmapData.map(d => d[1]), 1)

  return (
    <div>
      <SectionCard title="月均日步数">
        {monthlySteps.length === 0 ? <EmptyState label="步数" /> :
          <ReactECharts option={{
            ...baseChartOption(),
            xAxis: { type: 'category', data: monthlySteps.map(d => d.month), axisLabel: { color: COLORS.text, rotate: 30, fontSize: 10 } },
            yAxis: { type: 'value', axisLabel: { color: COLORS.text }, splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } } },
            series: [{
              type: 'bar', data: monthlySteps.map(d => d.avg),
              itemStyle: { color: COLORS.stepsPurple },
              markLine: { silent: true, lineStyle: { color: COLORS.ok, type: 'dashed' }, data: [{ yAxis: 8000, label: { formatter: '8000步' } }] },
            }],
            tooltip: { formatter: p => `${p.name}: ${p.value.toLocaleString()} 步/天` },
          }} style={{ height: 220 }} />
        }
      </SectionCard>
      <SectionCard title="近90天步数热力图">
        <div className="flex flex-wrap gap-1">
          {heatmapData.map(([date, steps]) => {
            const opacity = steps === 0 ? 0.1 : Math.max(0.2, steps / maxSteps)
            return (
              <div
                key={date}
                title={`${date}: ${steps.toLocaleString()} 步`}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: steps === 0 ? COLORS.border : COLORS.stepsPurple, opacity }}
              />
            )
          })}
        </div>
        <p className="text-slate-600 text-xs mt-2">颜色越深 = 步数越多，灰色 = 无数据</p>
      </SectionCard>
    </div>
  )
}
