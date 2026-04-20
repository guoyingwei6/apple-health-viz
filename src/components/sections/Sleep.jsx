import ReactECharts from 'echarts-for-react'
import { aggregateMonthly } from '../../lib/metrics'
import { buildSectionAdvice } from '../../lib/advice'
import { lineChartOption, COLORS } from '../../lib/chartOptions'
import { EmptyState, SectionCard } from './_empty'
import AdviceCard from '../AdviceCard'

export default function Sleep({ data }) {
  const sleepMonthly = aggregateMonthly(
    data.sleep.map(r => ({ date: r.date, value: r.durationHours }))
  )
  const shortDays = data.sleep.filter(r => r.isShort).length
  const shortPct = data.sleep.length ? (shortDays / data.sleep.length * 100).toFixed(0) : 0
  const recent = data.sleep.slice(-60)
  const advice = buildSectionAdvice('sleep', data)

  return (
    <div>
      <AdviceCard advice={advice} />
      <SectionCard title="每日睡眠时长（近60天）">
        {recent.length === 0 ? <EmptyState label="睡眠" /> :
          <ReactECharts option={{
            backgroundColor: 'transparent',
            grid: { left: 40, right: 16, top: 16, bottom: 40 },
            xAxis: { type: 'category', data: recent.map(r => r.date.slice(5)), axisLabel: { color: COLORS.text, fontSize: 9, rotate: 45 } },
            yAxis: { type: 'value', max: 12, axisLabel: { color: COLORS.text, formatter: v => v + 'h' }, splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } } },
            series: [{
              type: 'bar',
              data: recent.map(r => ({
                value: +r.durationHours.toFixed(1),
                itemStyle: { color: r.isShort ? COLORS.bad : COLORS.hrvBlue },
              })),
            }],
            tooltip: { formatter: p => `${p.name}: ${p.value}h` },
          }} style={{ height: 220 }} />
        }
        <p className="text-slate-500 text-xs mt-1">
          睡眠不足6h：<span className="text-bad">{shortDays}天（{shortPct}%）</span>
        </p>
      </SectionCard>
      <SectionCard title="月均睡眠时长">
        {sleepMonthly.length === 0 ? <EmptyState label="睡眠趋势" /> :
          <ReactECharts option={lineChartOption({
            data: sleepMonthly,
            color: COLORS.sleepOrange,
            markLine: { value: 7, label: '推荐 7h', color: COLORS.ok },
          })} style={{ height: 200 }} />
        }
      </SectionCard>
    </div>
  )
}
