import {
  aggregateStepsByDay,
  rateBMI,
  rateHRV,
  rateRestingHR,
  rateSleep,
  rateSteps,
  rateVO2Max,
} from './metrics'

const EMPTY_ADVICE = {
  status: 'null',
  summary: '数据不足，暂时无法判断是否稳定或达标。',
  stability: '数据不足',
  medical: '如有持续不适、胸痛、晕厥、呼吸困难或异常出血，请及时就医。',
  metrics: [],
  actions: ['继续积累至少 2-4 周数据，再观察趋势。'],
}

function avg(values) {
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function latest(records = []) {
  if (!records.length) return null
  return records[records.length - 1].value
}

function recentValues(records = [], count = 30) {
  return records.slice(-count).map(record => record.value).filter(Number.isFinite)
}

function splitRecent(records = [], count = 30) {
  const values = records.map(record => record.value).filter(Number.isFinite)
  const recent = values.slice(-count)
  const previous = values.slice(-(count * 2), -count)
  return { recent, previous }
}

function stabilityText(records = [], label = '该指标') {
  const { recent, previous } = splitRecent(records)
  if (recent.length < 2) return `${label}数据较少，稳定性判断有限。`
  const recentAvg = avg(recent)
  const previousAvg = avg(previous)
  if (!previous.length || !previousAvg) {
    const spread = Math.max(...recent) - Math.min(...recent)
    if (recentAvg && spread / Math.abs(recentAvg) <= 0.05) return `${label}最近阶段基本稳定。`
    return `${label}近期波动可继续观察。`
  }
  const change = ((recentAvg - previousAvg) / Math.abs(previousAvg)) * 100
  if (Math.abs(change) <= 5) return `${label}最近阶段基本稳定。`
  if (change > 0) return `${label}最近阶段上升 ${Math.abs(change).toFixed(0)}%。`
  return `${label}最近阶段下降 ${Math.abs(change).toFixed(0)}%。`
}

function worstStatus(statuses) {
  if (statuses.includes('bad')) return 'bad'
  if (statuses.includes('warn')) return 'warn'
  if (statuses.includes('ok')) return 'ok'
  return 'null'
}

function metric(label, value, unit, status) {
  return { label, value: value === null ? '暂无' : `${value}${unit}`, status: status ?? 'null' }
}

function advice(status, summary, stability, medical, metrics, actions) {
  return { status, summary, stability, medical, metrics, actions }
}

function heartAdvice(data) {
  const rhr = avg(recentValues(data.restingHeartRate))
  const hrv = avg(recentValues(data.hrv))
  const recovery = avg(recentValues(data.heartRateRecovery))
  if (rhr === null && hrv === null && recovery === null) return EMPTY_ADVICE

  const rhrRating = rhr === null ? null : rateRestingHR(Math.round(rhr))
  const hrvRating = hrv === null ? null : rateHRV(Math.round(hrv))
  const status = worstStatus([rhrRating, hrvRating])
  const needsCare = (rhr !== null && (rhr > 90 || rhr < 45)) || (hrv !== null && hrv < 20)

  return advice(
    needsCare ? 'bad' : status,
    status === 'ok' ? '心血管基础指标达标。' : '心率恢复或自主神经恢复状态需要关注。',
    stabilityText(data.restingHeartRate, '静息心率'),
    needsCare
      ? '若静息心率多日高于 90、低于 45，或伴随胸闷、心悸、头晕，建议就医评估。'
      : '暂未看到明确就医信号；若出现胸痛、晕厥或持续心悸，应及时就医。',
    [
      metric('静息心率', rhr === null ? null : Math.round(rhr), ' bpm', rhrRating),
      metric('HRV', hrv === null ? null : Math.round(hrv), ' ms', hrvRating),
      metric('心率恢复', recovery === null ? null : Math.round(recovery), ' bpm', recovery !== null && recovery >= 18 ? 'ok' : recovery === null ? null : 'warn'),
    ],
    status === 'ok'
      ? ['维持每周 150 分钟中等强度有氧训练，保留 1-2 天低强度恢复。']
      : ['减少连续高强度训练，优先保证睡眠和补水。', '连续 2 周 HRV 偏低时，降低训练量 20-30%。']
  )
}

function sleepAdvice(data) {
  const recentSleep = (data.sleep ?? []).slice(-30)
  if (!recentSleep.length) return EMPTY_ADVICE
  const sleepAvg = avg(recentSleep.map(record => record.durationHours))
  const shortPct = recentSleep.filter(record => record.isShort).length / recentSleep.length
  const rating = rateSleep(sleepAvg, shortPct)
  const needsCare = sleepAvg < 5 || shortPct > 0.5

  return advice(
    needsCare ? 'bad' : rating,
    rating === 'ok' ? '睡眠时长达标。' : '睡眠时长未达标，恢复质量可能受影响。',
    stabilityText(recentSleep.map(record => ({ value: record.durationHours })), '睡眠时长'),
    needsCare
      ? '若连续多周平均睡眠低于 5 小时，或伴随白天嗜睡、打鼾憋醒，建议就医或做睡眠评估。'
      : '暂未看到明确就医信号；若长期失眠、憋醒或白天功能明显下降，应咨询医生。',
    [
      metric('平均睡眠', sleepAvg.toFixed(1), ' h', rating),
      metric('短睡占比', Math.round(shortPct * 100), '%', shortPct > 0.3 ? 'bad' : shortPct > 0.15 ? 'warn' : 'ok'),
    ],
    rating === 'ok'
      ? ['维持固定入睡和起床时间，训练日避免过晚高强度运动。']
      : ['先把目标定为每晚增加 30-45 分钟睡眠。', '睡前 60 分钟降低屏幕、咖啡因和酒精刺激。']
  )
}

function activityAdvice(data) {
  const stepsByDay = aggregateStepsByDay(data.steps ?? [])
  const stepVals = Object.values(stepsByDay)
  const avgSteps = avg(stepVals)
  if (avgSteps === null) return EMPTY_ADVICE
  const stepRating = rateSteps(avgSteps)
  const activeEnergy = avg(recentValues(data.activeEnergy))
  const status = stepRating

  return advice(
    status,
    status === 'ok' ? '日常活动量达标。' : '日常活动量未达标，需要逐步增加。',
    stabilityText(Object.entries(stepsByDay).map(([, value]) => ({ value })), '步数'),
    '运动时若出现胸痛、明显气短、头晕或异常心悸，应停止运动并就医。',
    [
      metric('日均步数', Math.round(avgSteps).toLocaleString(), ' 步', stepRating),
      metric('活动能量', activeEnergy === null ? null : Math.round(activeEnergy), ' kcal', activeEnergy === null ? null : activeEnergy >= 300 ? 'ok' : 'warn'),
    ],
    status === 'ok'
      ? ['维持当前活动量，加入每周 2 次力量训练提升代谢。']
      : ['从每天多步行 1500-2000 步开始，连续 2 周后再提高。', '久坐每 60 分钟起身 3-5 分钟。']
  )
}

function fitnessAdvice(data, profile) {
  const vo2 = latest(data.vo2max ?? [])
  const walk = avg(recentValues(data.sixMinuteWalk))
  const steadiness = avg(recentValues(data.walkingSteadiness))
  if (vo2 === null && walk === null && steadiness === null) return EMPTY_ADVICE
  const vo2Rating = vo2 === null ? null : rateVO2Max(vo2, profile?.sex && profile?.age ? profile : null)
  const walkStatus = walk === null ? null : walk >= 500 ? 'ok' : walk >= 400 ? 'warn' : 'bad'
  const status = worstStatus([vo2Rating, walkStatus])
  const needsCare = walk !== null && walk < 400

  return advice(
    needsCare ? 'bad' : status,
    status === 'ok' ? '有氧能力和步行能力表现良好。' : '心肺能力或步行功能需要改善。',
    stabilityText(data.vo2max ?? [], 'VO₂Max'),
    needsCare
      ? '6 分钟步行距离偏低，若伴随气短、胸闷或下肢无力，建议就医评估。'
      : '训练中若出现胸痛、晕厥、异常气短，应停止训练并就医。',
    [
      metric('VO₂Max', vo2 === null ? null : vo2.toFixed(1), '', vo2Rating),
      metric('6分钟步行', walk === null ? null : Math.round(walk), ' m', walkStatus),
      metric('步行稳定性', steadiness === null ? null : (steadiness * 100).toFixed(1), '%', steadiness === null ? null : steadiness >= 0.9 ? 'ok' : 'warn'),
    ],
    status === 'ok'
      ? ['维持每周 2-3 次 Zone 2 有氧，搭配短间歇训练。']
      : ['先以低冲击有氧为主，每次 20-30 分钟。', '每周增加不超过 10% 的训练总量。']
  )
}

function bodyAdvice(data, profile) {
  const bmi = latest(data.bmi ?? [])
  const bodyFat = latest(data.bodyFat ?? [])
  const mass = latest(data.bodyMass ?? [])
  if (bmi === null && bodyFat === null && mass === null) return EMPTY_ADVICE
  const bmiRating = bmi === null ? null : rateBMI(bmi)
  const fatPct = bodyFat === null ? null : bodyFat * 100
  const fatStatus = fatPct === null || !profile?.sex
    ? null
    : profile.sex === 'male'
      ? fatPct <= 19 && fatPct >= 8 ? 'ok' : fatPct <= 25 ? 'warn' : 'bad'
      : fatPct <= 33 && fatPct >= 21 ? 'ok' : fatPct <= 38 ? 'warn' : 'bad'
  const status = worstStatus([bmiRating, fatStatus])
  const needsCare = bmi !== null && (bmi >= 30 || bmi < 17)

  return advice(
    needsCare ? 'bad' : status,
    status === 'ok' ? '身体组成处在较理想范围。' : '体重或体脂指标需要改善。',
    stabilityText(data.bodyMass ?? [], '体重'),
    needsCare
      ? 'BMI 达到肥胖或明显偏低范围，建议就医或咨询营养师进行风险评估。'
      : '若短期体重无明显原因快速变化，或伴随乏力、水肿、食欲异常，应咨询医生。',
    [
      metric('BMI', bmi === null ? null : bmi.toFixed(1), '', bmiRating),
      metric('体脂率', fatPct === null ? null : fatPct.toFixed(1), '%', fatStatus),
      metric('体重', mass === null ? null : mass.toFixed(1), ' kg', null),
    ],
    status === 'ok'
      ? ['维持蛋白质摄入和力量训练，避免只看体重忽略肌肉量。']
      : ['优先建立每周 2-3 次力量训练和每日稳定步数。', '控制精制糖和酒精，保证每餐有优质蛋白。']
  )
}

function advancedAdvice(data) {
  const spo2 = avg(recentValues(data.oxygenSaturation)) 
  const sys = avg(recentValues(data.bloodPressureSystolic))
  const dia = avg(recentValues(data.bloodPressureDiastolic))
  const resp = avg(recentValues(data.respiratoryRate))
  const temp = avg(recentValues(data.bodyTemperature))
  if (spo2 === null && sys === null && dia === null && resp === null && temp === null) return EMPTY_ADVICE

  const spo2Pct = spo2 === null ? null : spo2 * 100
  const bpStatus = sys === null || dia === null ? null : (sys >= 140 || dia >= 90 ? 'bad' : sys >= 130 || dia >= 80 ? 'warn' : 'ok')
  const spo2Status = spo2Pct === null ? null : spo2Pct < 92 ? 'bad' : spo2Pct < 95 ? 'warn' : 'ok'
  const respStatus = resp === null ? null : resp > 22 || resp < 10 ? 'warn' : 'ok'
  const tempStatus = temp === null ? null : temp >= 37.8 ? 'warn' : 'ok'
  const status = worstStatus([bpStatus, spo2Status, respStatus, tempStatus])
  const needsCare = bpStatus === 'bad' || spo2Status === 'bad'

  return advice(
    needsCare ? 'bad' : status,
    status === 'ok' ? '生命体征整体平稳。' : '生命体征存在需要复核的指标。',
    stabilityText(data.respiratoryRate ?? data.oxygenSaturation ?? [], '生命体征'),
    needsCare
      ? '若血压多次高于 140/90 或血氧多次低于 92%，建议就医复核。'
      : '单次异常先复测；若异常持续或伴随胸闷、气短、发热，应及时就医。',
    [
      metric('血氧', spo2Pct === null ? null : spo2Pct.toFixed(1), '%', spo2Status),
      metric('血压', sys === null || dia === null ? null : `${Math.round(sys)}/${Math.round(dia)}`, ' mmHg', bpStatus),
      metric('呼吸频率', resp === null ? null : resp.toFixed(1), '/min', respStatus),
      metric('体温', temp === null ? null : temp.toFixed(1), '°C', tempStatus),
    ],
    status === 'ok'
      ? ['保持规律训练和恢复，异常值先确认佩戴和测量条件。']
      : ['同一时间段连续复测 3-5 天，避免只看单次值。', '血压偏高时减少酒精和高盐饮食，先降低高强度训练。']
  )
}

export function buildSectionAdvice(section, data, profile = {}) {
  switch (section) {
    case 'heartrate':
      return heartAdvice(data)
    case 'sleep':
      return sleepAdvice(data)
    case 'activity':
      return activityAdvice(data)
    case 'fitness':
      return fitnessAdvice(data, profile)
    case 'body':
      return bodyAdvice(data, profile)
    case 'advanced':
      return advancedAdvice(data)
    default:
      return EMPTY_ADVICE
  }
}
