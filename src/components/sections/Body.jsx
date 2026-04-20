import ReactECharts from 'echarts-for-react'
import { lineChartOption, COLORS } from '../../lib/chartOptions'
import { buildSectionAdvice } from '../../lib/advice'
import { EmptyState, SectionCard } from './_empty'
import AdviceCard from '../AdviceCard'

function toMonthly(records) {
  const buckets = {}
  for (const { date, value } of records) {
    const m = date.slice(0, 7)
    if (!buckets[m]) buckets[m] = []
    buckets[m].push(value)
  }
  return Object.entries(buckets).sort().map(([month, vals]) => ({
    month, avg: vals.reduce((a, b) => a + b, 0) / vals.length,
  }))
}

export default function Body({ data, profile }) {
  const massMonthly = toMonthly(data.bodyMass)
  const leanMassMonthly = toMonthly(data.leanBodyMass)
  const bmiMonthly = toMonthly(data.bmi)
  const fatMonthly = toMonthly(data.bodyFat.map(r => ({ ...r, value: r.value * 100 })))
  const advice = buildSectionAdvice('body', data, profile)

  return (
    <div>
      <AdviceCard advice={advice} />
      <SectionCard title="体重趋势 (kg)">
        {massMonthly.length === 0 ? <EmptyState label="体重" /> :
          <ReactECharts option={lineChartOption({ data: massMonthly, color: COLORS.hrPink })} style={{ height: 200 }} />
        }
      </SectionCard>
      <SectionCard title="瘦体重趋势 (kg)">
        {leanMassMonthly.length === 0 ? <EmptyState label="瘦体重" /> :
          <ReactECharts option={lineChartOption({ data: leanMassMonthly, color: COLORS.fitnessGreen })} style={{ height: 180 }} />
        }
      </SectionCard>
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="BMI 趋势">
          {bmiMonthly.length === 0 ? <EmptyState label="BMI" /> :
            <ReactECharts option={lineChartOption({
              data: bmiMonthly,
              color: COLORS.sleepOrange,
              markLine: { value: 24.9, label: '正常上限 24.9', color: COLORS.warn },
            })} style={{ height: 180 }} />
          }
        </SectionCard>
        <SectionCard title={`体脂率趋势 (%)${!profile.sex ? ' · 填写性别显示参考区间' : ''}`}>
          {fatMonthly.length === 0 ? <EmptyState label="体脂率" /> :
            <ReactECharts option={lineChartOption({
              data: fatMonthly,
              color: COLORS.stepsPurple,
              markLine: profile.sex === 'male'
                ? { value: 19, label: '男性正常上限 19%', color: COLORS.warn }
                : profile.sex === 'female'
                ? { value: 33, label: '女性正常上限 33%', color: COLORS.warn }
                : undefined,
            })} style={{ height: 180 }} />
          }
        </SectionCard>
      </div>
    </div>
  )
}
