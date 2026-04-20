import { describe, it, expect } from 'vitest'
import { buildSectionAdvice } from './advice'

describe('buildSectionAdvice', () => {
  it('marks stable heart metrics as on target', () => {
    const data = {
      restingHeartRate: [
        { date: '2025-01-01', value: 61 },
        { date: '2025-01-02', value: 62 },
        { date: '2025-01-03', value: 61 },
        { date: '2025-01-04', value: 62 },
      ],
      hrv: [
        { date: '2025-01-01', value: 52 },
        { date: '2025-01-02', value: 51 },
        { date: '2025-01-03', value: 52 },
        { date: '2025-01-04', value: 51 },
      ],
      heartRateRecovery: [],
      walkingHR: [],
    }

    const advice = buildSectionAdvice('heartrate', data, {})

    expect(advice.status).toBe('ok')
    expect(advice.summary).toContain('达标')
    expect(advice.stability).toContain('稳定')
    expect(advice.actions.join(' ')).toContain('维持')
  })

  it('flags sleep as needing medical attention when recent sleep is very short', () => {
    const data = {
      sleep: [
        { date: '2025-01-01', durationHours: 4.4, isShort: true },
        { date: '2025-01-02', durationHours: 4.8, isShort: true },
        { date: '2025-01-03', durationHours: 5.1, isShort: true },
      ],
    }

    const advice = buildSectionAdvice('sleep', data, {})

    expect(advice.status).toBe('bad')
    expect(advice.medical).toContain('就医')
    expect(advice.actions.join(' ')).toContain('睡眠')
  })

  it('recommends activity improvement when steps are low', () => {
    const data = {
      steps: [
        { date: '2025-01-01', value: 3200 },
        { date: '2025-01-02', value: 4100 },
      ],
      activeEnergy: [],
      standTime: [],
      distanceWalkingRunning: [],
    }

    const advice = buildSectionAdvice('activity', data, {})

    expect(advice.status).toBe('bad')
    expect(advice.summary).toContain('未达标')
    expect(advice.actions.join(' ')).toContain('步行')
  })

  it('flags advanced vitals with high blood pressure for medical review', () => {
    const data = {
      oxygenSaturation: [{ date: '2025-01-01', value: 0.97 }],
      bloodPressureSystolic: [{ date: '2025-01-01', value: 145 }],
      bloodPressureDiastolic: [{ date: '2025-01-01', value: 92 }],
      respiratoryRate: [{ date: '2025-01-01', value: 16 }],
      bodyTemperature: [],
    }

    const advice = buildSectionAdvice('advanced', data, {})

    expect(advice.status).toBe('bad')
    expect(advice.medical).toContain('就医')
    expect(advice.metrics.some(metric => metric.label === '血压')).toBe(true)
  })

  it('returns a data-insufficient response for missing section data', () => {
    const advice = buildSectionAdvice('fitness', { vo2max: [], sixMinuteWalk: [], walkingSteadiness: [] }, {})

    expect(advice.status).toBe('null')
    expect(advice.summary).toContain('数据不足')
  })
})
