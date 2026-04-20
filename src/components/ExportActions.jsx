import { buildExportBundle } from '../lib/metrics'
import { downloadText, exportBundleToCsv } from '../lib/export'

export default function ExportActions({ data, profile }) {
  function filename(ext) {
    const today = new Date().toISOString().slice(0, 10)
    return `apple-health-cleaned-${today}.${ext}`
  }

  function exportJson() {
    const bundle = buildExportBundle(data, profile)
    downloadText(
      filename('json'),
      JSON.stringify(bundle, null, 2),
      'application/json;charset=utf-8'
    )
  }

  function exportCsv() {
    const bundle = buildExportBundle(data, profile)
    downloadText(
      filename('csv'),
      exportBundleToCsv(bundle),
      'text/csv;charset=utf-8'
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={exportJson} className="text-slate-500 hover:text-slate-300 text-sm">
        导出 JSON
      </button>
      <button onClick={exportCsv} className="text-slate-500 hover:text-slate-300 text-sm">
        导出 CSV
      </button>
    </div>
  )
}
