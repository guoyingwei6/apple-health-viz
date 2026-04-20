import { describe, it, expect } from 'vitest'
import { tableToCsv, exportBundleToCsv } from './export'

describe('tableToCsv', () => {
  it('escapes commas, quotes, and newlines', () => {
    const csv = tableToCsv([
      { name: 'Apple Watch', note: 'good, clean', quote: 'say "hi"' },
      { name: 'iPhone', note: 'line\nbreak', quote: '' },
    ])

    expect(csv).toBe('name,note,quote\nApple Watch,"good, clean","say ""hi"""\niPhone,"line\nbreak",')
  })
})

describe('exportBundleToCsv', () => {
  it('combines summary, daily, and monthly tables with section headers', () => {
    const csv = exportBundleToCsv({
      summary: {
        generatedAt: '2026-04-20T00:00:00.000Z',
        selectedSources: ['Apple Watch'],
        ratings: { steps: 'ok' },
      },
      daily: {
        steps: [{ date: '2025-01-10', steps: 9000 }],
        sleep: [{ date: '2025-01-10', durationHours: 8, isShort: false }],
      },
      monthly: {
        steps: [{ month: '2025-01', avg: 9000 }],
      },
    })

    expect(csv).toContain('# summary')
    expect(csv).toContain('metric,value')
    expect(csv).toContain('rating_steps,ok')
    expect(csv).toContain('# daily_steps')
    expect(csv).toContain('2025-01-10,9000')
    expect(csv).toContain('# monthly_steps')
  })
})
