import ReactECharts from 'echarts-for-react'
import { aggregateMonthly } from '../../lib/metrics'
import { buildSectionAdvice } from '../../lib/advice'
import { lineChartOption, COLORS } from '../../lib/chartOptions'
import { EmptyState, SectionCard } from './_empty'
import AdviceCard from '../AdviceCard'

export default function HeartRate({ data }) {
  const rhrMonthly = aggregateMonthly(data.restingHeartRate)
  const hrvMonthly = aggregateMonthly(data.hrv)
  const recoveryMonthly = aggregateMonthly(data.heartRateRecovery)
  const walkingHRMonthly = aggregateMonthly(data.walkingHR)
  const advice = buildSectionAdvice('heartrate', data)

  const hrValues = data.heartRate.map(r => r.value)
  const bins = Array.from({ length: 14 }, (_, i) => ({ range: 40 + i * 10, count: 0 }))
  for (const v of hrValues) {
    const idx = Math.min(Math.floor((v - 40) / 10), 13)
    if (idx >= 0) bins[idx].count++
  }
  const tachycardiaCount = hrValues.filter(v => v > 100).length
  const tachycardiaPct = hrValues.length ? ((tachycardiaCount / hrValues.length) * 100).toFixed(1) : 0

  return (
    <div>
      <AdviceCard advice={advice} />
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <SectionCard title="静息心率趋势（月均）">
          {rhrMonthly.length === 0 ? <EmptyState label="静息心率" /> :
            <ReactECharts option={lineChartOption({
              data: rhrMonthly,
              color: COLORS.hrPink,
              markLine: { value: 65, label: '65 bpm', color: COLORS.warn },
            })} style={{ height: 200 }} />
          }
        </SectionCard>
        <SectionCard title="HRV SDNN 趋势（月均）">
          {hrvMonthly.length === 0 ? <EmptyState label="HRV" /> :
            <ReactECharts option={lineChartOption({
              data: hrvMonthly,
              color: COLORS.hrvBlue,
              markLine: { value: 45, label: '45ms 参考', color: COLORS.warn },
            })} style={{ height: 200 }} />
          }
        </SectionCard>
      </div>
      <SectionCard title="心率分布">
        {hrValues.length === 0 ? <EmptyState label="心率" /> : (
          <>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              grid: { left: 40, right: 16, top: 16, bottom: 32 },
              xAxis: { type: 'category', data: bins.map(b => `${b.range}-${b.range+9}`), axisLabel: { color: COLORS.text, fontSize: 10, rotate: 30 } },
              yAxis: { type: 'value', axisLabel: { color: COLORS.text }, splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } } },
              series: [{ type: 'bar', data: bins.map(b => b.count), itemStyle: { color: COLORS.hrPink } }],
              tooltip: { formatter: p => `${p.name} bpm: ${p.value.toLocaleString()} 次` },
            }} style={{ height: 180 }} />
            <p className="text-slate-500 text-xs mt-1">心动过速（&gt;100 bpm）占比：<span className="text-warn">{tachycardiaPct}%</span></p>
          </>
        )}
      </SectionCard>
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="心率恢复（一分钟）">
          {recoveryMonthly.length === 0 ? <EmptyState label="心率恢复" /> :
            <ReactECharts option={lineChartOption({
              data: recoveryMonthly,
              color: COLORS.fitnessGreen,
              markLine: { value: 18, label: '18 bpm 参考', color: COLORS.warn },
            })} style={{ height: 180 }} />
          }
        </SectionCard>
        <SectionCard title="步行平均心率">
          {walkingHRMonthly.length === 0 ? <EmptyState label="步行心率" /> :
            <ReactECharts option={lineChartOption({
              data: walkingHRMonthly,
              color: COLORS.sleepOrange,
            })} style={{ height: 180 }} />
          }
        </SectionCard>
      </div>
    </div>
  )
}
