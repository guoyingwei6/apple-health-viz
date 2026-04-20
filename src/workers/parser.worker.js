// src/workers/parser.worker.js
import JSZip from 'jszip'

export const RECORD_TYPES = {
  HKQuantityTypeIdentifierHeartRate:             'heartRate',
  HKQuantityTypeIdentifierRestingHeartRate:      'restingHeartRate',
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: 'hrv',
  HKQuantityTypeIdentifierHeartRateRecoveryOneMinute: 'heartRateRecovery',
  HKQuantityTypeIdentifierStepCount:             'steps',
  HKQuantityTypeIdentifierActiveEnergyBurned:    'activeEnergy',
  HKQuantityTypeIdentifierBasalEnergyBurned:     'basalEnergy',
  HKQuantityTypeIdentifierAppleStandTime:        'standTime',
  HKQuantityTypeIdentifierDistanceWalkingRunning: 'distanceWalkingRunning',
  HKQuantityTypeIdentifierDistanceCycling:       'distanceCycling',
  HKQuantityTypeIdentifierDistanceSwimming:      'distanceSwimming',
  HKQuantityTypeIdentifierFlightsClimbed:        'flightsClimbed',
  HKQuantityTypeIdentifierVO2Max:                'vo2max',
  HKQuantityTypeIdentifierSixMinuteWalkTestDistance: 'sixMinuteWalk',
  HKQuantityTypeIdentifierAppleWalkingSteadiness: 'walkingSteadiness',
  HKQuantityTypeIdentifierBodyMass:              'bodyMass',
  HKQuantityTypeIdentifierBodyMassIndex:         'bmi',
  HKQuantityTypeIdentifierBodyFatPercentage:     'bodyFat',
  HKQuantityTypeIdentifierLeanBodyMass:          'leanBodyMass',
  HKQuantityTypeIdentifierRespiratoryRate:       'respiratoryRate',
  HKQuantityTypeIdentifierOxygenSaturation:      'oxygenSaturation',
  HKQuantityTypeIdentifierBloodPressureSystolic: 'bloodPressureSystolic',
  HKQuantityTypeIdentifierBloodPressureDiastolic: 'bloodPressureDiastolic',
  HKQuantityTypeIdentifierBodyTemperature:       'bodyTemperature',
  HKQuantityTypeIdentifierWalkingHeartRateAverage: 'walkingHR',
  HKQuantityTypeIdentifierRunningPower:          'runningPower',
  HKQuantityTypeIdentifierRunningSpeed:          'runningSpeed',
  HKQuantityTypeIdentifierRunningStrideLength:   'runningStrideLength',
  HKQuantityTypeIdentifierRunningVerticalOscillation: 'runningVerticalOscillation',
  HKQuantityTypeIdentifierRunningGroundContactTime: 'runningGroundContactTime',
  HKQuantityTypeIdentifierCyclingPower:          'cyclingPower',
  HKQuantityTypeIdentifierCyclingCadence:        'cyclingCadence',
  HKQuantityTypeIdentifierCyclingSpeed:          'cyclingSpeed',
  HKQuantityTypeIdentifierSwimmingStrokeCount:   'swimmingStrokeCount',
  HKCategoryTypeIdentifierSleepAnalysis:         'sleepRaw',
}

const TYPE_RE = /type="([^"]+)"/
const SOURCE_RE = /sourceName="([^"]+)"/
const UNIT_RE = /unit="([^"]+)"/
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
  const sourceName = SOURCE_RE.exec(line)?.[1] ?? '未知来源'
  const unit = UNIT_RE.exec(line)?.[1] ?? ''

  if (internalKey === 'sleepRaw') {
    const startM = DATE_RE.exec(line)
    const endM = END_RE.exec(line)
    if (!startM || !endM) return null
    return { type: 'sleepRaw', startDate: startM[1], endDate: endM[1], value: valM[1], sourceName }
  }

  const dateM = DATE_RE.exec(line)
  if (!dateM) return null
  const date = dateM[1].slice(0, 10)
  const value = parseFloat(valM[1])
  if (isNaN(value)) return null
  return { type: internalKey, date, value, sourceName, unit }
}

if (typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined') {
  self.onmessage = async ({ data: { buffer } }) => {
    try {
      const zip = await JSZip.loadAsync(buffer)
      const xmlFile = zip.file('apple_health_export/export.xml') ?? zip.file('export.xml')
      if (!xmlFile) {
        self.postMessage({ type: 'error', message: '未找到健康数据文件（export.xml），请确认上传了正确的导出文件。' })
        return
      }

      const buckets = {}
      for (const key of Object.values(RECORD_TYPES)) {
        if (key !== 'sleepRaw') buckets[key] = []
      }
      const sleepRaw = []
      const sources = new Set()
      let totalRecords = 0
      let processedBytes = 0
      const totalBytes = xmlFile._data.uncompressedSize || 0

      let lineBuffer = ''

      await new Promise((resolve, reject) => {
        xmlFile.internalStream('string')
          .on('data', (chunk) => {
            processedBytes += chunk.length
            lineBuffer += chunk
            const lines = lineBuffer.split('\n')
            lineBuffer = lines.pop()

            for (const line of lines) {
              const record = parseRecordLine(line)
              if (record) {
                totalRecords++
                sources.add(record.sourceName)
                if (record.type === 'sleepRaw') {
                  sleepRaw.push(record)
                } else {
                  buckets[record.type].push({ date: record.date, value: record.value, sourceName: record.sourceName, unit: record.unit })
                }
              }
            }

            self.postMessage({ type: 'progress', processed: processedBytes, total: totalBytes })
          })
          .on('error', reject)
          .on('end', resolve)
          .resume()
      })

      // Process remaining buffer
      if (lineBuffer) {
        const record = parseRecordLine(lineBuffer)
        if (record) {
          totalRecords++
          sources.add(record.sourceName)
          if (record.type === 'sleepRaw') {
            sleepRaw.push(record)
          } else {
            buckets[record.type].push({ date: record.date, value: record.value, sourceName: record.sourceName, unit: record.unit })
          }
        }
      }

      const { aggregateSleepByDay } = await import('../lib/metrics.js')
      const sleepByDay = aggregateSleepByDay(sleepRaw)
      const sleep = Object.entries(sleepByDay)
        .map(([date, d]) => ({ date, ...d }))
        .sort((a, b) => a.date.localeCompare(b.date))

      const allDates = Object.values(buckets).flat().map(r => r.date).sort()
      const meta = {
        totalRecords,
        dateRange: {
          start: allDates[0] ?? null,
          end: allDates.at(-1) ?? null,
        },
      }

      self.postMessage({ type: 'done', payload: { ...buckets, sleepRaw, sleep, sources: Array.from(sources).sort(), meta } })
    } catch (e) {
      self.postMessage({ type: 'error', message: '解析出错：' + e.message })
    }
  }
}
