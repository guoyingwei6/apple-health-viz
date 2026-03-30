# Apple Health 数据可视化网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个纯前端静态网站，用户上传 Apple Health 导出的 zip 文件，浏览器本地解析并可视化展示健康数据，部署到 GitHub Pages。

**Architecture:** 用户上传 zip → JSZip 解压 → Web Worker 流式扫描 XML → 结构化 JSON → React 组件渲染 ECharts 图表。App.jsx 管理三阶段状态机（upload / parsing / dashboard），6 个 section 组件各自独立展示一个健康维度。

**Tech Stack:** Vite 5, React 18, ECharts-for-React, JSZip, Tailwind CSS v3, Vitest（测试）, GitHub Actions（部署）

---

## 文件清单

| 文件 | 职责 |
|------|------|
| `package.json` | 依赖声明 |
| `vite.config.js` | Vite + Worker 配置，base 路径 |
| `tailwind.config.js` | 深色主题色板 |
| `index.html` | 入口 HTML |
| `src/App.jsx` | 状态机：phase = upload \| parsing \| dashboard |
| `src/workers/parser.worker.js` | Web Worker：逐行正则扫描 XML，postMessage 进度和结果 |
| `src/lib/metrics.js` | 纯函数：聚合计算、评级判断（可单元测试） |
| `src/components/UploadZone.jsx` | 拖拽/点击上传区 + 文件校验 |
| `src/components/ProgressBar.jsx` | 解析进度展示 + 取消按钮 |
| `src/components/UserProfile.jsx` | 可选性别/年龄输入（用于 VO2Max 评级） |
| `src/components/Dashboard.jsx` | Tab 导航 + KPI 卡片行 + section 渲染 |
| `src/components/sections/HeartRate.jsx` | 心率/HRV 图表模块 |
| `src/components/sections/Sleep.jsx` | 睡眠图表模块 |
| `src/components/sections/Activity.jsx` | 步数/热力图模块 |
| `src/components/sections/Fitness.jsx` | VO2Max/步行测试模块 |
| `src/components/sections/Body.jsx` | 体重/BMI/体脂模块 |
| `src/components/sections/Summary.jsx` | 综合评级 + 风险提示 |
| `src/lib/chartOptions.js` | ECharts 公共配置（深色主题、颜色常量） |
| `src/lib/metrics.test.js` | metrics.js 单元测试 |
| `src/workers/parser.worker.test.js` | parser 逻辑单元测试 |
| `.github/workflows/deploy.yml` | GitHub Actions 自动部署 |

---

## Task 1: 项目脚手架

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `index.html`
- Create: `src/App.jsx`

- [ ] **Step 1: 初始化 Vite + React 项目**

> ⚠️ 注意：当前目录已有 `docs/` 和 `.git/`，不要用 `npm create vite` 覆盖。改用手动创建方式：

```bash
cd /Users/guoyingwei/MyFiles/GitHub/apple-health-viz
# 手动创建必要文件，不使用 create vite（会删除现有文件）
npm init -y
```

然后在后续 Step 手动创建 `vite.config.js`、`index.html`、`src/main.jsx` 等文件。

- [ ] **Step 2: 安装所有依赖**

```bash
npm install
npm install echarts echarts-for-react jszip
npm install -D tailwindcss postcss autoprefixer vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
npx tailwindcss init -p
```

- [ ] **Step 3: 配置 vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/apple-health-viz/',
  worker: {
    format: 'es',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
  },
})
```

- [ ] **Step 4: 配置 tailwind.config.js**

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f172a',
        card: '#1e293b',
        border: '#334155',
        'hr-pink': '#f472b6',
        'hrv-blue': '#60a5fa',
        'sleep-orange': '#f59e0b',
        'steps-purple': '#a78bfa',
        'fitness-green': '#34d399',
        ok: '#22c55e',
        warn: '#f59e0b',
        bad: '#ef4444',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: 更新 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Apple Health 数据分析</title>
  </head>
  <body class="bg-bg text-slate-100 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建 src/main.jsx**

```jsx
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 7: 创建 src/index.css（引入 Tailwind）**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; }
```

- [ ] **Step 8: 创建测试 setup 文件**

```js
// src/test-setup.js
import '@testing-library/jest-dom'
```

- [ ] **Step 9: 创建最小 App.jsx（占位，后续替换）**

```jsx
// src/App.jsx
export default function App() {
  return <div className="p-8 text-white">Apple Health Viz</div>
}
```

- [ ] **Step 10: 验证开发服务器可以启动**

```bash
npm run dev
```

Expected: 浏览器打开 http://localhost:5173，显示 "Apple Health Viz"

- [ ] **Step 11: 提交**

```bash
git add -A
git commit -m "feat: scaffold Vite+React project with Tailwind and ECharts"
```

---

## Task 2: metrics.js — 纯函数计算库（TDD）

**Files:**
- Create: `src/lib/metrics.js`
- Create: `src/lib/metrics.test.js`

所有评级和统计计算都在这里，与 UI 完全解耦，易于测试。

- [ ] **Step 1: 写 metrics 测试文件**

```js
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
  it('returns ok for 50-65', () => expect(rateRestingHR(60)).toBe('ok'))
  it('returns warn for 65-75', () => expect(rateRestingHR(70)).toBe('warn'))
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
    // main sleep ends 07:00 Jan 11,归属 Jan 10
    expect(result['2025-01-10'].durationHours).toBeCloseTo(8)
    expect(result['2025-01-11']).toBeUndefined()
  })
})
```

- [ ] **Step 2: 运行测试确认全部失败**

```bash
npx vitest run src/lib/metrics.test.js
```

Expected: 所有测试 FAIL（metrics.js 不存在）

- [ ] **Step 3: 实现 metrics.js**

```js
// src/lib/metrics.js

