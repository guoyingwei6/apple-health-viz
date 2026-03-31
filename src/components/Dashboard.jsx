import { useState } from 'react'
import { RATING_COLOR, RATING_ICON, RATING_LABEL } from '../lib/chartOptions'
import {
  aggregateStepsByDay,
  rateRestingHR, rateHRV, rateSleep, rateSteps, rateVO2Max, rateBMI,
} from '../lib/metrics'
import HeartRate from './sections/HeartRate'
import Sleep from './sections/Sleep'
import Activity from './sections/Activity'
import Fitness from './sections/Fitness'
import Body from './sections/Body'
import Summary from './sections/Summary'

const TABS = [
  { id: 'summary', label: '概览' },
  { id: 'heartrate', label: '心率' },
  { id: 'sleep', label: '睡眠' },
  { id: 'activity', label: '活动' },
  { id: 'fitness', label: '体能' },
  { id: 'body', label: '体重' },
]

function KpiCard({ label, value, unit, rating, sub }) {
  const color = RATING_COLOR[rating] ?? '#94a3b8'
  return (
    <div className="bg-card rounded-xl p-3 flex flex-col gap-1 min-w-0">
      <span className="text-slate-500 text-xs truncate">{label}</span>
      <span className="font-bold tabular-nums" style={{ color, fontSize: '1.25rem' }}>
        {value ?? '—'}{unit && <span className="text-xs text-slate-500 ml-0.5">{unit}</span>}
      </span>
      {sub && <span className="text-xs" style={{ color }}>{RATING_ICON[rating]} {sub}</span>}
    </div>
  )
}

export default function Dashboard({ data, profile, onReset }) {
  const [tab, setTab] = useState('summary')

  const rhrList = data.restingHeartRate
  const avgRHR = rhrList.length ? Math.round(rhrList.reduce((s, r) => s + r.value, 0) / rhrList.length) : null
  const rhrRating = avgRHR ? rateRestingHR(avgRHR) : null

  const hrvList = data.hrv
  const avgHRV = hrvList.length ? Math.round(hrvList.reduce((s, r) => s + r.value, 0) / hrvList.length) : null
  const hrvRating = avgHRV ? rateHRV(avgHRV) : null

  const sleepAvg = data.sleep.length
    ? +(data.sleep.reduce((s, r) => s + r.durationHours, 0) / data.sleep.length).toFixed(1)
    : null
  const shortPct = data.sleep.length
    ? data.sleep.filter(r => r.isShort).length / data.sleep.length
    : 0
  const sleepRating = sleepAvg ? rateSleep(sleepAvg, shortPct) : null

  const stepsByDay = aggregateStepsByDay(data.steps)
  const stepVals = Object.values(stepsByDay)
  const avgSteps = stepVals.length ? Math.round(stepVals.reduce((a, b) => a + b, 0) / stepVals.length) : null
  const stepsRating = avgSteps ? rateSteps(avgSteps) : null

  const vo2List = data.vo2max
  const latestVO2 = vo2List.length ? +vo2List[vo2List.length - 1].value.toFixed(1) : null
  const vo2Rating = latestVO2 ? rateVO2Max(latestVO2, profile.sex && profile.age ? profile : null) : null

  const bmiList = data.bmi
  const latestBMI = bmiList.length ? +bmiList[bmiList.length - 1].value.toFixed(1) : null
  const bmiRating = latestBMI ? rateBMI(latestBMI) : null

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12">
      <div className="flex items-center justify-between py-4 border-b border-slate-800 mb-4">
        <h1 className="text-lg font-semibold">🍎 健康分析报告</h1>
        <button onClick={onReset} className="text-slate-500 hover:text-slate-300 text-sm">重新上传</button>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        <KpiCard label="静息心率" value={avgRHR} unit="bpm" rating={rhrRating} sub={RATING_LABEL[rhrRating]} />
        <KpiCard label="HRV" value={avgHRV} unit="ms" rating={hrvRating} sub={RATING_LABEL[hrvRating]} />
        <KpiCard label="平均睡眠" value={sleepAvg} unit="h" rating={sleepRating} sub={RATING_LABEL[sleepRating]} />
        <KpiCard label="日均步数" value={avgSteps?.toLocaleString()} rating={stepsRating} sub={RATING_LABEL[stepsRating]} />
        <KpiCard label="VO₂Max" value={latestVO2} rating={vo2Rating} sub={vo2Rating ? RATING_LABEL[vo2Rating] : '未填信息'} />
        <KpiCard label="BMI" value={latestBMI} rating={bmiRating} sub={RATING_LABEL[bmiRating]} />
      </div>

      <div>
        {tab === 'summary'   && <Summary data={data} profile={profile} kpis={{ rhrRating, hrvRating, sleepRating, stepsRating, vo2Rating, bmiRating }} />}
        {tab === 'heartrate' && <HeartRate data={data} />}
        {tab === 'sleep'     && <Sleep data={data} />}
        {tab === 'activity'  && <Activity data={data} stepsByDay={stepsByDay} />}
        {tab === 'fitness'   && <Fitness data={data} profile={profile} />}
        {tab === 'body'      && <Body data={data} profile={profile} />}
      </div>
    </div>
  )
}
