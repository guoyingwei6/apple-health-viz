// src/lib/metrics.test.js
import { describe, it, expect } from 'vitest'
import {
  monthlyAvg,
  rateRestingHR,
  rateHRV,
  rateSleep,
  rateSteps,
  rateVO2Max,
  rateBodyFat,
  rateBMI,
  aggregateSleepByDay,
  aggregateStepsByDay,
  aggregateMonthly,
  filterHealthDataBySources,
  buildExportBundle,
} from './metrics'

describe('monthlyAvg', () => {
  it('groups records by month and averages values', () => {
    const records = [
      { date: '2025-01-10', value: 60 },
      { date: '2025-01-20', value: 70 },
      { date: '2025-02-05', value: 80 },
    ]
    const result = monthlyAvg(records)
    expect(result['2025-01']).toBeCloseTo(65)
    expect(result['2025-02']).toBeCloseTo(80)
  })
})

describe('rateRestingHR', () => {
  it('returns ok for 60', () => expect(rateRestingHR(60)).toBe('ok'))
  it('returns warn for boundary 65', () => expect(rateRestingHR(65)).toBe('warn'))
  it('returns warn for 70', () => expect(rateRestingHR(70)).toBe('warn'))
  it('returns bad for >75', () => expect(rateRestingHR(80)).toBe('bad'))
  it('returns bad for <45', () => expect(rateRestingHR(40)).toBe('bad'))
})

describe('rateHRV', () => {
  it('returns ok for >45', () => expect(rateHRV(50)).toBe('ok'))
  it('returns warn for 30-45', () => expect(rateHRV(40)).toBe('warn'))
  it('returns bad for <30', () => expect(rateHRV(20)).toBe('bad'))
})

describe('rateSleep', () => {
  it('returns ok when avg>=7 and shortDaysPct<0.15', () =>
    expect(rateSleep(7.5, 0.1)).toBe('ok'))
  it('returns warn when avg 6-7', () =>
    expect(rateSleep(6.5, 0.1)).toBe('warn'))
  it('returns bad when shortDaysPct>0.3', () =>
    expect(rateSleep(6.5, 0.35)).toBe('bad'))
})

describe('rateSteps', () => {
  it('returns ok for >=8000', () => expect(rateSteps(9000)).toBe('ok'))
  it('returns warn for 5000-8000', () => expect(rateSteps(6000)).toBe('warn'))
  it('returns bad for <5000', () => expect(rateSteps(4000)).toBe('bad'))
})

describe('rateVO2Max', () => {
  it('returns null when no profile provided', () =>
    expect(rateVO2Max(40, null)).toBeNull())
  it('returns ok for male age 30 with VO2Max 43', () =>
    expect(rateVO2Max(43, { sex: 'male', age: 35 })).toBe('ok'))
  it('returns warn for male age 35 with VO2Max 38', () =>
    expect(rateVO2Max(38, { sex: 'male', age: 35 })).toBe('warn'))
  it('returns bad for male age 35 with VO2Max 34', () =>
    expect(rateVO2Max(34, { sex: 'male', age: 35 })).toBe('bad'))
})

describe('rateBodyFat', () => {
  it('returns ok for male 15%', () => expect(rateBodyFat(0.15, 'male')).toBe('ok'))
  it('returns warn for male 22%', () => expect(rateBodyFat(0.22, 'male')).toBe('warn'))
  it('returns bad for male 27%', () => expect(rateBodyFat(0.27, 'male')).toBe('bad'))
  it('returns ok for female 28%', () => expect(rateBodyFat(0.28, 'female')).toBe('ok'))
})

describe('rateBMI', () => {
  it('returns ok for 21', () => expect(rateBMI(21)).toBe('ok'))
  it('returns warn for 27', () => expect(rateBMI(27)).toBe('warn'))
  it('returns bad for 32', () => expect(rateBMI(32)).toBe('bad'))
})

