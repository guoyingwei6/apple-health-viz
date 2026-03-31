export default function Dashboard({ data, profile, onReset }) {
  return (
    <div className="p-8">
      <button onClick={onReset} className="text-slate-400">重新上传</button>
      <p className="text-slate-300 mt-4">数据已加载，共 {data.meta?.totalRecords?.toLocaleString()} 条记录</p>
    </div>
  )
}
