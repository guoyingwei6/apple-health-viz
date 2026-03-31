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