// VO2Max 阈值表：{ male: {age范围: 下限}, female: ... }
const VO2MAX_THRESHOLDS = {
  male:   [{ maxAge: 29, ok: 44 }, { maxAge: 39, ok: 42 }, { maxAge: 49, ok: 39 }, { maxAge: 200, ok: 36 }],
  female: [{ maxAge: 29, ok: 40 }, { maxAge: 39, ok: 38 }, { maxAge: 49, ok: 35 }, { maxAge: 200, ok: 32 }],
}

function getVO2MaxThreshold(sex, age) {
  const table = VO2MAX_THRESHOLDS[sex]
  if (!table) return null
  return table.find(r => age <= r.maxAge)?.ok ?? null
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
  // Returns [{month, avg}] sorted ascending
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

function isNap(startDate, durationHours) {
  // nap: < 3h AND starts between 09:00-20:00
  if (durationHours >= 3) return false
  const hour = new Date(startDate).getHours()
  return hour >= 9 && hour < 20
}

export function aggregateSleepByDay(rawSleepRecords) {
  // rawSleepRecords: [{ startDate, endDate, value }]
  const byDay = {}
  for (const rec of rawSleepRecords) {
    if (!ASLEEP_TYPES.has(rec.value)) continue
    const start = new Date(rec.startDate)
    const end = new Date(rec.endDate)
    const durationHours = (end - start) / 3_600_000
    if (isNap(start, durationHours)) continue
    // 归属日期：结束时间在中午12点前 → 归属前一天
    const endHour = end.getHours()
    const dayDate = new Date(end)
    if (endHour < 12) dayDate.setDate(dayDate.getDate() - 1)
    const dateKey = dayDate.toISOString().slice(0, 10)
    if (!byDay[dateKey]) byDay[dateKey] = { durationHours: 0 }
    byDay[dateKey].durationHours += durationHours
  }
  // mark isShort
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
```

- [ ] **Step 4: 运行测试确认全部通过**

```bash
npx vitest run src/lib/metrics.test.js
```

Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/
git commit -m "feat: add metrics.js pure functions with full test coverage"
```

---

## Task 3: chartOptions.js — ECharts 公共配置

**Files:**
- Create: `src/lib/chartOptions.js`

- [ ] **Step 1: 创建公共颜色常量和 ECharts 基础配置**

```js
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

// 所有图表共用的基础配置（深色主题）
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

// 月份趋势折线图通用配置
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
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/chartOptions.js
git commit -m "feat: add shared ECharts dark theme config and helpers"
```

---

## Task 4: Web Worker — XML 解析器（TDD）

**Files:**
- Create: `src/workers/parser.worker.js`
- Create: `src/workers/parser.worker.test.js`

Worker 内部的核心解析逻辑提取为可测试的纯函数 `parseXmlLine` 和 `aggregateSleep`。

- [ ] **Step 1: 写 parser 测试**

```js
// src/workers/parser.worker.test.js
import { describe, it, expect } from 'vitest'
import { parseRecordLine, RECORD_TYPES } from './parser.worker'

describe('parseRecordLine', () => {
  it('extracts heartRate record', () => {
    const line = `  <Record type="HKQuantityTypeIdentifierRestingHeartRate" sourceName="Apple Watch" sourceVersion="10" device="..." unit="count/min" creationDate="2025-01-10 08:00:00 +0800" startDate="2025-01-10 08:00:00 +0800" endDate="2025-01-10 08:00:00 +0800" value="63"/>`
    const result = parseRecordLine(line)
    expect(result).toEqual({ type: 'restingHeartRate', date: '2025-01-10', value: 63 })
  })

  it('extracts sleep record with start/end dates', () => {
    const line = `  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" creationDate="2025-01-11 07:00:00 +0800" startDate="2025-01-10 23:00:00 +0800" endDate="2025-01-11 07:00:00 +0800" value="HKCategoryValueSleepAnalysisAsleepCore"/>`
    const result = parseRecordLine(line)
    expect(result.type).toBe('sleepRaw')
    expect(result.value).toBe('HKCategoryValueSleepAnalysisAsleepCore')
    expect(result.startDate).toContain('2025-01-10')
    expect(result.endDate).toContain('2025-01-11')
  })

  it('returns null for unknown type', () => {
    const line = `  <Record type="HKQuantityTypeIdentifierSomethingObscure" value="1"/>`
    expect(parseRecordLine(line)).toBeNull()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/workers/parser.worker.test.js
```

Expected: FAIL

- [ ] **Step 3: 实现 parser.worker.js**

```js
// src/workers/parser.worker.js

// 映射: HK类型 → 内部键
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

// Worker entry point (only runs in worker context)
if (typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined') {
  self.onmessage = async ({ data: { text } }) => {
    const buckets = {}
    for (const key of Object.values(RECORD_TYPES)) {
      buckets[key] = []
    }
    // sleepRaw is special: collect raw records for aggregateSleepByDay
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

    // Import metrics aggregation (worker can use ES modules via Vite)
    const { aggregateSleepByDay } = await import('../lib/metrics.js')
    const sleepByDay = aggregateSleepByDay(sleepRaw)
    const sleep = Object.entries(sleepByDay)
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const meta = {
      totalRecords: lines.filter(l => l.includes('<Record')).length,
      dateRange: {
        start: Object.values(buckets).flat().map(r => r.date).sort()[0] ?? null,
        end: Object.values(buckets).flat().map(r => r.date).sort().at(-1) ?? null,
      },
    }

    self.postMessage({ type: 'done', payload: { ...buckets, sleep, meta } })
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run src/workers/parser.worker.test.js
```

Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/workers/
git commit -m "feat: add XML parser worker with unit tests"
```

---

## Task 5: UploadZone + ProgressBar + UserProfile 组件

**Files:**
- Create: `src/components/UploadZone.jsx`
- Create: `src/components/ProgressBar.jsx`
- Create: `src/components/UserProfile.jsx`

- [ ] **Step 1: 创建 UploadZone.jsx**

```jsx
// src/components/UploadZone.jsx
import { useRef, useState } from 'react'

export default function UploadZone({ onFile }) {
  const inputRef = useRef()
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (!file) return
    if (!file.name.endsWith('.zip') && file.type !== 'application/zip') {
      setError('请上传 .zip 格式的文件（Apple Health 导出文件）')
      return
    }
    setError('')
    onFile(file)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
        dragging ? 'border-blue-400 bg-slate-800' : 'border-slate-600 hover:border-slate-400'
      }`}
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
    >
      <div className="text-5xl mb-3">📦</div>
      <p className="text-slate-300 text-sm">
        拖拽 <span className="text-blue-400 font-semibold">apple_health_export.zip</span> 到这里
      </p>
      <p className="text-slate-500 text-xs mt-1">或点击选择文件</p>
      <button className="mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2 text-sm">
        选择文件
      </button>
      {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
      <input ref={inputRef} type="file" accept=".zip" className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}
```

- [ ] **Step 2: 创建 ProgressBar.jsx**

```jsx
// src/components/ProgressBar.jsx
export default function ProgressBar({ processed, total, onCancel }) {
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0
  return (
    <div className="bg-card rounded-xl p-4 border border-slate-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-400 text-sm">⚙️ 正在解析...</span>
        <span className="text-blue-400 text-sm font-mono">{pct}%</span>
      </div>
      <div className="bg-slate-900 rounded-full h-1.5">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-slate-500 text-xs">
          已处理 {processed.toLocaleString()} / {total.toLocaleString()} 行
        </span>
        <button
          onClick={onCancel}
          className="text-slate-500 hover:text-red-400 text-xs underline"
        >
          取消
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 创建 UserProfile.jsx**

```jsx
// src/components/UserProfile.jsx
export default function UserProfile({ profile, onChange }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-slate-700">
      <p className="text-slate-400 text-xs mb-3">
        可选填写，用于 VO₂Max 有氧能力评级。<span className="text-slate-500">不上传、不存储。</span>
      </p>
      <div className="flex gap-4">
        <div>
          <label className="text-slate-400 text-xs block mb-1">性别</label>
          <select
            value={profile.sex}
            onChange={e => onChange({ ...profile, sex: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm px-3 py-1.5"
          >
            <option value="">不填</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-xs block mb-1">年龄</label>
          <input
            type="number"
            min="10"
            max="120"
            placeholder="如：35"
            value={profile.age}
            onChange={e => onChange({ ...profile, age: e.target.value ? parseInt(e.target.value) : '' })}
            className="bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm px-3 py-1.5 w-20"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 提交**

```bash
git add src/components/UploadZone.jsx src/components/ProgressBar.jsx src/components/UserProfile.jsx
git commit -m "feat: add UploadZone, ProgressBar, UserProfile components"
```

---

## Task 6: App.jsx — 状态机与数据协调

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: 实现完整 App.jsx**

```jsx
// src/App.jsx
import { useState, useRef, useCallback } from 'react'
import JSZip from 'jszip'
import UploadZone from './components/UploadZone'
import ProgressBar from './components/ProgressBar'
import UserProfile from './components/UserProfile'
import Dashboard from './components/Dashboard'

export default function App() {
  const [phase, setPhase] = useState('upload') // upload | parsing | dashboard
  const [progress, setProgress] = useState({ processed: 0, total: 0 })
  const [healthData, setHealthData] = useState(null)
  const [profile, setProfile] = useState({ sex: '', age: '' })
  const [parseError, setParseError] = useState('')
  const workerRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    setParseError('')
    setPhase('parsing')
    try {
      const zip = await JSZip.loadAsync(file)
      const xmlFile = zip.file('apple_health_export/export.xml') ?? zip.file('export.xml')
      if (!xmlFile) {
        setParseError('未找到健康数据文件（export.xml），请确认上传了正确的导出文件。')
        setPhase('upload')
        return
      }
      const text = await xmlFile.async('text')
      const worker = new Worker(new URL('./workers/parser.worker.js', import.meta.url), { type: 'module' })
      workerRef.current = worker
      worker.onmessage = ({ data }) => {
        if (data.type === 'progress') {
          setProgress({ processed: data.processed, total: data.total })
        } else if (data.type === 'done') {
          worker.terminate()
          setHealthData(data.payload)
          setPhase('dashboard')
        }
      }
      worker.onerror = (e) => {
        setParseError('解析出错：' + e.message)
        setPhase('upload')
      }
      worker.postMessage({ text })
    } catch (e) {
      setParseError('文件读取失败：' + e.message)
      setPhase('upload')
    }
  }, [])

  const handleCancel = useCallback(() => {
    workerRef.current?.terminate()
    setPhase('upload')
    setProgress({ processed: 0, total: 0 })
  }, [])

  const handleReset = useCallback(() => {
    setHealthData(null)
    setPhase('upload')
    setProgress({ processed: 0, total: 0 })
  }, [])

  return (
    <div className="min-h-screen bg-bg text-slate-100">
      {phase === 'upload' && (
        <div className="max-w-lg mx-auto pt-20 px-4 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-100 mb-1">🍎 Apple Health 数据分析</h1>
            <p className="text-slate-500 text-sm">上传导出文件，在浏览器本地分析，数据不离开你的设备</p>
          </div>
          <UserProfile profile={profile} onChange={setProfile} />
          <UploadZone onFile={handleFile} />
          {parseError && <p className="text-red-400 text-sm text-center">{parseError}</p>}
          <div className="flex justify-center gap-6 text-xs text-slate-600">
            <span>🔒 本地处理</span><span>⚡ 无需登录</span><span>🆓 完全免费</span>
          </div>
        </div>
      )}

      {phase === 'parsing' && (
        <div className="max-w-lg mx-auto pt-32 px-4">
          <ProgressBar processed={progress.processed} total={progress.total} onCancel={handleCancel} />
        </div>
      )}

      {phase === 'dashboard' && healthData && (
        <Dashboard data={healthData} profile={profile} onReset={handleReset} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/App.jsx
git commit -m "feat: implement App state machine (upload→parsing→dashboard)"
```

---

## Task 7: Dashboard 布局与 KPI 卡片

**Files:**
- Create: `src/components/Dashboard.jsx`

- [ ] **Step 1: 创建 Dashboard.jsx**

```jsx
// src/components/Dashboard.jsx
import { useState } from 'react'
import { RATING_COLOR, RATING_ICON, RATING_LABEL } from '../lib/chartOptions'
import {
  aggregateMonthly, aggregateStepsByDay, aggregateSleepByDay,
  rateRestingHR, rateHRV, rateSleep, rateSteps, rateVO2Max, rateBMI,
} from '../lib/metrics'
import HeartRate from './sections/HeartRate'
import Sleep from './sections/Sleep'
import Activity from './sections/Activity'
import Fitness from './sections/Fitness'
import Body from './sections/Body'
import Summary from './sections/Summary'

const TABS = [
  { id: 'summary', label: '概览' },
  { id: 'heartrate', label: '心率' },
  { id: 'sleep', label: '睡眠' },
  { id: 'activity', label: '活动' },
  { id: 'fitness', label: '体能' },
  { id: 'body', label: '体重' },
]

function KpiCard({ label, value, unit, rating, sub }) {
  const color = RATING_COLOR[rating] ?? '#94a3b8'
  return (
    <div className="bg-card rounded-xl p-3 flex flex-col gap-1 min-w-0">
      <span className="text-slate-500 text-xs truncate">{label}</span>
      <span className="font-bold tabular-nums" style={{ color, fontSize: '1.25rem' }}>
        {value ?? '—'}{unit && <span className="text-xs text-slate-500 ml-0.5">{unit}</span>}
      </span>
      {sub && <span className="text-xs" style={{ color }}>{RATING_ICON[rating]} {sub}</span>}
    </div>
  )
}

export default function Dashboard({ data, profile, onReset }) {
  const [tab, setTab] = useState('summary')

  // Compute KPI values
  const rhrList = data.restingHeartRate
  const avgRHR = rhrList.length ? Math.round(rhrList.reduce((s, r) => s + r.value, 0) / rhrList.length) : null
  const rhrRating = avgRHR ? rateRestingHR(avgRHR) : null

  const hrvList = data.hrv
  const avgHRV = hrvList.length ? Math.round(hrvList.reduce((s, r) => s + r.value, 0) / hrvList.length) : null
  const hrvRating = avgHRV ? rateHRV(avgHRV) : null

  const sleepAvg = data.sleep.length
    ? +(data.sleep.reduce((s, r) => s + r.durationHours, 0) / data.sleep.length).toFixed(1)
    : null
  const shortPct = data.sleep.length
    ? data.sleep.filter(r => r.isShort).length / data.sleep.length
    : 0
  const sleepRating = sleepAvg ? rateSleep(sleepAvg, shortPct) : null

  const stepsByDay = aggregateStepsByDay(data.steps)
  const stepVals = Object.values(stepsByDay)
  const avgSteps = stepVals.length ? Math.round(stepVals.reduce((a, b) => a + b, 0) / stepVals.length) : null
  const stepsRating = avgSteps ? rateSteps(avgSteps) : null

  const vo2List = data.vo2max
  const latestVO2 = vo2List.length ? +vo2List[vo2List.length - 1].value.toFixed(1) : null
  const vo2Rating = latestVO2 ? rateVO2Max(latestVO2, profile.sex && profile.age ? profile : null) : null

  const bmiList = data.bmi
  const latestBMI = bmiList.length ? +bmiList[bmiList.length - 1].value.toFixed(1) : null
  const bmiRating = latestBMI ? rateBMI(latestBMI) : null

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between py-4 border-b border-slate-800 mb-4">
        <h1 className="text-lg font-semibold">🍎 健康分析报告</h1>
        <button onClick={onReset} className="text-slate-500 hover:text-slate-300 text-sm">重新上传</button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        <KpiCard label="静息心率" value={avgRHR} unit="bpm" rating={rhrRating} sub={RATING_LABEL[rhrRating]} />
        <KpiCard label="HRV" value={avgHRV} unit="ms" rating={hrvRating} sub={RATING_LABEL[hrvRating]} />
        <KpiCard label="平均睡眠" value={sleepAvg} unit="h" rating={sleepRating} sub={RATING_LABEL[sleepRating]} />
        <KpiCard label="日均步数" value={avgSteps?.toLocaleString()} rating={stepsRating} sub={RATING_LABEL[stepsRating]} />
        <KpiCard label="VO₂Max" value={latestVO2} rating={vo2Rating} sub={vo2Rating ? RATING_LABEL[vo2Rating] : '未填信息'} />
        <KpiCard label="BMI" value={latestBMI} rating={bmiRating} sub={RATING_LABEL[bmiRating]} />
      </div>

      {/* Section content */}
      <div>
        {tab === 'summary'   && <Summary data={data} profile={profile} kpis={{ rhrRating, hrvRating, sleepRating, stepsRating, vo2Rating, bmiRating }} />}
        {tab === 'heartrate' && <HeartRate data={data} />}
        {tab === 'sleep'     && <Sleep data={data} />}
        {tab === 'activity'  && <Activity data={data} stepsByDay={stepsByDay} />}
        {tab === 'fitness'   && <Fitness data={data} profile={profile} />}
        {tab === 'body'      && <Body data={data} profile={profile} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/Dashboard.jsx
git commit -m "feat: add Dashboard layout with KPI cards and tab navigation"
```

---

## Task 8: 六个 Section 组件

**Files:**
- Create: `src/components/sections/HeartRate.jsx`
- Create: `src/components/sections/Sleep.jsx`
- Create: `src/components/sections/Activity.jsx`
- Create: `src/components/sections/Fitness.jsx`
- Create: `src/components/sections/Body.jsx`
- Create: `src/components/sections/Summary.jsx`

每个 section 若无数据则显示占位卡片，不报错。

- [ ] **Step 1: 创建空数据占位组件（复用）**

在 `src/components/sections/` 目录下先创建一个共用工具：

```js
// src/components/sections/_empty.jsx
export function EmptyState({ label }) {
  return (
    <div className="bg-card rounded-xl p-8 text-center text-slate-500 border border-slate-700">
      暂无{label}数据
    </div>
  )
}

export function SectionCard({ title, children }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-slate-700 mb-4">
      {title && <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">{title}</h3>}
      {children}
    </div>
  )
}
```

- [ ] **Step 2: 创建 HeartRate.jsx**

```jsx
// src/components/sections/HeartRate.jsx
import ReactECharts from 'echarts-for-react'
import { aggregateMonthly } from '../../lib/metrics'
import { lineChartOption, COLORS } from '../../lib/chartOptions'
import { EmptyState, SectionCard } from './_empty'

export default function HeartRate({ data }) {
  const rhrMonthly = aggregateMonthly(data.restingHeartRate)
  const hrvMonthly = aggregateMonthly(data.hrv)

  // Heart rate distribution histogram
  const hrValues = data.heartRate.map(r => r.value)
  const bins = Array.from({ length: 14 }, (_, i) => ({ range: 40 + i * 10, count: 0 }))
  for (const v of hrValues) {
    const idx = Math.min(Math.floor((v - 40) / 10), 13)
    if (idx >= 0) bins[idx].count++
  }
  const tachycardiaCount = hrValues.filter(v => v > 100).length
  const tachycardiaPct = hrValues.length ? ((tachycardiaCount / hrValues.length) * 100).toFixed(1) : 0

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <SectionCard title="静息心率趋势（月均）">
          {rhrMonthly.length === 0 ? <EmptyState label="静息心率" /> :
            <ReactECharts option={lineChartOption({
              data: rhrMonthly,
              color: COLORS.hrPink,
              markLine: { value: 65, label: '65 bpm', color: COLORS.warn },
            })} style={{ height: 200 }} />
          }
        </SectionCard>
        <SectionCard title="HRV SDNN 趋势（月均）">
          {hrvMonthly.length === 0 ? <EmptyState label="HRV" /> :
            <ReactECharts option={lineChartOption({
              data: hrvMonthly,
              color: COLORS.hrvBlue,
              markLine: { value: 45, label: '45ms 参考', color: COLORS.warn },
            })} style={{ height: 200 }} />
          }
        </SectionCard>
      </div>
      <SectionCard title="心率分布">
        {hrValues.length === 0 ? <EmptyState label="心率" /> : (
          <>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              grid: { left: 40, right: 16, top: 16, bottom: 32 },
              xAxis: { type: 'category', data: bins.map(b => `${b.range}-${b.range+9}`), axisLabel: { color: COLORS.text, fontSize: 10, rotate: 30 } },
              yAxis: { type: 'value', axisLabel: { color: COLORS.text }, splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } } },
              series: [{ type: 'bar', data: bins.map(b => b.count), itemStyle: { color: COLORS.hrPink } }],
              tooltip: { formatter: p => `${p.name} bpm: ${p.value.toLocaleString()} 次` },
            }} style={{ height: 180 }} />
            <p className="text-slate-500 text-xs mt-1">心动过速（&gt;100 bpm）占比：<span className="text-warn">{tachycardiaPct}%</span></p>
          </>
        )}
      </SectionCard>
    </div>
  )
}
```

- [ ] **Step 3: 创建 Sleep.jsx**

```jsx
// src/components/sections/Sleep.jsx
import ReactECharts from 'echarts-for-react'
import { aggregateMonthly } from '../../lib/metrics'
import { lineChartOption, COLORS } from '../../lib/chartOptions'
import { EmptyState, SectionCard } from './_empty'

export default function Sleep({ data }) {
  const sleepMonthly = aggregateMonthly(
    data.sleep.map(r => ({ date: r.date, value: r.durationHours }))
  )
  const shortDays = data.sleep.filter(r => r.isShort).length
  const shortPct = data.sleep.length ? (shortDays / data.sleep.length * 100).toFixed(0) : 0

  // Daily bar chart (last 60 days)
  const recent = data.sleep.slice(-60)

  return (
    <div>
      <SectionCard title="每日睡眠时长（近60天）">
        {recent.length === 0 ? <EmptyState label="睡眠" /> :
          <ReactECharts option={{
            backgroundColor: 'transparent',
            grid: { left: 40, right: 16, top: 16, bottom: 40 },
            xAxis: { type: 'category', data: recent.map(r => r.date.slice(5)), axisLabel: { color: COLORS.text, fontSize: 9, rotate: 45 } },
            yAxis: { type: 'value', max: 12, axisLabel: { color: COLORS.text, formatter: v => v + 'h' }, splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } } },
            series: [{
              type: 'bar',
              data: recent.map(r => ({
                value: +r.durationHours.toFixed(1),
                itemStyle: { color: r.isShort ? COLORS.bad : COLORS.hrvBlue },
              })),
            }],
            tooltip: { formatter: p => `${p.name}: ${p.value}h` },
          }} style={{ height: 220 }} />
        }
        <p className="text-slate-500 text-xs mt-1">
          睡眠不足6h：<span className="text-bad">{shortDays}天（{shortPct}%）</span>
        </p>
      </SectionCard>
      <SectionCard title="月均睡眠时长">
        {sleepMonthly.length === 0 ? <EmptyState label="睡眠趋势" /> :
          <ReactECharts option={lineChartOption({
            data: sleepMonthly,
            color: COLORS.sleepOrange,
            markLine: { value: 7, label: '推荐 7h', color: COLORS.ok },
          })} style={{ height: 200 }} />
        }
      </SectionCard>
    </div>
  )
}
```

- [ ] **Step 4: 创建 Activity.jsx**

```jsx
// src/components/sections/Activity.jsx
import ReactECharts from 'echarts-for-react'
import { aggregateMonthly } from '../../lib/metrics'
import { COLORS, baseChartOption } from '../../lib/chartOptions'
import { EmptyState, SectionCard } from './_empty'

// Generate last-90-days heatmap data
function buildHeatmap(stepsByDay) {
  const result = []
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push([key, stepsByDay[key] ?? 0])
  }
  return result
}

export default function Activity({ data, stepsByDay }) {
  const monthlySteps = Object.entries(
    Object.entries(stepsByDay).reduce((acc, [date, val]) => {
      const month = date.slice(0, 7)
      if (!acc[month]) acc[month] = { sum: 0, days: 0 }
      acc[month].sum += val
      acc[month].days++
      return acc
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, days }]) => ({ month, avg: Math.round(sum / days) }))

  const heatmapData = buildHeatmap(stepsByDay)
  const maxSteps = Math.max(...heatmapData.map(d => d[1]), 1)

  return (
    <div>
      <SectionCard title="月均日步数">
        {monthlySteps.length === 0 ? <EmptyState label="步数" /> :
          <ReactECharts option={{
            ...baseChartOption(),
            xAxis: { type: 'category', data: monthlySteps.map(d => d.month), axisLabel: { color: COLORS.text, rotate: 30, fontSize: 10 } },
            yAxis: { type: 'value', axisLabel: { color: COLORS.text }, splitLine: { lineStyle: { color: COLORS.border, type: 'dashed' } } },
            series: [{
              type: 'bar', data: monthlySteps.map(d => d.avg),
              itemStyle: { color: COLORS.stepsPurple },
              markLine: { silent: true, lineStyle: { color: COLORS.ok, type: 'dashed' }, data: [{ yAxis: 8000, label: { formatter: '8000步' } }] },
            }],
            tooltip: { formatter: p => `${p.name}: ${p.value.toLocaleString()} 步/天` },
          }} style={{ height: 220 }} />
        }
      </SectionCard>
      <SectionCard title="近90天步数热力图">
        <div className="flex flex-wrap gap-1">
          {heatmapData.map(([date, steps]) => {
            const opacity = steps === 0 ? 0.1 : Math.max(0.2, steps / maxSteps)
            return (
              <div
                key={date}
                title={`${date}: ${steps.toLocaleString()} 步`}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: steps === 0 ? COLORS.border : COLORS.stepsPurple, opacity }}
              />
            )
          })}
        </div>
        <p className="text-slate-600 text-xs mt-2">颜色越深 = 步数越多，灰色 = 无数据</p>
      </SectionCard>
    </div>
  )
}
```

- [ ] **Step 5: 创建 Fitness.jsx**

```jsx
// src/components/sections/Fitness.jsx
import ReactECharts from 'echarts-for-react'
import { aggregateMonthly, rateVO2Max } from '../../lib/metrics'
import { lineChartOption, COLORS, RATING_ICON, RATING_LABEL } from '../../lib/chartOptions'
import { EmptyState, SectionCard } from './_empty'

