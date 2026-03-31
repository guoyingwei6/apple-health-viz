import { RATING_COLOR, RATING_ICON, RATING_LABEL } from '../../lib/chartOptions'
import { SectionCard } from './_empty'

const DIMENSION_TIPS = {
  ok: '表现良好，继续保持。',
  warn: '需要关注，建议改善。',
  bad: '存在健康隐患，建议重视并采取行动。',
  null: '数据不足，无法评级。',
}

const DIMENSIONS = [
  { key: 'rhrRating', label: '心率健康', detail: '静息心率反映心血管基础状态' },
  { key: 'hrvRating', label: '自主神经 (HRV)', detail: 'HRV 低提示压力、疲劳或恢复不足' },
  { key: 'sleepRating', label: '睡眠质量', detail: '睡眠不足影响心血管、代谢和认知' },
  { key: 'stepsRating', label: '日常活动量', detail: '步数反映整体活动水平' },
  { key: 'vo2Rating', label: '有氧能力 (VO₂Max)', detail: 'VO₂Max 是心肺耐力的核心指标' },
  { key: 'bmiRating', label: '体重 (BMI)', detail: 'BMI 是体重健康的基础参考指标' },
]

function RatingRow({ label, rating, detail }) {
  const color = RATING_COLOR[rating] ?? RATING_COLOR.null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
      <span className="text-lg mt-0.5">{RATING_ICON[rating] ?? '⚪'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-200 text-sm font-medium">{label}</span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: color + '22', color }}>
            {RATING_LABEL[rating] ?? '暂无'}
          </span>
        </div>
        <p className="text-slate-500 text-xs mt-0.5">{detail}</p>
        <p className="text-xs mt-0.5" style={{ color }}>{DIMENSION_TIPS[rating] ?? DIMENSION_TIPS.null}</p>
      </div>
    </div>
  )
}

export default function Summary({ data, profile, kpis }) {
  const badCount = Object.values(kpis).filter(r => r === 'bad').length
  const warnCount = Object.values(kpis).filter(r => r === 'warn').length

  return (
    <div>
      <SectionCard>
        <div className="mb-4">
          <h2 className="text-slate-100 text-lg font-bold">综合健康评估</h2>
          <p className="text-slate-500 text-xs">
            {badCount > 0
              ? `发现 ${badCount} 项异常，${warnCount} 项需关注`
              : warnCount > 0
              ? `${warnCount} 项需关注，整体状况尚可`
              : '各项指标均在正常范围内'}
          </p>
        </div>
        {DIMENSIONS.map(d => (
          <RatingRow key={d.key} label={d.label} rating={kpis[d.key]} detail={d.detail} />
        ))}
      </SectionCard>
      <SectionCard title="说明">
        <p className="text-slate-500 text-xs leading-relaxed">
          以上分析基于 Apple Watch 可穿戴设备数据，仅供参考，不能替代专业医疗诊断。
          如有持续不适或指标持续异常，请咨询医生。
        </p>
      </SectionCard>
    </div>
  )
}
