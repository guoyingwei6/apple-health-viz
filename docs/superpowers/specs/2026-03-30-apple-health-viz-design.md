# Apple Health 数据可视化网站 — 设计规格

**日期：** 2026-03-30
**状态：** 已审批
**目标受众：** 朋友/家人（小范围分享）

---

## 1. 项目概述

一个纯前端静态网站，用户上传 Apple Health 导出的 `apple_health_export.zip`，浏览器本地解析数据，生成可视化健康报告。数据不离开设备，完全免费托管于 GitHub Pages 或 Cloudflare Pages。

---

## 2. 技术选型

| 层级 | 选型 | 理由 |
|------|------|------|
| 构建工具 | Vite | 快速 HMR，零配置 |
| UI 框架 | React 18 | 组件化管理 6 个数据模块 |
| 图表库 | ECharts-for-React | 深色主题支持好，图表类型丰富 |
| ZIP 解压 | JSZip | 浏览器端解压，支持流式读取 |
| 样式 | Tailwind CSS | 深色主题快速实现 |
| 解析线程 | Web Worker | 防止主线程阻塞，支持进度回报 |
| 部署 | GitHub Pages + GitHub Actions | push 自动构建，免费 |
| 备选部署 | Cloudflare Pages | 国内访问更快 |

**运行时依赖：** `react`, `react-dom`, `echarts`, `echarts-for-react`, `jszip`
**开发依赖：** `vite`, `@vitejs/plugin-react`, `tailwindcss`

---

## 3. 目录结构

```
apple-health-viz/
├── src/
│   ├── workers/
│   │   └── parser.worker.js      # Web Worker：流式解析 XML，postMessage 结构化数据
│   ├── lib/
│   │   └── metrics.js            # 纯函数：计算各项统计指标（均值、趋势、评级）
│   ├── components/
│   │   ├── UploadZone.jsx        # 拖拽上传区，触发 Worker 解析
│   │   ├── ProgressBar.jsx       # 实时显示解析进度（已处理记录数/总数）
│   │   ├── Dashboard.jsx         # 仪表盘容器，管理 tab 导航
│   │   └── sections/
│   │       ├── HeartRate.jsx     # 心率模块
│   │       ├── Sleep.jsx         # 睡眠模块
│   │       ├── Activity.jsx      # 活动量模块
│   │       ├── Fitness.jsx       # 体能模块（VO2Max、步行测试）
│   │       ├── Body.jsx          # 体重/BMI/体脂模块
│   │       └── Summary.jsx       # 综合评分与风险提示
│   └── App.jsx                   # 状态机：upload → parsing → dashboard
├── public/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 自动部署
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 4. 数据流

```
用户拖拽 .zip
    ↓
JSZip 解压 → 读取 export.xml 内容（ArrayBuffer）
    ↓
postMessage 到 Web Worker
    ↓
Worker 流式逐行扫描 XML（正则提取 <Record> 标签属性，不构建 DOM）
    ↓
按类型分桶，每处理 5万条记录 postMessage 一次进度
    ↓
解析完成，postMessage 结构化 JSON 回主线程
    ↓