export default function Fitness({ data, profile }) {
  const vo2Monthly = aggregateMonthly(data.vo2max)
  const sixWalkMonthly = aggregateMonthly(data.sixMinuteWalk)
  const latestVO2 = data.vo2max.length ? data.vo2max[data.vo2max.length - 1].value : null
  const userProfile = profile.sex && profile.age ? profile : null
  const vo2Rating = latestVO2 ? rateVO2Max(latestVO2, userProfile) : null

  const steadiness = data.walkingSteadiness
  const avgSteadiness = steadiness.length
    ? (steadiness.reduce((s, r) => s + r.value, 0) / steadiness.length * 100).toFixed(1)
    : null

  return (
    <div>
      <SectionCard title="VO₂Max 最大摄氧量趋势">
        {vo2Monthly.length === 0 ? <EmptyState label="VO₂Max" /> : (
          <>
            <ReactECharts option={lineChartOption({
              data: vo2Monthly,
              color: COLORS.fitnessGreen,
            })} style={{ height: 200 }} />
            {latestVO2 && (
              <p className="text-xs text-slate-500 mt-1">
                最新值：<span className="text-fitness-green font-semibold">{latestVO2.toFixed(1)} mL/kg/min</span>
                {vo2Rating
                  ? <span className="ml-2">{RATING_ICON[vo2Rating]} {RATING_LABEL[vo2Rating]}</span>
                  : <span className="ml-2 text-slate-600">（填写性别年龄以显示评级）</span>}
              </p>
            )}
          </>
        )}
      </SectionCard>
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="6分钟步行测试">
          {sixWalkMonthly.length === 0 ? <EmptyState label="步行测试" /> :
            <ReactECharts option={lineChartOption({
              data: sixWalkMonthly,
              color: COLORS.fitnessGreen,
              markLine: { value: 500, label: '500m 参考', color: COLORS.warn },
            })} style={{ height: 180 }} />
          }
        </SectionCard>
        <SectionCard title="步行稳定性">
          {avgSteadiness
            ? <div className="flex items-center justify-center h-32"><span className="text-5xl font-bold text-fitness-green">{avgSteadiness}%</span></div>
            : <EmptyState label="步行稳定性" />}
        </SectionCard>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: 创建 Body.jsx**

```jsx
// src/components/sections/Body.jsx
import ReactECharts from 'echarts-for-react'
import { lineChartOption, COLORS } from '../../lib/chartOptions'
import { EmptyState, SectionCard } from './_empty'

function toMonthly(records) {
  const buckets = {}
  for (const { date, value } of records) {
    const m = date.slice(0, 7)
    if (!buckets[m]) buckets[m] = []
    buckets[m].push(value)
  }
  return Object.entries(buckets).sort().map(([month, vals]) => ({
    month, avg: vals.reduce((a, b) => a + b, 0) / vals.length,
  }))
}

export default function Body({ data, profile }) {
  const massMonthly = toMonthly(data.bodyMass)
  const bmiMonthly = toMonthly(data.bmi)
  const fatMonthly = toMonthly(data.bodyFat.map(r => ({ ...r, value: r.value * 100 })))

  return (
    <div>
      <SectionCard title="体重趋势 (kg)">
        {massMonthly.length === 0 ? <EmptyState label="体重" /> :
          <ReactECharts option={lineChartOption({ data: massMonthly, color: COLORS.hrPink })} style={{ height: 200 }} />
        }
      </SectionCard>
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="BMI 趋势">
          {bmiMonthly.length === 0 ? <EmptyState label="BMI" /> :
            <ReactECharts option={lineChartOption({
              data: bmiMonthly,
              color: COLORS.sleepOrange,
              markLine: { value: 24.9, label: '正常上限 24.9', color: COLORS.warn },
            })} style={{ height: 180 }} />
          }
        </SectionCard>
        <SectionCard title={`体脂率趋势 (%)${!profile.sex ? ' · 填写性别显示参考区间' : ''}`}>
          {fatMonthly.length === 0 ? <EmptyState label="体脂率" /> :
            <ReactECharts option={lineChartOption({
              data: fatMonthly,
              color: COLORS.stepsPurple,
              markLine: profile.sex === 'male'
                ? { value: 19, label: '男性正常上限 19%', color: COLORS.warn }
                : profile.sex === 'female'
                ? { value: 33, label: '女性正常上限 33%', color: COLORS.warn }
                : undefined,
            })} style={{ height: 180 }} />
          }
        </SectionCard>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: 创建 Summary.jsx**

```jsx
// src/components/sections/Summary.jsx
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
        <div className="flex items-center gap-4 mb-4">
          <div>
            <h2 className="text-slate-100 text-lg font-bold">综合健康评估</h2>
            <p className="text-slate-500 text-xs">
              {badCount > 0
                ? `发现 ${badCount} 项异常，${warnCount} 项需关注`
                : warnCount > 0
                ? `${warnCount} 项需关注，整体状况尚可`
                : '各项指标均在正常范围内'}
            </p>
          </div>
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
```

- [ ] **Step 8: 提交**

```bash
git add src/components/sections/
git commit -m "feat: add all 6 health section components"
```

---

## Task 9: 集成验证

- [ ] **Step 1: 运行全量测试**

```bash
npx vitest run
```

Expected: 所有测试 PASS

- [ ] **Step 2: 本地构建验证**

```bash
npm run build
```

Expected: `dist/` 目录生成，无报错

- [ ] **Step 3: 本地预览（使用真实数据）**

```bash
npm run preview
```

打开 http://localhost:4173/apple-health-viz/，上传 `/Volumes/Store/Downloads/apple_health_export/apple_health_export.zip`，检查：
- [ ] 进度条正常显示
- [ ] 解析完成后跳转仪表盘
- [ ] 6 个 tab 均可切换
- [ ] KPI 卡片数值与之前 Python 分析结果吻合
- [ ] 睡眠柱状图红色高亮正确
- [ ] 不填性别年龄时 VO2Max 只显示图表无评级

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "test: integration verified with real health data"
```

---

## Task 10: GitHub Actions 自动部署

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 创建 deploy.yml**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: npm run build

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 2: 在 GitHub 创建仓库并推送**

```bash
# 在 GitHub 上创建名为 apple-health-viz 的公开仓库后：
git remote add origin https://github.com/<your-username>/apple-health-viz.git
git push -u origin main
```

- [ ] **Step 3: 启用 GitHub Pages**

GitHub 仓库 → Settings → Pages → Source 选择 `gh-pages` 分支 → Save

- [ ] **Step 4: 验证部署**

等待 Actions 完成（约 1-2 分钟），访问：
`https://<your-username>.github.io/apple-health-viz/`

Expected: 上传页正常显示

- [ ] **Step 5: 最终提交**

```bash
git add .github/
git commit -m "ci: add GitHub Actions deploy to gh-pages"
git push
```

---

## 成功标准核查

- [ ] 上传 zip 后 3 分钟内完成解析并展示所有模块
- [ ] 解析过程主线程不卡死（UI 可响应进度更新）
- [ ] 6 个模块均正确展示图表
- [ ] 综合评分与实际数据逻辑一致
- [ ] GitHub Pages 部署成功，可通过公网访问
