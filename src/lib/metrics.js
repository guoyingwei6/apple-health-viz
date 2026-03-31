// src/lib/metrics.js

const VO2MAX_THRESHOLDS = {
  male:   [{ maxAge: 29, ok: 44 }, { maxAge: 39, ok: 42 }, { maxAge: 49, ok: 39 }, { maxAge: 200, ok: 36 }],
  female: [{ maxAge: 29, ok: 40 }, { maxAge: 39, ok: 38 }, { maxAge: 49, ok: 35 }, { maxAge: 200, ok: 32 }],
}

function getVO2MaxThreshold(sex, age) {
  const table = VO2MAX_THRESHOLDS[sex]
  if (!table) return null
  return table.find(r => age <= r.maxAge)?.ok ?? null
}

/**
 * 解析带时区偏移的日期字符串，返回 { utcMs, localHour, localDateStr }
 * 支持格式：'2025-01-10 23:00:00 +0800'
 * localHour 和 localDateStr 基于字符串中明确的时区偏移计算
 */
function parseDateWithTZ(dateStr) {
  // 匹配格式：'2025-01-10 23:00:00 +0800' 或 '2025-01-10T23:00:00+08:00'
  const m = dateStr.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2}) ?([+-])(\d{2}):?(\d{2})$/)
  if (m) {
    const iso = `${m[1]}T${m[2]}${m[3]}${m[4]}:${m[5]}`
    const utcMs = new Date(iso).getTime()
    const sign = m[3] === '+' ? 1 : -1
    const offsetMin = sign * (parseInt(m[4]) * 60 + parseInt(m[5]))
    const localMs = utcMs + offsetMin * 60000
    const localDate = new Date(localMs)
    const localHour = localDate.getUTCHours()
    const localDateStr = localDate.toISOString().slice(0, 10)
    return { utcMs, localHour, localDateStr }
  }
  // 无时区偏移，直接解析
  const utcMs = new Date(dateStr).getTime()
  const d = new Date(utcMs)
  return {
    utcMs,
    localHour: d.getHours(),
    localDateStr: d.toISOString().slice(0, 10),
  }
}

export function monthlyAvg(records) {
  const buckets = {}
  for (const { date, value } of records) {
    const month = date.slice(0, 7)
    if (!buckets[month]) buckets[month] = []
    buckets[month].push(value)
  }
  const result = {}
  for (const [month, vals] of Object.entries(buckets)) {
    result[month] = vals.reduce((a, b) => a + b, 0) / vals.length
  }
  return result
}

export function aggregateMonthly(records) {
  const avgs = monthlyAvg(records)
  return Object.entries(avgs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, avg]) => ({ month, avg }))
}

export function aggregateStepsByDay(records) {
  const byDay = {}
  for (const { date, value } of records) {
    byDay[date] = (byDay[date] ?? 0) + value
  }
  return byDay
}

const ASLEEP_TYPES = new Set([
  'HKCategoryValueSleepAnalysisAsleep',
  'HKCategoryValueSleepAnalysisAsleepCore',
  'HKCategoryValueSleepAnalysisAsleepDeep',
  'HKCategoryValueSleepAnalysisAsleepREM',
])

function isNap(startLocalHour, durationHours) {
  if (durationHours >= 3) return false
  return startLocalHour >= 9 && startLocalHour < 20
}

export function aggregateSleepByDay(rawSleepRecords) {
  const byDay = {}
  for (const rec of rawSleepRecords) {
    if (!ASLEEP_TYPES.has(rec.value)) continue
    const start = parseDateWithTZ(rec.startDate)
    const end = parseDateWithTZ(rec.endDate)
    const durationHours = (end.utcMs - start.utcMs) / 3_600_000
    if (isNap(start.localHour, durationHours)) continue
    // 结束时本地小时 < 12，归属前一天
    const endLocalHour = end.localHour
    let dateKey = end.localDateStr
    if (endLocalHour < 12) {
      const prev = new Date(end.utcMs - endLocalHour * 3600000 - 60000)
      // 取前一天日期：从 localDateStr 减一天
      const d = new Date(end.utcMs)
      d.setUTCDate(d.getUTCDate() - 1)
      // 更准确：基于 localDateStr 计算前一天
      const [y, m, day] = dateKey.split('-').map(Number)
      const prevDate = new Date(Date.UTC(y, m - 1, day - 1))
      dateKey = prevDate.toISOString().slice(0, 10)
    }
    if (!byDay[dateKey]) byDay[dateKey] = { durationHours: 0 }
    byDay[dateKey].durationHours += durationHours
  }
  for (const d of Object.values(byDay)) {
    d.isShort = d.durationHours < 6
  }
  return byDay
}

export function rateRestingHR(bpm) {
  if (bpm >= 50 && bpm <= 65) return 'ok'
  if ((bpm > 65 && bpm <= 75) || (bpm >= 45 && bpm < 50)) return 'warn'
  return 'bad'
}

export function rateHRV(ms) {
  if (ms > 45) return 'ok'
  if (ms >= 30) return 'warn'
  return 'bad'
}

export function rateSleep(avgHours, shortDaysPct) {
  if (avgHours >= 7 && shortDaysPct < 0.15) return 'ok'
  if (shortDaysPct > 0.3) return 'bad'
  if (avgHours < 6) return 'bad'
  return 'warn'
}

export function rateSteps(dailyAvg) {
  if (dailyAvg >= 8000) return 'ok'
  if (dailyAvg >= 5000) return 'warn'
  return 'bad'
}

export function rateVO2Max(value, profile) {
  if (!profile?.sex || !profile?.age) return null
  const threshold = getVO2MaxThreshold(profile.sex, profile.age)
  if (threshold === null) return null
  if (value >= threshold) return 'ok'
  if (value >= threshold - 6) return 'warn'
  return 'bad'
}

export function rateBodyFat(fraction, sex) {
  const pct = fraction * 100
  if (sex === 'male') {
    if (pct >= 8 && pct <= 19) return 'ok'
    if ((pct >= 20 && pct <= 25) || (pct >= 6 && pct < 8)) return 'warn'
    return 'bad'
  }
  if (sex === 'female') {
    if (pct >= 21 && pct <= 33) return 'ok'
    if ((pct >= 34 && pct <= 38) || (pct >= 18 && pct < 21)) return 'warn'
    return 'bad'
  }
  return null
}

export function rateBMI(bmi) {
  if (bmi >= 18.5 && bmi < 25) return 'ok'
  if ((bmi >= 25 && bmi < 30) || (bmi >= 17 && bmi < 18.5)) return 'warn'
  return 'bad'
}