App.jsx 更新 state → 各 section 组件读取对应切片渲染图表
```

### Worker 输出数据结构

```js
{
  heartRate: [{ date, value }],          // 所有心率记录
  restingHeartRate: [{ date, value }],
  hrv: [{ date, value }],
  heartRateRecovery: [{ date, value }],
  sleep: [{ date, durationHours, isShort }],  // isShort: < 6h
  steps: [{ date, value }],
  activeEnergy: [{ date, value }],
  standTime: [{ date, value }],
  vo2max: [{ date, value }],
  sixMinuteWalk: [{ date, value }],
  walkingSteadiness: [{ date, value }],
  bodyMass: [{ date, value }],
  bmi: [{ date, value }],
  bodyFat: [{ date, value }],
  respiratoryRate: [{ date, value }],
  meta: { totalRecords, dateRange: { start, end } }
}
```

---

## 5. 各模块设计

### 5.1 心率模块（HeartRate）
- 静息心率月均趋势折线图（含颜色分段：正常/偏高）
- HRV 月均趋势折线图（参考线：50ms）
- 心率分布直方图（标注过速 >100 占比）
- KPI 卡片：静息心率均值、HRV 均值、心率恢复均值

### 5.2 睡眠模块（Sleep）
- 每日睡眠柱状图（不足6h 标红，足量标蓝）
- 月均睡眠折线图（参考线：7h）
- KPI：平均时长、不足6h 天数占比

### 5.3 活动量模块（Activity）
- 月均日步数柱状图（参考线：8000步）
- 近90天步数热力图（仿 GitHub contribution 风格）
- KPI：日均步数、日均活动卡路里、月均站立时间

### 5.4 体能模块（Fitness）
- VO2Max 趋势折线图（背景色区间：偏低/普通/良好/优秀）
- 6分钟步行测试趋势（参考线：500m）
- KPI：最新 VO2Max 及评级、步行稳定性

### 5.5 体重模块（Body）
- 体重趋势折线图
- BMI 折线图（背景色区间：过轻/正常/超重/肥胖）
- 体脂率折线图（男女不同参考区间）
- KPI：当前体重、BMI、体脂率

### 5.6 综合评分模块（Summary）
- 6个维度各给出 🔴🟡🟢 三色评级
- 文字版风险提示（复刻分析报告的文字输出）
- 评级算法：基于阈值判断，参见 `metrics.js`

---

## 6. 评级算法（metrics.js）

| 维度 | 🟢 正常 | 🟡 需关注 | 🔴 异常 |
|------|---------|---------|---------|
| 静息心率 | 50-65 bpm | 65-75 或 45-50 | >75 或 <45 |
| HRV | >45 ms | 30-45 ms | <30 ms |
| 睡眠 | 均值≥7h，<6h天数<15% | 均值6-7h 或 <6h天数15-30% | 均值<6h 或 <6h天数>30% |
| 步数 | 日均≥8000 | 日均5000-8000 | 日均<5000 |
| VO2Max | 按年龄性别分级（Apple 标准） | — | — |
| BMI | 18.5-24.9 | 25-29.9 或 17-18.5 | ≥30 或 <17 |

---

## 7. UI 风格

- **主题：** 深色（dark），背景 `#0f172a`，卡片 `#1e293b`
- **强调色：** 心率粉 `#f472b6`，HRV 蓝 `#60a5fa`，睡眠橙 `#f59e0b`，步数紫 `#a78bfa`，体能绿 `#34d399`
- **状态色：** 🟢 `#22c55e`，🟡 `#f59e0b`，🔴 `#ef4444`
- **字体：** 系统默认 sans-serif，数字用 tabular nums

---

## 8. 错误处理

| 场景 | 处理方式 |
|------|---------|
| 上传非 zip 文件 | 上传区显示红色提示，不触发解析 |
| zip 内无 export.xml | 解析后提示"未找到健康数据文件" |
| 某模块数据为空 | 该 section 显示"暂无数据"占位，不影响其他模块 |
| 解析耗时过长 | 进度条 + 取消按钮，取消后恢复上传状态 |

---

## 9. 部署配置

### GitHub Actions（`.github/workflows/deploy.yml`）
```yaml
on: push to main
steps:
  1. checkout
  2. setup Node 20
  3. npm ci
  4. npm run build
  5. Deploy dist/ to gh-pages branch (peaceiris/actions-gh-pages)
```

### Vite 配置
```js
// vite.config.js
base: '/apple-health-viz/'  // GitHub Pages 子路径
```

### Cloudflare Pages（可选）
- 连接 GitHub 仓库
- 构建命令：`npm run build`
- 输出目录：`dist`
- 无需额外配置

---

## 10. 超出范围（不实现）

- 数据持久化（不存 localStorage，刷新后需重新上传）
- 用户账号系统
- 多文件对比
- PDF 导出
- 移动端 App

---

## 11. 成功标准

- [ ] 上传 zip 后 3 分钟内完成解析并展示所有模块
- [ ] 解析过程主线程不卡死（UI 可响应）
- [ ] 6 个模块均正确展示图表
- [ ] 综合评分与实际数据逻辑一致
- [ ] GitHub Pages 部署成功，可通过公网访问
