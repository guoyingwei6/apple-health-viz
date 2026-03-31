# 🍎 Apple Health 数据可视化

一个纯前端静态网站，上传 Apple Health 导出的 ZIP 文件，在浏览器本地解析，生成可视化健康报告。**数据不离开设备，无需账号，完全免费。**

🌐 **在线访问：** [guoyingwei6.github.io/apple-health-viz](https://guoyingwei6.github.io/apple-health-viz/)

---

## 功能

| 模块 | 内容 |
|------|------|
| ❤️ 心率 | 静息心率趋势、HRV 趋势、心率分布直方图、心率恢复 |
| 😴 睡眠 | 每日睡眠时长、月均趋势、短睡天数统计 |
| 🚶 活动量 | 月均步数、90天热力图、活动卡路里、站立时间 |
| 💪 体能 | VO₂Max 趋势与评级、6分钟步行测试、步行稳定性 |
| ⚖️ 体重 | 体重趋势、BMI 折线图、体脂率（男女不同参考区间） |
| 📊 综合评分 | 6个维度三色评级（🟢🟡🔴）、健康提示、风险说明 |

---

## 使用方法

### 第一步：导出 Apple Health 数据

1. 打开 iPhone「健康」App
2. 右上角头像 → 向下滑动 → **导出所有健康数据**
3. 等待压缩完成（数据量大时可能需要几分钟）
4. 通过 AirDrop 或文件传输将 `apple_health_export.zip` 发送到电脑

### 第二步：上传并分析

1. 打开网站 [guoyingwei6.github.io/apple-health-viz](https://guoyingwei6.github.io/apple-health-viz/)
2. 将 `apple_health_export.zip` 拖拽到上传区，或点击选择文件
3. 等待解析完成（数据量较大时约 1-3 分钟）
4. 自动跳转到仪表盘，点击顶部 Tab 切换各模块

> **隐私说明：** 所有解析过程在浏览器本地完成，数据不上传任何服务器，刷新页面后自动清除。

### 可选：填写性别和年龄

上传后页面顶部可填写性别和年龄，用于 VO₂Max 有氧能力分级评估。不填写则仅展示趋势图，不显示评级。

---

## 评级算法参考

| 维度 | 🟢 正常 | 🟡 需关注 | 🔴 异常 |
|------|---------|-----------|---------|
| 静息心率 | 50–64 bpm | 65–75 或 45–50 | >75 或 <45 |
| HRV | >45 ms | 30–45 ms | <30 ms |
| 睡眠 | 均值 ≥7h 且 <6h 天数占比 <15% | 均值 6–7h 或 短睡 15–30% | 均值 <6h 或 短睡 >30% |
| 步数 | 日均 ≥8000 步 | 日均 5000–8000 步 | 日均 <5000 步 |
| VO₂Max（男） | 随年龄：18–29→≥44 / 30–39→≥42 / 40–49→≥39 / 50+→≥36 | 低于正常 1–6 | 低于正常 >6 |
| VO₂Max（女） | 随年龄：18–29→≥40 / 30–39→≥38 / 40–49→≥35 / 50+→≥32 | 低于正常 1–6 | 低于正常 >6 |
| 体脂率（男） | 8–19% | 20–25% 或 6–8% | >25% 或 <6% |
| 体脂率（女） | 21–33% | 34–38% 或 18–21% | >38% 或 <18% |
| BMI | 18.5–24.9 | 25–29.9 或 17–18.5 | ≥30 或 <17 |

---

## 技术栈

- **构建：** Vite 5 + React 18
- **图表：** Apache ECharts（echarts-for-react）
- **样式：** Tailwind CSS v3（深色主题）
- **ZIP 解压：** JSZip（纯浏览器端）
- **XML 解析：** Web Worker 流式逐行扫描（防主线程阻塞）
- **测试：** Vitest
- **部署：** GitHub Actions → GitHub Pages

### 本地开发

```bash
git clone https://github.com/guoyingwei6/apple-health-viz.git
cd apple-health-viz
npm install
npm run dev
```

运行测试：

```bash
npx vitest run
```

---

## 数据说明

- **睡眠计算：** 仅统计 Asleep 类型记录（AsleepCore / AsleepDeep / AsleepREM），排除 InBed；午睡（持续 <3h 且开始于 09:00–20:00）不计入；当天 12:00 前结束的睡眠归属前一天。
- **VO₂Max 评级：** 仅在填写性别和年龄后显示，参考 American College of Sports Medicine 标准。
- **免责声明：** 本工具仅供个人健康数据探索，不构成医疗建议。如有健康疑虑请咨询专业医生。

---

## License

MIT
