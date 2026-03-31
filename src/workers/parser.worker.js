// src/workers/parser.worker.js

export const RECORD_TYPES = {
  HKQuantityTypeIdentifierHeartRate:             'heartRate',
  HKQuantityTypeIdentifierRestingHeartRate:      'restingHeartRate',
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: 'hrv',
  HKQuantityTypeIdentifierHeartRateRecoveryOneMinute: 'heartRateRecovery',
  HKQuantityTypeIdentifierStepCount:             'steps',
  HKQuantityTypeIdentifierActiveEnergyBurned:    'activeEnergy',
  HKQuantityTypeIdentifierAppleStandTime:        'standTime',
  HKQuantityTypeIdentifierVO2Max:                'vo2max',
  HKQuantityTypeIdentifierSixMinuteWalkTestDistance: 'sixMinuteWalk',
  HKQuantityTypeIdentifierAppleWalkingSteadiness: 'walkingSteadiness',
  HKQuantityTypeIdentifierBodyMass:              'bodyMass',
  HKQuantityTypeIdentifierBodyMassIndex:         'bmi',
  HKQuantityTypeIdentifierBodyFatPercentage:     'bodyFat',
  HKQuantityTypeIdentifierRespiratoryRate:       'respiratoryRate',
  HKQuantityTypeIdentifierWalkingHeartRateAverage: 'walkingHR',
  HKCategoryTypeIdentifierSleepAnalysis:         'sleepRaw',
}

const TYPE_RE = /type="([^"]+)"/
const DATE_RE = /startDate="([^"]+)"/
const END_RE  = /endDate="([^"]+)"/
const VAL_RE  = /value="([^"]+)"/

export function parseRecordLine(line) {
  if (!line.includes('<Record')) return null
  const typeM = TYPE_RE.exec(line)
  if (!typeM) return null
  const internalKey = RECORD_TYPES[typeM[1]]
  if (!internalKey) return null

  const valM = VAL_RE.exec(line)
  if (!valM) return null

  if (internalKey === 'sleepRaw') {
    const startM = DATE_RE.exec(line)
    const endM = END_RE.exec(line)
    if (!startM || !endM) return null
    return { type: 'sleepRaw', startDate: startM[1], endDate: endM[1], value: valM[1] }
  }

  const dateM = DATE_RE.exec(line)
  if (!dateM) return null
  const date = dateM[1].slice(0, 10)
  const value = parseFloat(valM[1])
  if (isNaN(value)) return null
  return { type: internalKey, date, value }
}

// Worker entry point（只在 Worker 上下文中执行）
if (typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined') {
  self.onmessage = async ({ data: { text } }) => {
    const buckets = {}
    for (const key of Object.values(RECORD_TYPES)) {
      if (key !== 'sleepRaw') buckets[key] = []
    }
    const sleepRaw = []

    const lines = text.split('\n')
    const total = lines.length

    for (let i = 0; i < lines.length; i++) {
      const record = parseRecordLine(lines[i])
      if (record) {
        if (record.type === 'sleepRaw') {
          sleepRaw.push(record)
        } else {
          buckets[record.type].push({ date: record.date, value: record.value })
        }
      }
      if (i % 50_000 === 0) {
        self.postMessage({ type: 'progress', processed: i, total })
      }
    }

    const { aggregateSleepByDay } = await import('../lib/metrics.js')
    const sleepByDay = aggregateSleepByDay(sleepRaw)
    const sleep = Object.entries(sleepByDay)
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const allDates = Object.values(buckets).flat().map(r => r.date).sort()
    const meta = {
      totalRecords: lines.filter(l => l.includes('<Record')).length,
      dateRange: {
        start: allDates[0] ?? null,
        end: allDates.at(-1) ?? null,
      },
    }

    self.postMessage({ type: 'done', payload: { ...buckets, sleep, meta } })
  }
}