describe('aggregateSleepByDay', () => {
  it('excludes naps (< 3h and 09:00-20:00)', () => {
    const raw = [
      // main sleep: 23:00 - 07:00 = 8h
      { startDate: '2025-01-10 23:00:00 +0800', endDate: '2025-01-11 07:00:00 +0800', value: 'HKCategoryValueSleepAnalysisAsleepCore' },
      // nap: 14:00 - 15:30 = 1.5h (should be excluded)
      { startDate: '2025-01-11 14:00:00 +0800', endDate: '2025-01-11 15:30:00 +0800', value: 'HKCategoryValueSleepAnalysisAsleepCore' },
    ]
    const result = aggregateSleepByDay(raw)
    // main sleep ends 07:00 Jan 11, 归属 Jan 10
    expect(result['2025-01-10'].durationHours).toBeCloseTo(8)
    expect(result['2025-01-11']).toBeUndefined()
  })
})

describe('filterHealthDataBySources', () => {
  it('filters quantity records by source and recomputes sleep from selected raw sleep records', () => {
    const data = {
      steps: [
        { date: '2025-01-10', value: 1000, sourceName: 'iPhone' },
        { date: '2025-01-10', value: 2000, sourceName: 'Third Party' },
      ],
      restingHeartRate: [
        { date: '2025-01-10', value: 60, sourceName: 'Apple Watch' },
        { date: '2025-01-10', value: 75, sourceName: 'Third Party' },
      ],
      sleepRaw: [
        { startDate: '2025-01-10 23:00:00 +0800', endDate: '2025-01-11 07:00:00 +0800', value: 'HKCategoryValueSleepAnalysisAsleepCore', sourceName: 'Apple Watch' },
        { startDate: '2025-01-11 23:00:00 +0800', endDate: '2025-01-12 07:00:00 +0800', value: 'HKCategoryValueSleepAnalysisAsleepCore', sourceName: 'Third Party' },
      ],
      sleep: [],
      sources: ['Apple Watch', 'iPhone', 'Third Party'],
      meta: { totalRecords: 4 },
    }

    const filtered = filterHealthDataBySources(data, ['Apple Watch', 'iPhone'])

    expect(filtered.steps).toEqual([{ date: '2025-01-10', value: 1000, sourceName: 'iPhone' }])
    expect(filtered.restingHeartRate).toEqual([{ date: '2025-01-10', value: 60, sourceName: 'Apple Watch' }])
    expect(filtered.sleep).toEqual([{ date: '2025-01-10', durationHours: 8, isShort: false }])
    expect(filtered.meta.selectedSources).toEqual(['Apple Watch', 'iPhone'])
  })
})

describe('buildExportBundle', () => {
  it('creates cleaned daily, monthly, and rating payloads for export', () => {
    const data = {
      restingHeartRate: [{ date: '2025-01-10', value: 60 }],
      hrv: [{ date: '2025-01-10', value: 50 }],
      sleep: [{ date: '2025-01-10', durationHours: 8, isShort: false }],
      steps: [{ date: '2025-01-10', value: 9000 }],
      vo2max: [{ date: '2025-01-10', value: 45 }],
      bmi: [{ date: '2025-01-10', value: 22 }],
      bodyMass: [],
      bodyFat: [],
      meta: { dateRange: { start: '2025-01-10', end: '2025-01-10' }, selectedSources: ['Apple Watch'] },
    }

    const bundle = buildExportBundle(data, { sex: 'male', age: 35 })

    expect(bundle.summary.ratings).toMatchObject({
      restingHeartRate: 'ok',
      hrv: 'ok',
      sleep: 'ok',
      steps: 'ok',
      vo2max: 'ok',
      bmi: 'ok',
    })
    expect(bundle.daily.steps).toEqual([{ date: '2025-01-10', steps: 9000 }])
    expect(bundle.monthly.restingHeartRate).toEqual([{ month: '2025-01', avg: 60 }])
  })
})
