// src/lib/chartOptions.js

export const COLORS = {
  bg: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  text: '#94a3b8',
  textBright: '#e2e8f0',
  hrPink: '#f472b6',
  hrvBlue: '#60a5fa',
  sleepOrange: '#f59e0b',
  stepsPurple: '#a78bfa',
  fitnessGreen: '#34d399',
  ok: '#22c55e',
  warn: '#f59e0b',
  bad: '#ef4444',
}

export const RATING_COLOR = { ok: COLORS.ok, warn: COLORS.warn, bad: COLORS.bad, null: COLORS.text }
export const RATING_LABEL = { ok: '正常', warn: '需关注', bad: '异常', null: '暂无' }
export const RATING_ICON = { ok: '🟢', warn: '🟡', bad: '🔴', null: '⚪' }

export function baseChartOption(overrides = {}) {
  return {
    backgroundColor: 'transparent',
    textStyle: { color: COLORS.text, fontFamily: 'system-ui' },
    grid: { left: 40, right: 16, top: 32, bottom: 32, containLabel: true },
    tooltip: {
      backgroundColor: COLORS.card,
      borderColor: COLORS.border,
      textStyle: { color: COLORS.textBright },
    },
    ...overrides,
  }
}

export function lineChartOption({ data, color, markLine, title }) {
  return baseChartOption({
    title: title ? { text: title, textStyle: { color: COLORS.text, fontSize: 12 } } : undefined,
    xAxis: {
      type: 'category',
      data: data.map(d => d.month),
      axisLine: { lineStyle: { color: COLORS.border } },
      axisLabel: { color: COLORS.text, rotate: 30, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } },
      axisLabel: { color: COLORS.text },
    },
    series: [{
      type: 'line',
      data: data.map(d => d.avg),
      smooth: true,
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      symbol: 'circle',
      symbolSize: 4,
      markLine: markLine ? {
        silent: true,
        lineStyle: { color: markLine.color ?? COLORS.text, type: 'dashed' },
        data: [{ yAxis: markLine.value, label: { formatter: markLine.label } }],
      } : undefined,
    }],
  })
}
