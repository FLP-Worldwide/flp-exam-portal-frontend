'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Spin, Typography } from 'antd'
import { Toaster, toast } from 'react-hot-toast'
import api from '../../utils/axios'

const { Title } = Typography

// helper: normalize server payload -> { level, totalPoints, task_a, task_b }
function extractContentFromResponse(d) {
  // 1) If server already returned the flat shape
  if (d.content && typeof d.content === 'object') {
    const c = d.content;
    return {
      level: d.level ?? d.level, // keep if present
      totalPoints: c.totalPoints ?? d.totalPoints ?? (c.total_points ?? 0),
      task_a: c.task_a ?? c.taskA ?? d.task_a ?? d.taskA ?? { title: '', subtitle: '', body: '', instruction: '' },
      task_b: c.task_b ?? c.taskB ?? d.task_b ?? d.taskB ?? { title: '', subtitle: '', body: '', instruction: '' },
    }
  }

  // 2) If server returned top-level task_a/task_b (older shape)
  if (d.task_a || d.task_b) {
    return {
      level: d.level ?? '',
      totalPoints: d.totalPoints ?? 0,
      task_a: d.task_a ?? { title: '', subtitle: '', body: '', instruction: '' },
      task_b: d.task_b ?? { title: '', subtitle: '', body: '', instruction: '' },
    }
  }

  // 3) If server returned 'modules' as an object with keys like 'level_<name>'
  if (d.modules && typeof d.modules === 'object' && !Array.isArray(d.modules)) {
    // find first module object that has a 'content' and (optionally) matches level
    const keys = Object.keys(d.modules)
    for (const k of keys) {
      const candidate = d.modules[k]
      if (candidate && candidate.content) {
        const c = candidate.content
        return {
          level: k.replace(/^level_/, '') || d.level || '',
          totalPoints: c.totalPoints ?? d.totalPoints ?? 0,
          task_a: c.task_a ?? c.taskA ?? { title: '', subtitle: '', body: '', instruction: '' },
          task_b: c.task_b ?? c.taskB ?? { title: '', subtitle: '', body: '', instruction: '' },
        }
      }
    }
  }

  // 4) If server returned 'modules' as an array of { name, moduleRef, content? }
  if (Array.isArray(d.modules) && d.modules.length) {
    for (const m of d.modules) {
      if (m.content) {
        const c = m.content
        return {
          level: m.level ?? d.level ?? '',
          totalPoints: c.totalPoints ?? d.totalPoints ?? 0,
          task_a: c.task_a ?? c.taskA ?? { title: '', subtitle: '', body: '', instruction: '' },
          task_b: c.task_b ?? c.taskB ?? { title: '', subtitle: '', body: '', instruction: '' },
        }
      }
    }
  }

  // fallback: empty shape
  return {
    level: d.level ?? '',
    totalPoints: d.totalPoints ?? 0,
    task_a: { title: '', subtitle: '', body: '', instruction: '' },
    task_b: { title: '', subtitle: '', body: '', instruction: '' },
  }
}



export default function WritingAdmin({ testId }) {
  const [data, setData] = useState({
    level: 'Deutsch - B2',
    totalPoints: 45,
    A: { title: '', subtitle: '', body: '', instruction: '' },
    B: { title: '', subtitle: '', body: '', instruction: '' },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fetched = useRef(false)

  // Fetch existing content for the testId using the project's `api` axios instance
  useEffect(() => {
  const fetchData = async () => {
    if (fetched.current) return
    fetched.current = true

    if (!testId) {
      toast.error('Missing testId')
      setLoading(false)
      return
    }

    try {
      const res = await api.get(`/course-test/details/${encodeURIComponent(testId)}?module=writing`)
      // console.log('raw response', res)
      const d = res?.data?.data
      if (!d) {
        toast.error('No data found for this test')
        setLoading(false)
        return
      }

      // normalize / extract content
      const normalized = extractContentFromResponse(d)

      setData((prev) => ({
        ...prev,
        level: normalized.level || prev.level,
        totalPoints: normalized.totalPoints ?? prev.totalPoints,
        A: normalized.task_a,
        B: normalized.task_b,
      }))
    } catch (err) {
      console.error(err)
      toast.error('Failed to load test data')
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [testId])



const submitAll = async () => {
  if (!testId) return toast.error("Missing testId");
  setSaving(true);
  try {
    const payload = {
      testId,
      level: data.level,
      module: "writing",
      content: {
        totalPoints: data.totalPoints,
        task_a: data.A,
        task_b: data.B,
      },
    };

    const res = await api.post("/course-test/details", payload); // ✅ POST instead of PUT

    if (res?.data?.success) {
      toast.success(res.data.message || "Saved successfully");
    } else {
      toast.error(res?.data?.message || "Save failed");
    }
  } catch (err) {
    console.error(err);
    toast.error("Network error while saving");
  } finally {
    setSaving(false);
  }
};

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spin size="large" />
      <Toaster />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <Toaster />
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <Title level={3}>Admin · Writing Test (Teil 1)</Title>
          <div className="text-sm text-gray-500">Test ID: {testId}</div>
        </div>

        {/* Global Settings */}
        <div className="border rounded-xl p-4 mb-6">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
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
            <div className="flex items-end justify-end">
              <button
                onClick={submitAll}
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400"
              >
                {saving ? 'Saving…' : 'Save All'}
              </button>
            </div>
          </div>
        </div>

        {/* Task A */}
        <TaskEditor
          label="Task A"
          value={data.A}
          onChange={(v) => setData({ ...data, A: v })}
        />

        {/* Task B */}
        <TaskEditor
          label="Task B"
          value={data.B}
          onChange={(v) => setData({ ...data, B: v })}
        />

        <p className="text-xs text-gray-500">Note: tasks are content-only (no answers).</p>
      </div>
    </div>
  )
}

function TaskEditor({ label, value, onChange }) {
  return (
    <div className="border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{label}</h3>
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
