import ReactECharts from 'echarts-for-react'
import { aggregateMonthly, rateVO2Max } from '../../lib/metrics'
import { buildSectionAdvice } from '../../lib/advice'
import { lineChartOption, COLORS, RATING_ICON, RATING_LABEL } from '../../lib/chartOptions'
import { EmptyState, SectionCard } from './_empty'
import AdviceCard from '../AdviceCard'

export default function Fitness({ data, profile }) {
  const vo2Monthly = aggregateMonthly(data.vo2max)
  const sixWalkMonthly = aggregateMonthly(data.sixMinuteWalk)
  const latestVO2 = data.vo2max.length ? data.vo2max[data.vo2max.length - 1].value : null
  const userProfile = profile.sex && profile.age ? profile : null
  const vo2Rating = latestVO2 ? rateVO2Max(latestVO2, userProfile) : null

  const steadiness = data.walkingSteadiness
  const avgSteadiness = steadiness.length
    ? (steadiness.reduce((s, r) => s + r.value, 0) / steadiness.length * 100).toFixed(1)
    : null
  const advice = buildSectionAdvice('fitness', data, profile)

  return (
    <div>
      <AdviceCard advice={advice} />
      <SectionCard title="VO₂Max 最大摄氧量趋势">
        {vo2Monthly.length === 0 ? <EmptyState label="VO₂Max" /> : (
          <>
            <ReactECharts option={lineChartOption({ data: vo2Monthly, color: COLORS.fitnessGreen })} style={{ height: 200 }} />
            {latestVO2 && (
              <p className="text-xs text-slate-500 mt-1">
                最新值：<span style={{ color: COLORS.fitnessGreen }} className="font-semibold">{latestVO2.toFixed(1)} mL/kg/min</span>
                {vo2Rating
                  ? <span className="ml-2">{RATING_ICON[vo2Rating]} {RATING_LABEL[vo2Rating]}</span>
                  : <span className="ml-2 text-slate-600">（填写性别年龄以显示评级）</span>}
              </p>
            )}
          </>
        )}
      </SectionCard>
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="6分钟步行测试">
          {sixWalkMonthly.length === 0 ? <EmptyState label="步行测试" /> :
            <ReactECharts option={lineChartOption({
              data: sixWalkMonthly,
              color: COLORS.fitnessGreen,
              markLine: { value: 500, label: '500m 参考', color: COLORS.warn },
            })} style={{ height: 180 }} />
          }
        </SectionCard>
        <SectionCard title="步行稳定性">
          {avgSteadiness
            ? <div className="flex items-center justify-center h-32"><span className="text-5xl font-bold" style={{ color: COLORS.fitnessGreen }}>{avgSteadiness}%</span></div>
            : <EmptyState label="步行稳定性" />}
        </SectionCard>
      </div>
    </div>
  )
}
