import ReactECharts from 'echarts-for-react'
import { COLORS, baseChartOption } from '../../lib/chartOptions'
import { aggregateMonthly } from '../../lib/metrics'
import { buildSectionAdvice } from '../../lib/advice'
import { EmptyState, SectionCard } from './_empty'
import AdviceCard from '../AdviceCard'

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
  const activeEnergyMonthly = aggregateMonthly(data.activeEnergy)
  const standTimeMonthly = aggregateMonthly(data.standTime)
  const distanceMonthly = aggregateMonthly(data.distanceWalkingRunning)
  const flightsMonthly = aggregateMonthly(data.flightsClimbed)
  const distanceUnit = data.distanceWalkingRunning[0]?.unit ?? ''
  const advice = buildSectionAdvice('activity', data)
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
      <AdviceCard advice={advice} />
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
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="活动能量（月均）">
          {activeEnergyMonthly.length === 0 ? <EmptyState label="活动能量" /> :
            <ReactECharts option={{
              ...baseChartOption(),
              xAxis: { type: 'category', data: activeEnergyMonthly.map(d => d.month), axisLabel: { color: COLORS.text, rotate: 30, fontSize: 10 } },
              yAxis: { type: 'value', axisLabel: { color: COLORS.text, formatter: v => `${v} kcal` }, splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } } },
              series: [{ type: 'bar', data: activeEnergyMonthly.map(d => Math.round(d.avg)), itemStyle: { color: COLORS.sleepOrange } }],
              tooltip: { formatter: p => `${p.name}: ${p.value.toLocaleString()} kcal` },
            }} style={{ height: 190 }} />
          }
        </SectionCard>
        <SectionCard title="站立时间（月均）">
          {standTimeMonthly.length === 0 ? <EmptyState label="站立时间" /> :
            <ReactECharts option={{
              ...baseChartOption(),
              xAxis: { type: 'category', data: standTimeMonthly.map(d => d.month), axisLabel: { color: COLORS.text, rotate: 30, fontSize: 10 } },
              yAxis: { type: 'value', axisLabel: { color: COLORS.text }, splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } } },
              series: [{ type: 'line', data: standTimeMonthly.map(d => +d.avg.toFixed(1)), smooth: true, itemStyle: { color: COLORS.hrvBlue }, lineStyle: { color: COLORS.hrvBlue } }],
              tooltip: { formatter: p => `${p.name}: ${p.value}` },
            }} style={{ height: 190 }} />
          }
        </SectionCard>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title={`步行/跑步距离（月均${distanceUnit ? ` ${distanceUnit}` : ''}）`}>
          {distanceMonthly.length === 0 ? <EmptyState label="步行/跑步距离" /> :
            <ReactECharts option={{
              ...baseChartOption(),
              xAxis: { type: 'category', data: distanceMonthly.map(d => d.month), axisLabel: { color: COLORS.text, rotate: 30, fontSize: 10 } },
              yAxis: { type: 'value', axisLabel: { color: COLORS.text, formatter: v => distanceUnit ? `${v} ${distanceUnit}` : v }, splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } } },
              series: [{ type: 'bar', data: distanceMonthly.map(d => +d.avg.toFixed(1)), itemStyle: { color: COLORS.fitnessGreen } }],
              tooltip: { formatter: p => `${p.name}: ${p.value}${distanceUnit ? ` ${distanceUnit}` : ''}` },
            }} style={{ height: 190 }} />
          }
        </SectionCard>
        <SectionCard title="爬楼层数（月均）">
          {flightsMonthly.length === 0 ? <EmptyState label="楼层" /> :
            <ReactECharts option={{
              ...baseChartOption(),
              xAxis: { type: 'category', data: flightsMonthly.map(d => d.month), axisLabel: { color: COLORS.text, rotate: 30, fontSize: 10 } },
              yAxis: { type: 'value', axisLabel: { color: COLORS.text }, splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } } },
              series: [{ type: 'bar', data: flightsMonthly.map(d => Math.round(d.avg)), itemStyle: { color: COLORS.stepsPurple } }],
              tooltip: { formatter: p => `${p.name}: ${p.value} 层` },
            }} style={{ height: 190 }} />
          }
        </SectionCard>
      </div>
    </div>
  )
}
