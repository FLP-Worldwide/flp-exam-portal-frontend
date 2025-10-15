'use client'

import { useEffect, useState } from 'react'

export default function WritingAdmin() {
  const [token, setToken] = useState('')
  const [data, setData] = useState({
    timeMinutes: 30,
    level: 'Deutsch - B2',
    totalPoints: 45,
    A: { title: '', subtitle: '', body: '', instruction: '' },
    B: { title: '', subtitle: '', body: '', instruction: '' },
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tests/writing/prompts', {
        headers: { 'x-admin-token': token },
        cache: 'no-store',
      })
      const j = await res.json()
      if (j.ok) setData(j.data)
      else setMsg(j.error || 'Unauthorized')
    } catch {
      setMsg('Failed to load.')
    } finally {
      setLoading(false)
    }
  }

  const save = async (patch) => {
    setSaving(true)
    try {
      const res = await fetch('/api/tests/writing/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(patch),
      })
      const j = await res.json()
      if (j.ok) {
        setMsg('Saved!')
        await load()
      } else setMsg(j.error || 'Save failed')
    } catch {
      setMsg('Network error')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    // optional: pull saved token
    const t = localStorage.getItem('admin_token')
    if (t) setToken(t)
  }, [])

  const persistToken = () => {
    localStorage.setItem('admin_token', token)
    setMsg('Token saved in this browser.')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Admin · Writing Test (Teil 1)</h2>
        </div>
        {msg && <p className="text-sm text-gray-600 mb-4">{msg}</p>}

        {/* Global Settings */}
        <div className="border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3">Global Settings</h3>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div>
              <label className="block text-sm mb-1">Time (minutes)</label>
              <input
                type="number"
                value={data.timeMinutes}
                onChange={(e) => setData({ ...data, timeMinutes: Number(e.target.value) })}
                className="border p-2 rounded-md w-full"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Level</label>
              <input
                value={data.level}
                onChange={(e) => setData({ ...data, level: e.target.value })}
                className="border p-2 rounded-md w-full"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Total Points</label>
              <input
                type="number"
                value={data.totalPoints}
                onChange={(e) => setData({ ...data, totalPoints: Number(e.target.value) })}
                className="border p-2 rounded-md w-full"
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => save({ timeMinutes: data.timeMinutes, level: data.level, totalPoints: data.totalPoints })}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400"
            >
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Task A */}
        <TaskEditor
          label="Task A"
          value={data.A}
          loading={loading}
          onChange={(v) => setData({ ...data, A: v })}
          onSave={() => save({ A: data.A })}
        />

        {/* Task B */}
        <TaskEditor
          label="Task B"
          value={data.B}
          loading={loading}
          onChange={(v) => setData({ ...data, B: v })}
          onSave={() => save({ B: data.B })}
        />
      </div>
    </div>
  )
}

function TaskEditor({ label, value, onChange, onSave, loading }) {
  return (
    <div className="border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{label}</h3>
        <button
          onClick={onSave}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400"
        >
          Save {label}
        </button>
      </div>

      <div className="grid gap-3 grid-cols-1">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            className="border p-2 rounded-md w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Subtitle</label>
          <input
            value={value.subtitle}
            onChange={(e) => onChange({ ...value, subtitle: e.target.value })}
            className="border p-2 rounded-md w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Body (left panel text)</label>
          <textarea
            rows={8}
            value={value.body}
            onChange={(e) => onChange({ ...value, body: e.target.value })}
            className="border p-2 rounded-md w-full"
            placeholder="Paste the task text shown to students…"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Instruction (short)</label>
          <input
            value={value.instruction}
            onChange={(e) => onChange({ ...value, instruction: e.target.value })}
            className="border p-2 rounded-md w-full"
            placeholder="e.g., Write a formal complaint…"
          />
        </div>
      </div>
    </div>
  )
}
