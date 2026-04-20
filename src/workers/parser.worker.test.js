// src/workers/parser.worker.test.js
import { describe, it, expect } from 'vitest'
import { parseRecordLine, RECORD_TYPES } from './parser.worker'

describe('parseRecordLine', () => {
  it('extracts restingHeartRate record', () => {
    const line = `  <Record type="HKQuantityTypeIdentifierRestingHeartRate" sourceName="Apple Watch" unit="count/min" creationDate="2025-01-10 08:00:00 +0800" startDate="2025-01-10 08:00:00 +0800" endDate="2025-01-10 08:00:00 +0800" value="63"/>`
    const result = parseRecordLine(line)
    expect(result).toEqual({ type: 'restingHeartRate', date: '2025-01-10', value: 63, sourceName: 'Apple Watch', unit: 'count/min' })
  })

  it('extracts sleep record with start/end dates', () => {
    const line = `  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" creationDate="2025-01-11 07:00:00 +0800" startDate="2025-01-10 23:00:00 +0800" endDate="2025-01-11 07:00:00 +0800" value="HKCategoryValueSleepAnalysisAsleepCore"/>`
    const result = parseRecordLine(line)
    expect(result.type).toBe('sleepRaw')
    expect(result.sourceName).toBe('Apple Watch')
    expect(result.value).toBe('HKCategoryValueSleepAnalysisAsleepCore')
    expect(result.startDate).toContain('2025-01-10')
    expect(result.endDate).toContain('2025-01-11')
  })

  it('extracts advanced vitals and sports records', () => {
    const oxygen = `  <Record type="HKQuantityTypeIdentifierOxygenSaturation" sourceName="Apple Watch" unit="%" startDate="2025-01-10 08:00:00 +0800" endDate="2025-01-10 08:00:00 +0800" value="0.98"/>`
    const runningPower = `  <Record type="HKQuantityTypeIdentifierRunningPower" sourceName="Apple Watch" unit="W" startDate="2025-01-10 08:00:00 +0800" endDate="2025-01-10 08:00:00 +0800" value="240"/>`

    expect(parseRecordLine(oxygen)).toMatchObject({ type: 'oxygenSaturation', value: 0.98, sourceName: 'Apple Watch', unit: '%' })
    expect(parseRecordLine(runningPower)).toMatchObject({ type: 'runningPower', value: 240, sourceName: 'Apple Watch', unit: 'W' })
  })

  it('returns null for unknown type', () => {
    const line = `  <Record type="HKQuantityTypeIdentifierSomethingObscure" value="1"/>`
    expect(parseRecordLine(line)).toBeNull()
  })

  it('returns null for non-Record line', () => {
    const line = `  <ExportDate value="2026-03-27 16:37:55 +0800"/>`
    expect(parseRecordLine(line)).toBeNull()
  })
})
