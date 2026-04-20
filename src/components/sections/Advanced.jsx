import ReactECharts from 'echarts-for-react'
import { aggregateMonthly } from '../../lib/metrics'
import { buildSectionAdvice } from '../../lib/advice'
import { baseChartOption, lineChartOption, COLORS } from '../../lib/chartOptions'
import { EmptyState, SectionCard } from './_empty'
import AdviceCard from '../AdviceCard'

function MonthlyLine({ title, records, color, unit = '', scale = 1 }) {
  const monthly = aggregateMonthly(records.map(record => ({ ...record, value: record.value * scale })))
  const displayUnit = unit || records[0]?.unit || ''
  return (
    <SectionCard title={title}>
      {monthly.length === 0 ? <EmptyState label={title} /> :
        <ReactECharts option={{
          ...lineChartOption({ data: monthly, color }),
          yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } },
            axisLabel: { color: COLORS.text, formatter: v => displayUnit ? `${v}${displayUnit}` : v },
          },
        }} style={{ height: 180 }} />
      }
    </SectionCard>
  )
}

function BloodPressure({ systolic, diastolic }) {
  const sys = aggregateMonthly(systolic)
  const dia = aggregateMonthly(diastolic)
  const months = Array.from(new Set([...sys.map(d => d.month), ...dia.map(d => d.month)])).sort()
  const valueFor = (series, month) => {
    const found = series.find(item => item.month === month)
    return found ? Math.round(found.avg) : null
  }

  return (
    <SectionCard title="血压（月均）">
      {months.length === 0 ? <EmptyState label="血压" /> :
        <ReactECharts option={{
          ...baseChartOption(),
          legend: { data: ['收缩压', '舒张压'], textStyle: { color: COLORS.text }, top: 0 },
          xAxis: { type: 'category', data: months, axisLabel: { color: COLORS.text, rotate: 30, fontSize: 10 } },
          yAxis: { type: 'value', axisLabel: { color: COLORS.text, formatter: v => `${v} mmHg` }, splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } } },
          series: [
            { name: '收缩压', type: 'line', data: months.map(month => valueFor(sys, month)), smooth: true, itemStyle: { color: COLORS.bad }, lineStyle: { color: COLORS.bad } },
            { name: '舒张压', type: 'line', data: months.map(month => valueFor(dia, month)), smooth: true, itemStyle: { color: COLORS.hrvBlue }, lineStyle: { color: COLORS.hrvBlue } },
          ],
          tooltip: { trigger: 'axis' },
        }} style={{ height: 210 }} />
      }
    </SectionCard>
  )
}

export default function Advanced({ data }) {
  const advice = buildSectionAdvice('advanced', data)

  return (
    <div>
      <AdviceCard advice={advice} />
      <div className="grid md:grid-cols-2 gap-4">
        <MonthlyLine title="呼吸频率（月均）" records={data.respiratoryRate} color={COLORS.hrvBlue} unit="/min" />
        <MonthlyLine title="血氧（月均）" records={data.oxygenSaturation} color={COLORS.fitnessGreen} unit="%" scale={100} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <BloodPressure systolic={data.bloodPressureSystolic} diastolic={data.bloodPressureDiastolic} />
        <MonthlyLine title="体温（月均）" records={data.bodyTemperature} color={COLORS.sleepOrange} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <MonthlyLine title="跑步功率（月均）" records={data.runningPower} color={COLORS.fitnessGreen} />
        <MonthlyLine title="跑步速度（月均）" records={data.runningSpeed} color={COLORS.stepsPurple} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <MonthlyLine title="跑步步幅（月均）" records={data.runningStrideLength} color={COLORS.hrPink} />
        <MonthlyLine title="垂直振幅（月均）" records={data.runningVerticalOscillation} color={COLORS.sleepOrange} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <MonthlyLine title="触地时间（月均）" records={data.runningGroundContactTime} color={COLORS.hrvBlue} />
        <MonthlyLine title="骑行功率（月均）" records={data.cyclingPower} color={COLORS.fitnessGreen} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <MonthlyLine title="骑行踏频（月均）" records={data.cyclingCadence} color={COLORS.stepsPurple} />
        <MonthlyLine title="骑行速度（月均）" records={data.cyclingSpeed} color={COLORS.hrPink} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <MonthlyLine title="游泳距离（月均）" records={data.distanceSwimming} color={COLORS.hrvBlue} />
        <MonthlyLine title="游泳划水次数（月均）" records={data.swimmingStrokeCount} color={COLORS.sleepOrange} />
      </div>
    </div>
  )
}
