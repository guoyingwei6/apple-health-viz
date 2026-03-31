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
