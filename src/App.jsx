import { useState, useRef, useCallback } from 'react'
import UploadZone from './components/UploadZone'
import ProgressBar from './components/ProgressBar'
import UserProfile from './components/UserProfile'
import Dashboard from './components/Dashboard'

export default function App() {
  const [phase, setPhase] = useState('upload')
  const [progress, setProgress] = useState({ processed: 0, total: 0 })
  const [healthData, setHealthData] = useState(null)
  const [profile, setProfile] = useState({ sex: '', age: '' })
  const [parseError, setParseError] = useState('')
  const workerRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    setParseError('')
    setPhase('parsing')
    try {
      const buffer = await file.arrayBuffer()
      const worker = new Worker(new URL('./workers/parser.worker.js', import.meta.url), { type: 'module' })
      workerRef.current = worker
      worker.onmessage = ({ data }) => {
        if (data.type === 'progress') {
          setProgress({ processed: data.processed, total: data.total })
        } else if (data.type === 'error') {
          worker.terminate()
          setParseError(data.message || '解析出错，请重试。')
          setPhase('upload')
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
      worker.postMessage({ buffer }, [buffer])
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
