function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function tableToCsv(rows) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  return [
    headers.join(','),
    ...rows.map(row => headers.map(header => escapeCsvValue(row[header])).join(',')),
  ].join('\n')
}

function summaryRows(summary) {
  const rows = [
    { metric: 'generatedAt', value: summary.generatedAt },
    { metric: 'dateStart', value: summary.dateRange?.start ?? '' },
    { metric: 'dateEnd', value: summary.dateRange?.end ?? '' },
    { metric: 'selectedSources', value: (summary.selectedSources ?? []).join('; ') },
  ]
  for (const [key, value] of Object.entries(summary.ratings ?? {})) {
    rows.push({ metric: `rating_${key}`, value: value ?? '' })
  }
  return rows
}

export function exportBundleToCsv(bundle) {
  const sections = [
    ['summary', summaryRows(bundle.summary)],
    ...Object.entries(bundle.daily ?? {}).map(([name, rows]) => [`daily_${name}`, rows]),
    ...Object.entries(bundle.monthly ?? {}).map(([name, rows]) => [`monthly_${name}`, rows]),
  ]

  return sections
    .filter(([, rows]) => rows?.length)
    .map(([name, rows]) => `# ${name}\n${tableToCsv(rows)}`)
    .join('\n\n')
}

export function downloadText(filename, text, type) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
